# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Add a "Ground Integrity" view to SelahOS -- a quiet, read-only 7-day grid showing anchor completion patterns. No gamification, no scores, just truthful visibility into the shape of the ground layer over the past week.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 3 (7-day anchor grid, anchor category grouping, nav tab addition)
- **User stories/acceptance criteria:** 4 success criteria, 5 explicit "what this is NOT" constraints
- **Estimated total work:** 3-5 hours

### Complexity Rating
**Overall Complexity: SIMPLE**

**Rationale:**
- Single read-only view with no write operations, no forms, no mutations
- Queries an existing table (`daily_records`) with a straightforward date-range filter -- no new database tables or schema changes required
- The existing codebase has a perfectly repeatable pattern: `'use client'` page + custom hook + Supabase client query. Every existing page follows this exact structure. This feature is a carbon copy of that pattern.
- No external API integrations, no complex state management, no new auth flows

---

## Architectural Analysis

### Existing Codebase Architecture

The codebase is a small, well-structured Next.js 15 App Router application with a consistent and intentional architecture:

**Layer 1: Pages (App Router)**
- `src/app/page.tsx` -- Today (daily anchors)
- `src/app/project/page.tsx` -- Ground Project management
- `src/app/signals/page.tsx` -- Weekly Signals
- `src/app/login/page.tsx` -- Magic link auth
- `src/app/auth/callback/route.ts` -- Auth callback handler

Each page follows an identical pattern:
1. `'use client'` directive
2. Auth wrapper component that fetches user via `supabase.auth.getUser()`
3. Content component that receives `userId` as prop and calls the relevant hook
4. Layout: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`

**Layer 2: Hooks**
- `use-daily-record.ts` -- Single-day fetch + debounced upsert
- `use-ground-project.ts` -- Project CRUD
- `use-weekly-signals.ts` -- Weekly signal fetch + explicit save
- `use-debounced-save.ts` -- Shared debounce utility
- `use-active-project-name.ts` -- Reads active project name for Today page

Each hook: creates Supabase client via `createClient()`, manages its own loading/error state, returns a clean API surface.

**Layer 3: Shared Components**
- `nav.tsx` -- Bottom nav with `NAV_ITEMS` array (trivially extensible)
- `section-group.tsx` -- Section wrapper with label
- `anchor-checkbox.tsx` -- Circular checkbox with green fill
- `sleep-button.tsx` -- Timestamp toggle button
- `note-field.tsx` -- Textarea component
- `date-header.tsx` -- Formatted date display

**Layer 4: Utilities**
- `lib/dates.ts` -- Date formatting, effective date calculation, week start calculation
- `lib/constants.ts` -- `DAY_BOUNDARY_HOUR = 4` (before 4am = previous day)
- `lib/types.ts` -- Supabase Database type definitions
- `lib/supabase/client.ts` -- Browser client factory
- `lib/supabase/server.ts` -- Server client factory
- `lib/supabase/middleware.ts` -- Auth session refresh

### Major Components for Ground Integrity View

1. **New Route: `src/app/ground/page.tsx`**
   - **Purpose:** Read-only 7-day anchor grid view
   - **Complexity:** LOW
   - **Why critical:** This is the entire feature -- a single page
   - **Pattern to follow:** Exact same auth wrapper + content component pattern used by all existing pages

2. **New Hook: `src/hooks/use-ground-integrity.ts`**
   - **Purpose:** Fetch last 7 days of `daily_records` for the authenticated user
   - **Complexity:** LOW
   - **Why critical:** Data layer for the view. Simpler than existing hooks because it is read-only (no mutations, no debouncing, no upsert).
   - **Query shape:** `supabase.from('daily_records').select('*').eq('user_id', userId).gte('date', sevenDaysAgo).order('date', { ascending: true })`

3. **New Component: `src/components/integrity-grid.tsx` (or inline in page)**
   - **Purpose:** Visual 7-day x 5-category grid showing filled/empty dots
   - **Complexity:** LOW-MEDIUM
   - **Why critical:** The primary visual element. Must communicate truthfully without triggering gamification anxiety.
   - **Design:** Pure presentational component. Receives 7 days of records, maps each to 5 anchor categories (Sleep, Food, Medication, Body, Ground), renders filled/empty dots.

4. **Nav Update: `src/components/nav.tsx`**
   - **Purpose:** Add "Ground" as 4th tab
   - **Complexity:** TRIVIAL
   - **Why critical:** The `NAV_ITEMS` array on line 7-11 is a simple array of `{ href, label }` objects. Adding a 4th entry is a one-line change.

### Anchor Category Mapping

The vision specifies 5 anchor categories derived from `daily_records` fields:

| Category   | Fields from daily_records                   | Logic                                           |
|------------|---------------------------------------------|--------------------------------------------------|
| Sleep      | `sleep_start`, `sleep_end`                  | Both non-null = filled                           |
| Food       | `breakfast`, `lunch`, `dinner`              | All three true = filled (or partial indication)  |
| Medication | `cipralex_taken`                            | Boolean = filled/empty                           |
| Body       | `hygiene_done`, `movement_done`             | Both true = filled                               |
| Ground     | `ground_maintenance_done`, `ground_build_done` | Both true = filled                            |

This mapping is pure logic -- no database changes needed. The `DailyRecord` type in `src/lib/types.ts` already has all required fields.

### Technology Stack Implications

**No new dependencies needed.** The feature uses:
- Supabase client (already installed) for querying `daily_records`
- React hooks (built-in) for state management
- Tailwind CSS v4 (already configured) with the existing warm/green palette in `globals.css`
- Next.js App Router (existing) for the `/ground` route

**Date utilities:** The existing `src/lib/dates.ts` has `getEffectiveDate()` and `formatDateString()`. A small helper to compute "7 days ago" date string will be needed, or it can be inlined in the hook. The `getEffectiveDate` function already handles the day boundary (before 4am = yesterday), which the Ground view should respect for "today."

---

## Iteration Breakdown Recommendation

### Recommendation: SINGLE ITERATION

**Rationale:**
- This is a single read-only view with no write operations
- No database changes required -- queries existing `daily_records` table
- The codebase has an extremely clear, repeatable pattern: page + hook + component
- Total estimated work: 3-5 hours including tests
- All pieces (route, hook, grid component, nav update) are tightly coupled and belong together
- No foundation needs to be laid first -- the foundation already exists from plan-1

**Estimated duration:** 3-5 hours

**What this iteration includes:**
1. `use-ground-integrity` hook (read-only query for 7 days of records)
2. `/ground` page with auth wrapper (following existing pattern exactly)
3. Integrity grid component (7-day x 5-category dot grid)
4. Nav update (add "Ground" tab as 4th item)
5. Date utility addition (7-day-ago date calculation)
6. Tests for hook, page, grid component, and updated nav

---

## Dependency Graph

```
Existing Foundation (plan-1, already deployed)
  daily_records table (Supabase, with RLS)
  Auth system (magic link, getUser())
  Supabase client (lib/supabase/client.ts)
  Date utilities (lib/dates.ts)
  Warm/green design system (globals.css)
  Nav component (components/nav.tsx)
      |
      v
Ground Integrity View (plan-2, single iteration)
  use-ground-integrity hook (reads daily_records)
  /ground page (uses hook, follows auth pattern)
  integrity-grid component (renders dot grid)
  nav.tsx update (add "Ground" tab)
```

No cross-cutting dependencies. No blocking relationships between new files -- they can be built in sequence within a single iteration.

---

## Risk Assessment

### Low Risks

- **Empty state (no records for past 7 days):** New users or users who haven't logged anchors will see an empty grid. The component should handle this gracefully with 7 columns of empty dots. This is a trivial design consideration, not a technical risk.

- **Day boundary alignment:** The `getEffectiveDate()` function handles pre-4am as "yesterday." The Ground Integrity hook should use this for "today" (the rightmost column) to match what the Today page shows. The pattern is already established.

- **Mobile layout with 4 nav items:** Currently 3 items at `flex-1` each. Adding a 4th still works fine at `flex-1` (each gets 25% width). The labels ("Today", "Project", "Signals", "Ground") are all short enough. No risk.

- **RLS (Row Level Security):** Already configured on `daily_records` -- the existing `user_id` filter in the query, combined with RLS policies, ensures users only see their own data. No additional security work needed.

---

## Testability Assessment

### Existing Test Patterns

The codebase has thorough, well-structured tests using Vitest + React Testing Library + jsdom:

- **Hook tests** (`use-daily-record.test.ts`, `use-weekly-signals.test.ts`): Mock Supabase client with chained method mocking (`from().select().eq().maybeSingle()`), test loading states, error states, data population, and side effects.
- **Component tests** (`nav.test.tsx`, `anchor-checkbox.test.tsx`, `section-group.test.tsx`): Render and assert DOM output, accessibility attributes, interaction behavior.
- **Page tests** (`page.test.tsx`, `signals.test.tsx`, `project.test.tsx`): Full page renders with mocked Supabase, testing loading, error, and data display states.

### Test Plan for Ground Integrity

**Hook test (`use-ground-integrity.test.ts`):**
- Mock Supabase `from('daily_records').select('*').eq('user_id', ...).gte('date', ...).order(...)` chain
- Test: returns 7 days of records when data exists
- Test: handles partial data (e.g., only 3 days of records)
- Test: handles empty result (no records)
- Test: error state on query failure
- Test: loading state transitions
- Follow exact mock pattern from `use-daily-record.test.ts` (chained mock with `vi.fn().mockReturnThis()`)

**Grid component test (`integrity-grid.test.tsx`):**
- Test: renders correct number of dots (7 days x 5 categories = 35 dots)
- Test: filled dots for completed anchors
- Test: empty dots for missing anchors
- Test: handles empty records array
- Test: category grouping logic (Sleep = both sleep_start and sleep_end non-null)

**Page test (`ground.test.tsx`):**
- Test: renders loading state
- Test: displays grid after data loads
- Test: error display
- Follow pattern from `signals.test.tsx`

**Nav test update (`nav.test.tsx`):**
- Update existing test: "renders four navigation links" (currently checks for three)
- Add assertion for "Ground" link with `href="/ground"`

### Test Configuration
- Vitest with jsdom environment (already configured in `vitest.config.ts`)
- `@testing-library/jest-dom/vitest` matchers (already in `src/test/setup.ts`)
- Path alias `@/` resolved (already in vitest config)
- Run with `npm test` (vitest run)

---

## Existing Patterns to Follow Precisely

### Page Pattern (from `src/app/signals/page.tsx`)
```
'use client'
- Import createClient, custom hook, components
- AuthWrapper: useState<User>, useEffect getUser(), render null-state or Content
- Content({ userId }): use custom hook, render with max-w-lg layout, pb-24 for nav clearance
```

### Hook Pattern (from `src/hooks/use-weekly-signals.ts`)
```
'use client'
- createClient() inside hook
- useState for data, isLoading, error
- useEffect with [userId, ...] deps for initial fetch
- Return { data, isLoading, error }
- NOTE: Ground Integrity hook is simpler -- read-only, no mutations
```

### Nav Pattern (from `src/components/nav.tsx`)
```
NAV_ITEMS array: add { href: '/ground', label: 'Ground' }
- Active state: pathname === href -> text-green-600
- Inactive: text-warm-600
```

### CSS/Design Tokens (from `src/app/globals.css`)
```
- Warm palette: warm-50 through warm-800 (grey/brown)
- Green accents: green-500, green-600, green-700 (earthy, desaturated)
- Error: B85C5C
- Body: bg-warm-100 text-warm-700 font-sans
- Font size: 17px base
```

---

## Recommendations for Master Plan

1. **Single iteration is the clear choice.** This feature is a textbook addition to an existing, well-patterned codebase. The architecture is already established. The data model is already in place. Breaking this into multiple iterations would add overhead without benefit.

2. **Follow existing patterns exactly.** The biggest risk is not technical -- it is stylistic. The new page, hook, and component should be indistinguishable in code style from the existing ones. Same auth wrapper pattern, same layout classes, same error handling, same test mock structure.

3. **The hook is the simplest part.** Unlike `useDailyRecord` (which has debounced saves, upserts, visibility change handlers) or `useWeeklySignals` (which has explicit save and history fetch), `useGroundIntegrity` is purely read-only: fetch 7 days of records, return them. No mutations, no debouncing, no flush logic.

4. **The grid component is the core design challenge.** The technical implementation is trivial (map records to dots), but the visual design must satisfy the "quiet mirror" constraint: no streaks, no scores, no encouragement. This is a design decision, not an architecture decision. The builder should reference the vision's success criteria carefully.

5. **Date range calculation must respect the day boundary.** Use `getEffectiveDate()` for "today" and compute 6 days prior. This ensures the Ground view's rightmost column matches what the Today page shows, even at 2am.

6. **Nav test must be updated.** The existing `nav.test.tsx` asserts exactly 3 links. Adding a 4th tab will break this test. The builder must update the nav test as part of the same change.

---

## Notes & Observations

- The codebase is remarkably disciplined: 17 source files, 15 test files. Nearly 1:1 test coverage. The Ground Integrity feature should maintain this standard.

- There is no shared auth context or provider. Each page independently calls `supabase.auth.getUser()` in a `useEffect`. This is intentional simplicity for a single-user app. The Ground page should follow the same pattern.

- The `basePath: '/os'` in `next.config.ts` means the route will be accessible at `/os/ground`. The Next.js App Router handles this automatically -- no special path handling needed in the page or nav.

- The `pb-24` class on content areas provides clearance for the fixed bottom nav. With 4 tabs instead of 3, the nav height (`h-14`) remains unchanged, so `pb-24` is still sufficient.

- The `daily_records` table uses `user_id,date` as a composite unique constraint (evidenced by `onConflict: 'user_id,date'` in the upsert). The Ground Integrity query filters by `user_id` and date range, which aligns perfectly with this structure.

---

*Exploration completed: 2026-03-12*
*This report informs master planning decisions*
