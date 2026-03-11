# Integration Plan - Round 1

**Created:** 2026-03-12T00:00:00Z
**Iteration:** plan-1/iteration-2
**Total builders to integrate:** 3

---

## Executive Summary

All three builders completed their work successfully with COMPLETE status. The codebase is in excellent shape: builders operated on entirely separate file domains with zero file-level conflicts. Builder-2 made additive modifications to shared utility files (`dates.ts`, `dates.test.ts`), Builder-3 made single-class CSS changes to shared components (`section-group.tsx`, `nav.tsx`) and updated corresponding test assertions. All builder outputs are already merged into the working tree and appear consistent.

Key insights:
- Zero file-level merge conflicts exist -- all builders wrote to non-overlapping files as planned
- All additive modifications (Builder-2 to `dates.ts`, Builder-3 to `section-group.tsx`/`nav.tsx`) are clean and do not conflict
- The only noteworthy observation is a minor pattern inconsistency: Builder-1's project page uses `text-warm-500` for the "paused" status display, while Builder-3's accessibility fix targeted only `section-group.tsx` and `nav.tsx` as specified in the plan -- this is intentional (paused status on a different background) but worth verifying during integration

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Ground Project Screen - Status: COMPLETE (30 tests: 19 hook + 11 page)
- **Builder-2:** Weekly Signals Screen - Status: COMPLETE (26 tests: 13 hook + 9 page + 4 utility)
- **Builder-3:** Today Enhancement + Testing + Accessibility - Status: COMPLETE (21 new tests + 1 updated assertion)

### Sub-Builders
None. No builders required splitting.

**Total outputs to integrate:** 3 builder outputs
**Total new tests:** 77
**Expected total tests after integration:** ~159 (per Builder-1's full suite verification)

---

## Integration Zones

### Zone 1: Shared Date Utilities

**Builders involved:** Builder-2

**Conflict type:** File modification (additive)

**Risk level:** LOW

**Description:**
Builder-2 added `formatWeekRange` and `MONTH_ABBREVS` to `src/lib/dates.ts` and appended a `formatWeekRange` describe block (4 tests) to `src/lib/dates.test.ts`. These are purely additive changes -- no existing functions were modified. The `formatWeekRange` function is imported by `src/app/signals/page.tsx` and mocked in `src/hooks/use-weekly-signals.test.ts` and `src/app/signals/signals.test.tsx`.

**Files affected:**
- `src/lib/dates.ts` - Added `formatWeekRange` + `MONTH_ABBREVS` (lines 72-95, appended after existing code)
- `src/lib/dates.test.ts` - Added `formatWeekRange` describe block (lines 129-145, appended after existing tests)

**Integration strategy:**
1. Verify `formatWeekRange` is exported and the import in `signals/page.tsx` resolves
2. Verify `dates.test.ts` import line includes `formatWeekRange` alongside existing imports
3. Run `npx vitest run src/lib/dates.test.ts` to confirm all 22 date tests pass (18 existing + 4 new)

**Expected outcome:**
All date utility tests pass. `formatWeekRange` is available for the signals page.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 2: Accessibility Contrast Fix (section-group + nav)

**Builders involved:** Builder-3

**Conflict type:** File modification (CSS class change)

**Risk level:** LOW

**Description:**
Builder-3 changed `text-warm-500` to `text-warm-600` in two files for WCAG AA contrast compliance:
- `src/components/section-group.tsx` - h2 label class
- `src/components/nav.tsx` - inactive nav item class

Builder-3 also updated the nav test assertion in `nav.test.tsx` to match the new class. A new test in `section-group.test.tsx` specifically verifies the `text-warm-600` class.

No other builder touches these files. Builder-1's project page uses `text-warm-500` for the paused status display, but this is on a different element (status badge, not a section label) and was intentionally excluded from the accessibility fix per the plan.

**Files affected:**
- `src/components/section-group.tsx` - `text-warm-500` changed to `text-warm-600` on h2
- `src/components/nav.tsx` - `text-warm-500` changed to `text-warm-600` for inactive items
- `src/components/nav.test.tsx` - Test assertion updated from `text-warm-500` to `text-warm-600`
- `src/components/section-group.test.tsx` - New test verifies `text-warm-600` class

**Integration strategy:**
1. Verify `section-group.tsx` has `text-warm-600` on the h2 element
2. Verify `nav.tsx` has `text-warm-600` for inactive items
3. Verify `nav.test.tsx` assertion matches with `text-warm-600`
4. Run `npx vitest run src/components/section-group.test.tsx src/components/nav.test.tsx` to confirm tests pass
5. Note: `sleep-button.tsx` and `project/page.tsx` still use `text-warm-500` in different contexts -- this is intentional per the plan

**Expected outcome:**
Both component tests pass. WCAG AA contrast compliance achieved for section labels and inactive nav items.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 3: Today Page Enhancement

**Builders involved:** Builder-3

**Conflict type:** File modification (feature addition)

**Risk level:** LOW

**Description:**
Builder-3 modified `src/app/page.tsx` to add the `useActiveProjectName` hook call and display the project name in the ground section. This is an additive change -- no existing code was removed or altered. Builder-3 also created `src/app/page.test.tsx` as a new smoke test for the Today page, which mocks both `useDailyRecord` and `useActiveProjectName`.

No other builder touches `src/app/page.tsx`.

**Files affected:**
- `src/app/page.tsx` - Added `useActiveProjectName` import and project name display in ground SectionGroup
- `src/hooks/use-active-project-name.ts` - New thin read-only hook (created by Builder-3)
- `src/hooks/use-active-project-name.test.ts` - 4 hook tests (created by Builder-3)
- `src/app/page.test.tsx` - 3 smoke tests for Today page (created by Builder-3)

**Integration strategy:**
1. Verify `useActiveProjectName` is properly imported in `page.tsx`
2. Verify the hook fetches only the `name` field (`.select('name')`)
3. Verify the project name renders with `text-sm text-warm-600` class (contrast compliant)
4. Run `npx vitest run src/hooks/use-active-project-name.test.ts src/app/page.test.tsx`

**Expected outcome:**
Hook and page tests pass. Today screen shows project name in ground section when an active project exists.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

## Independent Features (Direct Merge)

These builder outputs have no conflicts and can be merged directly:

- **Builder-1:** Ground Project Screen
  - `src/hooks/use-ground-project.ts` - Hook with fetch, updateName, toggleStatus, createProject
  - `src/hooks/use-ground-project.test.ts` - 19 hook tests
  - `src/app/project/page.tsx` - Full project page (replaced placeholder)
  - `src/app/project/project.test.tsx` - 11 page tests

- **Builder-2:** Weekly Signals Screen
  - `src/hooks/use-weekly-signals.ts` - Hook with fetch, updateField, save
  - `src/hooks/use-weekly-signals.test.ts` - 13 hook tests
  - `src/app/signals/page.tsx` - Full signals page (replaced placeholder)
  - `src/app/signals/signals.test.tsx` - 9 page tests

- **Builder-3:** Component Tests
  - `src/components/section-group.test.tsx` - 5 tests
  - `src/components/date-header.test.tsx` - 4 tests
  - `src/components/note-field.test.tsx` - 5 tests

**Assigned to:** Integrator-1 (quick verification alongside Zone work)

---

## Parallel Execution Groups

### Group 1 (Single Integrator -- All Zones are Low Risk)

- **Integrator-1:** Zone 1 + Zone 2 + Zone 3 + all independent features

**Rationale:** All zones are LOW risk with zero actual file conflicts between builders. The builder outputs are already present in the working tree. Integration is purely a verification pass -- confirming everything compiles, all tests pass, and patterns are consistent. One integrator is sufficient.

---

## Integration Order

**Recommended sequence:**

1. **Verification pass (Integrator-1)**
   - Run `npx tsc --noEmit` to verify TypeScript compilation with all builder files
   - Run `npx vitest run` to verify all tests pass (expected: ~159 tests)
   - Run `npx eslint .` to verify lint compliance
   - Check for any runtime import resolution issues

2. **Pattern consistency check**
   - Verify all three pages follow auth wrapper pattern identically
   - Verify all hooks follow the useDailyRecord canonical pattern
   - Verify error handling uses `role="alert"` and `text-error` consistently
   - Verify layout container `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6` on all pages

3. **Final build verification**
   - Run `npm run build` to confirm production build succeeds
   - Verify no console errors in build output

---

## Shared Resources Strategy

### Shared Types
**Status:** No conflicts.
- `GroundProject` type defined once in `src/hooks/use-ground-project.ts` (local alias from `Database`)
- `WeeklySignal` type defined once in `src/hooks/use-weekly-signals.ts` (local alias from `Database`)
- Both derive from `Database` type in `src/lib/types.ts` (shared, unmodified)
- `useActiveProjectName` does not define a type alias (uses inline `data?.name`)

**Resolution:** None needed. Each hook defines its own local type alias from the shared `Database` interface. No duplication.

### Shared Utilities
**Status:** No conflicts.
- `formatWeekRange` added by Builder-2 to `src/lib/dates.ts` -- sole owner
- Existing utilities (`getEffectiveDate`, `formatDisplayDate`, `formatTime`, `getWeekStart`) unchanged

**Resolution:** None needed.

### Shared Components
**Status:** Minor change, no conflict.
- `SectionGroup` used by all three pages (Today, Project, Signals) -- component modified by Builder-3 (contrast fix)
- `NoteField` used by Today page and Signals page -- not modified
- `Nav` modified by Builder-3 (contrast fix) -- used by layout, not directly by any builder page

**Resolution:** None needed. Builder-3's changes are already in place and tested.

### Configuration Files
**Status:** No changes.
- No builder modified `package.json`, `tsconfig.json`, `vitest.config.ts`, `.eslintrc`, or CI workflow

---

## Expected Challenges

### Challenge 1: Test Count Discrepancy
**Impact:** Builder reports cite different total test counts. Builder-1 saw 159 total, Builder-3 saw 111 total. This suggests builders ran at different times or from different baselines.
**Mitigation:** Run `npx vitest run` and verify the actual count. Expected: all original tests (82 from iteration 1) + Builder-1 (30) + Builder-2 (26) + Builder-3 (21) = ~159 total. The discrepancy is likely because Builder-3 ran before Builders 1 and 2 had committed.
**Responsible:** Integrator-1

### Challenge 2: Remaining text-warm-500 Usage
**Impact:** `text-warm-500` still appears in `sleep-button.tsx` (line 24, on `bg-warm-200` background) and `project/page.tsx` (line 115, paused status badge). These are intentional per the plan -- different background contexts.
**Mitigation:** Confirm these usages are deliberate. The sleep button uses `text-warm-500` on `bg-warm-200` (higher contrast ratio due to darker background). The paused status is a semantic choice (muted/inactive appearance).
**Responsible:** Integrator-1

---

## Success Criteria for This Integration Round

- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] All tests pass (`npx vitest run`)
- [ ] ESLint passes with zero errors (`npx eslint .`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No duplicate type definitions across builder outputs
- [ ] All imports resolve correctly (no broken paths)
- [ ] All three pages follow auth wrapper pattern
- [ ] All hooks follow useDailyRecord canonical pattern
- [ ] Error handling consistent (role="alert" + text-error)
- [ ] Accessibility fix applied (text-warm-600 in section-group and nav)
- [ ] formatWeekRange works and is tested
- [ ] Today page displays active project name
- [ ] All builder functionality preserved (no regressions)

---

## Notes for Integrators

**Important context:**
- All builder outputs are already in the working tree (not in separate branches). This is a verification-only integration round.
- The builders had zero file overlaps by design. The plan explicitly assigned non-overlapping file domains.
- Builder-1's `useGroundProject` and Builder-3's `useActiveProjectName` both query the `ground_projects` table but are completely independent hooks with different return shapes and responsibilities.

**Watch out for:**
- Test mock isolation: Each test file mocks `@/lib/supabase/client` independently. Ensure no test file leaks mock state to another.
- The `formatWeekRange` function uses `\u2013` (en-dash), not `--` (double hyphen). Test assertions must match exactly.
- Builder-1's `formatStartDate` is a local function inside `project/page.tsx`, not exported. It defines its own `MONTHS` array (similar to but independent from `MONTH_ABBREVS` in `dates.ts`). This is fine -- it is page-local.

**Patterns to maintain:**
- Reference `patterns.md` for all conventions
- Error handling: `setError(null)` before mutation, `setError(error.message)` on failure
- Auth wrapper: `supabase.auth.getUser()` in useEffect, empty div while loading
- Layout: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6` on all pages

---

## Next Steps

1. Spawn single integrator (Integrator-1) for full verification pass
2. Integrator runs TypeScript, tests, lint, and build
3. Integrator verifies pattern consistency across all builder outputs
4. Integrator creates completion report
5. Proceed to ivalidator for final validation

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2026-03-12
**Round:** 1
