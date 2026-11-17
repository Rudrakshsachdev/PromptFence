# Authentication Frontend Audit

| | |
|---|---|
| **Last updated** | 2026-11-17 (second pass: verification, environment repair, report correction) |
| **Scope** | Next.js authentication frontend (`frontend/src`) and its contract with `backend/app/api/v1/auth` (read-only) |
| **Backend changes** | None. Every fix is frontend-only and keeps the existing API contract. |
| **Statuses** | `OPEN` · `FIXED — automated tests passed` · `VERIFIED — real browser validation completed` |

## Summary

| Severity | Issues | OPEN | FIXED — automated tests passed | VERIFIED — real browser validation completed |
|---|---|---|---|---|
| High | 3 | 0 | 0 | 3 |
| Medium | 9 | 0 | 0 | 9 |
| Low | 9 | 0 | 0 | 9 |
| **Total** | **21** | **0** | **0** | **21** |

- **Fix history:** all 21 fixes were implemented in the first pass. The second pass re-inspected the code, found every fix present and correct, and reimplemented none. It added the browser verification still missing for 13 issues and one new regression test file (`tests/change-password-form.test.tsx`, AUTH-12 Settings and AUTH-20).
- **Development environment:** the broken `:3000` dev server (see §4) was repaired and verified in the second pass.
- **Correction:** the first pass stated that `frontend/.next` contained *production-build artifacts*. That was wrong; §4 has the evidence and the corrected root cause.

## 1. Surface inspected

| Area | Files |
|---|---|
| Routes | `app/(auth)/login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `app/(auth)/layout.tsx`; redirects `/signup → /register`, `/auth/login → /login` (`next.config.mjs`) |
| Protected-route guard | `app/(dashboard)/layout.tsx` (client-side guard; there is no `middleware.ts`) |
| Shared auth UI | `components/auth/*` (`AuthCard`, `AuthHeader`, `AuthInput`, `AuthPasswordInput`, `AuthButton`, `AuthAlert`) |
| Other password fields | `components/forms/password-input.tsx`, `app/(dashboard)/settings/_components/change-password-form.tsx` |
| Session and state | `providers/auth-provider.tsx`, `hooks/use-auth.ts`, `providers/query-provider.tsx` (unchanged) |
| API layer | `lib/api-client.ts`, `services/auth.service.ts` (unchanged) |
| Validation and redirects | `lib/auth-schemas.ts`, `lib/auth-redirect.ts` |
| Styling | `tailwind.config.ts`, `styles/globals.css` |

**API contract:** every endpoint path and HTTP method in `auth.service.ts` matches `backend/app/api/v1/auth/router.py` and the `users/me/*` routes, and request payloads match the Pydantic schemas. `auth.service.ts` needed no change; `auth-integration.test.tsx` asserts the register payload, and real-browser runs hit the live API.

## 2. How verification was done

| Method | What it covers |
|---|---|
| Vitest + React Testing Library | Unit and integration regression tests (§5) |
| Mutation checks | New tests were run against the *pre-fix* code: AUTH-10 (Register) and AUTH-12/-20 (Settings) fail on the old code and pass on the fix |
| Playwright E2E (`e2e/auth.spec.ts`) | Isolated production build; real sign-in against the live API; register, forgot and verify responses stubbed so no accounts or email are created |
| Real-browser scripts (Chromium) | Run against the repaired dev server on `:3000` with the **live backend**, at 1280px desktop and Pixel 7 touch / 320px. Fault injection (blocking `/auth/me`, deleting cookies, aborting a request) is used only to *cause* failures, never to fake success. |

## 3. Findings

### AUTH-01 · Missing `/verify-email` route (High)
- **Original problem:** verification emails link to `${FRONTEND_URL}/verify-email?token=…` (`backend/app/services/email_service.py`), and that route returned 404.
- **Root cause:** route never implemented; `authService.verifyEmail` existed but nothing called it.
- **Files:** `app/(auth)/verify-email/page.tsx` (new).
- **Fix:** page with verifying, success, failure and missing-token states. A ref guard sends the single-use token exactly once, including under React Strict Mode's double effects.
- **Regression tests:** `auth.test.tsx` › Verify email page (missing token; exactly-once under StrictMode; server error); E2E "email verification link resolves".
- **Verification:** before 404, after 200. In the browser the page renders "Email verified" (E2E).
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-02 · API validation errors shown as `[object Object]` (High)
- **Original problem:** FastAPI's 422 body has `detail` as an array of `{loc, msg, type}`, which `new ApiError(detail)` stringified to `[object Object]`.
- **Root cause:** `api-client.ts` assumed `detail` was always a string.
- **Files:** `lib/api-client.ts`.
- **Fix:** `extractErrorMessage()` handles string and array forms and falls back to the HTTP status.
- **Regression tests:** `api-client.test.ts` › 422 arrays, string detail, non-JSON body; `auth-integration.test.tsx` › register renders a 422 as readable text.
- **Verification:** registering `probe@example.local` (passes Zod; the backend's email-validator 2.4.0 rejects it, so no account is created) → **live API 422**. The inline alert reads "value is not a valid email address: The part after the @-sign is a special-use or reserved…".
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-03 · Forgot Password shows success when the request fails (High)
- **Original problem:** offline, 429 and 5xx responses all showed "Check your email".
- **Root cause:** `catch { setSubmitted(true) }`. Enumeration resistance already comes from the backend's identical 200 response, so the catch only hid real failures.
- **Files:** `app/(auth)/forgot-password/page.tsx`.
- **Fix:** the success view appears only after a 2xx; failures show an inline alert. Anti-enumeration is unchanged.
- **Regression tests:** `auth.test.tsx` › "does not claim the email was sent when the request fails"; E2E "forgot password reports a failed request…".
- **Verification:** in the browser with the request aborted → inline "Unable to reach the PromptFence server…", and no "Check your email" (E2E).
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-04 · Concurrent token refreshes; swallowed retry errors (Medium)
- **Original problem:** each concurrent 401 sent its own `/auth/refresh`. The backend rotates single-use refresh tokens with family-revocation reuse detection. Retry failures, and 204 retries, were replaced by the original 401.
- **Root cause:** no single-flight refresh, and a blanket `try/catch {}` around the retry.
- **Files:** `lib/api-client.ts`.
- **Fix:** one shared in-flight refresh promise; retried responses parsed normally; refresh-exempt auth endpoints listed; network errors become `ApiError(0, NETWORK_ERROR)`.
- **Regression tests:** `api-client.test.ts` › single shared refresh; new refresh after settle; 204 retry; retry's own error surfaced; exempt endpoints.
- **Verification (live API):** with the access cookie removed, opening Overview produced **2 concurrent 401s → 1 refresh** (200 at 3.5s). Both retries then returned 200 (5.5s and 6.8s), and the user stayed signed in. Earlier `curl` probes showed the old behaviour minted several valid refresh tokens from one session; family revocation itself was not reproduced (timing-dependent).
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-05 · Expired sessions leave users on a broken dashboard (Medium)
- **Original problem:** when the refresh was rejected, `user` stayed set, so the dashboard rendered errors instead of returning to sign-in.
- **Root cause:** no signal from "refresh failed" back to auth state.
- **Files:** `lib/api-client.ts` (`onSessionExpired`), `providers/auth-provider.tsx`, `app/(dashboard)/layout.tsx`.
- **Fix:** an expired session clears the user and the query cache, and the guard redirects to `/login?next=…`. Network failures during refresh do not sign the user out.
- **Regression tests:** `api-client.test.ts` › listeners notified; network failure does not expire the session. `auth.test.tsx` › "signs the user out locally when the API reports an unrecoverable session".
- **Verification (live API):** both auth cookies removed, then clicked Findings → redirected to `/login?next=%2Ffindings`.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-06 · Cached data not cleared between accounts (Medium)
- **Original problem:** TanStack Query data (`staleTime` 2 min) survived logout, so the next account to sign in on the same tab could be served the previous account's data.
- **Root cause:** `login()` and `logout()` never touched the `QueryClient`.
- **Files:** `providers/auth-provider.tsx`.
- **Fix:** `queryClient.clear()` on login, logout and session expiry; logout uses `router.replace`.
- **Regression tests:** `auth.test.tsx` › "clears cached server data and returns to sign-in on logout"; the session-expiry test also asserts cache clearing.
- **Verification (live API):** signed in as Researcher (Overview cached) → Sign out → signed in as Admin. Overview requests were **re-issued** (2) rather than served from the previous account's still-fresh cache.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-07 · Submit re-enabled before navigation completes (Medium)
- **Original problem:** `finally { setIsLoading(false) }` re-enabled the button while routing. A second click opened another session (login) or replayed a consumed reset token.
- **Root cause:** loading was cleared on success as well as on failure.
- **Files:** `app/(auth)/login/page.tsx`, `app/(auth)/reset-password/page.tsx`.
- **Fix:** loading is cleared only on failure; reset uses `router.replace`.
- **Regression tests:** `auth.test.tsx` › "signs in … stays locked while navigating"; "resets the password, replaces history … stays locked"; "blocks duplicate submissions".
- **Verification (live API):** polled every 100ms during a real sign-in. The submit button was **never re-enabled** across the 17.9s until `/overview` loaded.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-08 · Login reports success without a session (Medium)
- **Original problem:** if `/auth/me` failed after a 200 login, the page still toasted success and navigated, then bounced back to `/login`.
- **Root cause:** `refreshUser()` swallowed the error and `login()` navigated unconditionally.
- **Files:** `providers/auth-provider.tsx`.
- **Fix:** `login()` throws `SESSION_NOT_ESTABLISHED` with an explanation when no user loads.
- **Regression tests:** `auth.test.tsx` › "reports a login that did not produce a usable session…".
- **Verification:** live login returned 200 with `/auth/me` blocked → inline "Signed in, but your session could not be established…", and the page stayed on `/login`.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-09 · Protected-route redirect loses the requested page (Medium)
- **Original problem:** deep links always ended on `/overview` after sign-in.
- **Files:** `app/(dashboard)/layout.tsx`, `lib/auth-redirect.ts` (new), `hooks/use-auth.ts`, `app/(auth)/login/page.tsx`.
- **Fix:** the guard redirects to `/login?next=<path>`. `getSafeRedirect()` accepts only same-origin paths and rejects `//host`, back-slash variants, control characters and auth routes, preventing open redirects and loops.
- **Regression tests:** `auth-redirect.test.ts` (open-redirect cases); `auth.test.tsx` › `?next=` honoured, off-site `next` ignored, guard keeps the destination; E2E "protected pages send visitors to sign in and back again".
- **Verification:** E2E real sign-in `/findings` → `/login?next=%2Ffindings` → `/findings`.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-10 · Mismatch error persists after fixing the first password field (Medium)
- **Root cause:** React Hook Form re-validates only the changed field, and the error belongs to `confirm_password`.
- **Files:** `register/page.tsx`, `reset-password/page.tsx`, `settings/_components/change-password-form.tsx`.
- **Fix:** `register('password', { deps: ['confirm_password'] })` on all three forms.
- **Regression tests:** `auth.test.tsx` › Register mismatch test; `change-password-form.test.tsx` › mismatch test. Both fail on the pre-fix code (mutation check).
- **Verification:** in the browser on `/register`, the error **cleared** after editing the first field to match.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-11 · Tailwind 4-only utilities compile to nothing (Medium)
- **Original problem:** success CTAs rendered 21px and 23px tall; shadows and blur were missing.
- **Root cause:** the project uses Tailwind 3.4.19. `h-10.5`, `shadow-xs`, `shadow-2xs` and `backdrop-blur-xs` are Tailwind 4 utilities, and `py-0.2` is invalid.
- **Files:** `tailwind.config.ts`, `components/auth/auth-button.tsx` (`authButtonClasses`), `login/page.tsx` (`py-px`), the success views in `register` and `forgot-password`.
- **Fix:** added the missing scale steps (Tailwind 4 values); link CTAs reuse the button classes. Side effect: the 9 identical usages on the landing page now render as designed.
- **Regression tests:** E2E "register shows the confirmation screen" asserts CTA height ≥ 40px.
- **Verification:** CTA 21/23px → **42/42px**; submit buttons 41 → 42px (desktop and 320px).
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-12 · Password toggles not keyboard-accessible or correctly labelled (Medium)
- **Original problem:** every toggle had `tabIndex={-1}`. Auth toggles were labelled "Show value" with no state; the Settings toggles had no accessible name or focus ring; the icon contrast was about 2.5:1.
- **Files:** `components/auth/auth-password-input.tsx`, `components/forms/password-input.tsx`.
- **Fix:** focusable toggles with a stable "Show password" name, `aria-pressed`, `aria-controls`, a focus ring, disabled together with the input, and `neutral-500`. In Settings, `type` is set after the props spread.
- **Regression tests:** `auth.test.tsx` › AuthPasswordInput suite; independent toggles on Register and Reset; toggle after autofill. `change-password-form.test.tsx` › Settings toggles and keyboard (fails on pre-fix code). E2E keyboard toggle.
- **Verification:** all **8** password fields (Login, Register ×2, Reset ×2, Settings ×3) behave identically: `password`/eye → `text`/eye-off, `aria-pressed=true`, back again. Values are preserved, state is independent and the form does not submit. Desktop click, mobile (Pixel 7) tap, and keyboard Tab + Space all work. Checked on the production build and on the repaired dev server.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-13 · Dark colour scheme on light auth pages (Low)
- **Root cause:** a global `input { color-scheme: dark }` rule also applied to the light auth surface.
- **Files:** `styles/globals.css` (`.scheme-light`), `app/(auth)/layout.tsx`.
- **Regression tests:** none automated (jsdom has no computed `color-scheme`); browser audit only.
- **Verification:** computed `color-scheme` on auth inputs went `dark` → `light`. Real autofill styling cannot be triggered programmatically.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-14 · Frontend validation looser than the backend (Low)
- **Original problem:** no max length (backend: password ≤ 128, name ≤ 255), and whitespace-only names were accepted.
- **Files:** `lib/auth-schemas.ts` (new), used by Register, Reset and Change password.
- **Regression tests:** `auth.test.tsx` › password-policy table, including the 129-character case; whitespace name.
- **Verification:** in the browser, a 129-character password and a whitespace name were blocked inline, and **0** register requests were sent.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-15 · Missing form semantics and transient-only error delivery (Low)
- **Original problem:** no `aria-required`, no `<h1>` on the success views, and errors shown only in toasts that dismiss after about 4 seconds.
- **Files:** `components/auth/auth-input.tsx`, `auth-password-input.tsx`, `auth-alert.tsx` (new), all auth pages.
- **Regression tests:** `auth.test.tsx` › `aria-required`; inline alert tests on every form.
- **Verification:** each auth route has exactly one `h1`, and required inputs carry `aria-required`. A live failed login's inline alert was still visible after 6s.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-16 · "Remember me" did nothing (Low)
- **Root cause:** its state was never read or sent; session length is fixed server-side.
- **Files:** `app/(auth)/login/page.tsx`.
- **Fix:** removed. Making it real needs a backend contract change, which was not authorised.
- **Regression tests:** `auth.test.tsx` › "renders labelled fields…" (no checkbox).
- **Verification:** 0 checkboxes on `/login`.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-17 · Signed-in users still see the Login and Register forms (Low)
- **Files:** `hooks/use-auth.ts` (`useRedirectIfAuthenticated`), `login/page.tsx`, `register/page.tsx`.
- **Regression tests:** `auth.test.tsx` › "sends an already signed-in visitor straight to the dashboard".
- **Verification:** with a live session, visiting `/login` and `/register` redirects to `/overview`.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-18 · Development-account panel states (Low)
- **Original problem:** the "selected" ✓ stayed after editing, and the buttons were active while submitting.
- **Files:** `app/(auth)/login/page.tsx`.
- **Fix:** selection derived from the field values (`aria-pressed`); buttons disabled while submitting; the account list declared inside the `NODE_ENV` check.
- **Regression tests:** `auth.test.tsx` › development account autofill (4 tests).
- **Verification:** Admin autofill fills the correct credentials. `aria-pressed` goes true → false after editing, and the buttons are disabled during a live submit. The production client bundle contains **0** files with seed credentials (re-checked this pass).
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-19 · Reset Password missing-token and error states (Low)
- **Original problem:** the form could be submitted without a token, the dark skeleton showed on the white card, and token errors offered no next step.
- **Files:** `app/(auth)/reset-password/page.tsx`.
- **Regression tests:** `auth.test.tsx` › "blocks submission when the link has no token"; "explains a rejected token and offers a new link"; valid-token success.
- **Verification:** without a token, submit and inputs are disabled. A bogus token gives a **live API 422**, "Invalid or expired password reset token", with a "request a new one" link to `/forgot-password`. No dark skeletons.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-20 · Change-password input switches uncontrolled → controlled (Low)
- **Root cause:** no `defaultValues`, so `watch()` returned `undefined` and then a string for the controlled `value`.
- **Files:** `settings/_components/change-password-form.tsx`.
- **Regression tests:** `change-password-form.test.tsx`. Every test fails on any controlled/uncontrolled warning; on the pre-fix code it captures React's "changing an uncontrolled input to be controlled" warning.
- **Verification:** typing in all Settings password fields on the dev build produced **0** such console warnings.
- **Status:** `VERIFIED — real browser validation completed`

### AUTH-21 · E2E spec could never pass (Low)
- **Original problem:** it asserted an `h2`/`h3` that don't exist, registered `@promptfence.local` addresses (the backend's email-validator rejects that special-use domain, confirmed with a live 422 this pass), and had a vacuous "invalid credentials" assertion.
- **Files:** `e2e/auth.spec.ts`.
- **Verification:** **7/7 passed** against an isolated production build, with real sign-in.
- **Status:** `VERIFIED — real browser validation completed`

## 4. Development environment: `:3000` dev server not hydrating

| | |
|---|---|
| **Symptom** | No client-side control responded on any page; eye toggles did nothing. |
| **Evidence** | `/_next/static/chunks/main-app.js`, `app-pages-internals.js` and `app/(auth)/layout.js` returned **404**; React never hydrated. |
| **Root cause (corrected)** | `frontend/.next` held **only development output**: hot-update files written minutes earlier, with no `BUILD_ID`, `prerender-manifest.json`, `routes-manifest.json` or `trace`. **There was no production build in it**, contrary to the first-pass report. The dev server's core chunks were missing from disk while its in-memory compiler considered them emitted, so they were never rewritten. That fits `.next` being emptied while `next dev` ran, which `next build` does at startup even if aborted, as does a manual clean. Which of these happened cannot be determined. The audit's own production builds always used isolated copies. |
| **Remedy (applied)** | Identified the PromptFence `next dev` process tree (`next dev` launcher plus `start-server.js`, under `C:\PromptFence\frontend`) and stopped only those two PIDs. A graceful stop was attempted first; Windows console Node processes required `/F`, and the parent shell was left untouched. Confirmed port 3000 was free, removed `frontend/.next`, and restarted with `npm run dev`. |
| **Verification** | All five auth routes return 200, every `_next/static` request returns **200 (0 failures)**, and all password toggles respond on desktop and mobile on `:3000`. |
| **Prevention** | Never run `next build` in `frontend/` while `next dev` is running. Build in a separate checkout, worktree or copy, or stop the dev server first. |

## 5. Test and build results (actually executed, second pass)

| Check | Result |
|---|---|
| Full frontend suite (`npx vitest run`) | **9 files, 98 tests passed** (includes the pre-existing dashboard, targets, test-suites and phase3 suites) |
| `change-password-form.test.tsx` mutation check | pre-fix code: 2 of 4 fail (controlled warning, mismatch); fixed code: 4 of 4 pass |
| Type check (`tsc --noEmit`) | 0 errors |
| Lint (`next lint`, src + tests + e2e) | No warnings or errors |
| Production build (`next build`, isolated copy) | Succeeded; `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` prerendered |
| Seed credentials in production client bundle | 0 files |
| E2E (`playwright test e2e/auth.spec.ts`, Chromium, production build) | 7/7 passed |
| Real-browser checks on the dev server with the live API | 15/15 checks passed. Two initial failures were script errors (the wrong Settings URL; a 1.5s window shorter than the remote DB's latency), fixed and re-run. |

## 6. Remaining items (not defects in the 21; not fixed)

| Item | Reason |
|---|---|
| All auth routes share one document title (WCAG 2.4.2) | The pages are client components; unique titles need per-route `layout.tsx` metadata. A follow-up. |
| Logo shown in both the header bar and the card | A design decision from the recent redesign. |
| Root viewport declares `colorScheme: 'dark'` (scrollbars on auth pages) | App-wide setting; form controls are already fixed by AUTH-13. |
| Backend refresh race (no row lock between token lookup and revocation) | A backend concern; mitigated client-side by AUTH-04, and backend changes are not authorised. |
| No automated test for AUTH-13 | jsdom cannot compute `color-scheme`; covered by the browser audit only. |
