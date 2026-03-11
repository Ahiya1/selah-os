# Builder-1 Report: Ground Project Screen

## Status
COMPLETE

## Summary
Implemented the Ground Project screen and its data hook, replacing the placeholder at `/project` with a fully functional screen. The hook (`useGroundProject`) fetches the active project, supports updating the name (with optimistic updates and error revert), toggling status between active/paused, and creating new projects (with automatic deactivation of the previous project and recovery on failure). The page follows the auth wrapper pattern and uses SectionGroup for layout with the warm palette from the design system. All 30 tests pass.

## Files Created

### Implementation
- `src/hooks/use-ground-project.ts` -- Data hook: fetch active project, updateName, toggleStatus, createProject with two-step deactivation/insert and error recovery

### Tests
- `src/hooks/use-ground-project.test.ts` -- 19 hook tests covering fetch, mutations, error handling, optimistic updates with revert, empty name rejection, and no-op behavior when no project exists
- `src/app/project/project.test.tsx` -- 11 page tests covering loading state, project display, edit flow, create flow, empty state, error display, and cancel behaviors

## Files Modified

### Implementation
- `src/app/project/page.tsx` -- Replaced entirely from placeholder to full Ground Project screen with auth wrapper, editable project name, status toggle, start date display, create new project flow, and empty state

## Success Criteria Met
- [x] `useGroundProject` hook fetches active project on mount
- [x] Hook exposes `updateName`, `toggleStatus`, `createProject` functions
- [x] `updateName` optimistically updates name, persists immediately to Supabase
- [x] `toggleStatus` switches between `active` and `paused`, persists immediately
- [x] `createProject` deactivates the current project (sets to `completed`), then inserts new
- [x] `createProject` re-activates the old project if the insert fails
- [x] Page displays project name, status, and start date when active project exists
- [x] Page shows empty state with create prompt when no active project exists
- [x] Project name is editable inline (tap to edit, input + save)
- [x] Error messages display with `role="alert"` and `text-error` styling
- [x] Hook handles duplicate name constraint error gracefully
- [x] Page follows auth wrapper pattern (user fetch -> content component)
- [x] Page uses layout container: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`
- [x] 19 hook tests passing (target was ~15)
- [x] 11 page tests passing (target was ~10)
- [x] All code passes `npm run type-check` (no errors in Builder-1 files)
- [x] All code passes `npm run lint` (zero errors)

## Test Generation Summary (Production Mode)

### Test Files Created
- `src/hooks/use-ground-project.test.ts` -- 19 unit tests for the data hook
- `src/app/project/project.test.tsx` -- 11 page-level integration tests

### Test Statistics
- **Unit tests (hook):** 19 tests
- **Page tests:** 11 tests
- **Total tests:** 30
- **Estimated coverage:** 90%+

### Test Verification
```bash
npx vitest run src/hooks/use-ground-project.test.ts src/app/project/project.test.tsx
# Result: 30 passed, 0 failed
npx vitest run  # Full suite: 159 passed, 0 failed (no regressions)
```

### Hook Tests Detail
- Initializes with isLoading true
- Initializes with no error
- Fetches active project on mount
- Returns null project when no active project exists
- Sets error on fetch failure
- updateName optimistically updates name and persists
- updateName reverts on error
- updateName rejects empty string
- updateName rejects whitespace-only string
- toggleStatus switches from active to paused
- toggleStatus switches from paused to active
- toggleStatus reverts on error
- createProject inserts new project when no active project
- createProject deactivates previous project then inserts new
- createProject re-activates old project if insert fails
- createProject rejects empty name
- createProject handles deactivation failure
- updateName does nothing when no project exists
- toggleStatus does nothing when no project exists

### Page Tests Detail
- Renders loading state initially before user loads
- Displays page heading after user loads
- Displays project name when active project exists
- Displays project status and start date
- Shows empty state when no active project
- Enters edit mode when project name is clicked
- Cancels name edit without saving
- Shows create form when new project button is clicked
- Cancels create form
- Displays error message with role alert
- Has new project button available when project exists

## CI/CD Status

- **Workflow existed:** Yes (`.github/workflows/ci.yml` already exists from Iteration 1)
- **Workflow created:** No (not needed)

## Security Checklist

- [x] No hardcoded secrets (all from env vars via Supabase client)
- [x] Input validation: empty/whitespace name rejection in hook (`!name.trim()`)
- [x] Parameterized queries only (Supabase ORM with `.eq()` chaining)
- [x] Auth middleware on protected routes (auth wrapper pattern + middleware.ts)
- [x] No dangerouslySetInnerHTML
- [x] Error messages don't expose internals (Supabase error messages only)

## Dependencies Used
- `@supabase/supabase-js` (via `@/lib/supabase/client`): Database operations
- `@supabase/ssr`: Typed Supabase client creation
- `SectionGroup` component: Section layout with labeled heading
- `Database` types from `@/lib/types`: TypeScript type safety

## Patterns Followed
- **Page Pattern (Auth Wrapper):** Auth check with empty div loading state, then content component receiving `userId`
- **Data Hook Pattern:** Following `useDailyRecord` canonical structure -- `createClient()` inside hook, `useState` for data/loading/error, `useEffect` for fetch, `useCallback` for mutations
- **Supabase Mock Pattern:** Fully chainable mock supporting `.from().select().eq().eq().maybeSingle()`, `.from().update().eq().select().single()`, `.from().insert().select().single()`
- **Error Handling Pattern:** `setError(null)` before mutations, `setError(error.message)` on failure, `role="alert"` with `text-error` in UI
- **Optimistic Updates with Revert:** Save previous state, apply optimistic update, revert on error
- **Styling Conventions:** Warm palette colors, quiet buttons (`text-sm text-warm-600`), input styling (`p-3 rounded-lg border border-warm-300 bg-warm-50`), status colors (`text-green-600` for active, `text-warm-500` for paused)

## Integration Notes

### Exports
- `useGroundProject(userId: string)` from `src/hooks/use-ground-project.ts`
  - Returns: `{ project, isLoading, error, updateName, toggleStatus, createProject }`
  - `project` is `GroundProject | null`

### Imports Used
- `createClient` from `@/lib/supabase/client`
- `Database` type from `@/lib/types`
- `SectionGroup` from `@/components/section-group`
- `User` type from `@supabase/supabase-js`

### No Dependencies on Other Builders
This builder has zero dependencies on Builder-2 or Builder-3. All files are independent and can merge in any order.

### Potential Conflicts
None. Builder-1 does not modify any files owned by other builders.

## Challenges Overcome

1. **Supabase TypeScript generics**: The Supabase client returns generic types from `.select()` and `.single()` that don't match the `GroundProject` type alias. Solved with explicit `as GroundProject` casts on `data` after null checks.

2. **Mock chain complexity**: The `ground_projects` hook uses three different Supabase call patterns (fetch with `maybeSingle`, mutation with `update().eq().select().single()`, and deactivation with `update().eq()`). The initial mock pattern from patterns.md didn't chain `eq()` after `update()`. Solved by creating a fully chainable mock where all methods return `this` and terminal methods (`maybeSingle`, `single`) are separately mockable.

3. **Deactivation error testing**: Testing the deactivation failure path required making `eq()` return `{ error: ... }` for a specific call while keeping it chainable for other calls. Used `mockReturnValueOnce` to override just the deactivation call.

## Testing Notes
- Run `npx vitest run src/hooks/use-ground-project.test.ts src/app/project/project.test.tsx` to test Builder-1 files
- Run `npx vitest run` to verify no regressions across the full suite
- The `act(...)` warnings in stderr for `isLoading` and `no error` tests are benign -- they occur because the hook's `useEffect` fires asynchronously after the synchronous assertion
