# PromptFence Frontend

Next.js 14 web application for the PromptFence AI Application Security Testing Lab.

## Tech Stack
- **Next.js 14 (App Router)**
- **TypeScript 5 (Strict Mode)**
- **Tailwind CSS** with custom cybersecurity theme tokens
- **shadcn/ui** headless component architecture (Radix UI)
- **TanStack Query v5** for server-state caching
- **React Hook Form** + **Zod** for form validation
- **Recharts** for metric visualization
- **Lucide React** for icons
- **Vitest** & **Playwright** for testing

## Directory Structure
```
frontend/
├── src/
│   ├── app/            # App Router pages (auth, dashboard, targets, suites, scenarios)
│   ├── components/     # Reusable UI primitives, layouts, forms, and tables
│   ├── features/       # Feature domain slices (auth, targets, test-suites, scenarios, dashboard)
│   ├── hooks/          # React hooks (use-auth, use-targets, use-debounce, etc.)
│   ├── lib/            # Utilities and Axios API client with automatic token refreshing
│   ├── providers/      # TanStack Query and Auth context providers
│   ├── services/       # Typed backend API client services
│   ├── styles/         # Global styles and Tailwind tokens
│   └── types/          # Shared TypeScript type definitions
├── tests/              # Vitest unit and component tests
└── e2e/                # Playwright end-to-end tests
```

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Quality & Tests
```bash
# Unit tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# End-to-end tests
npm run test:e2e
```

