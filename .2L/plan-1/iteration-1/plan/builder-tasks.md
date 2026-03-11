# Builder Task Breakdown

## Overview

3 primary builders will work on Iteration 1.
No builders are expected to split into sub-builders (complexity is LOW-MEDIUM for each).

**Execution order:**
- Builder 1 must complete first (scaffolding dependency)
- Builders 2 and 3 run in parallel after Builder 1 finishes

**Total estimated build time:** 5-7 hours (wall-clock: ~4-5 hours with parallelism)

## Builder Assignment Strategy

- **Builder 1 (Foundation)**: Smallest scope, most mechanical. Completes first so others can start.
- **Builder 2 (Auth + Nav)**: Owns all Supabase client wiring, auth flow, layout, and navigation.
- **Builder 3 (Today Screen)**: Owns the primary user-facing feature -- all components, hooks, date utilities, and tests. This is the most important builder.
- Builders have zero file overlap. Integration is a clean merge.

---

## Builder-1: Foundation & Infrastructure

### Scope

Project scaffolding, all configuration files, design system CSS, database schema, TypeScript types, test infrastructure. This builder creates the foundation that Builders 2 and 3 depend on.

### Complexity Estimate
**LOW**

Mostly mechanical: creating config files, writing SQL, defining types. No application logic except the constants file.

### Success Criteria

- [ ] `npm install` succeeds with all 16 dependencies
- [ ] `npm run type-check` passes (TypeScript strict mode, even with no app code)
- [ ] `npm run lint` runs without configuration errors
- [ ] `npm run test` runs without configuration errors (zero tests is OK at this stage)
- [ ] `src/app/globals.css` contains the complete warm palette via `@theme`
- [ ] `src/lib/types.ts` contains Database interface with all 3 tables (Row, Insert, Update)
- [ ] `supabase/migrations/001_initial_schema.sql` contains all tables, RLS, indexes, triggers
- [ ] `.env.local.example` contains placeholder Supabase variables
- [ ] `.gitignore` excludes node_modules, .next, .env.local

### Files to Create

```
package.json                        # All dependencies with exact versions
tsconfig.json                       # TypeScript strict mode, @/* path alias
next.config.ts                      # Minimal Next.js config
postcss.config.mjs                  # Tailwind v4 PostCSS plugin
eslint.config.mjs                   # ESLint flat config with next rules
.gitignore                          # Standard Next.js + env ignores
.env.local.example                  # Supabase URL + anon key placeholders
vitest.config.ts                    # Vitest with jsdom, @/* alias, setup file
src/test/setup.ts                   # Testing Library Vitest matchers
src/app/globals.css                 # Tailwind v4 @theme + base styles
src/lib/constants.ts                # DAY_BOUNDARY_HOUR = 4
src/lib/types.ts                    # Database types for all 3 tables
supabase/migrations/001_initial_schema.sql  # Full schema + RLS + triggers
```

**Total: 13 files**

### Dependencies

**Depends on:** Nothing (first builder)
**Blocks:** Builder 2, Builder 3 (both need package.json, types.ts, globals.css)

### Implementation Notes

1. **Do NOT use `create-next-app`.** Create `package.json` manually for full control over dependencies. The project is simple enough that the boilerplate from create-next-app would need cleanup.

2. **package.json must include ALL dependencies** from tech-stack.md:
   - 5 production: next@15.5.12, react, react-dom, @supabase/supabase-js, @supabase/ssr@0.9.0
   - 11 dev: typescript, @types/react, @types/node, tailwindcss@4.2.1, @tailwindcss/postcss@4.2.1, eslint, eslint-config-next@15.5.12, vitest, @testing-library/react, @testing-library/jest-dom, jsdom

3. **package.json scripts:**
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

4. **ESLint must use flat config format** (eslint.config.mjs, not .eslintrc.json). ESLint 9 requires this.

5. **Schema SQL uses the detailed version from Explorer 1:**
   - Separate SELECT, INSERT, UPDATE policies per table (not `FOR ALL`)
   - `updated_at` column with auto-update trigger on all tables
   - `CHECK` constraint on ground_projects.status
   - Named unique constraints
   - Indexes on common query patterns
   - `note TEXT DEFAULT ''` (empty string default, not NULL)

6. **Types must include `updated_at`** in all Row/Insert/Update types.

7. **globals.css must use Tailwind v4 `@import "tailwindcss"` and `@theme`** -- NOT the v3 `@tailwind base/components/utilities` syntax.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use the exact CSS theme definition from "Design System" section
- Use the exact TypeScript types from "TypeScript Types" section
- Use the exact Vitest config from "Testing Patterns" section
- Use the exact schema SQL from patterns (with `updated_at`, triggers, separate policies)

### Testing Requirements

- No tests to write (this builder creates the test infrastructure, not tests)
- Verify vitest runs without errors: `npm run test` should exit 0 (no tests found is acceptable)
- Verify type-check passes: `npm run type-check` should exit 0

### Estimated Effort
1.5-2 hours

---

## Builder-2: Auth + Navigation Shell

### Scope

All Supabase client wiring (3 variants), authentication flow (login page, callback, middleware), root layout, bottom navigation bar, and placeholder pages. This builder owns everything auth-related and the application shell.

### Complexity Estimate
**MEDIUM**

The Supabase SSR client setup requires exact cookie handling patterns across three execution contexts. Misconfiguration causes auth loops or session loss. The patterns are well-documented in patterns.md but must be followed precisely.

### Success Criteria

- [ ] Three Supabase client files exist and export correct functions
- [ ] `middleware.ts` refreshes sessions and redirects unauthenticated users to /login
- [ ] Login page shows email input and "Send magic link" button
- [ ] Auth callback route exchanges code for session and redirects to /
- [ ] Root layout includes Nav component and applies global styles
- [ ] Nav component shows three text labels (Today, Project, Signals) with correct hrefs
- [ ] Active nav item is highlighted with garden green
- [ ] Nav is fixed at bottom with safe area padding
- [ ] /project renders placeholder page
- [ ] /signals renders placeholder page
- [ ] Nav component test passes
- [ ] TypeScript compiles without errors

### Files to Create

```
middleware.ts                           # Root middleware (route protection + session refresh)
src/lib/supabase/client.ts              # Browser Supabase client
src/lib/supabase/server.ts              # Server Supabase client (cookies)
src/lib/supabase/middleware.ts          # Middleware helper (updateSession)
src/app/layout.tsx                      # Root layout with Nav, metadata, viewport
src/app/login/page.tsx                  # Magic link login form
src/app/auth/callback/route.ts          # Auth callback route handler
src/app/project/page.tsx                # Placeholder page
src/app/signals/page.tsx                # Placeholder page
src/components/nav.tsx                  # Fixed bottom navigation bar
src/components/nav.test.tsx             # Nav component test
```

**Total: 11 files**

### Dependencies

**Depends on:** Builder 1 (package.json, globals.css, types.ts)
**Blocks:** Builder 3 (needs `src/lib/supabase/client.ts` for the data hook)

### Implementation Notes

1. **Copy the Supabase client patterns from patterns.md exactly.** The cookie handling in `server.ts` and `middleware.ts` is subtle. The `setAll` try/catch in server.ts is intentional (Server Components cannot set cookies). The middleware's `supabaseResponse` reassignment pattern is required.

2. **Use `getUser()`, NEVER `getSession()`** in the middleware. `getUser()` validates the JWT with the Supabase server. `getSession()` only reads the local JWT without validation and is not secure.

3. **Middleware matcher must exclude static files.** Use the regex pattern from patterns.md.

4. **Login page is a `'use client'` component.** It uses the browser Supabase client for `auth.signInWithOtp()`.

5. **Auth callback is a Route Handler** (not a page). It uses the server Supabase client.

6. **Root layout exports `metadata` and `viewport` separately** (Next.js 15 pattern -- viewport is no longer part of metadata).

7. **Nav component uses `usePathname()` from `next/navigation`** for active state detection.

8. **Nav must include `pb-[env(safe-area-inset-bottom)]`** for notched phones.

9. **Login page should NOT show the Nav bar.** Either conditionally hide Nav based on pathname in layout.tsx, or accept that Nav renders on the login page (it is harmless since the links redirect to /login anyway for unauthenticated users).

   **Decision:** Show Nav on all pages including login. The middleware redirects unauthenticated nav clicks back to /login. This avoids complexity in the layout.

10. **Placeholder pages use the pattern from patterns.md.** Include `pb-24` for nav clearance.

### Patterns to Follow

- Use the exact Supabase client patterns from "Supabase Client Patterns" section
- Use the exact middleware pattern from patterns.md
- Use the exact login page pattern from "Auth Flow Patterns" section
- Use the exact auth callback pattern from patterns.md
- Use the exact Nav component pattern from "Navigation Bar" section
- Use the exact layout pattern from "Root Layout Pattern" section
- Use the exact placeholder page pattern from patterns.md

### Testing Requirements

- Write Nav component test (nav.test.tsx) following the pattern in patterns.md
- Test: renders three navigation links with correct text
- Test: links have correct href attributes
- Mock `next/navigation` usePathname

### Estimated Effort
2-2.5 hours

---

## Builder-3: Today Screen

### Scope

The complete Today screen implementation: date utilities, data access hooks, all interactive components, page assembly, and tests. This is the most important builder -- the Today screen is where the user spends 95% of their time.

### Complexity Estimate
**MEDIUM**

The `useDailyRecord` hook is the densest piece of application logic (optimistic updates, debouncing, visibility change handling, upsert pattern). The components themselves are straightforward but must meet specific UX requirements (56px tap targets, auto-save, half-asleep usability).

### Success Criteria

- [ ] `getEffectiveDate()` returns correct date before and after 4 AM boundary
- [ ] `formatDisplayDate()` produces "Thursday, March 12" format
- [ ] `formatTime()` produces "07:14" format from ISO timestamp
- [ ] `useDailyRecord` hook fetches today's record on mount
- [ ] `useDailyRecord` hook upserts optimistically with 500ms debounce
- [ ] `useDailyRecord` hook flushes on visibility change
- [ ] Sleep buttons record current timestamp and toggle on re-tap
- [ ] All checkboxes have 56px minimum tap target
- [ ] Checked checkboxes show garden green state
- [ ] Note field auto-saves via the hook
- [ ] Today page shows all sections in a single viewport on 375x667 screen
- [ ] All date utility tests pass
- [ ] Hook tests pass (with mocked Supabase)
- [ ] Component tests pass (AnchorCheckbox)
- [ ] TypeScript compiles without errors

### Files to Create

```
src/lib/dates.ts                        # Day boundary, date formatting, time formatting
src/lib/dates.test.ts                   # Unit tests for date utilities
src/hooks/use-daily-record.ts           # Optimistic update hook with debounced save
src/hooks/use-daily-record.test.ts      # Hook tests with mocked Supabase
src/hooks/use-debounced-save.ts         # Generic debounced save utility (optional, can be inline in use-daily-record)
src/app/page.tsx                        # Today page (assembles all components)
src/components/date-header.tsx          # Client-only effective date display
src/components/anchor-checkbox.tsx      # Large tap target checkbox
src/components/anchor-checkbox.test.tsx # Checkbox component tests
src/components/sleep-button.tsx         # Sleep timestamp button
src/components/note-field.tsx           # Auto-saving textarea
src/components/section-group.tsx        # Visual grouping wrapper
```

**Total: 12 files**

### Dependencies

**Depends on:** Builder 1 (package.json, globals.css, types.ts, constants.ts, vitest config)
**Depends on:** Builder 2 (src/lib/supabase/client.ts -- imported by use-daily-record.ts)
**Blocks:** Nothing (end of dependency chain)

**Parallelism note:** Builder 3 can start immediately after Builder 1 completes, even before Builder 2 finishes. The only dependency on Builder 2 is `src/lib/supabase/client.ts`, which Builder 3 can stub temporarily or write a compatible version. However, since the file is small and well-defined, Builder 3 can simply create a minimal version and let Builder 2's final version overwrite it during integration.

**Recommended approach:** Builder 3 creates all files. If `src/lib/supabase/client.ts` does not yet exist, Builder 3 should create it following the pattern in patterns.md. During integration, Builder 2's version takes precedence (they are identical if both follow patterns.md).

### Implementation Notes

1. **dates.ts is the foundation.** Implement and test it first. Every other piece depends on correct date logic.

2. **useDailyRecord is the core hook.** Follow the pattern in patterns.md exactly. Key behaviors:
   - 500ms debounce for checkbox/note changes
   - Immediate flush for sleep button taps
   - Immediate flush on visibilitychange
   - `maybeSingle()` on fetch (record may not exist)
   - Optimistic local state update before debounce

3. **DateHeader must render client-only** (useEffect pattern) to avoid hydration mismatch. Use a placeholder `div` with `h-8` to prevent layout shift while the date loads.

4. **AnchorCheckbox uses sr-only native checkbox** with a custom visual circle. The `peer-checked` Tailwind class drives the green state. The label wraps both the hidden input and the visual indicator.

5. **SleepButton toggles between states:**
   - No timestamp: shows label text, warm-50 bg with border
   - Has timestamp: shows "label HH:MM", warm-200 bg (muted/completed)
   - Tapping when recorded clears the timestamp (undo)

6. **NoteField relies on the hook's debounce.** Each `onChange` calls `updateField('note', value)`, which triggers the 500ms debounce. No separate debounce in the NoteField component.

7. **Today page layout (`page.tsx`):**
   - `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`
   - `pb-24` clears the fixed bottom nav
   - Sections ordered: sleep, food, medication, body, ground, note
   - Food section: 3 checkboxes in a horizontal row (`flex justify-around`)
   - Body section: 2 checkboxes in a row
   - Ground section: 2 checkboxes in a row
   - Medication section: single checkbox

8. **User ID retrieval:** The page is `'use client'`. Get the user via `supabase.auth.getUser()` in a useEffect. The middleware guarantees the user is authenticated, so this is a formality.

9. **No loading spinner.** Show the empty state (all checkboxes unchecked, empty note) immediately. When the fetch resolves, populate the fields. This feels instant.

### Patterns to Follow

- Use the exact `getEffectiveDate` implementation from "Day Boundary Utility" section
- Use the exact `useDailyRecord` hook from "Data Access Patterns" section
- Use the exact AnchorCheckbox from "Anchor Checkbox" section
- Use the exact SleepButton from "Sleep Button" section
- Use the exact NoteField from "Note Field" section
- Use the exact SectionGroup from "Section Group" section
- Use the exact DateHeader from "Date Header" section
- Use the exact Today page assembly from "Today Page Assembly Pattern" section
- Use the exact test patterns from "Testing Patterns" section

### Testing Requirements

**Must-have tests (priority order):**

1. `src/lib/dates.test.ts` -- Day boundary tests:
   - getEffectiveDate returns today after 4 AM
   - getEffectiveDate returns yesterday before 4 AM
   - getEffectiveDate returns today at exactly 4 AM
   - getEffectiveDate handles midnight (returns yesterday)
   - getEffectiveDate handles 3:59 AM (returns yesterday)
   - getEffectiveDate accepts custom Date parameter
   - formatDisplayDate produces correct format
   - formatTime produces HH:MM format

2. `src/hooks/use-daily-record.test.ts` -- Hook tests:
   - Fetches record on mount (mocked Supabase)
   - Updates field optimistically

3. `src/components/anchor-checkbox.test.tsx` -- Component tests:
   - Renders with label text
   - Calls onChange when clicked
   - Shows checked state

**Coverage target:** 90%+ on dates.ts, 70%+ on hooks, 60%+ on components.

### Estimated Effort
2.5-3 hours

### Potential Split Strategy

If this task proves too complex (unlikely for MEDIUM complexity), split into:

**Sub-builder 3A: Date Utilities + Hooks**
- `src/lib/dates.ts`
- `src/lib/dates.test.ts`
- `src/hooks/use-daily-record.ts`
- `src/hooks/use-daily-record.test.ts`
- `src/hooks/use-debounced-save.ts`
- Estimate: LOW-MEDIUM

**Sub-builder 3B: Components + Page Assembly**
- `src/components/date-header.tsx`
- `src/components/anchor-checkbox.tsx` + test
- `src/components/sleep-button.tsx`
- `src/components/note-field.tsx`
- `src/components/section-group.tsx`
- `src/app/page.tsx`
- Estimate: LOW-MEDIUM

---

## Builder Execution Order

### Phase 1: Foundation (Builder 1, solo)

**Builder-1** runs first, producing all configuration files, globals.css, types.ts, constants.ts, and the schema SQL.

**Duration:** 1.5-2 hours

**Completion signal:** `npm install` and `npm run type-check` both succeed.

### Phase 2: Auth + Today Screen (Builders 2 and 3, parallel)

**Builder-2** and **Builder-3** start simultaneously after Builder 1 completes.

- Builder 2 creates auth flow, layout, navigation, placeholder pages
- Builder 3 creates date utilities, hooks, components, Today page, tests

**Duration:** 2-3 hours (wall-clock, parallel)

**Builder 3 note:** If Builder 3 needs `src/lib/supabase/client.ts` before Builder 2 produces it, Builder 3 creates it following the same pattern from patterns.md. The files will be identical.

### Phase 3: Integration (merge + verify)

After both builders complete:

1. Merge all builder outputs (zero file conflicts expected)
2. Run `npm install`
3. Run `npm run type-check` -- must pass
4. Run `npm run lint` -- must pass
5. Run `npm run test` -- all tests must pass
6. Run `npm run build` -- must succeed
7. Manual test with real Supabase credentials

**Duration:** 15-30 minutes

---

## Integration Notes

### Zero-Conflict Design

The builder task assignments have zero file overlap:

| File | Builder |
|------|---------|
| package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs | 1 |
| .gitignore, .env.local.example | 1 |
| vitest.config.ts, src/test/setup.ts | 1 |
| src/app/globals.css | 1 |
| src/lib/constants.ts, src/lib/types.ts | 1 |
| supabase/migrations/001_initial_schema.sql | 1 |
| middleware.ts | 2 |
| src/lib/supabase/client.ts, server.ts, middleware.ts | 2 |
| src/app/layout.tsx | 2 |
| src/app/login/page.tsx | 2 |
| src/app/auth/callback/route.ts | 2 |
| src/app/project/page.tsx, src/app/signals/page.tsx | 2 |
| src/components/nav.tsx, nav.test.tsx | 2 |
| src/lib/dates.ts, dates.test.ts | 3 |
| src/hooks/use-daily-record.ts, .test.ts | 3 |
| src/hooks/use-debounced-save.ts | 3 |
| src/app/page.tsx | 3 |
| src/components/date-header.tsx | 3 |
| src/components/anchor-checkbox.tsx, .test.tsx | 3 |
| src/components/sleep-button.tsx | 3 |
| src/components/note-field.tsx | 3 |
| src/components/section-group.tsx | 3 |

### Only Cross-Builder Import

Builder 3's `src/hooks/use-daily-record.ts` imports:
- `@/lib/supabase/client` (created by Builder 2)
- `@/lib/dates` (created by Builder 3 itself)
- `@/lib/types` (created by Builder 1)
- `@/lib/constants` (created by Builder 1)

If Builder 3 starts before Builder 2 finishes, Builder 3 should create `src/lib/supabase/client.ts` using the identical pattern from patterns.md.

### Post-Integration Checklist

- [ ] All 36+ files present in correct locations
- [ ] `npm install` succeeds
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all date, hook, and component tests)
- [ ] `npm run build` succeeds
- [ ] No TypeScript `any` types or `@ts-ignore` comments
- [ ] All imports use `@/` path alias
- [ ] Color tokens use `warm-*` and `green-*` (not gray-* or emerald-*)
