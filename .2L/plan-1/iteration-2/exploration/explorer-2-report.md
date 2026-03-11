# Explorer 2 Report: Testing Strategy + Production Deployment

## Executive Summary

Iteration 1 established strong, well-structured testing patterns with 82 tests achieving 92.98% branch coverage across hooks, components, utility functions, and a page-level test. Iteration 2 should follow these exact patterns for the new `useGroundProject` and `useWeeklySignals` hooks, the Project and Signals page components, and the Today screen enhancement. Production deployment is straightforward: Vercel auto-deploys from GitHub, Supabase Cloud hosts the database, and the CI pipeline already covers lint, type-check, test, and build gates.

## Discoveries

### Existing Test Inventory

The codebase has 9 test files with 82 total tests:

| File | Tests | Coverage | What It Tests |
|------|-------|----------|---------------|
| `src/lib/dates.test.ts` | 15 | 100% stmts, 87.5% branch | `getEffectiveDate`, `formatDateString`, `formatDisplayDate`, `formatTime`, `getWeekStart` |
| `src/lib/constants.test.ts` | 2 | 100% | `DAY_BOUNDARY_HOUR` constant |
| `src/lib/types.test.ts` | 5 | N/A (type-level) | TypeScript type structure validation for all 3 tables |
| `src/hooks/use-daily-record.test.ts` | 22 | 97.14% stmts | Fetch, optimistic update, debounce, flush, visibility change, sleep toggle, error, cleanup |
| `src/hooks/use-debounced-save.test.ts` | 7 | 96% stmts | Schedule, debounce, flush, visibility flush, custom delay |
| `src/components/anchor-checkbox.test.tsx` | 9 | 100% | Render, onChange, checked/unchecked states, tap target, icon, label association |
| `src/components/sleep-button.test.tsx` | 8 | 100% | Render, timestamp display, onClick, button semantics, tap target, styles |
| `src/components/nav.test.tsx` | 4 | 100% | Links, hrefs, aria-label, active state |
| `src/app/login/login.test.tsx` | 5 | 100% | Form render, email input, success/error messages, retry clearing |

### Established Testing Conventions

1. **Test file location:** Co-located with source, same directory, `.test.ts` or `.test.tsx` extension
2. **Imports:** Always `import { describe, it, expect, vi } from 'vitest'` plus testing-library as needed
3. **Supabase mocking pattern:** Module-level `vi.mock('@/lib/supabase/client', ...)` with chained method mocks
4. **Next.js mocking:** `vi.mock('next/navigation', ...)` and `vi.mock('next/link', ...)` for navigation
5. **Date mocking:** Either `vi.useFakeTimers()` + `vi.setSystemTime()` or `vi.mock('@/lib/dates', ...)`
6. **Cleanup:** `beforeEach(() => vi.clearAllMocks())` and `afterEach(() => vi.useRealTimers())`
7. **Hook testing:** `renderHook` + `act` + `waitFor` from `@testing-library/react`
8. **Component testing:** `render` + `screen` + `fireEvent` from `@testing-library/react`
9. **No `describe.each` or `test.each`:** All tests are individual `it()` blocks
10. **Assertion style:** Direct `.toBe()`, `.toBeInTheDocument()`, `.toHaveAttribute()`, `.toHaveClass()` -- no snapshots

### Coverage Metrics (Current)

```
All files:          97.84% stmts | 92.98% branch | 97.43% funcs | 98.47% lines
```

The target for Iteration 2 is >= 70% coverage. The existing codebase significantly exceeds this. New code should maintain at least the same standard.

### Files Not Yet Tested

These existing files have no dedicated test file:
- `src/components/date-header.tsx` -- client component with `useEffect`, testable
- `src/components/note-field.tsx` -- simple controlled textarea, testable
- `src/components/section-group.tsx` -- pure presentational, simple test
- `src/app/page.tsx` (Today page) -- page-level integration test, more complex
- `src/lib/supabase/client.ts` -- factory function, tested indirectly via mocks
- `src/lib/supabase/server.ts` -- server-side, hard to unit test (cookies dependency)
- `src/lib/supabase/middleware.ts` -- middleware, hard to unit test (request/response)
- `src/app/auth/callback/route.ts` -- API route, hard to unit test

The untested components are low-risk. The middleware and server files are tested implicitly through integration. New Iteration 2 code should have dedicated tests.

## Patterns Identified

### Pattern 1: Supabase Client Mock (Chained Query Builder)

**Description:** The Supabase client is mocked at the module level with chained method mocks that mirror the query builder pattern (`.from().select().eq().maybeSingle()`).

**Use Case:** All hook tests and page tests that interact with Supabase.

**Example (from `use-daily-record.test.ts`):**
```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect })

function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  return vi.fn().mockReturnValue(chain)
}

const mockFrom = createFromMock()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
}))
```

**Recommendation:** Builders MUST use this exact pattern for `useGroundProject` and `useWeeklySignals` hook tests. The chain shape will differ slightly:

- **useGroundProject** needs: `.from('ground_projects').select('*').eq('user_id', ...).eq('status', 'active').maybeSingle()` for fetching, plus `.update()` and `.insert()` for mutations
- **useWeeklySignals** needs: `.from('weekly_signals').select('*').eq('user_id', ...).order('week_start', { ascending: false }).limit(6)` for listing, plus `.upsert()` for create/update

### Pattern 2: Hook Testing (Optimistic Update + Debounced Save)

**Description:** Hooks are tested with `renderHook`, state changes via `act`, and async operations via `waitFor`. The debounce is tested by triggering visibility change (not timer advancement).

**Use Case:** `useGroundProject` and `useWeeklySignals` hooks.

**Example (established pattern):**
```typescript
it('updates field optimistically', () => {
  const { result } = renderHook(() => useDailyRecord('user-123'))
  act(() => {
    result.current.updateField('breakfast', true)
  })
  expect(result.current.record.breakfast).toBe(true)
})

it('debounced save calls upsert via flush', async () => {
  const { result } = renderHook(() => useDailyRecord('user-123'))
  await waitFor(() => { expect(result.current.isLoading).toBe(false) })
  act(() => { result.current.updateField('breakfast', true) })
  // Flush via visibility change
  await act(async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await waitFor(() => { expect(mockUpsert).toHaveBeenCalled() })
})
```

**Recommendation:** Follow this exact approach. The `useGroundProject` hook may not need debounced save (project edits are less frequent, could use immediate save), but `useWeeklySignals` should use the same debounce pattern for text fields.

### Pattern 3: Component Testing (Render + Interact + Assert)

**Description:** Components are rendered with explicit props, user interactions simulated with `fireEvent`, and assertions made against `screen` queries and CSS classes.

**Use Case:** All new components in Iteration 2.

**Example (established pattern):**
```typescript
it('renders with label', () => {
  render(<AnchorCheckbox id="test" label="breakfast" checked={false} onChange={() => {}} />)
  expect(screen.getByText('breakfast')).toBeInTheDocument()
})

it('has a minimum tap target size', () => {
  const { container } = render(<AnchorCheckbox ... />)
  const label = container.querySelector('label')
  expect(label).toHaveClass('min-w-[56px]')
  expect(label).toHaveClass('min-h-[56px]')
})
```

**Recommendation:** New components (project status display, signal form fields, etc.) should follow this pattern. Always test: render, interaction, accessibility attributes, tap target sizes (56px minimum).

### Pattern 4: Page-Level Testing (Mock Dependencies, Test User Flow)

**Description:** Pages are tested by mocking their Supabase client dependency and testing the user-visible flow.

**Use Case:** Project page and Signals page tests.

**Example (from `login.test.tsx`):**
```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOtp: mockSignInWithOtp },
  }),
}))

it('shows success message after successful magic link send', async () => {
  mockSignInWithOtp.mockResolvedValueOnce({ error: null })
  render(<LoginPage />)
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
  fireEvent.click(screen.getByText('Send magic link'))
  await waitFor(() => {
    expect(screen.getByText('Check your email for the login link.')).toBeInTheDocument()
  })
})
```

**Recommendation:** The Project and Signals pages should have similar page-level tests that mock the Supabase client, render the page, and verify the full user flow including loading state, data display, and form interactions.

## Test Plan for Iteration 2

### Test File: `src/hooks/use-ground-project.test.ts`

The `useGroundProject` hook manages fetching and mutating the active ground project. Tests needed:

**Fetch behavior (5 tests):**
1. Starts with `isLoading: true`
2. Fetches active project on mount (queries `ground_projects` where `status = 'active'`)
3. Populates project data when fetch returns a result
4. Sets `project` to `null` when no active project exists
5. Sets error on fetch failure

**Mutation behavior (6 tests):**
6. `updateName` updates the project name optimistically
7. `updateName` calls Supabase `.update()` with the new name
8. `toggleStatus` switches between 'active' and 'paused'
9. `toggleStatus` calls Supabase `.update()` with new status
10. `createProject` creates a new project with 'active' status
11. `createProject` deactivates the previous active project first (sets old project to 'completed' or 'paused' before inserting new one)

**Error handling (2 tests):**
12. Sets error when update fails
13. Sets error when create fails

**Edge cases (2 tests):**
14. Creating a project when none exists works without deactivation step
15. Name update with empty string is rejected or handled

**Mock shape for ground_projects:**
```typescript
// Fetch chain: .from('ground_projects').select('*').eq('user_id', ...).eq('status', 'active').maybeSingle()
// Update chain: .from('ground_projects').update({...}).eq('id', ...).select().single()
// Insert chain: .from('ground_projects').insert({...}).select().single()
const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  update: mockUpdate,
  insert: mockInsert,
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
}
```

### Test File: `src/hooks/use-weekly-signals.test.ts`

The `useWeeklySignals` hook manages the current week's signal entry and recent signal history. Tests needed:

**Fetch behavior (5 tests):**
1. Starts with `isLoading: true`
2. Fetches current week's signal on mount (queries where `week_start = getWeekStart()`)
3. Fetches recent signals list (last 4-6 weeks, ordered by `week_start` descending)
4. Populates current signal when data exists
5. Sets error on fetch failure

**Mutation behavior (4 tests):**
6. `updateField` updates field optimistically (financial_note, sleep_state, note)
7. `updateField` triggers debounced upsert (same pattern as `useDailyRecord`)
8. Flush on visibility change sends pending updates
9. Upsert payload includes `user_id` and `week_start` for conflict resolution

**Edge cases (3 tests):**
10. Creating a new signal for a week with no existing entry
11. Multiple field updates batch into a single upsert
12. Cleanup on unmount clears debounce timer

**Mock shape for weekly_signals (note the `getWeekStart` mock):**
```typescript
vi.mock('@/lib/dates', () => ({
  getWeekStart: () => '2026-03-09',  // Monday of test week
  formatDateString: (d: Date) => d.toISOString().slice(0, 10),
}))
```

### Test File: `src/app/project/project.test.tsx`

Page-level test for the Project screen. Tests needed:

**Rendering (4 tests):**
1. Shows loading state initially
2. Displays project name, status, and start date when project exists
3. Shows empty state message when no active project exists
4. Displays error message when fetch fails

**Interaction (4 tests):**
5. Editing project name updates the display
6. Toggling status between active/paused updates the display
7. "New project" flow creates a new project
8. Creating a new project shows it as active

**Accessibility (2 tests):**
9. Form inputs have proper labels
10. Status indicator is screen-reader accessible

### Test File: `src/app/signals/signals.test.tsx`

Page-level test for the Signals screen. Tests needed:

**Rendering (4 tests):**
1. Shows current week indicator
2. Displays form fields for financial note, sleep state, weekly note
3. Shows recent signals list with previous weeks
4. Shows empty state when no signals exist

**Interaction (3 tests):**
5. Typing in financial note field auto-saves
6. Typing in sleep state field auto-saves
7. Typing in weekly note field auto-saves

**Accessibility (2 tests):**
8. All text inputs have visible labels
9. Recent signals list is semantically structured

### Test File: Today Screen Enhancement Test

The Today screen needs to display the active ground project name in the ground section. This can be tested by:

**In existing `page.tsx` test (create `src/app/today.test.tsx`):**
1. Ground section displays project name when an active project exists
2. Ground section shows default text when no active project exists

This requires the Today page to call `useGroundProject` (or a lighter query) to fetch just the project name. The mock needs to include both `daily_records` and `ground_projects` table responses.

### Test Summary Table

| Test File | Est. Tests | Priority |
|-----------|-----------|----------|
| `src/hooks/use-ground-project.test.ts` | ~15 | HIGH |
| `src/hooks/use-weekly-signals.test.ts` | ~12 | HIGH |
| `src/app/project/project.test.tsx` | ~10 | HIGH |
| `src/app/signals/signals.test.tsx` | ~9 | HIGH |
| `src/app/today.test.tsx` (enhancement) | ~2 | MEDIUM |

**Estimated total new tests: ~48**
**Post-iteration total: ~130 tests**

## Code Patterns from Existing Codebase

### Data Hook Pattern (Reference: `use-daily-record.ts`)

All new data hooks MUST follow this structure:

```typescript
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types'

type RowType = Database['public']['Tables']['TABLE_NAME']['Row']

export function useHookName(userId: string) {
  const supabase = createClient()
  const [data, setData] = useState<RowType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('TABLE_NAME')
        .select('*')
        .eq('user_id', userId)
        // ... additional filters
        .maybeSingle()

      if (error) setError(error.message)
      else if (data) setData(data)
      setIsLoading(false)
    }
    load()
  }, [userId])

  // 2. Mutation functions
  // 3. Debounced save (if needed)
  // 4. Cleanup

  return { data, isLoading, error, /* mutation functions */ }
}
```

### Available Utilities (Already Built)

Builders should use these, NOT re-implement them:

| Utility | Location | What It Does |
|---------|----------|--------------|
| `getEffectiveDate()` | `src/lib/dates.ts` | Returns YYYY-MM-DD with 4 AM day boundary |
| `getWeekStart()` | `src/lib/dates.ts` | Returns Monday of current week as YYYY-MM-DD |
| `formatDateString()` | `src/lib/dates.ts` | Formats Date object as YYYY-MM-DD |
| `formatDisplayDate()` | `src/lib/dates.ts` | Formats YYYY-MM-DD as "Thursday, March 12" |
| `formatTime()` | `src/lib/dates.ts` | Formats ISO timestamp as "HH:MM" |
| `DAY_BOUNDARY_HOUR` | `src/lib/constants.ts` | Value: 4 |
| `createClient()` | `src/lib/supabase/client.ts` | Browser Supabase client |
| `createClient()` | `src/lib/supabase/server.ts` | Server Supabase client |
| `useDebouncedSave()` | `src/hooks/use-debounced-save.ts` | Generic debounce hook |

### Available Types (from `src/lib/types.ts`)

```typescript
// Ground Projects
Database['public']['Tables']['ground_projects']['Row']
// { id, user_id, name, status, start_date, created_at, updated_at }

Database['public']['Tables']['ground_projects']['Insert']
// { user_id (req), name (req), status?, start_date?, id?, created_at?, updated_at? }

// Weekly Signals
Database['public']['Tables']['weekly_signals']['Row']
// { id, user_id, week_start, financial_note, sleep_state, note, created_at, updated_at }

Database['public']['Tables']['weekly_signals']['Insert']
// { user_id (req), week_start (req), financial_note?, sleep_state?, note?, id?, created_at?, updated_at? }
```

### Database Constraints Builders Must Respect

From `001_initial_schema.sql`:

- `ground_projects.status` CHECK constraint: must be one of `'active'`, `'paused'`, `'completed'`, `'dropped'`
- `ground_projects` unique on `(user_id, name)` -- cannot have two projects with the same name
- `weekly_signals` unique on `(user_id, week_start)` -- enables idempotent upsert
- No DELETE policies on any table -- data is append-only / update-only
- `updated_at` is auto-set by trigger on UPDATE -- do not include in upsert payloads

### Reusable Components for New Screens

Existing components that should be reused:

| Component | Props | Use In |
|-----------|-------|--------|
| `SectionGroup` | `{ label, children }` | Both new screens for section grouping |
| `NoteField` | `{ value, onChange }` | Signals screen for all 3 text fields |
| `DateHeader` | none (uses `getEffectiveDate`) | Not needed for new screens, but pattern is useful |

New screens should NOT need new shared components. They can use native HTML elements (`<input>`, `<button>`, `<textarea>`) styled with Tailwind, consistent with the existing aesthetic.

## Production Deployment Checklist

### 1. Supabase Cloud Project Setup

The database schema migration (`supabase/migrations/001_initial_schema.sql`) already defines all 3 tables, RLS policies, indexes, and triggers. Steps:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
   - Choose region closest to user (likely EU West or similar for Israel timezone)
   - Free tier is sufficient for single-user
2. **Run the schema migration** via Supabase SQL Editor:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Execute in the SQL Editor
   - Verify all 3 tables appear under Table Editor
3. **Configure Auth:**
   - Enable Email provider (magic link)
   - Disable email confirmations for magic link (or keep enabled for security)
   - Set site URL to the Vercel deployment URL
   - Add redirect URLs: `https://<your-domain>/auth/callback`
4. **Get API keys:**
   - Project URL: `https://<project-ref>.supabase.co`
   - Anon key: from Settings > API

### 2. Vercel Deployment

1. **Connect GitHub repo** to Vercel
   - Import the `selah-os` repository
   - Framework detection: Next.js (auto-detected)
   - Build command: `npm run build` (default)
   - Output directory: `.next` (default)
2. **Set environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon-key-from-supabase>`
   - These are safe to expose (RLS enforces security, anon key is public by design)
3. **Deploy:**
   - Push to `main` branch triggers auto-deploy
   - Verify the build succeeds (CI must pass first)
4. **Verify post-deploy:**
   - Visit the Vercel URL
   - Verify redirect to `/login`
   - Send a magic link and complete login
   - Verify Today screen loads and persists data

### 3. Domain Setup (Optional)

If deploying to `selah.im/os` or a custom domain:

1. Add domain in Vercel project settings
2. Configure DNS (CNAME or A record) as instructed by Vercel
3. Update Supabase Auth redirect URLs to include the custom domain
4. SSL is automatic with Vercel

### 4. Environment Variables Summary

| Variable | Where | Value |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel dashboard | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel dashboard | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` (dev) | Same or local Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` (dev) | Same or local Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub Actions CI | `http://localhost:54321` (build only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub Actions CI | `placeholder-for-ci-build` (build only) |

**NEVER add to env or source control:**
- `SUPABASE_SERVICE_ROLE_KEY` -- bypasses RLS, admin-only
- Any secret that starts without `NEXT_PUBLIC_` prefix must not be in client code

### 5. CI Pipeline Verification

The existing `.github/workflows/ci.yml` already has 3 jobs:

1. **quality:** TypeScript check + ESLint
2. **test:** `vitest run --coverage` with artifact upload
3. **build:** `next build` with placeholder env vars

This is sufficient. No changes needed for Iteration 2 unless we want to add:
- Coverage threshold enforcement (optional: add `--coverage.thresholds.branches=70` to vitest)
- `npm audit` step (suggested in master plan but not critical for single-user app)

**Suggested CI enhancement (optional):**
```yaml
- name: Security audit
  run: npm audit --production --audit-level=high
  continue-on-error: true  # Don't block on advisory-level issues
```

### 6. Post-Deployment Security Checklist

- [ ] RLS enabled on all 3 tables (verified in schema: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] No DELETE policies (intentional: data protection)
- [ ] No service role key in client code or env
- [ ] Auth redirect URL matches deployment domain exactly
- [ ] `getUser()` used in middleware (not `getSession()`) for JWT validation
- [ ] No exposed API routes beyond `/auth/callback`
- [ ] `@supabase/ssr` pinned to exact version `0.9.0` (prevents breaking changes)

## Accessibility Audit Checklist

### WCAG 2.1 AA Requirements for SelahOS

**Color Contrast (1.4.3):**
- [ ] Text on `bg-warm-100` body: `text-warm-700` (#524840 on #F5F3F0) -- verify >= 4.5:1 ratio
- [ ] Text on `bg-warm-50` inputs: `text-warm-800` (#3D3632 on #FAF8F5) -- verify >= 4.5:1 ratio
- [ ] `text-warm-500` labels (#8C8279 on #F5F3F0) -- this is the riskiest for AA compliance, verify
- [ ] `text-green-600` active nav (#6B8F71 on #E8E4DF) -- verify >= 4.5:1 ratio
- [ ] White text on `bg-green-600` button (#FAF8F5 on #6B8F71) -- verify >= 4.5:1 ratio
- [ ] Error color `text-error` (#B85C5C on #F5F3F0) -- verify >= 4.5:1 ratio

**Keyboard Navigation (2.1.1):**
- [ ] All checkboxes focusable via Tab key
- [ ] All buttons activatable via Enter/Space
- [ ] All text inputs focusable via Tab
- [ ] Focus order matches visual order (top to bottom, left to right)
- [ ] Focus ring visible on all interactive elements (check `peer-checked` states)

**Focus Visible (2.4.7):**
- [ ] Checkboxes show focus ring (currently using `sr-only` for the actual input -- the visual checkbox span may not show focus)
- [ ] Buttons show focus ring on keyboard focus
- [ ] Text inputs show focus ring

**Labels (1.3.1, 4.1.2):**
- [ ] All form inputs have associated labels (verified: `htmlFor` + `id` on AnchorCheckbox)
- [ ] All sections have headings (verified: `SectionGroup` uses `<h2>`)
- [ ] Navigation has `aria-label` (verified: "Main navigation")
- [ ] Error messages use `role="alert"` (verified on Today page)

**Specific Concerns for New Screens:**

**Project Screen:**
- [ ] Project name input must have a visible `<label>` or `aria-label`
- [ ] Status toggle (active/paused) must be keyboard accessible
- [ ] If using a custom toggle, ensure `role="switch"` or use native `<select>`
- [ ] "New project" action must be a `<button>`, not a styled `<div>`

**Signals Screen:**
- [ ] All 3 text fields (financial_note, sleep_state, note) must have visible labels
- [ ] Week indicator should use semantic heading (`<h1>` or `<h2>`)
- [ ] Recent signals list should use `<ul>` / `<li>` or `<dl>` for semantic structure
- [ ] Each signal entry in the list should be distinguishable by week label

**Today Screen Enhancement:**
- [ ] Project name display in ground section should be readable by screen readers
- [ ] If the project name is a link to `/project`, it must have descriptive link text

### Known Risk: `sr-only` Checkbox Pattern

The `AnchorCheckbox` hides the native `<input>` with `sr-only` and renders a visual `<span>`. This works for screen readers (the input is still in the DOM), but the visual focus indicator may be missing when navigating by keyboard. The existing test checks for `min-w-[56px]` and `min-h-[56px]` but does not test focus visibility.

**Recommendation:** Add a CSS rule for focus-visible on the label when the sr-only input is focused:
```css
.peer:focus-visible ~ span {
  outline: 2px solid var(--color-green-600);
  outline-offset: 2px;
}
```

Or add the Tailwind class `peer-focus-visible:ring-2 peer-focus-visible:ring-green-600` to the visual span.

## Complexity Assessment

### High Complexity Areas

- **`useGroundProject` hook:** Medium-high. More mutation operations than `useDailyRecord` (update name, toggle status, create new + deactivate old). The "create new project deactivates previous" logic requires two sequential Supabase calls (update old, insert new), which needs careful error handling. Estimated: 15 tests, ~1 hour.

- **Signals page with recent history:** Medium-high. The page combines a form (current week) with a read-only list (past weeks). The `useWeeklySignals` hook needs to manage two data states (current entry + list). The form uses debounced auto-save like the Today screen. Estimated: 12 hook tests + 9 page tests, ~1.5 hours.

### Medium Complexity Areas

- **Project page UI:** Medium. Simple form with name input, status display, and "new project" action. Uses existing SectionGroup and NoteField patterns. Estimated: 10 page tests, ~45 minutes.

- **Today screen enhancement:** Low-medium. Requires fetching the active project name and displaying it. Could be a simple query inside the existing `useDailyRecord` or a separate lightweight fetch. Estimated: 2 tests, ~15 minutes.

### Low Complexity Areas

- **Production deployment:** Low. Standard Vercel + Supabase setup. The CI pipeline is already in place. Estimated: ~30 minutes manual work.

- **Accessibility fixes:** Low. Mostly adding focus styles and verifying contrast ratios. Estimated: ~30 minutes.

## Technology Recommendations

### Testing Stack (Already Established -- No Changes)

- **Test Runner:** Vitest 4.x (already configured)
- **DOM Environment:** jsdom 28.x (already configured)
- **Component Testing:** @testing-library/react 16.x (already configured)
- **Assertions:** @testing-library/jest-dom for DOM matchers (already configured)
- **Coverage:** @vitest/coverage-v8 (already configured)
- **Mocking:** Vitest built-in `vi.mock`, `vi.fn` (already used throughout)

No new testing dependencies are needed.

### Deployment Stack (Already Decided)

- **Hosting:** Vercel (auto-deploy from GitHub)
- **Database/Auth:** Supabase Cloud (free tier)
- **CI:** GitHub Actions (already configured)

### Optional Addition: Coverage Threshold

Add to `vitest.config.ts` to enforce the 70% minimum:

```typescript
export default defineConfig({
  test: {
    // ... existing config
    coverage: {
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
})
```

This would cause CI to fail if coverage drops below 70%.

## Integration Points

### Internal Integrations

- **Today Page <-> useGroundProject:** The Today page's ground section needs to display the active project name. This creates a dependency: the Today page must either (a) call `useGroundProject` directly or (b) make a lightweight query for just the project name. Option (a) is simpler and reuses the hook.

- **useGroundProject <-> Project Page:** The Project page is the primary consumer of `useGroundProject`. The hook must expose: `project` (current data), `isLoading`, `error`, `updateName(name)`, `toggleStatus()`, `createProject(name)`.

- **useWeeklySignals <-> Signals Page:** The Signals page is the primary consumer. The hook must expose: `currentSignal` (this week), `recentSignals` (list), `isLoading`, `error`, `updateField(field, value)`.

- **getWeekStart <-> useWeeklySignals:** The hook uses `getWeekStart()` from `src/lib/dates.ts` to determine the current week. This utility is already implemented and tested.

### Builder Coordination Points

- **Builder doing Project hook + page** is independent of **Builder doing Signals hook + page**.
- **Builder doing Today enhancement** depends on `useGroundProject` being available (or at least its interface being defined).
- **Builder doing deployment** is independent but should run after tests are written.

## Risks & Challenges

### Technical Risks

- **Supabase mock chain complexity for ground_projects:** The create-new-project flow requires updating the old project and inserting the new one. The mock chain needs to handle `.update().eq().select().single()` AND `.insert().select().single()` in the same test. Mitigation: carefully structure the mock in `beforeEach` with separate mock functions for update vs insert.

- **Contrast ratio failures on warm-500 text:** The `text-warm-500` (#8C8279) on `bg-warm-100` (#F5F3F0) may fail WCAG AA 4.5:1 contrast. Calculated ratio is approximately 3.2:1 (fails). Mitigation: use `text-warm-600` (#6B6158) for label text, which should pass at ~5.1:1.

### Complexity Risks

- **Weekly signals list pagination:** The master plan says "last 4-6 weeks, reverse chronological." This is a simple `.limit(6).order('week_start', { ascending: false })` query. No pagination needed. Low risk.

- **Ground project "only one active" constraint:** This is enforced at the application level (deactivate old before creating new), not at the database level. If the hook has a bug, two active projects could exist. Mitigation: the query always fetches `.eq('status', 'active').maybeSingle()` which returns only one result regardless.

## Recommendations for Planner

1. **Split builders by feature, not by layer.** Each builder should own both the hook and the page for their feature. Builder A: Project hook + Project page. Builder B: Signals hook + Signals page. Builder C: Today enhancement + deployment + accessibility. This minimizes coordination overhead.

2. **Tests should be written alongside implementation, not after.** Each builder writes tests for their own feature. The established patterns are clear enough that test-first or test-alongside is practical. Do not create a separate "testing builder."

3. **Coverage threshold enforcement is optional but recommended.** Adding `thresholds: { branches: 70 }` to `vitest.config.ts` prevents regression. Current coverage is 93% so there is significant headroom.

4. **Address the contrast ratio concern proactively.** Change `text-warm-500` to `text-warm-600` in `SectionGroup` labels and `AnchorCheckbox` labels. This is a single CSS class change in two files and ensures AA compliance.

5. **Deployment should happen last, after all features and tests pass.** Vercel deployment is a 15-minute task once the Supabase cloud project is configured. It should be the final step of Iteration 2.

6. **Do not add new dependencies.** The existing stack is complete. No new npm packages are needed for Iteration 2. Resist the urge to add form libraries, state management, or animation packages.

7. **The `useDebouncedSave` hook should be reused in `useWeeklySignals`.** It already handles debounce, flush, visibility change, and cleanup. The Signals hook should compose it rather than re-implementing debounce logic.

## Resource Map

### Critical Files for Iteration 2 Builders

| Path | Purpose | Builder Reference |
|------|---------|-------------------|
| `src/hooks/use-daily-record.ts` | Reference pattern for all data hooks | All builders |
| `src/hooks/use-daily-record.test.ts` | Reference pattern for all hook tests | All builders |
| `src/hooks/use-debounced-save.ts` | Reusable debounce hook | Signals builder |
| `src/lib/types.ts` | TypeScript types for all 3 tables | All builders |
| `src/lib/dates.ts` | Date utilities including `getWeekStart()` | Signals builder |
| `src/lib/supabase/client.ts` | Browser Supabase client factory | All builders |
| `src/components/section-group.tsx` | Reusable section wrapper | All screen builders |
| `src/components/note-field.tsx` | Reusable textarea component | Signals builder |
| `src/components/anchor-checkbox.test.tsx` | Reference pattern for component tests | All builders |
| `src/app/login/login.test.tsx` | Reference pattern for page tests | Project + Signals builders |
| `src/app/page.tsx` | Today page (needs enhancement) | Today enhancement builder |
| `src/app/project/page.tsx` | Placeholder to be replaced | Project builder |
| `src/app/signals/page.tsx` | Placeholder to be replaced | Signals builder |
| `src/app/globals.css` | Design system (warm palette + green accents) | All builders |
| `supabase/migrations/001_initial_schema.sql` | Database schema (constraints, RLS) | All builders |
| `.github/workflows/ci.yml` | CI pipeline configuration | Deployment builder |
| `.env.local.example` | Environment variable template | Deployment builder |
| `vitest.config.ts` | Test runner configuration | All builders |
| `src/test/setup.ts` | Test setup (jest-dom matchers) | All builders |

### Key Dependencies (No Changes Needed)

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.0.18 | Test runner |
| `@testing-library/react` | ^16.3.2 | Component testing |
| `@testing-library/jest-dom` | ^6.9.1 | DOM assertions |
| `@vitest/coverage-v8` | ^4.0.18 | Coverage reporting |
| `jsdom` | ^28.1.0 | DOM environment for tests |
| `next` | 15.5.12 | Framework |
| `@supabase/ssr` | 0.9.0 (pinned) | Auth/database client |
| `@supabase/supabase-js` | ^2.99.1 | Supabase core |

## Questions for Planner

1. **Should `useGroundProject` use immediate save (like sleep timestamps) or debounced save (like checkboxes)?** Project mutations (name edit, status toggle) are infrequent. Immediate save is simpler and avoids data loss if the user navigates away. Debounced save adds complexity without clear benefit here. Recommendation: immediate save for all project mutations.

2. **Should the Signals page auto-save all fields or have a "Save" button?** The master plan says "Save/auto-save signal entry." The Today screen uses auto-save exclusively (no buttons). For consistency and the "usable half-asleep" principle, auto-save via debounce is recommended. A visible "saved" indicator (subtle text) could provide reassurance without adding a button.

3. **How should the Today screen fetch the project name?** Two options: (a) Import and call `useGroundProject` in the Today page, which fetches the full project. (b) Make a lightweight inline query that only fetches the name. Option (a) is simpler and the data is tiny. Recommendation: use `useGroundProject` directly.

4. **Should coverage thresholds be enforced in CI?** The master plan targets >= 70%. Current coverage is ~93%. Adding thresholds to `vitest.config.ts` would prevent regression. Recommendation: yes, add thresholds.

5. **Should the accessibility contrast fix (`text-warm-500` to `text-warm-600`) be part of a specific builder's scope or a separate task?** It is a 2-line change. Recommendation: include it in the builder who handles the Today enhancement, since they are already touching shared components.
