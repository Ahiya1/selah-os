# Explorer 1 Report: Architecture & Implementation Plan for Iteration 2

## Executive Summary

Iteration 1 produced a clean, well-structured codebase with strong patterns. The Today screen, auth, navigation, database schema (all 3 tables), and a comprehensive test suite (82 passing tests) are complete. Iteration 2 must implement the Ground Project screen and Weekly Signals screen by following the established patterns precisely. The codebase is specifically designed for this expansion: placeholder pages exist at both routes, Database types already cover all three tables, `getWeekStart()` is already implemented and tested, and the `useDebouncedSave` hook is ready for reuse. No new dependencies, no schema changes, no architectural decisions needed -- this iteration is pure feature implementation on solid foundations.

## Discoveries

### Established Codebase (What Already Exists)

**Foundation (fully built, do not touch):**
- Next.js 15.5.12, App Router, TypeScript strict mode, Tailwind v4
- Supabase auth with magic link, session persistence, middleware route protection
- Database: all 3 tables deployed (`daily_records`, `ground_projects`, `weekly_signals`) with RLS, indexes, triggers
- CI pipeline (`.github/workflows/ci.yml`): lint, type-check, test with coverage, build
- 82 passing tests across 9 test files
- 5 production deps, 12 dev deps (minimal footprint)

**Reusable Components:**
- `SectionGroup` -- section wrapper with uppercase label heading. Used for visual grouping. **Reuse for both new screens.**
- `NoteField` -- textarea with auto-resize styling, 500-char max, placeholder "...". **Reuse directly for financial_note, sleep_state, weekly note, and project name editing.**
- `AnchorCheckbox` -- large tap-target checkbox with circle UI. **Not directly needed for new screens** (Project uses status toggle, Signals uses text fields).
- `DateHeader` -- displays effective date with client-side rendering pattern. **Reference pattern for week header on Signals.**
- `Nav` -- fixed bottom nav bar, already links to `/project` and `/signals` with active state highlighting.

**Reusable Hooks:**
- `useDebouncedSave` -- generic debounced save with visibility-change flush. **Reuse for Signals auto-save or Project name editing.** Note: the hook was built generically in Iteration 1 precisely for this reuse.
- `useDailyRecord` -- domain-specific hook for daily records. **Study as the canonical pattern** for building `useGroundProject` and `useWeeklySignals` hooks.

**Reusable Utilities:**
- `getWeekStart(now?: Date): string` -- already implemented and tested in `dates.ts`. Returns Monday as YYYY-MM-DD. **Use directly for Signals.**
- `formatDateString(date: Date): string` -- formats Date as YYYY-MM-DD.
- `formatDisplayDate(dateString: string): string` -- formats for display ("Thursday, March 12").
- `createClient()` from `@/lib/supabase/client` -- browser-side Supabase client.
- Database types in `@/lib/types` -- already include `ground_projects` and `weekly_signals` Row/Insert/Update types.

**Placeholder Pages (targets for replacement):**
- `src/app/project/page.tsx` -- minimal div with `<h1>Project</h1>`, uses identical layout class pattern (`max-w-lg mx-auto px-4 pt-5 pb-24`).
- `src/app/signals/page.tsx` -- minimal div with `<h1>Signals</h1>`, same layout pattern.

### Database Schema Details (Already Deployed)

**`ground_projects` table:**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID NOT NULL REFERENCES auth.users(id)
name TEXT NOT NULL
status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'dropped'))
start_date DATE NOT NULL DEFAULT CURRENT_DATE
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
CONSTRAINT ground_projects_user_name_unique UNIQUE (user_id, name)
```
- Index on `(user_id, status)` -- efficient for fetching active project
- RLS: SELECT, INSERT, UPDATE policies (no DELETE -- intentional)
- Status enum: `active`, `paused`, `completed`, `dropped`
- Unique constraint on `(user_id, name)` -- prevents duplicate project names per user

**`weekly_signals` table:**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID NOT NULL REFERENCES auth.users(id)
week_start DATE NOT NULL
financial_note TEXT NOT NULL DEFAULT ''
sleep_state TEXT NOT NULL DEFAULT ''
note TEXT NOT NULL DEFAULT ''
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
CONSTRAINT weekly_signals_user_week_unique UNIQUE (user_id, week_start)
```
- Index on `(user_id, week_start)` -- efficient for fetching by week
- RLS: SELECT, INSERT, UPDATE policies (no DELETE)
- Upsert key: `(user_id, week_start)` -- idempotent weekly entry

### TypeScript Types (Already Defined)

The `Database` interface in `src/lib/types.ts` already contains complete types for all three tables. Key type extractions for builders:

```typescript
// For Builder 1 (Project):
type GroundProject = Database['public']['Tables']['ground_projects']['Row']
type GroundProjectInsert = Database['public']['Tables']['ground_projects']['Insert']
type GroundProjectUpdate = Database['public']['Tables']['ground_projects']['Update']

// For Builder 2 (Signals):
type WeeklySignal = Database['public']['Tables']['weekly_signals']['Row']
type WeeklySignalInsert = Database['public']['Tables']['weekly_signals']['Insert']
```

### Auth Pattern (Must Follow Exactly)

Every page follows the same user-fetching pattern established in `page.tsx` (Today screen):

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function PageName() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  if (!user) {
    return <div className="p-4" />  // Empty div while loading (no flash)
  }

  return <PageContent userId={user.id} />
}
```

This pattern: (1) creates supabase client, (2) fetches user on mount, (3) renders empty div until user loaded, (4) passes `userId` to content component which uses it for data hooks. Both new pages MUST follow this exact pattern.

## Patterns Identified

### Pattern 1: Data Hook Architecture
**Description:** Each screen gets a dedicated custom hook that encapsulates all Supabase interaction. The hook returns state, loading, error, and mutation functions.
**Use Case:** `useDailyRecord` is the canonical example. New hooks `useGroundProject` and `useWeeklySignals` must follow this pattern.
**Structure:**
```
1. Type aliases from Database interface
2. Default/empty state constant
3. Hook function accepting userId
4. createClient() inside hook
5. useState for record, isLoading, error
6. useEffect for initial fetch
7. useCallback mutation functions
8. Return { state, isLoading, error, ...mutations }
```
**Recommendation:** Follow exactly. The pattern is proven and tested.

### Pattern 2: Supabase Query Chaining
**Description:** All Supabase queries use the chained builder pattern with typed client.
**Use Case:** Read operations chain `.from('table').select('*').eq('col', val).maybeSingle()`. Writes use `.upsert(payload, { onConflict: 'constraint_columns' }).select().single()`.
**Key detail:** For ground_projects, fetching active project: `.from('ground_projects').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle()`.
**Recommendation:** Follow the exact chaining pattern. Always use `.select()` after mutations to get the returned row.

### Pattern 3: Optimistic UI with Debounced Persistence
**Description:** UI updates immediately on interaction, then debounced save fires after 500ms. On visibility change to hidden, pending saves flush immediately.
**Use Case:** Today screen uses this for all checkbox/note interactions.
**For Iteration 2:** Project name editing should use debounced save. Signals is weekly/deliberate, so explicit save button is more appropriate (user opens once per week, writes thoughtfully, saves intentionally).
**Recommendation:** Project screen uses optimistic + debounced for name editing. Signals screen uses explicit "save" button (matching the deliberate, weekly cadence of the interaction).

### Pattern 4: Page Layout Structure
**Description:** Every page uses the same container classes.
**Code:** `<div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">`
**Key:** `pb-24` provides clearance for the fixed bottom nav bar. `max-w-lg` (512px) constrains content width. `space-y-6` provides consistent section spacing.
**Recommendation:** Use this exact class string for both new pages.

### Pattern 5: Test Mocking for Supabase
**Description:** Tests mock `@/lib/supabase/client` at the module level, returning a mock object with chained methods.
**Use Case:** Both new hooks need tests following this exact mocking pattern. The mock builder chain must be re-setup in `beforeEach` after `vi.clearAllMocks()`.
**Recommendation:** Copy the mocking structure from `use-daily-record.test.ts` and adapt for ground_projects and weekly_signals tables.

### Pattern 6: Component Rendering Tests
**Description:** Component tests use `@testing-library/react` with `render`, `screen`, `fireEvent`. They test: renders correctly, interactions work, proper semantics (button type, aria labels), styling classes present.
**Recommendation:** Follow for all new components.

## Complexity Assessment

### Low Complexity Areas

**Ground Project Screen (Builder 1):**
This is the simplest screen in the app. It displays one active project and provides basic CRUD. Low complexity because:
- Only one active project at a time (no list management)
- Three operations: display, edit name, toggle status / create new
- No debounce needed for status toggle (immediate save, like sleep buttons)
- Name editing can reuse `NoteField` pattern (or simple input + debounced save)
- Single query: `.eq('status', 'active').maybeSingle()`
- "Create new project" deactivates current, then inserts new -- two sequential operations

**Estimated effort:** 1.5-2 hours including tests.

**Weekly Signals Screen (Builder 2):**
Medium-low complexity. Two distinct sections: entry form for current week + history list. Low complexity because:
- `getWeekStart()` is already implemented and tested
- Three text fields, one save button
- Upsert on `(user_id, week_start)` is idempotent
- History is a simple `.order('week_start', { ascending: false }).limit(6)` query
- No real-time updates needed (weekly cadence)

**Estimated effort:** 2-3 hours including tests.

**Today Screen Enhancement (Builder 3):**
Trivial. Adding project name display to the ground section requires:
- A small `useActiveProject` hook (or the same hook Builder 1 creates, just the read portion)
- One line of JSX in the ground SectionGroup

**Estimated effort:** 30 minutes including tests.

**Tests + CI Polish (Builder 3):**
Medium effort due to volume, not complexity. Testing patterns are fully established.

**Estimated effort:** 2-3 hours.

### Integration Points Requiring Coordination

**Builder 1 <-> Builder 3:** Builder 3 needs to import the active project name on the Today screen. Builder 1 must expose a reusable way to fetch the active project. Two approaches:
1. Builder 1 creates `useGroundProject(userId)` which returns the full project. Builder 3 creates a minimal `useActiveProjectName(userId)` that only fetches the name. (Avoids coupling.)
2. Builder 1's hook is designed from the start to be importable by Builder 3. (Tighter coupling but less code.)

**Recommendation:** Approach 1. Builder 1 creates `useGroundProject` in `src/hooks/use-ground-project.ts`. Builder 3 creates a thin `useActiveProjectName` in the same file or a separate one that just does a select for `name` where `status = 'active'`. This way Builder 3 does not depend on Builder 1's hook being complete.

## Technology Recommendations

### No New Dependencies
The iteration requires zero new npm packages. Everything needed is already in the project:
- React hooks for state management
- Supabase client for data access
- Tailwind for styling
- Vitest + Testing Library for tests

### File Structure for New Code

```
src/
  app/
    project/
      page.tsx              # Builder 1 replaces placeholder
    signals/
      page.tsx              # Builder 2 replaces placeholder
    page.tsx                # Builder 3 modifies (adds project name)
  
  components/
    project-status.tsx      # Builder 1: status badge/toggle (active/paused)
    project-form.tsx        # Builder 1: create new project form
    signal-entry.tsx        # Builder 2: current week entry form
    signal-history.tsx      # Builder 2: past weeks list
    week-header.tsx         # Builder 2: week indicator display
    [test files co-located]

  hooks/
    use-ground-project.ts   # Builder 1: fetch + mutate active project
    use-ground-project.test.ts
    use-weekly-signals.ts   # Builder 2: fetch + upsert signals
    use-weekly-signals.test.ts
    use-active-project-name.ts  # Builder 3: thin read-only hook for Today screen
    use-active-project-name.test.ts
```

### Design Decisions for Builders

**Project Screen UX:**
- Page header: "ground project" (lowercase, matching SectionGroup label style)
- Active project displayed with name (editable inline), status indicator, start date
- Status shown as text ("active" / "paused") with a tap-to-toggle button, not a dropdown
- "Create new project" as a quiet text button at the bottom
- When creating new: show a simple input field + confirm button, auto-deactivates previous project
- Empty state: "no active project" with prompt to create one
- No delete functionality (consistent with schema having no DELETE RLS policy)

**Signals Screen UX:**
- Page header shows week range: "Mar 9 -- 15" (Monday to Sunday of current week)
- Three labeled text areas: "financial", "sleep", "note"
- Explicit "save" button (garden green, like login button style)
- Below the form: divider, then "recent weeks" section
- Each past week shows: week range label + truncated preview of notes
- Past weeks are read-only (no in-place editing of historical signals)
- Show last 4 weeks of history (or 6, keeping it minimal)

**Today Screen Enhancement:**
- In the "ground" SectionGroup, above the checkboxes, add a small line: the active project name in `text-warm-500` (muted, not attention-grabbing)
- If no active project, show nothing (not "no project" -- just absence)

## Builder Decomposition

### Builder 1: Ground Project Screen + Data Hook

**Scope:**
1. `src/hooks/use-ground-project.ts` -- Custom hook:
   - Fetches active project (`.eq('status', 'active').maybeSingle()`)
   - `updateName(name: string)` -- debounced save via `useDebouncedSave`
   - `toggleStatus()` -- switches between 'active' and 'paused', immediate save
   - `createProject(name: string)` -- deactivates current active project (UPDATE status='completed'), then INSERT new project
   - Returns `{ project, isLoading, error, updateName, toggleStatus, createProject }`

2. `src/hooks/use-ground-project.test.ts` -- Tests for the hook (follow `use-daily-record.test.ts` pattern)

3. `src/app/project/page.tsx` -- Replace placeholder:
   - Auth wrapper pattern (user fetch -> content component)
   - Display: project name (editable), status, start date
   - Actions: edit name, toggle status, create new
   - Empty state: "no active project" + create button
   - Follow layout pattern: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`

4. Optional sub-components if the page gets long:
   - `src/components/project-status.tsx` -- status display + toggle
   - Tests for any new components

**Files touched:**
- `src/hooks/use-ground-project.ts` (NEW)
- `src/hooks/use-ground-project.test.ts` (NEW)
- `src/app/project/page.tsx` (REPLACE)
- `src/components/project-status.tsx` (NEW, optional)
- `src/components/project-status.test.tsx` (NEW, optional)

**Dependencies:** None. Fully independent.

**Key implementation detail -- "create new project" flow:**
```typescript
async function createProject(name: string) {
  // Step 1: Deactivate current active project (if any)
  if (project) {
    await supabase
      .from('ground_projects')
      .update({ status: 'completed' })
      .eq('id', project.id)
  }
  
  // Step 2: Insert new project
  const { data, error } = await supabase
    .from('ground_projects')
    .insert({ user_id: userId, name, status: 'active' })
    .select()
    .single()
  
  if (data) setProject(data)
}
```

Note the unique constraint on `(user_id, name)` -- the UI should handle the case where user tries to create a project with an existing name. Show the error from Supabase.

### Builder 2: Weekly Signals Screen + Data Hook + Week Utilities

**Scope:**
1. `src/hooks/use-weekly-signals.ts` -- Custom hook:
   - Fetches current week's signal (`.eq('week_start', getWeekStart()).maybeSingle()`)
   - Fetches recent signals (`.order('week_start', { ascending: false }).limit(6)`)
   - `updateField(field, value)` -- updates local state (no auto-save for weekly)
   - `save()` -- upserts current week's signal (explicit, not debounced)
   - Returns `{ currentSignal, recentSignals, isLoading, isSaving, error, updateField, save }`

2. `src/hooks/use-weekly-signals.test.ts` -- Tests for the hook

3. `src/app/signals/page.tsx` -- Replace placeholder:
   - Auth wrapper pattern
   - Week header showing current week range
   - Three text fields (financial_note, sleep_state, note)
   - Save button
   - Recent signals list below
   - Follow layout pattern

4. New utility in `src/lib/dates.ts` -- Add `formatWeekRange(weekStart: string): string`:
   - Input: "2026-03-09" (Monday)
   - Output: "Mar 9 -- 15" (Monday to Sunday display)
   - Needed for both current week header and history entries

5. Additional test cases in `src/lib/dates.test.ts` for `formatWeekRange`

6. Sub-components:
   - `src/components/signal-entry.tsx` -- form for current week
   - `src/components/signal-history.tsx` -- list of past weeks
   - Tests for new components

**Files touched:**
- `src/hooks/use-weekly-signals.ts` (NEW)
- `src/hooks/use-weekly-signals.test.ts` (NEW)
- `src/app/signals/page.tsx` (REPLACE)
- `src/lib/dates.ts` (MODIFY -- add formatWeekRange)
- `src/lib/dates.test.ts` (MODIFY -- add formatWeekRange tests)
- `src/components/signal-entry.tsx` (NEW, optional)
- `src/components/signal-history.tsx` (NEW, optional)
- Tests for new components

**Dependencies:** None. Fully independent. `getWeekStart` already exists.

**Key implementation detail -- explicit save vs auto-save:**
The vision says signals are "opened once per week" with the interaction taking "under 2 minutes." This is deliberate, reflective writing -- not rapid checkbox toggling. An explicit save button is the right choice. It matches the weekly cadence: the user writes thoughtfully, reviews, then saves. Auto-save would feel noisy for this interaction.

**Key implementation detail -- upsert for idempotency:**
```typescript
const { error } = await supabase
  .from('weekly_signals')
  .upsert({
    user_id: userId,
    week_start: getWeekStart(),
    financial_note: currentSignal.financial_note,
    sleep_state: currentSignal.sleep_state,
    note: currentSignal.note,
  }, { onConflict: 'user_id,week_start' })
  .select()
  .single()
```

### Builder 3: Today Screen Enhancement + Tests + CI Polish

**Scope:**
1. `src/hooks/use-active-project-name.ts` -- Thin hook that fetches only the active project name:
   ```typescript
   // Minimal hook -- only fetches name, not full project
   const { data } = await supabase
     .from('ground_projects')
     .select('name')
     .eq('user_id', userId)
     .eq('status', 'active')
     .maybeSingle()
   ```
   Returns `{ projectName: string | null, isLoading: boolean }`

2. `src/hooks/use-active-project-name.test.ts` -- Tests

3. `src/app/page.tsx` -- Modify Today screen:
   - Import `useActiveProjectName`
   - In TodayContent, call `useActiveProjectName(userId)`
   - In the "ground" SectionGroup, add project name display above checkboxes:
     ```tsx
     <SectionGroup label="ground">
       {projectName && (
         <p className="text-sm text-warm-500">{projectName}</p>
       )}
       <div className="flex justify-around">
         {/* existing checkboxes */}
       </div>
     </SectionGroup>
     ```

4. **Component tests for new Builder 1 and Builder 2 components** (if those builders only wrote hook tests):
   - Page-level render tests for project/page.tsx
   - Page-level render tests for signals/page.tsx
   - Component tests for any sub-components

5. **Integration test coverage:**
   - Test that NoteField works with different onChange handlers
   - Test date-header rendering
   - Test section-group rendering (currently untested)

6. **CI polish:**
   - Verify `npm run build` succeeds with all new code
   - Verify `npm run lint` passes
   - Verify `npm run type-check` passes
   - Verify `npm run test:coverage` meets >= 70% threshold
   - Review `.github/workflows/ci.yml` -- currently functional, may need `npm audit` step added

**Files touched:**
- `src/hooks/use-active-project-name.ts` (NEW)
- `src/hooks/use-active-project-name.test.ts` (NEW)
- `src/app/page.tsx` (MODIFY -- add project name to ground section)
- `src/components/section-group.test.tsx` (NEW -- currently untested)
- `src/components/date-header.test.tsx` (NEW -- currently untested)
- `src/components/note-field.test.tsx` (NEW -- currently untested)
- `src/app/project/page.test.tsx` (NEW -- page-level tests)
- `src/app/signals/page.test.tsx` (NEW -- page-level tests)
- `.github/workflows/ci.yml` (MODIFY -- optional: add npm audit)

**Dependencies:** Runs after Builder 1 and Builder 2, or in parallel if using its own thin hook for project name (recommended approach).

## Risks & Challenges

### Technical Risks

**Risk 1: "Create new project" race condition**
- When creating a new project, two sequential operations occur: (1) deactivate current, (2) insert new. If the second fails, the user has no active project.
- **Mitigation:** Wrap in try/catch. If insert fails, re-activate the previous project. Alternatively, accept the edge case -- user can always create another project. Given single-user, single-device usage, this risk is negligible.

**Risk 2: Unique constraint on project name**
- Schema has `UNIQUE(user_id, name)` on ground_projects. If user tries to create a project with the same name as a previous one (even completed), it will fail.
- **Mitigation:** Show the Supabase error message. This is actually desirable -- it prevents confusion between projects. But the builder should handle the error gracefully in the UI.

**Risk 3: `formatWeekRange` locale sensitivity**
- Month abbreviations depend on locale. Tests should account for this or use a fixed-format approach.
- **Mitigation:** Use explicit month abbreviation array instead of `toLocaleDateString()`, or test with regex patterns like the existing `formatTime` tests do.

### Complexity Risks

None of the features in this iteration are complex enough to require sub-builder splits. All three builders have well-scoped, independent work.

## Recommendations for Planner

1. **Builder execution order does not matter.** All three builders can run in parallel. Builder 3's Today screen enhancement uses its own thin `useActiveProjectName` hook, so it does not depend on Builder 1's `useGroundProject` being complete. The only sequencing concern is that Builder 3 may want to write page-level tests for Builder 1 and Builder 2's pages, which means Builder 3 should run last or have a "test pass" that runs after the other builders merge.

2. **Signals screen should use explicit save, not auto-save.** The weekly cadence is deliberate. A save button with green styling (matching login button) feels intentional and calm. Auto-save would create anxiety about "did it save?" for a weekly reflection. The save button provides clear feedback.

3. **Project name editing should use the existing `useDebouncedSave` hook.** The hook was built generically in Iteration 1 precisely for this reuse. Project name editing is a natural fit: user types, debounce saves, visibility-change flushes.

4. **Builder 3 should be the "integration builder."** Assign it responsibility for: (a) Today screen enhancement, (b) filling test gaps from Iteration 1 (section-group, date-header, note-field have no tests), (c) writing page-level tests for the new screens, (d) verifying CI pipeline works end-to-end. This makes Builder 3 the quality gate.

5. **Do not over-componentize the Project screen.** It is a simple single-project display. One page component with the hook is likely sufficient. Extracting sub-components adds file overhead without benefit for such a simple screen. Let the builder decide based on actual line count.

6. **Keep signal history minimal.** Show 4 weeks maximum. Each entry should be a compact display: week range + first ~60 chars of any filled field. No expand/collapse, no detail view. Simplicity is a feature.

7. **Add `formatWeekRange` to `dates.ts` (Builder 2's responsibility).** This utility is needed for both the current-week header and history display. It belongs in the shared dates module alongside `getWeekStart`.

8. **No new screen needed for "create project" flow.** It should be inline on the Project page: show an input field when user taps "new project", confirm creates it. No modal, no separate route. Keeping it on-page matches the calm, single-screen philosophy.

## Resource Map

### Critical Files for Builders to Read First
- `/home/ahiya/Selah/selah-os/src/app/page.tsx` -- Today screen (canonical page pattern)
- `/home/ahiya/Selah/selah-os/src/hooks/use-daily-record.ts` -- Canonical data hook pattern
- `/home/ahiya/Selah/selah-os/src/hooks/use-daily-record.test.ts` -- Canonical test mocking pattern
- `/home/ahiya/Selah/selah-os/src/lib/types.ts` -- All Database types (ground_projects, weekly_signals already defined)
- `/home/ahiya/Selah/selah-os/src/lib/dates.ts` -- `getWeekStart()` already implemented
- `/home/ahiya/Selah/selah-os/src/hooks/use-debounced-save.ts` -- Reusable debounce hook
- `/home/ahiya/Selah/selah-os/src/components/section-group.tsx` -- Reusable section wrapper
- `/home/ahiya/Selah/selah-os/src/components/note-field.tsx` -- Reusable textarea component
- `/home/ahiya/Selah/selah-os/supabase/migrations/001_initial_schema.sql` -- Schema reference (constraints, indexes, status enum)

### Files to Replace (Placeholders)
- `/home/ahiya/Selah/selah-os/src/app/project/page.tsx` -- Builder 1 replaces entirely
- `/home/ahiya/Selah/selah-os/src/app/signals/page.tsx` -- Builder 2 replaces entirely

### Files to Modify
- `/home/ahiya/Selah/selah-os/src/app/page.tsx` -- Builder 3 adds project name
- `/home/ahiya/Selah/selah-os/src/lib/dates.ts` -- Builder 2 adds `formatWeekRange`
- `/home/ahiya/Selah/selah-os/src/lib/dates.test.ts` -- Builder 2 adds tests

### Files to Create
- `/home/ahiya/Selah/selah-os/src/hooks/use-ground-project.ts` -- Builder 1
- `/home/ahiya/Selah/selah-os/src/hooks/use-ground-project.test.ts` -- Builder 1
- `/home/ahiya/Selah/selah-os/src/hooks/use-weekly-signals.ts` -- Builder 2
- `/home/ahiya/Selah/selah-os/src/hooks/use-weekly-signals.test.ts` -- Builder 2
- `/home/ahiya/Selah/selah-os/src/hooks/use-active-project-name.ts` -- Builder 3
- `/home/ahiya/Selah/selah-os/src/hooks/use-active-project-name.test.ts` -- Builder 3

### Key Configuration
- `/home/ahiya/Selah/selah-os/package.json` -- No changes needed
- `/home/ahiya/Selah/selah-os/vitest.config.ts` -- No changes needed
- `/home/ahiya/Selah/selah-os/tsconfig.json` -- No changes needed
- `/home/ahiya/Selah/selah-os/.github/workflows/ci.yml` -- Optional: add `npm audit` step

## Questions for Planner

1. **Test coverage target:** The master plan says >= 70%. Current test count is 82 across 9 files. Should Builder 3 run `vitest --coverage` and verify the threshold, or should we add a coverage threshold to the vitest config so CI enforces it automatically?

2. **Builder 3 timing:** Should Builder 3 wait for Builders 1 and 2 to complete (so it can write page-level tests for their output), or should it run in parallel and only test its own additions? Running in parallel is faster but means page-level tests for project/signals would need a separate pass.

3. **Vercel deployment:** The master plan scope includes "Production deployment to Vercel" and "Vercel environment variables configuration." Is this something the planner will handle post-build, or should one of the builders be responsible? It requires Supabase credentials which are not in the codebase.

4. **Mobile responsive polish and accessibility audit:** The master plan lists these in scope. Should Builder 3 handle these, or should they be a separate post-build verification step? They are more about review than implementation, since the existing design already follows mobile-first patterns (56px tap targets, system fonts, no iOS zoom issues).
