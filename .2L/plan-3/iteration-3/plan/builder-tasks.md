# Builder Task Breakdown

## Overview

2 primary builders will work in parallel.
Neither builder should need to split -- complexity is MEDIUM for both.

## Builder Assignment Strategy

- Builder 1 handles **subtraction**: deletions, nav removal, layout cleanup, import removal
- Builder 2 handles **transformation**: 3-state component, type changes, database migration, data layer updates
- Shared files (`types.ts`, `page.tsx`, `page.test.tsx`) are split by concern: Builder 1 owns deletion-related edits, Builder 2 owns transformation-related edits
- Both builders write tests for their own changes

---

## Builder-1: SUBTRACTION

### Scope

Delete all Project and Signals infrastructure (pages, hooks, tests). Remove the navigation bar entirely. Remove `useActiveProjectName` from the Today page. Clean up type definitions. Reduce bottom padding on pages.

### Complexity Estimate

**MEDIUM**

Mechanical deletions plus targeted edits to 5 files. No algorithmic complexity. Risk is in ordering (useActiveProjectName import must be removed before/with file deletion).

### Success Criteria

- [ ] 10 source files deleted (listed below)
- [ ] 2 empty directories removed (`src/app/project/`, `src/app/signals/`)
- [ ] `nav.tsx` and `nav.test.tsx` deleted
- [ ] `layout.tsx` no longer imports or renders `<Nav />`
- [ ] `page.tsx` no longer imports or uses `useActiveProjectName`
- [ ] `page.tsx` bottom padding changed from `pb-24` to `pb-8`
- [ ] `page.test.tsx` no longer mocks `useActiveProjectName`; project name test removed
- [ ] `types.ts` no longer contains `ground_projects` or `weekly_signals` definitions
- [ ] `types.test.ts` no longer contains tests for `ground_projects` or `weekly_signals`
- [ ] `ground/page.tsx` bottom padding changed from `pb-24` to `pb-8`
- [ ] `npx tsc --noEmit` passes (no dangling imports)
- [ ] `npx vitest run` passes (no broken tests)
- [ ] Tests written/updated for all modified files

### Files to Delete

1. `/home/ahiya/Selah/selah-os/src/app/project/page.tsx`
2. `/home/ahiya/Selah/selah-os/src/app/project/project.test.tsx`
3. `/home/ahiya/Selah/selah-os/src/app/signals/page.tsx`
4. `/home/ahiya/Selah/selah-os/src/app/signals/signals.test.tsx`
5. `/home/ahiya/Selah/selah-os/src/hooks/use-ground-project.ts`
6. `/home/ahiya/Selah/selah-os/src/hooks/use-ground-project.test.ts`
7. `/home/ahiya/Selah/selah-os/src/hooks/use-weekly-signals.ts`
8. `/home/ahiya/Selah/selah-os/src/hooks/use-weekly-signals.test.ts`
9. `/home/ahiya/Selah/selah-os/src/hooks/use-active-project-name.ts`
10. `/home/ahiya/Selah/selah-os/src/hooks/use-active-project-name.test.ts`
11. `/home/ahiya/Selah/selah-os/src/components/nav.tsx`
12. `/home/ahiya/Selah/selah-os/src/components/nav.test.tsx`

Also remove empty directories:
- `/home/ahiya/Selah/selah-os/src/app/project/`
- `/home/ahiya/Selah/selah-os/src/app/signals/`

### Files to Modify

1. `/home/ahiya/Selah/selah-os/src/app/layout.tsx`
   - Remove line 4: `import { Nav } from '@/components/nav'`
   - Remove `<Nav />` from body (line 26)

2. `/home/ahiya/Selah/selah-os/src/app/page.tsx`
   - Remove line 6: `import { useActiveProjectName } from '@/hooks/use-active-project-name'`
   - Remove line 39: `const { projectName } = useActiveProjectName(userId)`
   - Remove lines 116-118: `{projectName && (<p className="text-sm text-warm-600">{projectName}</p>)}`
   - Change line 42: `pb-24` to `pb-8`

3. `/home/ahiya/Selah/selah-os/src/app/page.test.tsx`
   - Remove lines 40-46: `vi.mock('@/hooks/use-active-project-name', ...)`
   - Remove lines 83-89: `it('shows active project name in ground section', ...)`

4. `/home/ahiya/Selah/selah-os/src/lib/types.ts`
   - Remove lines 69-98: `ground_projects` table definition
   - Remove lines 99-131: `weekly_signals` table definition
   - Keep `daily_records` definition intact (Builder 2 handles the boolean->nullable changes)

5. `/home/ahiya/Selah/selah-os/src/lib/types.test.ts`
   - Remove test: "ground_projects Row type has status field" (lines 49-61)
   - Remove test: "weekly_signals Row type has all signal fields" (lines 63-76)

6. `/home/ahiya/Selah/selah-os/src/app/ground/page.tsx`
   - Change `pb-24` to `pb-8` in the container div (line 30)

### Dependencies

**Depends on:** Nothing -- can start immediately
**Blocks:** Nothing -- Builder 2 can work in parallel

### Implementation Notes

**CRITICAL ORDERING:** The `useActiveProjectName` import in `page.tsx` (line 6) and the `useActiveProjectName` hook file MUST be handled atomically. Remove the import and usage from `page.tsx` FIRST, then delete the hook files. If the file is deleted before the import is removed, TypeScript compilation will fail.

Recommended execution order:
1. Modify `page.tsx` (remove useActiveProjectName import + usage + projectName display + change pb-24 to pb-8)
2. Modify `page.test.tsx` (remove useActiveProjectName mock + project name test)
3. Delete the 10 hook/page files and 2 directories
4. Delete `nav.tsx` and `nav.test.tsx`
5. Modify `layout.tsx` (remove Nav import + render)
6. Modify `types.ts` (remove ground_projects + weekly_signals definitions)
7. Modify `types.test.ts` (remove corresponding tests)
8. Modify `ground/page.tsx` (change pb-24 to pb-8)
9. Run `npx tsc --noEmit` to verify no dangling imports
10. Run `npx vitest run` to verify all tests pass

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use the **Layout Pattern (After Nav Removal)** for `layout.tsx` changes
- Use the **Page Container Pattern** for bottom padding changes (pb-8)
- Use the **File Deletion Pattern** for safe file removal

### Testing Requirements

- All existing tests must pass after modifications
- The following tests are DELETED (not failing, deleted): nav.test.tsx (4 tests), project.test.tsx, signals.test.tsx, use-ground-project.test.ts, use-weekly-signals.test.ts, use-active-project-name.test.ts
- The project name test in page.test.tsx is DELETED
- Remaining tests in page.test.tsx must still pass (2 tests: "renders all sections" and "shows date header")
- Remaining tests in types.test.ts must still pass (1 test: "daily_records Row type has all required fields")
- Coverage target: >= 70%

---

## Builder-2: TRANSFORMATION

### Scope

Transform the anchor system from binary (boolean) to 3-state (boolean | null). This includes: database migration, type definition updates, EMPTY_RECORD update, AnchorCheckbox component rewrite, Today page prop updates, and test rewrites/updates across 4 files.

### Complexity Estimate

**MEDIUM**

The AnchorCheckbox rewrite is the most complex piece (new element type, 3 visual states, cycling logic, ARIA), but the component is small (44 lines). The rest is mechanical type changes and test updates.

### Success Criteria

- [ ] Migration file `002_anchor_three_state.sql` created with correct SQL
- [ ] `types.ts` anchor fields changed from `boolean` to `boolean | null` in Row, Insert, and Update
- [ ] `EMPTY_RECORD` in `use-daily-record.ts` has all 8 anchor defaults as `null` instead of `false`
- [ ] `AnchorCheckbox` rewritten as `<button>` with 3-state cycling: null -> true -> false -> null
- [ ] Untouched state: empty circle with `border-warm-400`, no fill, no icon
- [ ] Done state: green circle with `bg-green-600 border-green-600`, white checkmark SVG
- [ ] Not-done state: warm circle with `bg-warm-300 border-warm-400`, warm-600 dash SVG
- [ ] ARIA: `role="checkbox"`, `aria-checked="mixed|true|false"`, `aria-label` includes state name
- [ ] All 8 AnchorCheckbox usages in `page.tsx` changed from `checked={...??false}` to `value={...??null}`
- [ ] `anchor-checkbox.test.tsx` fully rewritten with >= 10 tests covering all states and transitions
- [ ] `use-daily-record.test.ts` updated: `false` assertions changed to `null` for anchor defaults
- [ ] `page.test.tsx` mock record updated: anchor values `false` changed to `null`
- [ ] `types.test.ts` updated to test `boolean | null` types
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` passes
- [ ] Coverage target: >= 70%

### Files to Create

1. `/home/ahiya/Selah/selah-os/supabase/migrations/002_anchor_three_state.sql` - Database migration

### Files to Modify

1. `/home/ahiya/Selah/selah-os/src/lib/types.ts`
   - Lines 19-26 (Row): change `boolean` to `boolean | null` for 8 anchor fields
   - Lines 37-44 (Insert): change `boolean` to `boolean | null` for 8 anchor fields
   - Lines 55-62 (Update): change `boolean` to `boolean | null` for 8 anchor fields

2. `/home/ahiya/Selah/selah-os/src/hooks/use-daily-record.ts`
   - Lines 17-24: change `EMPTY_RECORD` defaults from `false` to `null` for 8 anchor fields

3. `/home/ahiya/Selah/selah-os/src/components/anchor-checkbox.tsx` -- **FULL REWRITE**
   - Replace `<input type="checkbox">` with `<button type="button">`
   - Change props: `checked: boolean` to `value: AnchorState` (where `AnchorState = boolean | null`)
   - Change `onChange`: `(checked: boolean) => void` to `(value: AnchorState) => void`
   - Implement `nextAnchorState()` cycle function
   - Implement 3 visual states with conditional classes
   - Add ARIA: `role="checkbox"`, `aria-checked`, `aria-label`
   - See `patterns.md` for full implementation reference

4. `/home/ahiya/Selah/selah-os/src/app/page.tsx`
   - All 8 AnchorCheckbox instances: change `checked={record.X ?? false}` to `value={record.X ?? null}`
   - The `onChange` callbacks remain `(v) => updateField('X', v)` -- no change needed (type widens automatically)

5. `/home/ahiya/Selah/selah-os/src/components/anchor-checkbox.test.tsx` -- **FULL REWRITE**
   - Delete all 8 existing tests (binary checkbox assumptions)
   - Write new tests per the pattern in `patterns.md` section "AnchorCheckbox Test Pattern"
   - Minimum 10 tests covering: 3 visual states, 3 cycle transitions, tap target, ARIA, label rendering

6. `/home/ahiya/Selah/selah-os/src/hooks/use-daily-record.test.ts`
   - Update "starts with empty record" test: change `expect(...).toBe(false)` to `expect(...).toBeNull()` for all 8 anchor assertions
   - Update mock records in other tests where anchor defaults are used: change `false` to `null`
   - Search for `breakfast: false` to find all locations

7. `/home/ahiya/Selah/selah-os/src/app/page.test.tsx`
   - Update mock record in `useDailyRecord` mock: change all 8 anchor values from `false` to `null`

8. `/home/ahiya/Selah/selah-os/src/lib/types.test.ts`
   - Update "daily_records Row type" test: change mock anchor values from `false` to `null`

### Dependencies

**Depends on:** Nothing -- can start immediately
**Blocks:** Nothing -- Builder 1 can work in parallel

**Shared file coordination with Builder 1:**
- `types.ts`: Builder 1 removes `ground_projects` + `weekly_signals` (lines 69-131). Builder 2 changes `boolean` to `boolean | null` (lines 19-62). Different line ranges, no conflict.
- `page.tsx`: Builder 1 removes `useActiveProjectName` import/usage (lines 6, 39, 116-118) and changes pb-24 to pb-8 (line 42). Builder 2 changes `checked` to `value` on AnchorCheckbox props (lines 66-131). Different line ranges, no conflict.
- `page.test.tsx`: Builder 1 removes `useActiveProjectName` mock (lines 40-46) and project name test (lines 83-89). Builder 2 updates mock record values (lines 23-30). Different line ranges, no conflict.
- `types.test.ts`: Builder 1 removes ground_projects and weekly_signals tests (lines 49-76). Builder 2 updates daily_records test values (lines 5-29). Different line ranges, no conflict.

### Implementation Notes

**AnchorCheckbox rewrite guidance:**

1. The component changes from `<label>` wrapping `<input type="checkbox">` to a `<div>` wrapping `<button>`. The outer `<div>` replaces the `<label>` as the layout container.

2. The `peer-checked:` Tailwind pattern is removed entirely. It only works with native checkboxes. Use conditional className based on the `value` prop instead.

3. The `nextAnchorState` function should be defined inside the component file (not exported). It is a pure function that is easy to test indirectly through the component tests.

4. The `stateLabel` function generates human-readable state names for ARIA labels: "untouched", "done", "not done".

5. The SVG check icon path (`M5 13l4 4L19 7`) is identical to the current one. The dash icon path (`M6 12h12`) is new -- a simple horizontal line.

6. The "not done" state uses `bg-warm-300` (defined as `#D4CEC7`) and `text-warm-600` for the dash. These are existing tokens that already appear elsewhere in the UI. No new colors are introduced.

**Database migration note:** The migration file is created but NOT executed by the builder. Migration is run manually on Supabase before deployment. The builder only creates the `.sql` file.

**Type propagation:** After changing `boolean` to `boolean | null` in `types.ts`, the `DailyRecord` type alias in `use-daily-record.ts` automatically picks up the change (it derives from `Database['public']['Tables']['daily_records']['Row']`). The `updateField` function signature (`value: DailyRecord[keyof DailyRecord]`) automatically accepts `boolean | null`. No explicit signature changes needed in the hook.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use the **AnchorCheckbox Component** pattern for the full rewrite
- Use the **Three-State Anchor Pattern** for cycle function and type definition
- Use the **AnchorCheckbox Usage Pattern** for Today page prop updates
- Use the **AnchorCheckbox Test Pattern** for the test rewrite
- Use the **EMPTY_RECORD Pattern** for hook updates
- Use the **Database Migration** pattern for the SQL file
- Use the **Mocking Strategies** section for test mock updates (note the `false` -> `null` changes)

### Testing Requirements

- `anchor-checkbox.test.tsx`: Full rewrite, >= 10 tests. Must cover:
  - Renders label text
  - Shows untouched visual state (null)
  - Shows done visual state (true)
  - Shows not-done visual state (false)
  - Cycles null -> true
  - Cycles true -> false
  - Cycles false -> null
  - Minimum tap target size
  - ARIA role and aria-checked
  - ARIA label includes state name
- `use-daily-record.test.ts`: Update ~12 assertion sites from `false` to `null`
- `page.test.tsx`: Update mock record (8 values from `false` to `null`)
- `types.test.ts`: Update mock row (8 values from `false` to `null`)
- Coverage target: >= 70%
- All tests pass: `npx vitest run`

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

- **Builder-1 (Subtraction):** Delete files, remove nav, clean up imports
- **Builder-2 (Transformation):** Rewrite AnchorCheckbox, update types, create migration

Both builders start immediately and work in parallel.

### Integration Notes

**Shared files that both builders modify:**
1. `src/lib/types.ts` -- Builder 1 removes table defs (lines 69-131), Builder 2 changes boolean types (lines 19-62). Merge is clean.
2. `src/app/page.tsx` -- Builder 1 removes useActiveProjectName (lines 6, 39, 116-118) and changes padding (line 42), Builder 2 changes AnchorCheckbox props (lines 66-131). Merge is clean.
3. `src/app/page.test.tsx` -- Builder 1 removes mock+test (lines 40-46, 83-89), Builder 2 updates mock values (lines 23-30). Merge is clean.
4. `src/lib/types.test.ts` -- Builder 1 removes tests (lines 49-76), Builder 2 updates values (lines 5-29). Merge is clean.

**Potential conflict areas:** None identified. All edits to shared files target non-overlapping line ranges.

**Post-integration validation:**
1. `npx tsc --noEmit` -- catches dangling imports, type mismatches
2. `npx vitest run` -- all remaining tests pass
3. `npx vitest run --coverage` -- coverage >= 70%
4. `npm run build` -- production build succeeds

### Final Test Count Estimate

Current: 177 tests
Deleted: ~50 tests (project page, signals page, use-ground-project, use-weekly-signals, use-active-project-name, nav, plus removed assertions)
Modified: ~25 test updates (anchor-checkbox rewrite, use-daily-record updates, page.test updates, types.test updates)
Added: ~10 new tests (anchor-checkbox 3-state)

Expected final: ~130-140 tests, all passing, >= 70% coverage.
