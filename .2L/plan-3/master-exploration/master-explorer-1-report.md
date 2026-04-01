# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Removal Analysis

## Vision Summary
SelahOS is being radically simplified: removing the Project and Signals tabs entirely, restricting Ground to weekly-only access (out of daily navigation), and evolving the Today page's anchor checkboxes from binary (done/not-done) to tri-state (done/not-done/untouched). The nav bar collapses from 4 tabs to effectively 1.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 5 distinct changes (2 removals, 1 restriction, 1 component redesign, 1 nav simplification)
- **User stories/acceptance criteria:** ~8 (remove Project route + all references, remove Signals route + all references, remove Ground from nav, add weekly-only access gate to Ground, convert AnchorCheckbox to 3-state, update nav to Today-only, update daily_records schema to support tri-state, update tests)
- **Estimated total work:** 4-6 hours

### Complexity Rating
**Overall Complexity: SIMPLE**

**Rationale:**
- This is a subtraction project: more code is being removed than added
- The codebase is small (46 source files including tests) and well-structured
- The one new feature (tri-state checkbox) is a contained UI/data change
- No new external dependencies, no new API routes, no new database tables
- All changes are within a single Next.js app with clear module boundaries

---

## Architectural Analysis

### Current Architecture (What Exists)

The app is a standard Next.js App Router application with:
- **4 route pages:** `/` (Today), `/project`, `/signals`, `/ground`
- **6 UI components:** `AnchorCheckbox`, `DateHeader`, `IntegrityGrid`, `Nav`, `NoteField`, `SectionGroup`, `SleepButton`
- **5 custom hooks:** `useDailyRecord`, `useActiveProjectName`, `useGroundProject`, `useWeeklySignals`, `useGroundIntegrity`, `useDebouncedSave`
- **3 lib modules:** `types.ts` (DB schema types), `dates.ts` (date utilities), `constants.ts`
- **3 Supabase tables:** `daily_records`, `ground_projects`, `weekly_signals`
- **Auth:** Supabase magic link, callback at `/auth/callback`
- **Layout:** Single root layout with `<Nav />` rendered globally

### Major Changes Required

#### 1. Files to DELETE (complete removal)

**Route pages (2 files + 2 test files):**
- `src/app/project/page.tsx` -- entire Project page
- `src/app/project/project.test.tsx` -- its tests
- `src/app/signals/page.tsx` -- entire Signals page
- `src/app/signals/signals.test.tsx` -- its tests

**Hooks (3 files + 3 test files):**
- `src/hooks/use-ground-project.ts` -- only used by Project page
- `src/hooks/use-ground-project.test.ts` -- its tests
- `src/hooks/use-weekly-signals.ts` -- only used by Signals page
- `src/hooks/use-weekly-signals.test.ts` -- its tests
- `src/hooks/use-active-project-name.ts` -- used by Today page to show project name in ground section (must be removed from Today page too)
- `src/hooks/use-active-project-name.test.ts` -- its tests

**Total files to delete: 10**

#### 2. Files to MODIFY

**`src/components/nav.tsx`** (major rewrite)
- Current: 4-tab bottom nav (Today, Project, Signals, Ground)
- Target: Today-only nav, or possibly no visible nav at all (since there is only one destination in daily use)
- Decision needed: Should Ground still be accessible via some hidden/restricted mechanism, or via direct URL only?

**`src/components/nav.test.tsx`** (major rewrite)
- Current tests assert 4 links, href attributes for all tabs, and active highlighting
- Must be rewritten to match simplified nav

**`src/components/anchor-checkbox.tsx`** (significant redesign)
- Current: Binary checkbox (HTML `<input type="checkbox">` with boolean `checked`/`onChange`)
- Target: Tri-state control with 3 states: Done (checkmark), Not Done (dash), Untouched (empty circle, default)
- This requires changing from `<input type="checkbox">` to a custom button or role="radio" group
- The `onChange` callback signature changes from `(checked: boolean) => void` to something like `(state: 'done' | 'not_done' | 'untouched') => void`
- Visual states: circle with checkmark (done), circle with dash (not done), empty circle (untouched)

**`src/components/anchor-checkbox.test.tsx`** (significant rewrite)
- All 8 current tests assume binary checked/unchecked
- Must test all 3 states and the cycling behavior between them

**`src/app/page.tsx` (Today page)** (moderate changes)
- Remove import and usage of `useActiveProjectName` hook
- Remove project name display in ground section (`{projectName && ...}`)
- Change all `AnchorCheckbox` usages to pass tri-state value instead of boolean `checked`
- Update all `onChange` callbacks to handle tri-state

**`src/app/page.test.tsx`** (moderate changes)
- Remove mock of `use-active-project-name`
- Remove test asserting project name visibility ("Build SelahOS")
- Update mocks for `useDailyRecord` to use tri-state values instead of booleans

**`src/hooks/use-daily-record.ts`** (moderate changes)
- Current: stores boolean values for anchors (`breakfast: false`, `cipralex_taken: false`, etc.)
- Target: stores tri-state values. Two approaches:
  - **Option A:** Change booleans to string enum (`'done' | 'not_done' | 'untouched'`) -- requires DB schema migration
  - **Option B:** Use `boolean | null` where `true` = done, `false` = not done, `null` = untouched -- works with existing nullable column pattern but requires schema changes since current columns are `boolean NOT NULL`
- The `EMPTY_RECORD` defaults change from `false` to the untouched state
- The `updateField` function type signature changes accordingly

**`src/hooks/use-daily-record.test.ts`** (moderate changes)
- Update all assertions that check for `false` defaults to check for untouched state
- Update field update tests to use tri-state values

**`src/lib/types.ts`** (moderate changes)
- Remove `ground_projects` and `weekly_signals` table type definitions (or keep for schema reference -- decision needed)
- Update `daily_records` field types from `boolean` to tri-state type for anchor fields
- Note: `ground_projects` types are referenced only by hooks being deleted, and by `types.test.ts`

**`src/lib/types.test.ts`** (minor changes)
- Remove tests for `ground_projects` Row type
- Remove tests for `weekly_signals` Row type
- Update `daily_records` type tests to reflect tri-state field types

**`src/lib/dates.ts`** (no changes needed, but note)
- `getWeekStart()` and `formatWeekRange()` are only used by `use-weekly-signals.ts` and `signals/page.tsx`
- After those files are deleted, these functions become dead code
- Decision: Remove them for cleanliness, or keep (they are tested and might be useful for Ground weekly view)
- Recommendation: Keep them -- the Ground page still exists (weekly access) and may use week-based date logic

**`src/lib/dates.test.ts`** (optional cleanup)
- Tests for `getWeekStart` and `formatWeekRange` can remain (functions are still exported and used by Ground view)

**`src/app/ground/page.tsx`** (minor modification or no change)
- The page itself stays as-is (it shows 7-day integrity grid)
- Access restriction is a nav/routing concern, not a page-level concern
- Decision: Should the page itself show a gate (e.g., "available on Sundays only"), or is removing it from nav sufficient?

**`src/app/layout.tsx`** (minor change)
- May need to conditionally render `<Nav />` or simplify it since nav becomes minimal
- If nav becomes just "Today" with no other links, consider whether the nav bar is needed at all

**`src/hooks/use-ground-integrity.ts`** and its test (NO changes)
- Used by Ground page which is retained
- No modifications needed

**`src/components/integrity-grid.tsx`** and its test (NO changes)
- Used by Ground page which is retained

#### 3. Database Schema Impact

The tri-state change for anchor fields requires a schema decision:

**Current schema (daily_records):**
```
breakfast: boolean (NOT NULL, default false)
lunch: boolean (NOT NULL, default false)
dinner: boolean (NOT NULL, default false)
cipralex_taken: boolean (NOT NULL, default false)
hygiene_done: boolean (NOT NULL, default false)
movement_done: boolean (NOT NULL, default false)
ground_maintenance_done: boolean (NOT NULL, default false)
ground_build_done: boolean (NOT NULL, default false)
```

**Recommended approach: `boolean | null`**
- `null` = untouched (default, no interaction)
- `true` = done
- `false` = not done (explicit mark)
- This maps naturally to the 3 states in the vision
- Requires Supabase migration: `ALTER COLUMN ... DROP NOT NULL, SET DEFAULT NULL`
- Existing `false` values from old data remain valid (they mean "not done")
- BUT: old `false` values were really "untouched" -- a data migration should convert all `false` to `null` for accuracy

**Alternative: String enum**
- More explicit but requires larger migration
- Would need new column type or check constraint
- Recommendation: Avoid this -- `boolean | null` is simpler and PostgreSQL-native

### Technology Stack Implications

**No new technology needed.** The stack remains:
- Next.js 15.5 App Router
- Supabase (auth + database)
- Tailwind CSS 4.2
- Vitest + Testing Library
- TypeScript 5.9

**Database migration needed:**
- Supabase dashboard or migration script to alter `daily_records` columns
- Convert boolean fields to nullable
- Backfill existing `false` values to `null` (untouched)

---

## Inventory Summary

### Files to DELETE (10 files)
| File | Lines | Purpose |
|------|-------|---------|
| `src/app/project/page.tsx` | 173 | Project page |
| `src/app/project/project.test.tsx` | 205 | Project page tests |
| `src/app/signals/page.tsx` | 104 | Signals page |
| `src/app/signals/signals.test.tsx` | 208 | Signals page tests |
| `src/hooks/use-ground-project.ts` | 132 | Ground project hook |
| `src/hooks/use-ground-project.test.ts` | 407 | Ground project tests |
| `src/hooks/use-weekly-signals.ts` | 121 | Weekly signals hook |
| `src/hooks/use-weekly-signals.test.ts` | 326 | Weekly signals tests |
| `src/hooks/use-active-project-name.ts` | 31 | Active project name hook |
| `src/hooks/use-active-project-name.test.ts` | 95 | Active project name tests |

**Total lines removed: ~1,802**

### Files to MODIFY (11-13 files)
| File | Change Scope | Description |
|------|-------------|-------------|
| `src/components/anchor-checkbox.tsx` | Major | Binary -> tri-state |
| `src/components/anchor-checkbox.test.tsx` | Major | Rewrite all tests |
| `src/components/nav.tsx` | Major | 4 tabs -> Today only |
| `src/components/nav.test.tsx` | Major | Rewrite all tests |
| `src/app/page.tsx` | Moderate | Remove project name, update anchor props |
| `src/app/page.test.tsx` | Moderate | Remove project mock, update assertions |
| `src/hooks/use-daily-record.ts` | Moderate | Boolean -> nullable boolean |
| `src/hooks/use-daily-record.test.ts` | Moderate | Update assertions |
| `src/lib/types.ts` | Moderate | Remove 2 table defs, update field types |
| `src/lib/types.test.ts` | Minor | Remove 2 type tests, update daily_records test |
| `src/app/layout.tsx` | Minor | Possibly simplify nav rendering |

### Files UNCHANGED (19 files)
All remaining files need no changes: `globals.css`, `login/`, `auth/callback/`, `ground/page.tsx`, `ground/ground.test.tsx`, `integrity-grid.*`, `date-header.*`, `note-field.*`, `section-group.*`, `sleep-button.*`, `use-debounced-save.*`, `use-ground-integrity.*`, `dates.ts`, `dates.test.ts`, `constants.ts`, `constants.test.ts`, `supabase/*`, `test/setup.ts`.

---

## Iteration Breakdown Recommendation

### Recommendation: SINGLE ITERATION

**Rationale:**
- This is a simplification/subtraction project, not a construction project
- All changes are tightly interdependent (removing nav links, removing pages, updating checkbox -- these all happen together)
- The tri-state checkbox is the only net-new feature, and it is a contained UI component change
- Total estimated duration: 4-6 hours
- No foundation/feature phasing is needed -- there is no "build X first, then Y on top of it" dependency chain

### Work Order Within Single Iteration

The changes have a natural sequence but no phase boundaries:

1. **Database migration** (must happen first or in parallel)
   - Alter `daily_records` columns to nullable
   - Backfill `false` -> `null`

2. **Type updates** (`types.ts`)
   - Update field types to `boolean | null`
   - Remove `ground_projects` and `weekly_signals` type definitions

3. **Delete removed files** (10 files)
   - Delete all Project and Signals pages, hooks, and tests
   - Clean removal, no remaining imports

4. **Update core components**
   - Rewrite `AnchorCheckbox` to tri-state
   - Simplify `Nav` to Today-only
   - Update `use-daily-record` for nullable booleans

5. **Update Today page**
   - Remove `useActiveProjectName` import and usage
   - Update all AnchorCheckbox usages

6. **Update all tests**
   - Rewrite tests for modified components
   - Remove tests for deleted code
   - Run full test suite

---

## Dependency Graph

```
Database Migration (alter daily_records columns)
|
v
Type Updates (types.ts: boolean -> boolean | null, remove unused tables)
|
+---> Delete Files (10 files: project/*, signals/*, unused hooks)
|
+---> AnchorCheckbox Redesign (binary -> tri-state component)
|     |
|     v
|     Today Page Update (new props, remove project name)
|
+---> Nav Simplification (4 tabs -> Today only)
|
v
Test Updates (rewrite affected tests, verify full suite passes)
```

All branches converge at test verification. The database migration is the only true prerequisite -- everything else can proceed in parallel once types are updated.

---

## Risk Assessment

### Medium Risks

- **Tri-state data migration:** Existing `false` values in `daily_records` were semantically "untouched" (the user never interacted), but they are stored as `false`. After migration, `false` means "explicitly not done." A data backfill (`UPDATE daily_records SET breakfast = NULL WHERE breakfast = false`) should run as part of the migration to preserve semantic accuracy.
  - **Impact:** Without backfill, historical data would show everything as "not done" instead of "untouched," which contradicts the non-judgmental philosophy.
  - **Mitigation:** Include backfill SQL in the migration script. Run in a transaction.
  - **Recommendation:** Address in iteration 1, as the first step.

- **Ground page access restriction:** The vision says Ground is "accessed once per week only, at a fixed time" with "no open access" and "no mid-week checking." The simplest implementation (removing from nav) still allows direct URL access. Enforcing true weekly-only access requires time-gating logic.
  - **Impact:** Without enforcement, the user can still visit `/ground` directly -- which may undermine the behavioral intent.
  - **Mitigation:** Two options: (A) Simple nav removal only (trust-based), or (B) Add time-gate check in `ground/page.tsx`. Recommend starting with (A) and adding (B) only if needed.
  - **Recommendation:** Start with nav removal. The user is the only user -- self-discipline may suffice.

### Low Risks

- **AnchorCheckbox accessibility:** Changing from native `<input type="checkbox">` to a custom tri-state control requires careful ARIA implementation (e.g., `role="button"` with `aria-pressed` or custom `aria-label` indicating state). Not difficult but must be done correctly.
  - **Mitigation:** Use `role="button"` with `aria-label` that includes current state, or `aria-checked="mixed"` for the untouched state.

- **IntegrityGrid interpretation:** The Ground page's integrity grid currently interprets boolean fields (e.g., `food: !!(record.breakfast && record.lunch && record.dinner)`). With tri-state, the interpretation logic in `recordToIntegrity()` needs to handle `null` values. Currently `!!null` is `false`, so the grid would show "not done" for untouched items -- which is actually the correct behavior for the grid (it shows whether the anchor was fulfilled, and untouched means not fulfilled).
  - **Impact:** Minimal. The existing `!!` coercion handles `null` correctly for grid purposes.
  - **Mitigation:** No code change needed in `use-ground-integrity.ts`, but add a comment clarifying the null handling.

---

## Integration Considerations

### Cross-Component Integration Points

- **AnchorCheckbox <-> useDailyRecord:** The checkbox state type must match the hook's field type. If checkbox uses `'done' | 'not_done' | 'untouched'` strings but the hook stores `boolean | null`, a mapping layer is needed in the Today page. Recommend keeping the data layer as `boolean | null` and having the component accept a `value: boolean | null` prop.

- **useDailyRecord <-> Supabase:** The hook's `EMPTY_RECORD` defaults must change from `false` to `null` for anchor fields. The upsert payload must correctly send `null` values (Supabase handles this natively).

- **Nav <-> Layout:** If the nav becomes trivially simple (just "Today"), consider whether to keep it at all. A minimal "SelahOS" label or no nav might be more aligned with the vision's minimalism. The layout currently always renders `<Nav />`.

### Potential Integration Challenges

- **Test mock alignment:** The Today page test mocks `useDailyRecord` with a fixed record. The mock must be updated to use `null` instead of `false` for untouched fields, and the test assertions must be updated accordingly. This is straightforward but easy to miss.

- **CSS transition between 3 states:** The current checkbox uses `peer-checked:` Tailwind variants which only work for binary checkbox states. The tri-state component will need explicit conditional classes instead of peer-based variants.

---

## Recommendations for Master Plan

1. **Single iteration is correct.** The work is a coherent simplification with tight interdependencies. Splitting into multiple iterations would create unnecessary overhead and intermediate states where the app is partially simplified but not yet consistent.

2. **Database migration first.** The Supabase column alteration (boolean -> nullable boolean with backfill) should be the very first step, as both the hook and component changes depend on the new data model. This can be done via Supabase dashboard SQL editor.

3. **Consider removing the nav bar entirely.** With only one active page (Today), a bottom nav showing a single "Today" link has no functional purpose. The layout could render no nav at all, or a minimal header with just the app name. The Ground page remains accessible via direct URL for weekly use.

4. **The tri-state value representation should be `boolean | null`.** This avoids a string enum migration, works naturally with PostgreSQL nullable columns, maps cleanly to the 3 states (`null` = untouched, `true` = done, `false` = not done), and requires minimal changes to the existing data layer.

5. **Preserve date utility functions.** `getWeekStart()` and `formatWeekRange()` in `dates.ts` should remain even after deleting Signals, as the Ground weekly view may need them. Their tests should remain as well.

6. **Builder count: 2-3 builders recommended.** One builder handles the deletion + nav simplification + layout cleanup (mechanical work). One builder handles the tri-state redesign (AnchorCheckbox + useDailyRecord + types + Today page). A third builder could handle test rewrites if needed, but this may naturally fall to the first two.

---

## Notes & Observations

- The codebase is remarkably clean and well-tested. Every component and hook has a dedicated test file. The test suite uses Vitest with Testing Library and achieves good coverage.

- The `useDebouncedSave` hook exists but is not actually used by `useDailyRecord` (which has its own inline debounce logic). It appears to have been extracted as a generic utility but never adopted. This is a pre-existing minor inconsistency, not related to plan-3.

- The `useActiveProjectName` hook is used by the Today page to display the project name in the ground section. This creates a cross-cutting dependency: removing the Project feature means removing this display from Today as well. This is a clean removal.

- The vision explicitly states these tabs "are not archived" -- they are fully removed. This means we should delete the files, not just hide them behind feature flags.

- The Ground page and its supporting code (`use-ground-integrity`, `integrity-grid`) remain fully intact and unchanged. The only change to Ground is removing its nav link.

---

*Exploration completed: 2026-04-01*
*This report informs master planning decisions*
