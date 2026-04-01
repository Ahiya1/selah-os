# Technology Stack

## Core Framework

**Decision:** Next.js 15.5.12 with App Router (existing, no change)

**Rationale:**
- Already in use and working well
- App Router provides file-system routing (deleting `src/app/project/page.tsx` automatically removes the `/project` route)
- No new framework features needed for this iteration

## Runtime

**Decision:** React 19.2.4, TypeScript 5.9.3 strict mode (existing, no change)

**Rationale:**
- No new React features needed; standard useState/useEffect/useCallback patterns
- TypeScript strict mode catches `boolean | null` type mismatches at compile time

## Database

**Decision:** Supabase (PostgreSQL) with manual migrations (existing, no change)

**Schema Strategy:**
- New migration: `supabase/migrations/002_anchor_three_state.sql`
- Migration naming convention: `{sequence_number}_{descriptive_name}.sql`
- Migrations applied via Supabase dashboard SQL editor (no local dev setup, no `supabase start`)
- No ORM; direct Supabase JS client queries

**Migration Details:**
- 8 anchor boolean columns change from `BOOLEAN NOT NULL DEFAULT FALSE` to `BOOLEAN DEFAULT NULL`
- Existing `false` values backfilled to `NULL` (semantic correction: old false = untouched)
- `ground_projects` and `weekly_signals` tables left in place (no destructive migration)

## Authentication

**Decision:** Supabase Auth with magic link (existing, no change)

**Implementation Notes:**
- Auth flow untouched by this iteration
- RLS policies on `daily_records` remain: SELECT/INSERT/UPDATE where `auth.uid() = user_id`
- No new auth requirements introduced

## API Layer

**Decision:** Direct Supabase client-side queries (existing, no change)

**Pattern:**
- `createClient()` from `@/lib/supabase/client`
- `.from('daily_records').select().eq().eq().maybeSingle()` for reads
- `.from('daily_records').upsert(payload, { onConflict: 'user_id,date' }).select().single()` for writes
- No REST API routes, no tRPC, no server actions

## Frontend

**Decision:** Tailwind CSS 4.2.1 with custom warm palette via `@theme` directive (existing, no change)

**UI Component Library:** None -- all components are hand-built, minimal

**Styling:** Tailwind utility classes only. Custom tokens defined in `globals.css`:
- Warm palette: `warm-50` through `warm-800` (grey/brown)
- Garden green accents: `green-500` through `green-700`
- Functional: `error` (#B85C5C)

**New Visual Tokens Used:**
- `bg-warm-300` -- "not done" circle fill (already defined, previously used for borders/dots)
- `text-warm-600` -- "not done" dash color (already in use for labels)
- No new Tailwind tokens needed

## External Integrations

### Supabase
**Purpose:** Authentication + PostgreSQL database
**Library:** `@supabase/supabase-js` 2.99.1
**Implementation:** Client-side queries with RLS. No server-side Supabase usage.

No other external integrations exist or are needed for this iteration.

## Development Tools

### Testing
- **Framework:** Vitest 4.0.18 with jsdom environment
- **Component Testing:** @testing-library/react 16.3.2
- **DOM Matchers:** @testing-library/jest-dom (imported via `src/test/setup.ts`)
- **Coverage:** @vitest/coverage-v8 4.0.18
- **Coverage target:** >= 70% overall (baseline is 92.26%)
- **Strategy:** Co-located tests (test files next to source files)

### Code Quality
- **Linter:** ESLint (Next.js default config)
- **Type Checking:** `npx tsc --noEmit` (TypeScript strict mode)
- **No formatter enforced** (code style is consistent by convention)

### Build and Deploy
- **Build tool:** Next.js (`npm run build`)
- **Deployment target:** Vercel (auto-deploy on push to master)
- **Base path:** `/os` (app hosted at `selah.im/os`)

## Environment Variables

No new environment variables. Existing ones:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (client-side auth)

## Dependencies Overview

No new dependencies. Key existing packages:
- `next`: 15.5.12 -- Framework
- `react`: 19.2.4 -- UI library
- `@supabase/supabase-js`: 2.99.1 -- Database client
- `typescript`: 5.9.3 -- Type system
- `tailwindcss`: 4.2.1 -- Styling
- `vitest`: 4.0.18 -- Test runner
- `@testing-library/react`: 16.3.2 -- Component testing
- `@vitest/coverage-v8`: 4.0.18 -- Coverage reporting

## Performance Targets

- No new performance requirements
- Removing nav component reduces DOM nodes and eliminates `usePathname` hook on every page
- Removing 3 unused hooks (`useActiveProjectName`, `useGroundProject`, `useWeeklySignals`) eliminates dead Supabase queries
- Bundle size should decrease (fewer pages, fewer hooks, no nav)

## Security Considerations

- **No new attack surface:** This iteration is primarily subtraction (removing features)
- **RLS policies unchanged:** `daily_records` table continues to enforce `auth.uid() = user_id`
- **Nullable columns:** `NULL` values in anchor columns are a valid PostgreSQL state; no injection risk
- **No new API endpoints:** All data access patterns remain client-side Supabase queries with RLS
