# Frontend Engineering Guide — PromptFence

## Overview
This document guides AI coding agents and human engineers working on the PromptFence Next.js App Router frontend application.

## Engineering Standards
- **App Router First**: Use Next.js 14 App Router with Server Components by default.
- **Client Components**: Add `'use client';` only when user interactivity (state, effects, form handlers, event listeners) is strictly required.
- **Strict TypeScript**: Never use `any` without documented architectural exceptions. Use specific interfaces defined in `src/types/`.
- **Styling**: Tailwind CSS with shadcn/ui primitives. Adhere to the cybersecurity aesthetic (white/slate neutral backgrounds, slate-900 typography, teal-600 accents).
- **Forms**: React Hook Form with Zod schema validation.
- **State Management**:
  - Server state: TanStack Query (React Query)
  - Auth state: `src/providers/auth-provider.tsx`
  - Avoid unnecessary global stores (Redux, Zustand) when React Context and TanStack Query suffice.
- **API Communication**: All network requests must flow through `src/services/` using the centralized `src/lib/api-client.ts`. Never use direct fetch calls inside components.
- **Security**:
  - Never store access or refresh tokens in `localStorage` or `sessionStorage`.
  - Credentials are automatically transported via HttpOnly, Secure, SameSite cookies.
  - Escape dynamic content; rely on React's automatic XSS mitigation.

## Folder Organization
```
frontend/src/
├── app/                  # App router routes & pages
│   ├── (auth)/           # Authentication layout and login/register pages
│   └── (dashboard)/      # Protected dashboard layout and feature views
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Sidebar, TopBar, Breadcrumb, PageHeader
│   ├── dashboard/        # Dashboard cards, charts, empty states
│   ├── forms/            # Form fields, password input, JSON editor
│   └── shared/           # Logo, badges, confirm dialogs
├── constants/            # Static navigation, options, classifications
├── hooks/                # React hooks (useAuth, useTargets, etc.)
├── lib/                  # Utilities (cn, formatDate) and api-client
├── providers/            # AuthProvider, QueryProvider, ThemeProvider
├── services/             # API service layer (auth, targets, test-suites, scenarios)
├── styles/               # Global CSS and Tailwind directives
└── types/                # Shared TypeScript models and interfaces
```

