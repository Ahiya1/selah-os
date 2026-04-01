# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
SelahOS is being simplified from a 4-tab app (Today, Project, Signals, Ground) to a single-tab daily interface (Today only), with Project and Signals removed entirely, Ground restricted to weekly-only access outside the nav, and the Today tab's anchor items changed from binary (done/not-done) to a 3-state model (Done / Not done / Untouched).

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 5 (remove Project tab, remove Signals tab, restrict Ground access, modify nav to single tab, convert anchors to 3-state)
- **User stories/acceptance criteria:** ~8 (remove 2 pages, remove 2 nav entries, add access gate for Ground, redesign anchor checkboxes, preserve existing data, update Ground integrity view for 3-state)
- **Estimated total work:** 4-8 hours

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- The codebase is small and well-organized (14 components, 6 hooks, 3 DB tables)
- The changes are primarily subtractive (removing code) which is lower risk than additive
- The 3-state anchor model requires a schema migration on the core `daily_records` table, which introduces a moderate data migration risk
- The dependency graph is clean with minimal cross-cutting concerns

---

## Dependency Chain Analysis

### Import Dependency Graph

#### Files to REMOVE (Project tab)

1. **`src/app/project/page.tsx`** -- imports:
   - `@/hooks/use-ground-project` (ONLY used here)
   - `@/components/section-group` (SHARED -- also used by Today, Signals)
   - `@/lib/supabase/client` (SHARED)
   
2. **`src/hooks/use-ground-project.ts`** -- imports:
   - `@/lib/supabase/client` (SHARED)
   - `@/lib/types` (references `ground_projects` table type)
   
3. **`src/hooks/use-active-project-name.ts`** -- imports:
   - `@/lib/supabase/client` (SHARED)
   - References `ground_projects` table directly

**CRITICAL:** `use-active-project-name` is imported by `src/app/page.tsx` (Today page, line 6). The Today page uses it to display the active project name in the "ground" section (line 39, rendered at line 116-118). This hook must be removed AND the Today page must be updated to remove the import and the `projectName` display. This is a **hard dependency** that will cause a build break if the hook is deleted without updating the Today page.

4. **`src/hooks/use-ground-project.test.ts`** -- test file, safe to remove
5. **`src/hooks/use-active-project-name.test.ts`** -- test file, safe to remove
6. **`src/app/page.test.tsx`** -- mocks `use-active-project-name` (line 41), must be updated

#### Files to REMOVE (Signals tab)

1. **`src/app/signals/page.tsx`** -- imports:
   - `@/hooks/use-weekly-signals` (ONLY used here)
   - `@/components/section-group` (SHARED)
   - `@/components/note-field` (SHARED -- also used by Today)
   - `@/lib/dates` (`formatWeekRange` -- only used by Signals page)
   - `@/lib/supabase/client` (SHARED)

2. **`src/hooks/use-weekly-signals.ts`** -- imports:
   - `@/lib/supabase/client` (SHARED)
   - `@/lib/dates` (`getWeekStart` -- only used by this hook)
   - `@/lib/types` (references `weekly_signals` table type)

3. **`src/hooks/use-weekly-signals.test.ts`** -- test file, safe to remove

#### Files to MODIFY (Nav)

1. **`src/components/nav.tsx`** -- Currently has 4 items: Today, Project, Signals, Ground. Must be reduced to Today only (or possibly removed entirely, since a single-tab nav has no purpose).

#### Files to KEEP but RESTRICT (Ground)

1. **`src/app/ground/page.tsx`** -- imports:
   - `@/hooks/use-ground-integrity` (shared type export used by `integrity-grid`)
   - `@/components/integrity-grid` (ONLY used by Ground page)
   
2. **`src/hooks/use-ground-integrity.ts`** -- exports `DayIntegrity` type used by `integrity-grid.tsx`
3. **`src/components/integrity-grid.tsx`** -- imports `DayIntegrity` from `use-ground-integrity`
4. **`src/components/integrity-grid.test.tsx`** -- imports `DayIntegrity` type

#### Files to MODIFY (3-state anchors)

1. **`src/components/anchor-checkbox.tsx`** -- Currently a binary checkbox (checked: boolean). Must become a 3-state component.
2. **`src/hooks/use-daily-record.ts`** -- Current state model uses booleans. Must change to support 3-state values.
3. **`src/lib/types.ts`** -- Database type definitions for `daily_records` use booleans. Must change.
4. **`supabase/migrations/001_initial_schema.sql`** -- Source schema uses BOOLEAN columns. A new migration is needed.

#### Files UNAFFECTED

- `src/components/sleep-button.tsx` -- Used by Today, independent
- `src/components/note-field.tsx` -- Used by Today (and Signals, being removed)
- `src/components/section-group.tsx` -- Used by Today (and Project/Signals, being removed)
- `src/components/date-header.tsx` -- Used only by Today
- `src/hooks/use-debounced-save.ts` -- Not imported by anything currently (only its test imports it)
- `src/lib/dates.ts` -- Shared utility, some functions become unused (`formatWeekRange`, `getWeekStart`) but this is harmless
- `src/lib/constants.ts` -- Contains only `DAY_BOUNDARY_HOUR`, unaffected
- `middleware.ts` / `src/lib/supabase/middleware.ts` -- Auth middleware, unaffected

### Complete Deletion Safety Map

| File | Safe to Delete? | Reason |
|------|----------------|--------|
| `src/app/project/page.tsx` | YES | Self-contained page |
| `src/app/signals/page.tsx` | YES | Self-contained page |
| `src/hooks/use-ground-project.ts` | YES | Only imported by project page |
| `src/hooks/use-ground-project.test.ts` | YES | Test for deleted hook |
| `src/hooks/use-active-project-name.ts` | AFTER updating Today page | Imported by `src/app/page.tsx` |
| `src/hooks/use-active-project-name.test.ts` | YES | Test for deleted hook |
| `src/hooks/use-weekly-signals.ts` | YES | Only imported by signals page |
| `src/hooks/use-weekly-signals.test.ts` | YES | Test for deleted hook |

---

## State Model Analysis: Current vs Required 3-State

### Current State Model

The `daily_records` table uses **boolean columns** for all anchors:

```
breakfast: BOOLEAN NOT NULL DEFAULT FALSE
lunch: BOOLEAN NOT NULL DEFAULT FALSE
dinner: BOOLEAN NOT NULL DEFAULT FALSE
cipralex_taken: BOOLEAN NOT NULL DEFAULT FALSE
hygiene_done: BOOLEAN NOT NULL DEFAULT FALSE
movement_done: BOOLEAN NOT NULL DEFAULT FALSE
ground_maintenance_done: BOOLEAN NOT NULL DEFAULT FALSE
ground_build_done: BOOLEAN NOT NULL DEFAULT FALSE
```

The TypeScript types mirror this: `breakfast: boolean`, etc.

The `AnchorCheckbox` component takes `checked: boolean` and renders a binary circle (empty or green with checkmark).

The `use-ground-integrity.ts` hook maps these booleans to `DayIntegrity` which is also boolean per domain: `sleep: boolean, food: boolean, medication: boolean, body: boolean, ground: boolean`.

### Required 3-State Model

The vision specifies:
- Done (explicit positive mark)
- Not done (explicit negative mark -- first-class, not failure)
- Untouched (default, no pressure, no data written)

### Migration Options

**Option A: Change BOOLEAN columns to TEXT/ENUM**

Replace each boolean column with a text column using CHECK constraint:
```sql
ALTER TABLE daily_records 
  ALTER COLUMN breakfast TYPE TEXT USING CASE WHEN breakfast THEN 'done' ELSE NULL END,
  ALTER COLUMN breakfast SET DEFAULT NULL,
  ADD CONSTRAINT breakfast_state CHECK (breakfast IN ('done', 'not_done') OR breakfast IS NULL);
```

- `NULL` = untouched (default, no row needed)
- `'done'` = explicitly marked done
- `'not_done'` = explicitly marked not done

**Pros:** Clean semantic mapping, NULL naturally represents "untouched"
**Cons:** Requires type changes across the entire stack

**Option B: Add parallel "explicit" columns**

Keep existing boolean columns, add `_explicit` boolean columns:
```sql
ALTER TABLE daily_records ADD COLUMN breakfast_explicit BOOLEAN DEFAULT FALSE;
```

Where `_explicit = false AND value = false` means untouched, `_explicit = true AND value = false` means "not done", `_explicit = true AND value = true` means "done".

**Pros:** Backward compatible, no data loss risk
**Cons:** Doubles column count, confusing semantics, violates simplicity principle

**Option C: Use nullable boolean (recommended)**

Change from `BOOLEAN NOT NULL DEFAULT FALSE` to `BOOLEAN DEFAULT NULL`:
```sql
ALTER TABLE daily_records 
  ALTER COLUMN breakfast DROP NOT NULL,
  ALTER COLUMN breakfast SET DEFAULT NULL;
```

- `NULL` = untouched
- `true` = done
- `false` = not done (explicitly)

**Pros:** Minimal migration, clean semantics, TypeScript `boolean | null` maps naturally to 3 states, existing `true` values preserved correctly
**Cons:** Existing `false` values become ambiguous (were they explicit "not done" or untouched?)

### Recommendation: Option C (Nullable Boolean)

This is the cleanest approach for this codebase. The migration is:
1. Drop NOT NULL constraint on each boolean column
2. Change default from FALSE to NULL
3. Convert existing `false` values to `NULL` (since the old system had no concept of explicit "not done", all existing `false` values were effectively "untouched")

The data migration is safe because the current system only writes `true` (when user checks a box) or uses the default `false`. No user ever explicitly marked "not done" -- they just did not interact. So converting all existing `false` to `NULL` is semantically correct.

### Sleep Columns: Special Case

`sleep_start` and `sleep_end` are already `TIMESTAMPTZ NULL` -- they are timestamps, not boolean anchors. The vision lists "Sleep" as one of the 3-state tracked domains. The question is: does the 3-state model apply to sleep?

Currently, sleep is tracked by two timestamp buttons ("going to sleep" / "woke up"). The Ground integrity view interprets sleep as boolean: `!!(record.sleep_start && record.sleep_end)`.

For 3-state, sleep could remain as timestamps (null = untouched, both set = done) but "not done" has no natural representation. Options:
- Add a `sleep_not_done: boolean` column
- Keep sleep as-is (timestamps are already a richer model)
- Replace sleep timestamps with a 3-state value and lose time tracking

**Recommendation:** Keep sleep timestamps as-is. The vision says "no typing required for core flow" -- the sleep buttons already satisfy this. The 3-state model should apply to the simple anchor items. Sleep's existing model (untouched = no timestamps, done = both timestamps present) already has 2 of 3 states. If "not done" for sleep is desired, a simple `sleep_skipped: BOOLEAN DEFAULT NULL` column could be added later.

---

## Database Schema Impact

### Tables Currently in Schema

| Table | Status After Changes | Rationale |
|-------|---------------------|-----------|
| `daily_records` | KEEP + MIGRATE | Core table. Needs nullable booleans for 3-state. |
| `ground_projects` | ORPHANED | Only used by Project page (being removed) and `use-active-project-name` (used on Today page to show project name, also being removed). |
| `weekly_signals` | ORPHANED | Only used by Signals page (being removed). |

### Orphaned Tables Decision

The `ground_projects` and `weekly_signals` tables will have NO code referencing them after this revision. Options:

1. **Leave in place (RECOMMENDED):** No risk. RLS policies protect data. Tables sit idle. If features are re-introduced later, data is preserved. Zero migration needed.

2. **Drop tables:** Irreversible data loss. No benefit. Against the philosophy ("they are removed from the current phase" -- not destroyed).

3. **Mark as deprecated:** Add a comment to the migration file noting these tables are not currently in use.

**Recommendation:** Leave tables in place. Do NOT write a destructive migration. The `types.ts` file can optionally retain the type definitions (harmless) or remove them (cleaner). Removing them from `types.ts` is fine since no code will reference them.

### Required Migration

A new migration file is needed: `supabase/migrations/002_anchor_three_state.sql`

```sql
-- Convert boolean anchor columns to nullable (3-state: NULL=untouched, true=done, false=not_done)

-- Convert existing false values to NULL first (they represent "untouched" in the old model)
UPDATE daily_records SET breakfast = NULL WHERE breakfast = false;
UPDATE daily_records SET lunch = NULL WHERE lunch = false;
UPDATE daily_records SET dinner = NULL WHERE dinner = false;
UPDATE daily_records SET cipralex_taken = NULL WHERE cipralex_taken = false;
UPDATE daily_records SET hygiene_done = NULL WHERE hygiene_done = false;
UPDATE daily_records SET movement_done = NULL WHERE movement_done = false;
UPDATE daily_records SET ground_maintenance_done = NULL WHERE ground_maintenance_done = false;
UPDATE daily_records SET ground_build_done = NULL WHERE ground_build_done = false;

-- Drop NOT NULL constraints and change defaults
ALTER TABLE daily_records ALTER COLUMN breakfast DROP NOT NULL, ALTER COLUMN breakfast SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch DROP NOT NULL, ALTER COLUMN lunch SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner DROP NOT NULL, ALTER COLUMN dinner SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken DROP NOT NULL, ALTER COLUMN cipralex_taken SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done DROP NOT NULL, ALTER COLUMN hygiene_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done DROP NOT NULL, ALTER COLUMN movement_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done DROP NOT NULL, ALTER COLUMN ground_maintenance_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done DROP NOT NULL, ALTER COLUMN ground_build_done SET DEFAULT NULL;
```

### Impact on RLS Policies

No impact. RLS policies for all three tables are based on `auth.uid() = user_id`. Column type changes (boolean -> nullable boolean) do not affect RLS. The orphaned tables' policies remain in place (harmless).

---

## Risk Assessment

### High Risks

**NONE.** This is a simplification of a small codebase with clear dependency chains.

### Medium Risks

- **Risk: Data semantics change during 3-state migration**
  - **Impact:** Existing `false` values in `daily_records` could be misinterpreted. If a user had explicitly unchecked something (set it to false), converting to NULL loses that signal.
  - **Mitigation:** In the current UI, there is no way to explicitly set "not done" -- unchecking returns to `false`, which is the default state. So all existing `false` values genuinely represent "untouched". The conversion is semantically safe.
  - **Recommendation:** Execute the data migration (false -> NULL) as part of the schema change, BEFORE deploying the new code.

- **Risk: Ground integrity view breaks with 3-state data**
  - **Impact:** `use-ground-integrity.ts` maps records to boolean `DayIntegrity`. The `recordToIntegrity` function uses `!!record.breakfast` etc. With nullable booleans: `!!null === false` and `!!true === true` and `!!false === false`. This means "untouched" and "not done" would both show as unfilled dots.
  - **Mitigation:** If the Ground view should distinguish 3 states, `DayIntegrity` needs updating. If it should remain binary (done/not-done), the current `!!` coercion works correctly with no changes needed.
  - **Recommendation:** For this phase, the Ground weekly view can remain binary (done vs not-done-or-untouched). The 3-state distinction is for the daily interface only. This means `use-ground-integrity.ts` and `integrity-grid.tsx` need NO changes for the 3-state migration.

- **Risk: Build break from partial file deletion**
  - **Impact:** Deleting `use-active-project-name.ts` without updating `src/app/page.tsx` will cause a build failure. The Today page imports this hook at line 6 and uses it at line 39.
  - **Mitigation:** Update `src/app/page.tsx` to remove the import and the `projectName` usage BEFORE or SIMULTANEOUSLY with deleting the hook file. Also update `src/app/page.test.tsx` to remove the mock (line 41-46) and the test that checks for project name (line 83-89).
  - **Recommendation:** Handle as an atomic change -- update Today page and delete hook in the same commit.

### Low Risks

- **Unused utility functions in `dates.ts`:** `getWeekStart` and `formatWeekRange` will have no consumers after Signals removal. This is harmless dead code. Can be cleaned up optionally.
- **`use-debounced-save.ts` is already unused:** This hook is not imported by any production code (only by its own test). Not related to this change but worth noting.
- **Nav component removal vs simplification:** With only one tab, the `Nav` component serves no navigation purpose. Removing it entirely from the layout is simplest, but requires updating `src/app/layout.tsx`. The alternative (keeping nav with one item) is functionally harmless but visually odd.

---

## Ground Access Restriction Mechanism

The vision specifies Ground should be accessible "once per week only, at a fixed time" with "no mid-week checking."

### Options for Restricting Ground Access

**Option A: Client-side time gate (RECOMMENDED)**

Add logic to the Ground page or a wrapper that checks the current day of week and time. If it is not the designated weekly review time, show a message like "weekly review available on [day]" instead of the integrity grid.

**Pros:** Simple, no server changes, easy to adjust
**Cons:** Can be bypassed by changing system clock (irrelevant for a personal tool)

**Option B: Middleware route protection**

Add a check in `middleware.ts` that redirects `/ground` to `/` unless it is the review day/time.

**Pros:** Cannot be bypassed by client-side manipulation
**Cons:** Over-engineered for a personal single-user tool

**Option C: Remove Ground from nav, keep URL accessible**

Simply remove Ground from the nav bar. The page at `/ground` still works if the user types the URL directly. No time gate.

**Pros:** Simplest implementation, zero logic needed
**Cons:** Does not enforce the "once per week" constraint. But the vision says this is about intention, not enforcement.

**Recommendation:** Option C for this iteration, with Option A as an enhancement. The vision's constraint is philosophical ("replace narrative with signal, bounded observation") -- removing Ground from navigation already removes it from the daily flow. The user would have to deliberately navigate to `/ground` to see it. Over-engineering enforcement for a personal tool that is about self-trust contradicts the philosophy.

---

## Iteration Breakdown Recommendation

### Recommendation: SINGLE ITERATION

**Rationale:**
- All changes are interconnected (removing tabs, updating nav, changing state model)
- Total estimated work is 4-8 hours
- There is no natural phase boundary -- removing Project/Signals is meaningless without also updating nav, and changing the 3-state model is the core feature
- The codebase is small (14 components, 6 hooks) with no complex build pipeline
- All changes target the same deployment unit (one Next.js app, one Supabase database)

**Estimated duration:** 4-8 hours

### If forced to split, the natural order would be:

1. **Phase A (Subtraction):** Remove Project page, Signals page, update nav, update Today page to remove project name reference (~2 hours)
2. **Phase B (Transformation):** Schema migration for 3-state, update AnchorCheckbox component, update use-daily-record hook, update types (~3 hours)
3. **Phase C (Restriction):** Ground access restriction mechanism (~1 hour)

But these phases are small enough to combine into a single iteration.

---

## Dependency Graph

```
DELETIONS (no dependencies between them, can be parallel):
  src/app/project/page.tsx
  src/hooks/use-ground-project.ts
  src/hooks/use-ground-project.test.ts
  src/app/signals/page.tsx
  src/hooks/use-weekly-signals.ts
  src/hooks/use-weekly-signals.test.ts
  src/hooks/use-active-project-name.ts  <-- BLOCKED by Today page update
  src/hooks/use-active-project-name.test.ts
      |
      v
MODIFICATIONS (depend on deletions being done):
  src/app/page.tsx               -- remove useActiveProjectName import + usage
  src/app/page.test.tsx          -- remove mock + project name test
  src/components/nav.tsx          -- reduce to Today only (or remove)
  src/app/layout.tsx              -- possibly remove Nav if no nav needed
      |
      v
SCHEMA MIGRATION (independent, but deploy before code):
  supabase/migrations/002_*.sql  -- nullable booleans
      |
      v
TYPE + COMPONENT UPDATES (depend on schema migration):
  src/lib/types.ts               -- boolean -> boolean | null
  src/hooks/use-daily-record.ts  -- update EMPTY_RECORD defaults to null
  src/components/anchor-checkbox.tsx -- redesign for 3-state
      |
      v
OPTIONAL:
  Ground access restriction (src/app/ground/page.tsx or new wrapper)
  Cleanup unused dates.ts functions
  Remove ground_projects/weekly_signals from types.ts
```

---

## Critical Path

The critical path is:

1. Schema migration (must run on Supabase before new code deploys)
2. Types update (everything downstream depends on correct types)
3. AnchorCheckbox 3-state redesign (the core UX change)
4. Today page updates (remove project name, use new anchor component)

The deletions (Project, Signals pages) are independent and can happen in parallel with any step.

---

## Integration Considerations

### Cross-Phase Integration Points

- **`src/lib/types.ts`** is the central type definition file. Changes to `daily_records` types affect `use-daily-record.ts`, `use-ground-integrity.ts`, and transitively `integrity-grid.tsx`. All consumers of `DailyRecord` types must be checked.

- **`AnchorCheckbox`** is used 8 times in the Today page. The interface change from `checked: boolean` to something that supports 3 states will require updating all 8 call sites.

### Potential Integration Challenges

- **AnchorCheckbox test updates:** The `anchor-checkbox.test.tsx` tests a binary component. The 3-state redesign requires rewriting these tests.

- **Deployment ordering:** The schema migration must run BEFORE the new code deploys. If the new code (expecting nullable booleans) hits the old schema (with NOT NULL booleans), inserts with `null` values will fail with constraint violations. This is a standard migration ordering concern.

---

## Recommendations for Master Plan

1. **Execute as a single iteration.** The total scope is 4-8 hours of work on a small, well-structured codebase. Splitting into multiple iterations would add overhead without reducing risk.

2. **Order of operations within the iteration:**
   - First: Schema migration (database change, deployable independently)
   - Second: Delete Project/Signals pages and hooks (pure subtraction, low risk)
   - Third: Update Today page (remove project name, update nav)
   - Fourth: Implement 3-state anchor component and update types/hooks
   - Fifth: Ground access restriction (simplest: just remove from nav)

3. **Do NOT drop database tables.** Leave `ground_projects` and `weekly_signals` in place. They cost nothing and preserve data for potential future phases.

4. **Use nullable boolean (Option C) for 3-state.** It requires the smallest migration, maps cleanly to TypeScript `boolean | null`, and the data conversion (false -> null) is semantically correct given the current UI behavior.

5. **Keep Ground page functional at its URL.** Removing it from the nav is sufficient access restriction. Do not over-engineer time-gating for a personal single-user tool.

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14+ (App Router), React, TypeScript, Supabase (auth + PostgreSQL + RLS), Tailwind CSS, Vitest for testing
- **Patterns observed:** Client components with `'use client'` directive, custom hooks for data fetching with optimistic updates and debounced saves, clean separation of concerns (hooks for data, components for UI, lib for utilities)
- **Opportunities:** The `use-debounced-save.ts` hook exists but is not used by any production code -- the debounce logic is duplicated inside `use-daily-record.ts`. This is pre-existing tech debt, not related to this change.
- **Constraints:** Must work with existing Supabase cloud instance. Schema migrations must be applied via Supabase dashboard or CLI. The app is served at `/os` base path (for `selah.im/os` hosting).

### No New Technology Needed

All changes can be implemented with the existing stack. No new libraries, services, or infrastructure required.

---

## Notes & Observations

- The vision document is philosophically rich and clear about what NOT to build. The implementation should respect this -- do not add features, analytics, or tracking beyond what is specified.

- The current `AnchorCheckbox` component is 44 lines of clean, accessible JSX. The 3-state redesign should maintain this quality: proper ARIA labels for all three states, keyboard accessibility, and the existing visual language (warm colors, circular indicators).

- The "not done" state in the vision is explicitly described as "first-class, not secondary." The UI design for the 3-state anchor must give equal visual weight to "not done" -- it should not look like an error or failure state. This is a UX design concern more than a technical one, but it is worth flagging as a design constraint that affects component implementation.

- Existing daily records in the database have boolean values. The `false` -> `NULL` conversion in the migration is the correct approach: in the old system, `false` always meant "the user did not interact with this item today" which is exactly what "untouched" means in the new 3-state model. No data semantics are lost.

- The `ground` domain in the vision is listed as "Ground (work: maintenance / build)" -- the current schema has two separate booleans: `ground_maintenance_done` and `ground_build_done`. The vision seems to treat "ground" as a single tracked domain. This may need clarification: does the 3-state apply to maintenance and build separately (as today), or is "ground" collapsed into a single 3-state item? The implementation should preserve the current granularity (two items) unless explicitly told otherwise.

---

*Exploration completed: 2026-04-01*
*This report informs master planning decisions*
