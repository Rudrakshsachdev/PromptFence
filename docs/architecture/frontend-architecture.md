# Frontend Architecture — PromptFence

## Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom CSS variables
- **Component Primitives**: shadcn/ui & Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod schema resolution
- **Server State**: TanStack Query (React Query v5)
- **Notifications**: Sonner toasts
- **Charts**: Recharts

## Component Architecture
```
frontend/src/
├── app/
│   ├── (auth)/          # Unauthenticated routes (login, register, forgot-password)
│   └── (dashboard)/     # Authenticated application shell with Sidebar and TopBar
├── components/
│   ├── ui/              # Atom components (Button, Input, Card, Table, Dialog)
│   ├── layout/          # Shell components (Sidebar, TopBar, Breadcrumbs, PageHeader)
│   ├── dashboard/       # Aggregated widgets (StatsCard, DistributionChart, QuickActions)
│   ├── forms/           # FormField, KeyValueEditor, JsonEditor, PasswordInput
│   └── shared/          # Logo, StatusBadge, CategoryBadge, SeverityBadge, ConfirmDialog
├── hooks/               # Custom hooks wrapping TanStack Query mutations/queries
└── services/            # Pure TypeScript API services making HTTP requests
```

## Security & Session Architecture
- Tokens are **never stored** in `window.localStorage` or `window.sessionStorage`.
- All requests send `credentials: 'include'` to allow the browser to manage `HttpOnly`, `Secure`, `SameSite=Lax` cookies automatically.
- Centralized `apiClient` intercepts 401 Unauthorized responses and seamlessly invokes `/api/v1/auth/refresh` to rotate tokens before retrying the original request.

