# Builder Task Breakdown - Iteration 2

## Overview

3 primary builders work in **parallel** with zero dependencies between them.
No builders are expected to need sub-builder splits (all tasks are LOW-MEDIUM complexity).

Estimated total new tests: ~50
Estimated post-iteration total: ~130 tests

---

## Builder-1: Ground Project Screen

### Scope

Implement the Ground Project screen and its data hook. Replace the placeholder at `/project` with a fully functional screen that displays and manages the active ground project (view, edit name, toggle status, create new).

### Complexity Estimate

**MEDIUM**

Simple data model (single active project), but the create-new-project flow requires two sequential Supabase operations and error recovery logic.

### Success Criteria

- [ ] `useGroundProject` hook fetches active project on mount
- [ ] Hook exposes `updateName`, `toggleStatus`, `createProject` functions
- [ ] `updateName` optimistically updates name, persists immediately to Supabase
- [ ] `toggleStatus` switches between `active` and `paused`, persists immediately
- [ ] `createProject` deactivates the current project (sets to `completed`), then inserts new
- [ ] `createProject` re-activates the old project if the insert fails
- [ ] Page displays project name, status, and start date when active project exists
- [ ] Page shows empty state with create prompt when no active project exists
- [ ] Project name is editable inline (tap to edit, input + save)
- [ ] Error messages display with `role="alert"` and `text-error` styling
- [ ] Hook handles duplicate name constraint error gracefully
- [ ] Page follows auth wrapper pattern (user fetch -> content component)
- [ ] Page uses layout container: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`
- [ ] ~15 hook tests passing
- [ ] ~10 page tests passing
- [ ] All code passes `npm run type-check` and `npm run lint`

### Files to Create

- `src/hooks/use-ground-project.ts` -- Data hook (fetch active, updateName, toggleStatus, createProject)
- `src/hooks/use-ground-project.test.ts` -- Hook tests (~15 tests)
- `src/app/project/project.test.tsx` -- Page-level tests (~10 tests)

### Files to Modify

- `src/app/project/page.tsx` -- **Replace entirely** (current file is a placeholder)

### Dependencies

**Depends on:** Nothing. Fully independent.
**Blocks:** Nothing. Builder 3 uses its own thin hook for project name.

### Implementation Notes

**Critical: Read these files first before writing any code:**
- `src/hooks/use-daily-record.ts` -- canonical data hook pattern
- `src/hooks/use-daily-record.test.ts` -- canonical test mock pattern
- `src/lib/types.ts` -- GroundProject type is already defined
- `src/app/page.tsx` -- canonical page pattern (auth wrapper)
- `supabase/migrations/001_initial_schema.sql` -- constraints and status enum

**Database schema reminders:**
- Status CHECK constraint: `'active'`, `'paused'`, `'completed'`, `'dropped'`
- Unique constraint on `(user_id, name)` -- handle duplicate name errors
- No DELETE policy -- do not attempt deletes
- `updated_at` is auto-set by trigger -- do not include in payloads

**Hook design:**
- Use immediate save (not debounced) for all mutations. Project edits are infrequent.
- Follow the exact return shape: `{ project, isLoading, error, updateName, toggleStatus, createProject }`
- `project` is `GroundProject | null` (null when no active project)

**Page UX:**
- Keep the page simple. One SectionGroup or minimal layout. Do not over-componentize.
- Status display: text "active" in `text-green-600` or "paused" in `text-warm-500`
- Start date: "since Mar 1, 2026" or similar quiet format
- "new project" button: quiet text button at bottom, not prominent
- Create flow: show input field inline when user taps "new project"
- Editable name: tap to toggle between display and input mode

**Test mock shape:**
```typescript
// The chain needs: .from().select().eq().eq().maybeSingle() for fetch
// Plus: .from().update().eq().select().single() for update
// Plus: .from().insert().select().single() for create
// See patterns.md "Supabase Mock Pattern for ground_projects"
```

### Patterns to Follow

- Use **Page Pattern (Auth Wrapper)** from patterns.md
- Use **Data Hook Pattern** from patterns.md (follow useDailyRecord structure)
- Use **Supabase Mock Pattern for ground_projects** from patterns.md for tests
- Use **Error Handling Patterns** from patterns.md
- Use **Styling Conventions** from patterns.md for button and input styling

### Testing Requirements

- Hook tests: fetch active, fetch null, fetch error, updateName, updateName error, toggleStatus, toggleStatus error, createProject with active, createProject without active, createProject error with revert, empty name rejection (~15 tests)
- Page tests: loading state, display project info, empty state, edit name, toggle status, create new, error display, accessibility (~10 tests)
- Coverage target: 90%+

---

## Builder-2: Weekly Signals Screen

### Scope

Implement the Weekly Signals screen and its data hook. Replace the placeholder at `/signals` with a fully functional screen showing the current week's signal entry form and recent weekly history. Add the `formatWeekRange` utility function.

### Complexity Estimate

**MEDIUM**

Two data contexts (current week + history list), but the query patterns are straightforward and the UI reuses existing NoteField components.

### Success Criteria

- [ ] `useWeeklySignals` hook fetches current week's signal on mount
- [ ] Hook fetches last 4 weeks of history (excluding current week)
- [ ] Hook exposes `updateField` for local state changes
- [ ] Hook exposes `save` function for explicit upsert to Supabase
- [ ] `save` uses upsert with `onConflict: 'user_id,week_start'` for idempotency
- [ ] `isSaving` state tracks save-in-progress
- [ ] Page shows week range header (e.g., "Mar 9 -- 15")
- [ ] Page shows three labeled text areas: financial, sleep, note
- [ ] Page shows explicit "save" button with green styling
- [ ] Save button shows "saving..." while in progress and is disabled
- [ ] Recent signals section shows below the form with divider
- [ ] Past weeks are read-only, showing truncated previews
- [ ] `formatWeekRange` utility added to dates.ts and tested
- [ ] Page follows auth wrapper pattern
- [ ] Error messages display with `role="alert"` and `text-error` styling
- [ ] ~12 hook tests passing
- [ ] ~9 page tests passing
- [ ] formatWeekRange tests passing (~4 tests)
- [ ] All code passes `npm run type-check` and `npm run lint`

### Files to Create

- `src/hooks/use-weekly-signals.ts` -- Data hook (fetch current + recent, updateField, save)
- `src/hooks/use-weekly-signals.test.ts` -- Hook tests (~12 tests)
- `src/app/signals/signals.test.tsx` -- Page-level tests (~9 tests)

### Files to Modify

- `src/app/signals/page.tsx` -- **Replace entirely** (current file is a placeholder)
- `src/lib/dates.ts` -- **Add** `formatWeekRange` function and `MONTH_ABBREVS` constant
- `src/lib/dates.test.ts` -- **Add** `formatWeekRange` test describe block (~4 tests)

### Dependencies

**Depends on:** Nothing. Fully independent. `getWeekStart` already exists in dates.ts.
**Blocks:** Nothing.

### Implementation Notes

**Critical: Read these files first before writing any code:**
- `src/hooks/use-daily-record.ts` -- canonical data hook pattern
- `src/hooks/use-daily-record.test.ts` -- canonical test mock pattern
- `src/lib/types.ts` -- WeeklySignal type is already defined
- `src/lib/dates.ts` -- `getWeekStart()` already implemented
- `src/lib/dates.test.ts` -- existing test patterns for date utilities
- `src/components/note-field.tsx` -- reuse for all 3 text fields
- `src/components/section-group.tsx` -- reuse for section labels

**Database schema reminders:**
- Unique constraint on `(user_id, week_start)` -- enables idempotent upsert
- All text fields default to `''` (empty string), not null
- No DELETE policy

**Hook design:**
- Explicit save (not auto-save / not debounced). Weekly signals are deliberate reflections.
- `updateField` only updates local React state. `save` sends to Supabase.
- Separate `isSaving` from `isLoading` (loading = initial fetch, saving = save button pressed).
- Return: `{ currentSignal, recentSignals, weekStart, isLoading, isSaving, error, updateField, save }`
- `currentSignal` is `Partial<WeeklySignal>` (may not have `id` if new)
- `recentSignals` is `WeeklySignal[]` (full rows from past weeks)

**Page UX:**
- Week header: use `formatWeekRange(weekStart)` as `<h1>`
- Three sections: "financial", "sleep", "note" using SectionGroup + NoteField
- Save button: full-width, `bg-green-600 text-warm-50`, shows "saving..." while saving
- Recent signals section: separated by `border-t border-warm-300`, heading "recent weeks"
- Each past week: week range + truncated non-empty fields
- Use `text-sm text-warm-600` for week range labels, `text-sm text-warm-700 truncate` for content

**formatWeekRange implementation:**
- Use explicit `MONTH_ABBREVS` array (not `toLocaleDateString`) for locale-independent output
- Handle month boundaries: "Mar 30 -- Apr 5"
- Use en-dash character (`\u2013`) not double hyphen
- See full implementation in patterns.md

**Test mock note:**
- Mock `@/lib/dates` to control `getWeekStart()` return value
- The mock chain needs `neq`, `order`, `limit` for recent signals query
- See patterns.md "Supabase Mock Pattern for weekly_signals"

### Patterns to Follow

- Use **Page Pattern (Auth Wrapper)** from patterns.md
- Use **Data Hook Pattern** from patterns.md (follow useDailyRecord structure)
- Use **Supabase Mock Pattern for weekly_signals** from patterns.md for tests
- Use **Utility Pattern: formatWeekRange** from patterns.md
- Use **Styling Conventions** from patterns.md for button, divider, and text styling
- Reuse **NoteField** component for all 3 text fields
- Reuse **SectionGroup** component for section labels

### Testing Requirements

- Hook tests: isLoading initial, fetch current signal, fetch empty current, fetch recent signals, fetch error, updateField updates local state, save calls upsert, save sets isSaving, save handles error, save with empty fields, weekStart exposed (~12 tests)
- Page tests: loading state, week header display, three form fields render, save button present, typing in fields, save button click, recent signals display, empty state, error display (~9 tests)
- formatWeekRange tests: single month, cross-month, cross-year, first week (~4 tests)
- Coverage target: 90%+

---

## Builder-3: Today Enhancement + Testing + Accessibility

### Scope

Three related tasks that together improve quality and completeness: (1) add active project name display to the Today screen, (2) write tests for previously untested components, (3) fix accessibility contrast issues.

### Complexity Estimate

**MEDIUM**

Multiple small tasks rather than one large feature. Each individual task is LOW complexity, but the variety requires attention to detail.

### Success Criteria

- [ ] `useActiveProjectName` hook fetches active project name on mount
- [ ] Hook returns `{ projectName: string | null, isLoading: boolean }`
- [ ] Today screen ground section displays project name when active project exists
- [ ] Today screen ground section shows nothing when no active project (graceful absence)
- [ ] Project name styled as `text-sm text-warm-600` (muted, above checkboxes)
- [ ] `text-warm-500` replaced with `text-warm-600` in section-group.tsx
- [ ] `text-warm-500` replaced with `text-warm-600` in nav.tsx (inactive items)
- [ ] SectionGroup has dedicated test file with ~4 tests
- [ ] DateHeader has dedicated test file with ~4 tests
- [ ] NoteField has dedicated test file with ~4 tests
- [ ] Today page has a smoke test (~3 tests)
- [ ] useActiveProjectName has hook tests (~3 tests)
- [ ] All code passes `npm run type-check` and `npm run lint`

### Files to Create

- `src/hooks/use-active-project-name.ts` -- Thin read-only hook
- `src/hooks/use-active-project-name.test.ts` -- Hook tests (~3 tests)
- `src/components/section-group.test.tsx` -- Component tests (~4 tests)
- `src/components/date-header.test.tsx` -- Component tests (~4 tests)
- `src/components/note-field.test.tsx` -- Component tests (~4 tests)
- `src/app/page.test.tsx` -- Today page smoke test (~3 tests)

### Files to Modify

- `src/app/page.tsx` -- Add `useActiveProjectName` import and project name display in ground section
- `src/components/section-group.tsx` -- Change `text-warm-500` to `text-warm-600`
- `src/components/nav.tsx` -- Change `text-warm-500` to `text-warm-600` for inactive items

### Dependencies

**Depends on:** Nothing. `useActiveProjectName` is independent from Builder 1's `useGroundProject`.
**Blocks:** Nothing.

### Implementation Notes

**Critical: Read these files first before writing any code:**
- `src/app/page.tsx` -- Today screen (file being modified)
- `src/components/section-group.tsx` -- being tested and accessibility-fixed
- `src/components/date-header.tsx` -- being tested
- `src/components/note-field.tsx` -- being tested
- `src/components/anchor-checkbox.test.tsx` -- reference for component test patterns
- `src/components/nav.tsx` -- being accessibility-fixed

**useActiveProjectName hook:**
- Thin, read-only. Fetches only `name` field: `.select('name')`
- No error state (if fetch fails, `projectName` stays null -- graceful degradation)
- No mutation functions. Display only.
- See full implementation in patterns.md

**Today screen modification:**
- Import `useActiveProjectName` from `@/hooks/use-active-project-name`
- In `TodayContent`, call `const { projectName } = useActiveProjectName(userId)`
- In the "ground" SectionGroup, add before the flex div:
  ```tsx
  {projectName && (
    <p className="text-sm text-warm-600">{projectName}</p>
  )}
  ```
- Use `text-warm-600` (not `text-warm-500`) for contrast compliance

**Accessibility fixes:**
- `src/components/section-group.tsx` line 11: change `text-warm-500` to `text-warm-600`
- `src/components/nav.tsx` line 31: change `text-warm-500` to `text-warm-600`
- These are single-class replacements, no other changes needed

**Component tests -- SectionGroup:**
- Renders label as h2
- Renders children
- Has uppercase and tracking-wide classes
- Uses section element

**Component tests -- DateHeader:**
- Mock `@/lib/dates` to return controlled values
- Renders a heading with formatted date after mount
- Shows placeholder div before date is available (initial render before useEffect)
- Uses h1 element

**Component tests -- NoteField:**
- Renders textarea
- Displays value prop
- Calls onChange with new value on input
- Has maxLength attribute (500)
- Has placeholder "..."

**Today page smoke test:**
- Mock both `@/lib/supabase/client` and relevant hooks
- Verify page renders without crashing
- Verify ground section appears
- Verify project name appears when active project exists

**Test mock for Today page:**
The Today page now uses two hooks: `useDailyRecord` and `useActiveProjectName`. For the page smoke test, mock both at the module level:
```typescript
vi.mock('@/hooks/use-daily-record', () => ({
  useDailyRecord: () => ({
    record: { /* empty record fields */ },
    error: null,
    updateField: vi.fn(),
    setSleepStart: vi.fn(),
    setSleepEnd: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-active-project-name', () => ({
  useActiveProjectName: () => ({
    projectName: 'Test Project',
    isLoading: false,
  }),
}))
```

### Patterns to Follow

- Use **Data Hook Pattern** from patterns.md for useActiveProjectName (simplified, read-only variant)
- Use **Supabase Mock Pattern for useActiveProjectName** from patterns.md for hook tests
- Use **Component Test Pattern** from patterns.md for SectionGroup, DateHeader, NoteField
- Use **Page-Level Test Pattern** from patterns.md for Today page smoke test
- Use **Accessibility Fix: Contrast Compliance** from patterns.md for the text-warm-500 to text-warm-600 changes

### Testing Requirements

- useActiveProjectName hook tests: fetches name on mount, returns null when no project, returns name when project exists (~3 tests)
- SectionGroup tests: renders label, renders children, correct styling, semantic element (~4 tests)
- DateHeader tests: renders date, placeholder before hydration, correct element (~4 tests)
- NoteField tests: renders textarea, displays value, onChange callback, maxLength, placeholder (~4-5 tests)
- Today page tests: renders without crash, shows ground section, shows project name (~3 tests)
- Coverage target: 90%+

---

## Builder Execution Order

### All Parallel (No Dependencies)

- Builder-1: Ground Project Screen
- Builder-2: Weekly Signals Screen
- Builder-3: Today Enhancement + Testing + Accessibility

All three builders can run simultaneously. There are no file conflicts:

| File | Builder-1 | Builder-2 | Builder-3 |
|------|-----------|-----------|-----------|
| `src/hooks/use-ground-project.ts` | CREATE | -- | -- |
| `src/hooks/use-ground-project.test.ts` | CREATE | -- | -- |
| `src/app/project/page.tsx` | REPLACE | -- | -- |
| `src/app/project/project.test.tsx` | CREATE | -- | -- |
| `src/hooks/use-weekly-signals.ts` | -- | CREATE | -- |
| `src/hooks/use-weekly-signals.test.ts` | -- | CREATE | -- |
| `src/app/signals/page.tsx` | -- | REPLACE | -- |
| `src/app/signals/signals.test.tsx` | -- | CREATE | -- |
| `src/lib/dates.ts` | -- | MODIFY (add) | -- |
| `src/lib/dates.test.ts` | -- | MODIFY (add) | -- |
| `src/hooks/use-active-project-name.ts` | -- | -- | CREATE |
| `src/hooks/use-active-project-name.test.ts` | -- | -- | CREATE |
| `src/app/page.tsx` | -- | -- | MODIFY |
| `src/app/page.test.tsx` | -- | -- | CREATE |
| `src/components/section-group.tsx` | -- | -- | MODIFY (1 class) |
| `src/components/section-group.test.tsx` | -- | -- | CREATE |
| `src/components/date-header.test.tsx` | -- | -- | CREATE |
| `src/components/note-field.test.tsx` | -- | -- | CREATE |
| `src/components/nav.tsx` | -- | -- | MODIFY (1 class) |

Zero file overlaps. All builders merge independently in any order.

### Integration Notes

- All builders follow the same auth wrapper, layout, and styling patterns from Iteration 1
- All new hooks follow the `useDailyRecord` canonical pattern
- All tests follow the established Supabase mock chain pattern
- Since there are zero shared file modifications between builders, no merge conflicts are expected
- After all builders merge, run `npm run test:coverage` and `npm run build` to verify everything works together
