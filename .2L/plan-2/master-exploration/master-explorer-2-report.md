# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Add a "Ground Integrity" read-only view to SelahOS showing a quiet 7-day anchor completion grid -- a visual mirror of recent ground-layer patterns, not a gamified tracker.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 4 (hook, grid component, page route, nav update)
- **User stories/acceptance criteria:** 4 success criteria, 5 requirements blocks
- **Estimated total work:** 3-5 hours

### Complexity Rating
**Overall Complexity: SIMPLE**

**Rationale:**
- Single read-only view with no write operations or user interactions beyond navigation
- Queries an existing table (`daily_records`) with no schema changes
- No new dependencies required (pure CSS grid)
- Follows extremely well-established patterns already in the codebase (hooks, page structure, nav items, test mocking)
- Zero external integration points

---

## Dependency Chain Analysis

### Internal Dependencies (What the new feature depends on)

1. **`daily_records` table (Supabase)**
   - **Dependency type:** Data source (read-only)
   - **Status:** Already exists and in production since plan-1 iteration 1
   - **Fields needed:** `sleep_start`, `sleep_end`, `breakfast`, `lunch`, `dinner`, `cipralex_taken`, `hygiene_done`, `movement_done`, `ground_maintenance_done`, `ground_build_done`, `date`, `user_id`
   - **Risk:** NONE -- all fields already exist in `Database['public']['Tables']['daily_records']['Row']` type (verified in `/home/ahiya/Selah/selah-os/src/lib/types.ts`)

2. **Supabase client (`@/lib/supabase/client`)**
   - **Dependency type:** Infrastructure
   - **Status:** Already exists, used by all 4 existing hooks
   - **Pattern:** `createClient()` returns typed `SupabaseClient<Database>`
   - **Risk:** NONE

3. **Date utilities (`@/lib/dates`)**
   - **Dependency type:** Utility
   - **Status:** Already exists with `getEffectiveDate()`, `formatDateString()`, `formatDisplayDate()`
   - **Note:** New hook will need to compute 7 dates going backward. The existing `formatDateString()` helper is sufficient for this. A new helper function (e.g., `getLastNDates(n)`) could be added to `dates.ts` or kept inline in the hook.
   - **Risk:** LOW -- the day boundary logic (`DAY_BOUNDARY_HOUR = 4`) means "today" might be yesterday before 4AM. The hook should use `getEffectiveDate()` as the anchor for the 7-day window.

4. **Navigation component (`@/components/nav.tsx`)**
   - **Dependency type:** UI integration point
   - **Status:** Currently has 3 items: Today, Project, Signals
   - **Change needed:** Add a 4th item `{ href: '/ground', label: 'Ground' }`
   - **Risk:** LOW -- the `NAV_ITEMS` array is a simple constant; adding one entry is trivial. Existing test (`nav.test.tsx`) checks for 3 links and will need updating.

5. **Auth pattern (getUser)**
   - **Dependency type:** Page-level auth
   - **Status:** All pages use the same pattern: `createClient().auth.getUser()` in a `useEffect`, render empty div while null
   - **Risk:** NONE -- copy the established pattern exactly

6. **TypeScript types (`@/lib/types.ts`)**
   - **Dependency type:** Type system
   - **Status:** `DailyRecord` Row type already defines all needed fields
   - **Risk:** NONE

### External Dependencies (Third-party)

- **None required.** No new npm packages. The feature uses only what is already installed: React, Supabase client, Tailwind CSS, Next.js routing.

### Feature Dependency Order

```
Nothing blocks anything -- all dependencies already exist in production.

Existing Foundation (plan-1, already deployed)
|-- daily_records table + RLS policies
|-- Supabase client + types
|-- Date utilities
|-- Nav component
|-- Auth pattern
    |
    v
Ground Integrity Feature (plan-2, all in one pass)
|-- useGroundIntegrity hook (reads daily_records for 7 days)
|-- GroundIntegrity grid component (renders the data)
|-- /ground page (wires auth + hook + component)
|-- Nav update (add "Ground" tab)
```

There is a **minor internal dependency** within the new code itself:
1. The hook must exist before the page can use it
2. The grid component must exist before the page can render it
3. The nav update is independent of the page

But these are build-order dependencies within a single iteration, not cross-iteration blockers.

---

## Established Patterns to Follow

### Hook Pattern (Critical -- follow exactly)

Every hook in this codebase follows the same shape. The new `useGroundIntegrity` hook must match:

| Pattern Element | Example from `useDailyRecord` | New hook should do |
|---|---|---|
| Client-side only | `'use client'` at top | Same |
| Supabase via `createClient()` | `const supabase = createClient()` | Same |
| Takes `userId: string` param | `function useDailyRecord(userId: string)` | Same |
| Returns `{ data, isLoading, error }` | `{ record, isLoading, error }` | `{ records, isLoading, error }` |
| Fetches in `useEffect` on mount | `useEffect(() => { load() }, [userId, ...])` | Same |
| Uses typed `Database` import | `import type { Database } from '@/lib/types'` | Same |

**Key query difference:** Instead of `.eq('date', effectiveDate).maybeSingle()`, the new hook queries multiple dates with `.gte('date', startDate).lte('date', endDate)` or `.in('date', dateArray)`. Either approach works; `.gte`/`.lte` is simpler for a contiguous range.

### Test Pattern (Critical -- follow exactly)

Every test file follows a consistent mocking strategy:

1. **Mock Supabase client** at module level with `vi.mock('@/lib/supabase/client', ...)`
2. **Build chainable mocks** (`select -> eq -> eq -> maybeSingle`)
3. **Re-setup chains in `beforeEach`** after `vi.clearAllMocks()`
4. **Mock date utilities** with `vi.mock('@/lib/dates', ...)`
5. **Test loading, data, error, and edge case states**

The new hook test will need a slightly different chain since it queries a range (no `.maybeSingle()` -- instead a direct `.then()` or the chain resolves to `{ data: DailyRecord[], error }` array).

### Page Pattern

All pages follow the identical auth wrapper:
```
export default function XPage() {
  const [user, setUser] = useState<User | null>(null)
  // ... getUser() in useEffect
  if (!user) return <div className="p-4" />
  return <XContent userId={user.id} />
}
```

### Component Pattern

- Tailwind classes with custom `warm-*` and `green-*` palette
- `max-w-lg mx-auto px-4 pt-5 pb-24` container pattern
- `SectionGroup` for labeled sections (if applicable -- the ground grid may not need this)

---

## Risk Assessment

### High Risks
None identified.

### Medium Risks

- **Day boundary edge case in 7-day window:**
  - **Description:** `getEffectiveDate()` shifts "today" backward before 4AM. The 7-day window must be anchored to the effective date, not `new Date()`. If the hook uses `new Date()` directly for date math, the grid will show the wrong 7 days during the 12AM-4AM window.
  - **Impact:** Grid shows wrong days between midnight and 4AM
  - **Mitigation:** Use `getEffectiveDate()` as the anchor, then subtract 6 days for the start of the window. This is straightforward.
  - **Likelihood:** Low if developer is aware of the pattern, but worth flagging.

- **Nav layout with 4 items:**
  - **Description:** Current nav has 3 items spread with `flex-1` in a `max-w-lg` container. Adding a 4th item reduces each item's width by 25%. On narrow screens (320px), each tab gets ~80px.
  - **Impact:** On very narrow screens, labels might feel cramped
  - **Mitigation:** Labels are short ("Today", "Project", "Signals", "Ground") -- all under 8 characters. At 80px width, this should be fine. No action needed, just worth verifying visually.
  - **Likelihood:** Very low.

### Low Risks

- **Supabase query for 7 rows:** A simple `.select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate)` query fetching at most 7 rows. No performance concern. RLS policy (`user_id = auth.uid()`) already enforces security.

- **Empty days (no record exists):** If the user hasn't logged a day, the query returns fewer than 7 rows. The component must handle missing days gracefully (show all anchors as empty for that day). This is a display concern, not a data risk.

- **Test coverage:** Current coverage is 93%+. The new feature adds ~4 files (hook, hook test, component/page, page test). If tests are written following existing patterns, coverage will remain well above the 70% threshold.

- **CI pipeline:** No changes needed to `.github/workflows/ci.yml`. The pipeline runs `tsc --noEmit`, lint, `vitest run --coverage`, and `next build`. All of these will pick up the new files automatically.

---

## Iteration Breakdown Recommendation

### Recommendation: SINGLE ITERATION

**Rationale:**
- All external dependencies already exist in production (database, types, auth, client, utilities)
- The feature has only 4 deliverables: hook, component, page, nav update
- No database migrations, no new tables, no new RLS policies
- No new npm packages
- Total estimated work: 3-5 hours
- Zero cross-feature dependencies to manage
- The feature is entirely read-only, reducing risk of breaking existing write paths
- Every pattern needed is already established and tested in the codebase

**Estimated duration:** 3-5 hours

**Success criteria:**
1. `/ground` route renders a 7-day anchor grid
2. Nav shows 4 tabs with "Ground" active on that route
3. Grid correctly reflects data from `daily_records`
4. Empty days render gracefully (all dots empty)
5. All new code has tests following existing patterns
6. `tsc --noEmit` passes, lint passes, all tests pass
7. Coverage remains >= 70%
8. `next build` succeeds

---

## Dependency Graph

```
EXISTING (plan-1, deployed, stable)
+-- daily_records table + RLS
+-- Database types (src/lib/types.ts)
+-- Supabase client (src/lib/supabase/client.ts)
+-- Date utilities (src/lib/dates.ts)
+-- Nav component (src/components/nav.tsx)
+-- Auth pattern (getUser in useEffect)
+-- Test setup (vitest, jsdom, @testing-library)
    |
    v
NEW (plan-2, single iteration)
+-- useGroundIntegrity hook (src/hooks/use-ground-integrity.ts)
|     reads: daily_records for 7 days
|     uses: createClient, getEffectiveDate, formatDateString, Database types
|     returns: { records, isLoading, error }
|
+-- Ground grid component (src/components/ground-grid.tsx or inline in page)
|     receives: records array
|     renders: 5 anchor categories x 7 days CSS grid
|     pure presentational, no data fetching
|
+-- Ground page (src/app/ground/page.tsx)
|     uses: auth pattern, useGroundIntegrity, grid component
|     route: /ground (basePath /os/ground)
|
+-- Nav update (src/components/nav.tsx)
      add: { href: '/ground', label: 'Ground' }
      update test: expect 4 links instead of 3
```

---

## Integration Considerations

### Cross-Phase Integration Points
Not applicable -- this is a single-iteration feature with no cross-phase work.

### Potential Integration Challenges

- **Nav test update:** The existing `nav.test.tsx` asserts exactly 3 links and checks specific hrefs. Adding the 4th item requires updating the test. This is mechanical, not risky.

- **Anchor category mapping:** The vision defines 5 categories (Sleep, Food, Medication, Body, Ground) mapped from 10 database fields. The mapping logic should be clear and testable:
  - Sleep: `sleep_start !== null && sleep_end !== null`
  - Food: `breakfast && lunch && dinner` (or show each individually)
  - Medication: `cipralex_taken`
  - Body: `hygiene_done && movement_done` (or show each individually)
  - Ground: `ground_maintenance_done && ground_build_done` (or show each individually)

  The vision says "filled/empty dots or subtle marks per anchor" which suggests showing individual anchors, not aggregated categories. This is a design decision that should be clarified but is not a technical risk.

- **Date query boundary:** The Supabase query must use date strings in `YYYY-MM-DD` format (matching the `date` column type). The existing `formatDateString()` utility produces exactly this format.

---

## Recommendations for Master Plan

1. **Build everything in a single iteration.**
   - There is no architectural reason to split this. All foundations exist. The feature is self-contained, read-only, and follows every established pattern.

2. **Build the hook first, then the component/page, then the nav update.**
   - Within the iteration, the natural build order is: (a) `useGroundIntegrity` hook + tests, (b) grid component + page + tests, (c) nav update + test update. This is a suggestion for builder task ordering, not an iteration split.

3. **Anchor the 7-day window to `getEffectiveDate()`.**
   - This is the most important technical detail. The day boundary at 4AM is a core SelahOS concept. The hook must respect it.

4. **No database migration needed.**
   - The `daily_records` table already contains all required fields. RLS policies already enforce `user_id = auth.uid()`. No Supabase dashboard changes required.

5. **No new dependencies.**
   - The `package.json` should not change. The grid is pure Tailwind CSS. No charting libraries.

6. **Consider whether to show individual anchors or categories in the grid.**
   - The vision mentions 5 categories but the database has 10 boolean fields (plus 2 timestamps for sleep). Showing individual anchors (10 rows) gives more truthful visibility but may be visually dense. Showing 5 categories is cleaner but aggregates information. This is a design decision, not a technical blocker. Either approach has identical technical complexity.

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 15.5 (App Router) + React 19 + Supabase SSR + Tailwind 4 + Vitest 4
- **Patterns observed:**
  - Every hook follows the exact same shape (client-side, takes userId, returns loading/error/data)
  - Every page follows the exact same auth wrapper pattern
  - Every test follows the exact same Supabase mock chain pattern
  - Tailwind custom palette (`warm-*`, `green-*`) is used consistently
  - `basePath: '/os'` in next config means all routes are under `/os/`
- **Opportunities:** None needed -- the codebase is clean and consistent
- **Constraints:**
  - Must use `'use client'` directive (no server components for data fetching in hooks)
  - Must maintain the existing mock chain pattern in tests
  - Must respect `basePath` for links (Next.js handles this automatically with `<Link>`)

---

## Notes & Observations

- The codebase is exceptionally consistent. Every hook, every page, every test follows the same pattern. This makes adding a new feature almost mechanical -- the patterns are clear guardrails.

- The Supabase query for the new hook is the only meaningfully new code. Everything else (auth wrapper, nav item, test structure, component rendering) is copy-adapt from existing code.

- The feature is philosophically important to SelahOS (quiet visibility, not gamification). The technical implementation should reflect this: no animations, no color coding beyond filled/empty, no numerical summaries. This is a design constraint, not a technical one, but it should inform component implementation.

- The existing test count (159 tests, 93%+ coverage) suggests the team values test quality. The new feature should aim for similar thoroughness: test loading, data, error, empty states, and edge cases (fewer than 7 days of data, missing anchors).

---

*Exploration completed: 2026-03-12*
*This report informs master planning decisions*
