# ADR-002: Next.js App Router with Server Components First and Feature-Based Slices

## Status
Accepted

## Context
The frontend needs to handle complex security workflows, data tables, metrics, and interactive forms while maintaining high performance, fast initial page loads, and strict type safety. In previous architectures, client-side SPAs often bundled extensive state management libraries and leaked business types across disparate components.

## Decision
We adopt Next.js 14 App Router with the following architectural rules:
1. **Server Components by Default**: Pages and layout wrappers are Server Components by default to minimize client bundle size, maximize streaming performance, and avoid hydration waterfalls.
2. **Interactive Islands (`"use client"`)**: Client components are limited strictly to interactive leaves (forms with React Hook Form, TanStack Query hooks, dialogs, dropdowns, and Recharts visual widgets).
3. **Feature-Based Slices (`src/features/`)**: High-cohesion domain modules (`auth`, `targets`, `test-suites`, `scenarios`, `dashboard`) encapsulate feature-specific components, hooks, and sub-views.
4. **Shared UI Primitives (`src/components/ui/`)**: Reusable primitives built on Tailwind CSS and Radix UI headless conventions (shadcn/ui pattern).
5. **Typed API Layer**: Axios-based API client with automatic token refreshing, typed service wrappers, and TanStack Query for cache invalidation and optimistic updates.

## Consequences
### Positive
- Smaller client JavaScript bundles and rapid first contentful paint (FCP).
- Clear organization where each domain feature lives in a cohesive directory.
- Type contracts shared seamlessly across UI forms (Zod) and backend DTOs.

### Negative / Trade-offs
- Developers must understand the boundary between Server Components and Client Components (e.g. passing serializable props, avoiding browser globals in server files).
- React Context providers must be mounted inside dedicated client wrapper components (`QueryProvider`, `AuthProvider`).

