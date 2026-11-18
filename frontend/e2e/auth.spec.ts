import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Authentication journeys.
 *
 * Sign-in runs against the real API (seed accounts from backend/scripts/seed.py).
 * Registration, recovery and verification responses are stubbed at the network
 * layer so the suite never creates accounts or sends email.
 */

/** The form-level alert (Next.js also renders an empty role="alert" route announcer). */
const formAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function stubAuth(page: Page, endpoint: string, status: number, body: unknown) {
  await page.route(`**/api/v1/auth/${endpoint}`, (route) =>
    route.request().method() === 'OPTIONS' ? route.fulfill({ status: 204 }) : json(route, status, body),
  );
}

test.describe('Authentication', () => {
  test('legacy /login redirects to /auth/login preserving query params', async ({ page }) => {
    await page.goto('/login?next=%2Ffindings');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Ffindings$/);
  });

  test('register shows the confirmation screen', async ({ page }) => {
    await stubAuth(page, 'register', 201, { message: 'Registration successful.' });
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');

    await page.fill('#full_name', 'E2E Researcher');
    await page.fill('#email', 'e2e.researcher@example.com');
    await page.fill('#password', 'ValidPass123!');
    await page.fill('#confirm_password', 'ValidPass123!');
    await page.getByRole('button', { name: /register account/i }).click();

    await expect(page.getByRole('heading', { name: 'Account Created' })).toBeVisible();
    const cta = page.getByRole('link', { name: /continue to sign in/i });
    expect((await cta.boundingBox())?.height).toBeGreaterThanOrEqual(40);
  });

  test('invalid credentials show an inline error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'unknown@example.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(formAlert(page)).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('protected pages send visitors to sign in and back again', async ({ page }) => {
    await page.goto('/findings');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Ffindings$/);

    // Typed rather than via the dev-accounts panel, which production builds omit.
    await page.fill('#email', process.env.E2E_EMAIL ?? 'researcher@promptfence.internal');
    await page.fill('#password', process.env.E2E_PASSWORD ?? 'ResearcherPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Real sign-in: login + session lookup against the live API can take several seconds.
    await expect(page).toHaveURL(/\/findings$/, { timeout: 20_000 });
  });

  test('password visibility toggle works from the keyboard', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#password').fill('Secret123!');
    await page.locator('#password').press('Tab');

    const toggle = page.getByRole('button', { name: 'Show password' });
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('forgot password reports a failed request instead of claiming success', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) => route.abort('internetdisconnected'));
    await page.goto('/auth/forgot-password');
    await page.fill('#email', 'someone@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(formAlert(page)).toContainText(/unable to reach/i);
    await expect(page.getByText(/check your email/i)).toHaveCount(0);
  });

  test('email verification link resolves', async ({ page }) => {
    await stubAuth(page, 'verify-email', 200, { message: 'verified' });
    await page.goto('/auth/verify-email?token=e2e-token');

    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
  });

  test('auth pages fit a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const path of ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password?token=x']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${path} scrolls horizontally`).toBe(false);
    }
  });
});
