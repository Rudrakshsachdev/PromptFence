---
name: frontend-engineering
description: Develop high-quality Next.js App Router, TypeScript, and shadcn/ui frontend components and pages for PromptFence.
---

# Frontend Engineering Skill

## Purpose
Build professional, responsive, and accessible cybersecurity SaaS interfaces matching PromptFence design guidelines.

## Trigger Conditions
- Adding or modifying pages under `frontend/src/app/`.
- Building reusable UI or form components in `frontend/src/components/`.
- Integrating backend APIs through services and TanStack Query hooks.

## Engineering Standards

1. **Server vs. Client Components**:
   - Keep page containers as Server Components where possible.
   - Mark client files with `'use client';` at line 1 only when state (`useState`), effects (`useEffect`), forms, or browser events are required.

2. **Form Management**:
   - Use `react-hook-form` with `zodResolver`.
   - Always define strict Zod schemas for validation.
   - Display inline validation errors using `<FormField>`.

3. **Design Tokens & Aesthetic**:
   - Primary: Teal-600 (`#0D9488`).
   - Text: Slate-900 / Slate-700.
   - Backgrounds: Neutral slate-50/60.
   - Fonts: Inter (sans) and JetBrains Mono (code/IDs).
   - Never use loud gradient backgrounds, floating glassmorphism, or cartoonish graphics.

4. **API Integration**:
   - Add endpoint methods to `frontend/src/services/<domain>.service.ts`.
   - Wrap queries and mutations in `frontend/src/hooks/use-<domain>.ts`.
   - Use Sonner `toast.success` and `toast.error` for actionable user feedback.

## Component Creation Checklist
- [ ] TypeScript interfaces imported from `src/types/`?
- [ ] Loading skeleton state implemented for data fetches?
- [ ] Meaningful empty state displayed when lists are empty?
- [ ] Confirmation dialog added for destructive actions (delete)?
- [ ] No tokens saved in `localStorage`?

