# Technology Stack

## Core Framework

**Decision:** Next.js 15.5.12 (App Router, TypeScript)

**Rationale:**
- Next.js 15.x is the current LTS line with proven stability on Vercel
- App Router is the modern standard for new Next.js projects
- Server Components + Client Components model suits our hybrid needs (server auth check + client-side interactions)
- Next.js 16.x exists but is too new for a decades-stable project

**Alternatives Considered:**
- Next.js 16.x: Too new, higher risk of breaking changes in early patches
- Remix: Viable but less Vercel integration, smaller ecosystem for Supabase SSR

**Configuration (`next.config.ts`):**
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

Minimal configuration. No custom webpack, no experimental features.

## Language

**Decision:** TypeScript 5.9.x with strict mode

**Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      { "name": "next" }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key decisions:**
- `strict: true` enables all strict type checking (catches bugs at compile time)
- `@/*` path alias maps to `./src/*` for clean imports
- `moduleResolution: "bundler"` matches the Next.js bundler

## Database + Auth

**Decision:** Supabase (PostgreSQL + Auth + Row Level Security)

**Rationale:**
- Single managed service handles database, authentication, and authorization
- RLS enforces data security at the database level (not application level)
- Magic link auth eliminates password management
- Free tier is more than sufficient for single-user (365 rows/year in daily_records)
- Direct client-side queries via `@supabase/supabase-js` -- no custom API layer needed

**Packages:**
- `@supabase/supabase-js@^2.99.1` -- Supabase client for queries and auth
- `@supabase/ssr@0.9.0` -- Server-side auth for Next.js App Router (pinned exactly, pre-1.0)

**Schema Strategy:**
- All 3 tables created in Iteration 1 (daily_records, ground_projects, weekly_signals)
- Migration stored in `supabase/migrations/001_initial_schema.sql`
- Applied manually via Supabase SQL Editor (no Supabase CLI required for v1)
- RLS enabled on all tables with per-operation policies (SELECT, INSERT, UPDATE)
- No DELETE policies (intentional -- protect against accidental data loss)
- `updated_at` column with auto-update trigger for debugging and conflict detection
- `UNIQUE(user_id, date)` constraint on daily_records enables the upsert pattern

## Styling

**Decision:** Tailwind CSS v4.2.1 (CSS-first configuration)

**Rationale:**
- Utility-first CSS is efficient for a small custom-palette app
- Tailwind v4 uses CSS `@theme` directive -- no tailwind.config.ts file needed
- No autoprefixer needed (Tailwind v4 handles vendor prefixes internally)
- Smaller setup footprint than v3

**Packages (dev):**
- `tailwindcss@4.2.1`
- `@tailwindcss/postcss@4.2.1`

**Configuration (`postcss.config.mjs`):**
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**No `tailwind.config.ts` file.** Theme is defined in `src/app/globals.css` via `@theme`.

**UI Component Library:** None. Native HTML elements (`<input type="checkbox">`, `<button>`, `<textarea>`) with Tailwind classes. The vision mandates simplicity and maximum durability.

## Testing

**Decision:** Vitest 4.x + Testing Library + jsdom

**Rationale:**
- Vitest is TypeScript-native, fast, and requires minimal configuration
- Testing Library encourages testing user-visible behavior, not implementation details
- jsdom provides a lightweight DOM environment without a real browser
- No E2E tests in Iteration 1 (manual verification sufficient for 1 screen + auth)

**Packages (dev):**
- `vitest@^4.0.18` -- Test runner
- `@testing-library/react@^16.3.2` -- Component testing
- `@testing-library/jest-dom@^6.9.1` -- DOM assertion matchers
- `jsdom@^28.1.0` -- DOM environment

**Coverage targets for Iteration 1:**

| Module Type | Minimum | Target |
|------------|---------|--------|
| Date utilities (lib/dates.ts) | 90% | 95% |
| Hooks (use-daily-record) | 70% | 80% |
| Components (checkbox, sleep-button) | 60% | 70% |

**Test file location:** Co-located with source files using `.test.ts` / `.test.tsx` suffix.

## Code Quality

**Decision:** ESLint 9.x with Next.js config (flat config format)

**Packages (dev):**
- `eslint@^9.0.0`
- `eslint-config-next@15.5.12` (matches Next.js version)

**No Prettier.** Single-developer project; CI linting is sufficient.
**No Husky / lint-staged.** CI linting is sufficient for v1.

## Environment Variables

All required environment variables for Iteration 1:

```env
# .env.local (not committed to git)

# Supabase - Public (safe to expose, RLS enforces security)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# NEVER add SUPABASE_SERVICE_ROLE_KEY to NEXT_PUBLIC_ or client code
```

**Security rules:**
- `NEXT_PUBLIC_SUPABASE_URL` -- safe to expose (public API endpoint)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- safe to expose (RLS enforces access control)
- `SUPABASE_SERVICE_ROLE_KEY` -- NEVER in `NEXT_PUBLIC_`, NEVER in browser code, not needed for Iteration 1

## Full Dependency Manifest

### Production Dependencies (5 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `15.5.12` | App Router framework (pinned exactly) |
| `react` | `^19.2.4` | UI library (required by Next.js 15) |
| `react-dom` | `^19.2.4` | DOM rendering (required by Next.js 15) |
| `@supabase/supabase-js` | `^2.99.1` | Supabase client (database + auth) |
| `@supabase/ssr` | `0.9.0` | Server-side auth for Next.js App Router (pinned exactly, pre-1.0) |

### Dev Dependencies (11 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.9.3` | Type checking |
| `@types/react` | `^19.2.14` | React type definitions |
| `@types/node` | `^22.0.0` | Node.js type definitions |
| `tailwindcss` | `4.2.1` | CSS utility framework (pinned to v4 stable) |
| `@tailwindcss/postcss` | `4.2.1` | PostCSS plugin for Tailwind v4 |
| `eslint` | `^9.0.0` | Code linting (flat config) |
| `eslint-config-next` | `15.5.12` | Next.js ESLint rules |
| `vitest` | `^4.0.18` | Test runner |
| `@testing-library/react` | `^16.3.2` | Component testing |
| `@testing-library/jest-dom` | `^6.9.1` | DOM assertion matchers |
| `jsdom` | `^28.1.0` | DOM environment for tests |

**Total: 16 packages (5 production + 11 dev).**

### Explicitly Excluded Dependencies

| Package | Why Excluded |
|---------|-------------|
| date-fns / dayjs | Native `Date` + `Intl.DateTimeFormat` sufficient for day boundary and date display |
| Zustand / Redux / Jotai | React useState is sufficient for CRUD on 3 screens |
| React Query / SWR | Single-user app with simple fetches -- no caching layer needed |
| Zod | Database constraints and RLS handle validation; no complex input forms |
| Prisma / Drizzle | Supabase client handles queries directly |
| Any UI component library (MUI, Chakra, Radix) | Native HTML elements only -- vision mandates simplicity |
| Prettier | Single-developer project |
| Husky / lint-staged | CI linting sufficient |
| @vitejs/plugin-react | Not needed -- Vitest 4.x handles React JSX transforms natively |

**Design principle:** Every dependency is a future maintenance burden. For a system designed for decades, each package must justify its existence.

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Performance Targets

- First Contentful Paint: < 1.5s on 4G mobile
- Time to Interactive: < 2s on 4G mobile
- Interaction to Next Paint: < 100ms (checkbox toggles feel instant)
- Cumulative Layout Shift: < 0.05 (no layout jumps)
- JS bundle: < 80KB gzipped total
- API response time (Supabase upsert): < 300ms

Performance is achieved through:
- No web fonts (system font stack)
- No images (pure text + CSS)
- No UI component library (native HTML)
- Optimistic UI (no waiting for server response)
- Single Supabase client instance per session
- Minimal dependencies (5 production packages)

## Security Considerations

- **RLS enforced at database level**: All 3 tables have row-level security policies. `auth.uid() = user_id` on SELECT, INSERT, UPDATE. No DELETE policies (intentional).
- **Single-user enforcement**: Disable email signup in Supabase dashboard after creating initial user. RLS handles data isolation.
- **Session management**: `@supabase/ssr` handles HTTP-only cookies. Middleware refreshes sessions on every request.
- **No service role key in client**: Only anon key (designed to be public) is used in the browser. RLS is the security boundary.
- **No custom API routes**: Eliminates the risk of forgetting auth checks on endpoints.
- **Middleware route protection**: All routes except /login and /auth/* require valid session.
- **CSRF protection**: Handled by Supabase Auth's token-based approach.
- **XSS risk**: Minimal -- React's default escaping, no dangerouslySetInnerHTML.
