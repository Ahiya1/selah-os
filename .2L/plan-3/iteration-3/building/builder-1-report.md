# Builder-1 Report: SUBTRACTION

## Status
COMPLETE

## Summary

Removed all Project and Signals infrastructure (pages, hooks, tests), deleted the navigation bar component entirely, removed `useActiveProjectName` from the Today page, removed `ground_projects` and `weekly_signals` type definitions from `types.ts`, and reduced bottom padding on Today and Ground pages from `pb-24` to `pb-8`. All 12 files deleted, 2 directories removed, 6 files modified. TypeScript compiles cleanly. All tests within Builder-1's scope pass.

## Files Deleted

### Source Files
1. `src/app/project/page.tsx` - Project page component
2. `src/app/project/project.test.tsx` - Project page tests
3. `src/app/signals/page.tsx` - Signals page component
4. `src/app/signals/signals.test.tsx` - Signals page tests
5. `src/hooks/use-ground-project.ts` - Ground project data hook
6. `src/hooks/use-ground-project.test.ts` - Ground project hook tests
7. `src/hooks/use-weekly-signals.ts` - Weekly signals data hook
8. `src/hooks/use-weekly-signals.test.ts` - Weekly signals hook tests
9. `src/hooks/use-active-project-name.ts` - Active project name hook
10. `src/hooks/use-active-project-name.test.ts` - Active project name hook tests
11. `src/components/nav.tsx` - Navigation bar component
12. `src/components/nav.test.tsx` - Navigation bar tests

### Directories Removed
- `src/app/project/` (was empty after file deletion)
- `src/app/signals/` (was empty after file deletion)

## Files Modified

### 1. `src/app/page.tsx` (Today page)
- Removed `import { useActiveProjectName } from '@/hooks/use-active-project-name'` (line 6)
- Removed `const { projectName } = useActiveProjectName(userId)` (line 39)
- Removed project name display JSX: `{projectName && (<p className="text-sm text-warm-600">{projectName}</p>)}` (lines 116-118)
- Changed container padding from `pb-24` to `pb-8` (line 42)
- Did NOT touch AnchorCheckbox `checked` props (Builder-2 handles `checked` -> `value` transformation)

### 2. `src/app/page.test.tsx` (Today page tests)
- Removed `vi.mock('@/hooks/use-active-project-name', ...)` mock block (lines 40-46)
- Removed `it('shows active project name in ground section', ...)` test (lines 83-89)
- Remaining 2 tests pass: "renders all sections after user loads" and "shows date header"

### 3. `src/app/layout.tsx` (Root layout)
- Removed `import { Nav } from '@/components/nav'` (line 4)
- Removed `<Nav />` from body JSX (line 26)

### 4. `src/app/ground/page.tsx` (Ground page)
- Changed container padding from `pb-24` to `pb-8` (line 30)
- No other changes (did NOT touch integrity-grid or ground integrity hook code)

### 5. `src/lib/types.ts` (Database type definitions)
- Removed `ground_projects` table definition (lines 69-98, covering Row/Insert/Update/Relationships)
- Removed `weekly_signals` table definition (lines 99-131, covering Row/Insert/Update/Relationships)
- Did NOT touch `daily_records` definition (Builder-2 handles boolean -> boolean|null changes)

### 6. `src/lib/types.test.ts` (Database type tests)
- Removed `it('ground_projects Row type has status field', ...)` test (lines 49-61)
- Removed `it('weekly_signals Row type has all signal fields', ...)` test (lines 63-76)
- Remaining 3 tests pass: "daily_records Row type has all required fields", "Insert type allows optional server-generated fields", "Update type allows all fields as optional"

## Success Criteria Met

- [x] 12 source files deleted (10 hook/page files + 2 nav files)
- [x] 2 empty directories removed (`src/app/project/`, `src/app/signals/`)
- [x] `nav.tsx` and `nav.test.tsx` deleted
- [x] `layout.tsx` no longer imports or renders `<Nav />`
- [x] `page.tsx` no longer imports or uses `useActiveProjectName`
- [x] `page.tsx` bottom padding changed from `pb-24` to `pb-8`
- [x] `page.test.tsx` no longer mocks `useActiveProjectName`; project name test removed
- [x] `types.ts` no longer contains `ground_projects` or `weekly_signals` definitions
- [x] `types.test.ts` no longer contains tests for `ground_projects` or `weekly_signals`
- [x] `ground/page.tsx` bottom padding changed from `pb-24` to `pb-8`
- [x] `npx tsc --noEmit` passes (after `.next` cache cleared -- stale cache had refs to deleted pages)
- [x] All tests within Builder-1 scope pass (8 tests across 3 test files)

## Tests Summary

- **Tests deleted:** ~50+ tests across 6 deleted test files (project, signals, nav, use-ground-project, use-weekly-signals, use-active-project-name) plus 1 test removed from page.test.tsx, 2 tests removed from types.test.ts
- **Tests remaining in modified files:** 8 tests (2 in page.test.tsx, 3 in types.test.ts, 3 in ground.test.tsx)
- **All tests in scope:** PASSING

### Pre-existing failures NOT caused by Builder-1

Two test files have failures that are Builder-2's responsibility:

1. `src/components/anchor-checkbox.test.tsx` (6 failures) -- Old tests use `checked` prop but Builder-2 already rewrote `anchor-checkbox.tsx` to use `value` prop. Builder-2 must rewrite these tests.

2. `src/hooks/use-daily-record.test.ts` (1 failure) -- Test expects `breakfast` to be `false` but Builder-2 already changed `EMPTY_RECORD` defaults from `false` to `null`. Builder-2 must update this test.

## Patterns Followed

- **File Deletion Pattern** from `patterns.md`: Deleted source + test + empty directory, verified no remaining imports via `grep` and `tsc --noEmit`
- **Layout Pattern (After Nav Removal)** from `patterns.md`: `layout.tsx` matches the reference pattern exactly
- **Page Container Pattern** from `patterns.md`: Both `page.tsx` and `ground/page.tsx` now use `pb-8` per the post-nav-removal pattern
- **Import Order Convention**: Maintained no-semicolon style, single quotes, proper import grouping after removals

## Integration Notes

### Exports removed
- `Nav` component no longer exported (file deleted)
- `useActiveProjectName` hook no longer exported (file deleted)
- `useGroundProject` hook no longer exported (file deleted)
- `useWeeklySignals` hook no longer exported (file deleted)

### Shared files with Builder-2
Builder-1 and Builder-2 both modify these files in non-overlapping regions:

1. **`src/lib/types.ts`**: Builder-1 removed `ground_projects` + `weekly_signals` (lines 69-131). Builder-2 changes `boolean` to `boolean | null` in `daily_records` (lines 19-62). No conflict.

2. **`src/app/page.tsx`**: Builder-1 removed `useActiveProjectName` import/usage (lines 6, 39, 116-118) and changed padding (line 42). Builder-2 changes `checked` to `value` on AnchorCheckbox props. No conflict.

3. **`src/app/page.test.tsx`**: Builder-1 removed `useActiveProjectName` mock (lines 40-46) and project name test (lines 83-89). Builder-2 updates mock record values (lines 23-30). No conflict.

4. **`src/lib/types.test.ts`**: Builder-1 removed ground_projects and weekly_signals tests (lines 49-76). Builder-2 updates daily_records test values (lines 5-29). No conflict.

### .next cache note
After deleting `src/app/project/` and `src/app/signals/`, the `.next` build cache contained stale type declarations referencing the deleted pages. Cleared with `rm -rf .next`. The integrator should ensure a clean build is performed.

## Challenges Overcome

1. **Stale `.next` cache**: TypeScript compilation initially failed due to cached type declarations in `.next/types/` referencing deleted page files. Resolved by removing the `.next` directory. This is expected behavior when deleting Next.js page files.

2. **Ordering**: Followed the recommended execution order -- modified source files to remove imports BEFORE deleting the referenced files, preventing any intermediate broken state.

## Testing Notes

To verify Builder-1's changes in isolation:
```bash
# TypeScript compilation (clean cache first)
rm -rf .next && npx tsc --noEmit

# Run tests for Builder-1's modified files only
npx vitest run src/app/page.test.tsx src/lib/types.test.ts src/app/ground/ground.test.tsx

# Verify no dangling imports to deleted files
grep -r "use-active-project-name\|use-ground-project\|use-weekly-signals\|components/nav" src/
```

## MCP Testing Performed

No MCP testing needed for deletion-only work. All verification done via TypeScript compiler and Vitest test runner.
