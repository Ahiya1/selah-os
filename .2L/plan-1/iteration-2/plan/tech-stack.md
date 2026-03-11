# Technology Stack - Iteration 2

## No Changes From Iteration 1

Iteration 2 introduces **zero new dependencies**. The stack is locked and complete.

## Production Dependencies (5 packages, unchanged)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.5.12 | App Router, server/client components, routing |
| `react` | ^19.2.4 | UI rendering |
| `react-dom` | ^19.2.4 | DOM rendering |
| `@supabase/ssr` | 0.9.0 (pinned) | SSR-compatible Supabase client (auth, middleware) |
| `@supabase/supabase-js` | ^2.99.1 | Supabase core SDK (database, auth) |

## Dev Dependencies (12 packages, unchanged)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.9.3 | Type checking (strict mode) |
| `tailwindcss` | 4.2.1 | CSS utility framework (v4 with @theme) |
| `@tailwindcss/postcss` | 4.2.1 | PostCSS plugin for Tailwind v4 |
| `eslint` | ^9.0.0 | Code quality linting |
| `eslint-config-next` | 15.5.12 | Next.js ESLint rules |
| `vitest` | ^4.0.18 | Test runner |
| `@vitest/coverage-v8` | ^4.0.18 | Coverage reporting |
| `@testing-library/react` | ^16.3.2 | Component rendering for tests |
| `@testing-library/jest-dom` | ^6.9.1 | DOM assertion matchers |
| `jsdom` | ^28.1.0 | DOM environment for Vitest |
| `@types/node` | ^22.0.0 | Node.js type definitions |
| `@types/react` | ^19.2.14 | React type definitions |

## Design System (unchanged)

**Palette (defined in `src/app/globals.css` via `@theme`):**
- Background: `bg-warm-100` (#F5F3F0)
- Text: `text-warm-700` (#524840)
- Headings: `text-warm-800` (#3D3632)
- Labels/muted: `text-warm-600` (#6B6158) -- **updated from text-warm-500 for contrast compliance**
- Inputs: `bg-warm-50` (#FAF8F5) with `border-warm-300` (#D4CEC7)
- Accent: `bg-green-600` (#6B8F71) for active states and primary buttons
- Error: `text-error` (#B85C5C)

**Typography:**
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- Base font size: 17px
- Line height: 1.5

**Interaction:**
- Tap targets: 56px minimum (`min-w-[56px] min-h-[56px]`)
- Native HTML elements (checkbox, button, textarea) -- no UI library

## Database (unchanged, already deployed)

- **Provider:** Supabase (PostgreSQL)
- **Tables:** `daily_records`, `ground_projects`, `weekly_signals`
- **Auth:** Magic link via Supabase Auth
- **Security:** Row Level Security on all tables, no DELETE policies
- **Schema file:** `supabase/migrations/001_initial_schema.sql`

## Environment Variables (unchanged)

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel | Supabase anonymous key (safe to expose, RLS enforces security) |

**Never expose:** `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).

## CI Pipeline (unchanged)

GitHub Actions (`.github/workflows/ci.yml`):
1. **quality**: TypeScript check + ESLint
2. **test**: `vitest run --coverage` with artifact upload
3. **build**: `next build` with placeholder env vars

## What Builders Should Know

- No `npm install` needed. All dependencies are already in `node_modules`.
- No schema changes needed. All tables are deployed.
- No configuration changes needed. Vitest, ESLint, TypeScript, Tailwind all configured.
- No new patterns needed. Follow the established patterns from Iteration 1 exactly.
- The only file outside `src/` that a builder might touch is `src/lib/dates.ts` (adding `formatWeekRange`).
