# Explorer 2 Report: Technology Patterns & Current Implementation

## Executive Summary

The SelahOS codebase is small, clean, and thoroughly tested (177 tests, 92% coverage, all passing). Every component follows a consistent pattern: typed props interface, Tailwind utility classes from a custom warm palette, minimal logic. The 3-state anchor toggle requires a contained redesign of `AnchorCheckbox` (from native checkbox to custom button), a nullable-boolean schema migration, and corresponding type/hook updates. All test patterns are well-established and must be replicated exactly.

---

## 1. Component Patterns (Exact Design Language)

### Props Interface Pattern

Every component uses a TypeScript `interface` with explicit prop names, never inline types. The pattern is:

```typescript
interface ComponentNameProps {
  propName: type
  anotherProp: type
}

export function ComponentName({ propName, anotherProp }: ComponentNameProps) {
  // ...
}
```

Components that need client-side features begin with `'use client'` directive. Server components (like `SectionGroup`) omit it.

### Components Using `'use client'`:
- `AnchorCheckbox` -- has interactive onChange
- `SleepButton` -- has interactive onClick
- `DateHeader` -- uses useState/useEffect
- `NoteField` -- has interactive onChange
- `Nav` -- uses usePathname from next/navigation

### Components Without `'use client'`:
- `SectionGroup` -- pure render, no hooks
- `IntegrityGrid` -- pure render, no hooks

### Color Palette (Exact Tailwind tokens from globals.css)

**Warm palette (grey/brown base):**
| Token | Hex | Usage |
|-------|-----|-------|
| `warm-50` | `#FAF8F5` | Button backgrounds (unrecorded state), input backgrounds |
| `warm-100` | `#F5F3F0` | Body background (`bg-warm-100`) |
| `warm-200` | `#E8E4DF` | Nav background, recorded-state button bg |
| `warm-300` | `#D4CEC7` | Borders, unfilled integrity dots |
| `warm-400` | `#B5ADA4` | Checkbox border (unchecked state), placeholder text |
| `warm-500` | `#8C8279` | Muted text (recorded sleep time), day labels |
| `warm-600` | `#6B6158` | Section labels, anchor item labels, nav inactive text |
| `warm-700` | `#524840` | Body text default |
| `warm-800` | `#3D3632` | Date header text, active button text |

**Garden green accents:**
| Token | Hex | Usage |
|-------|-----|-------|
| `green-500` | `#7A9E7E` | (defined but not currently used in components) |
| `green-600` | `#6B8F71` | Checked checkbox bg+border, filled integrity dots, active nav item |
| `green-700` | `#5A7A5F` | (defined but not currently used in components) |

**Functional:**
| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#B85C5C` | Error message text |

### Spacing & Layout Patterns

- **Page container:** `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`
- **Section group:** `space-y-2` with `h2` label: `text-sm text-warm-600 uppercase tracking-wide`
- **Anchor row:** `flex justify-around` (food, body, ground sections with multiple items)
- **Single anchor:** `flex` without justify-around (medication section)
- **Sleep buttons:** `space-y-2` vertical stack, full-width
- **Bottom nav:** `fixed bottom-0 left-0 right-0`, `h-14`, `max-w-lg mx-auto`
- **Page bottom padding:** `pb-24` (accounts for fixed bottom nav + safe area)

### Tap Target Standards

Minimum tap targets are enforced:
- `AnchorCheckbox`: `min-w-[56px] min-h-[56px]` on the label wrapper
- `SleepButton`: `min-h-[56px]`, `w-full`
- Nav links: `flex-1 flex items-center justify-center` within `h-14` container

### Typography Classes

- **Date header:** `text-xl text-warm-800`
- **Section labels:** `text-sm text-warm-600 uppercase tracking-wide`
- **Anchor item labels:** `text-sm text-warm-600`
- **Nav links:** `text-base` + active: `text-green-600`, inactive: `text-warm-600`
- **Error messages:** `text-error text-sm` with `role="alert"`
- **Body text (global):** `font-size: 17px; line-height: 1.5` via CSS
- **Font stack:** System fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`)

### AnchorCheckbox Current Implementation (Critical for 3-state redesign)

The current component at `/home/ahiya/Selah/selah-os/src/components/anchor-checkbox.tsx`:

- Uses a hidden native `<input type="checkbox">` with `className="sr-only peer"`
- Visual indicator is a sibling `<span>` that uses Tailwind `peer-checked:` variants
- Unchecked: `w-7 h-7 rounded-full border-2 border-warm-400` (empty circle, warm border)
- Checked: `peer-checked:bg-green-600 peer-checked:border-green-600` (green filled circle)
- Check icon: SVG path `M5 13l4 4L19 7` with `strokeWidth={3}`, `w-4 h-4 text-warm-50`
- Wrapper label: `flex flex-col items-center gap-1 cursor-pointer select-none min-w-[56px] min-h-[56px] justify-center`

---

## 2. Hook Patterns

### Core Pattern: `useDailyRecord`

File: `/home/ahiya/Selah/selah-os/src/hooks/use-daily-record.ts`

**Structure:**
1. Create Supabase client via `createClient()` (from `@/lib/supabase/client`)
2. Get effective date via `getEffectiveDate()` (from `@/lib/dates`)
3. Initialize state with `EMPTY_RECORD` (all booleans `false`, strings `''`, timestamps `null`)
4. Fetch on mount via `useEffect` with `.from('daily_records').select('*').eq('user_id', ...).eq('date', ...).maybeSingle()`
5. Provide `updateField(field, value)` for optimistic updates
6. Batch pending updates in `pendingUpdates.current` (useRef)
7. Debounce saves: 500ms timer, flushed via `upsert` with `{ onConflict: 'user_id,date' }`
8. Sleep timestamps flush immediately (time-sensitive)
9. Flush on `visibilitychange` to `hidden` (app goes to background)
10. Cleanup timeouts on unmount

**Supabase Query Patterns:**
- Fetch: `.from('daily_records').select('*').eq('user_id', userId).eq('date', effectiveDate).maybeSingle()`
- Save: `.from('daily_records').upsert(payload, { onConflict: 'user_id,date' }).select().single()`

**Optimistic Update Pattern:**
```typescript
const updateField = useCallback(
  (field: keyof DailyRecord, value: DailyRecord[keyof DailyRecord]) => {
    setRecord((prev) => ({ ...prev, [field]: value }))    // Optimistic
    pendingUpdates.current[field] = value as never          // Queue for save
    scheduleSave()                                          // Debounced flush
  },
  [scheduleSave]
)
```

**What Changes for 3-State:**
- `EMPTY_RECORD` anchor defaults change from `false` to `null`
- `updateField` signature: the `value` parameter already accepts `DailyRecord[keyof DailyRecord]` which will include `boolean | null` after type update -- no signature change needed
- The upsert payload naturally sends `null` values to Supabase (Supabase handles this)

### State Management

There is no global state management. Each page manages its own state:
- Today page: `useDailyRecord` hook (local state + Supabase)
- Ground page: `useGroundIntegrity` hook (local state + Supabase)
- Auth: `supabase.auth.getUser()` called in each page's `useEffect`

No Context, no Redux, no Zustand. State is per-page, per-hook.

---

## 3. Test Patterns (Exact Patterns for Builders)

### Testing Stack

- **Runner:** Vitest 4.0.18, config at `/home/ahiya/Selah/selah-os/vitest.config.ts`
- **Environment:** jsdom
- **Test library:** @testing-library/react 16.3.2
- **DOM matchers:** @testing-library/jest-dom (imported via `/home/ahiya/Selah/selah-os/src/test/setup.ts`)
- **Coverage:** @vitest/coverage-v8 4.0.18
- **Globals:** `globals: true` in vitest config (describe, it, expect, vi available without import -- but all test files still explicitly import them from 'vitest')

### Test File Location Convention

Tests are co-located with source:
- Components: `src/components/anchor-checkbox.test.tsx` (same directory as component)
- Hooks: `src/hooks/use-daily-record.test.ts` (same directory as hook)
- Pages: `src/app/page.test.tsx` or `src/app/ground/ground.test.tsx`
- Lib: `src/lib/types.test.ts`, `src/lib/dates.test.ts`

### Mock Patterns

**Supabase client mock (standard pattern for hooks):**
```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
// Build chained mock: .from().select().eq().eq().maybeSingle()
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
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))
```

**Supabase client mock (standard pattern for pages):**
```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  }),
}))
```

**Hook mocking (for page tests):**
```typescript
vi.mock('@/hooks/use-daily-record', () => ({
  useDailyRecord: () => ({
    record: { /* full record shape */ },
    error: null,
    updateField: vi.fn(),
    setSleepStart: vi.fn(),
    setSleepEnd: vi.fn(),
  }),
}))
```

**Date mocking (universal):**
```typescript
vi.mock('@/lib/dates', () => ({
  getEffectiveDate: () => '2026-03-12',
  formatDisplayDate: () => 'Thursday, March 12',
}))
```

**Next.js mocking:**
```typescript
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children, className }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))
```

### Test Structure Pattern

All tests follow this exact structure:
```typescript
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  it('renders with label', () => { ... })
  it('calls onChange when clicked', () => { ... })
  it('has minimum tap target size', () => { ... })
  // etc.
})
```

**Key patterns:**
- Use `screen.getByText()`, `screen.getByRole()`, `screen.getByLabelText()` for queries
- Use `fireEvent.click()` for interactions (not userEvent)
- Test CSS classes directly: `expect(element).toHaveClass('bg-green-600')`
- Test ARIA attributes: `expect(element).toHaveAttribute('aria-label', ...)`
- Hook tests use `renderHook()` from `@testing-library/react`
- Async hook tests use `waitFor()` for loading state transitions
- Optimistic updates are tested with `act(() => { result.current.updateField(...) })`

### Current Test Counts by File

| File | Tests |
|------|-------|
| anchor-checkbox.test.tsx | 8 |
| sleep-button.test.tsx | 8 |
| nav.test.tsx | 4 |
| date-header.test.tsx | 4 |
| integrity-grid.test.tsx | 5 |
| section-group.test.tsx | (exists) |
| note-field.test.tsx | (exists) |
| use-daily-record.test.ts | 20 |
| use-ground-integrity.test.ts | 10 |
| use-ground-project.test.ts | (to be deleted) |
| use-weekly-signals.test.ts | (to be deleted) |
| use-active-project-name.test.ts | (to be deleted) |
| use-debounced-save.test.ts | (exists, unused hook) |
| types.test.ts | 5 |
| dates.test.ts | (exists) |
| constants.test.ts | 2 |
| page.test.tsx (Today) | 3 |
| ground.test.tsx | 3 |
| login.test.tsx | (exists) |
| project.test.tsx | (to be deleted) |
| signals.test.tsx | (to be deleted) |
| **Total** | **177** |

### Coverage Baseline

- **Overall:** 92.26% statements, 80.45% branches, 85.34% functions, 92.16% lines
- **Components:** 100% across all metrics
- **Hooks:** 98.72% statements, 99.07% lines
- **Lib:** 100% statements and lines
- **Pages:** Lower coverage (55-87%) due to auth loading states and some uncovered branches

---

## 4. Three-State Anchor Toggle Design

### Current State: Binary Checkbox

```
Unchecked: ○ (empty circle, border-warm-400)
Checked:   ● (filled green-600 circle + white checkmark SVG)
```

### Required State: Tri-state Toggle

The vision specifies three states with equal visual weight:

| State | Symbol | Meaning | DB Value |
|-------|--------|---------|----------|
| Untouched | ○ | Default, no interaction, no pressure | `null` |
| Done | ✓ | Explicit positive mark | `true` |
| Not done | — | Explicit "I acknowledge this, it didn't happen" | `false` |

### Proposed Cycle

```
Tap: untouched(○) → done(✓) → not-done(—) → untouched(○) → ...
```

Rationale:
- First tap = most common intent: marking done
- Second tap = correction or intentional "not done"
- Third tap = reset to untouched (undo)
- This matches natural usage: most taps will be single (mark done), occasional double-tap for "not done"

### Visual Design (Matching Warm Palette)

```
UNTOUCHED (null):
  Circle: w-7 h-7 rounded-full border-2 border-warm-400
  Interior: empty
  Feels: neutral, inviting, no pressure

DONE (true):
  Circle: w-7 h-7 rounded-full bg-green-600 border-2 border-green-600
  Interior: white checkmark SVG (same as current checked state)
  Feels: calm confirmation

NOT DONE (false):
  Circle: w-7 h-7 rounded-full bg-warm-300 border-2 border-warm-400
  Interior: horizontal dash in warm-600 (em-dash character or SVG line)
  Feels: neutral acknowledgment, NOT red/error
```

**Critical design constraint from vision:** "Not done is first-class, not secondary." The not-done state must NOT use red, warning colors, or any visual language that implies failure. The warm-300 fill with warm-600 dash keeps it within the calm palette. It is visually distinct from untouched (has fill + dash) but does not carry negative weight.

### Component API Change

**Current:**
```typescript
interface AnchorCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}
```

**Proposed:**
```typescript
type AnchorState = boolean | null  // null=untouched, true=done, false=not-done

interface AnchorCheckboxProps {
  label: string
  value: AnchorState
  onChange: (value: AnchorState) => void
  id: string
}
```

### Implementation Notes

- Replace `<input type="checkbox">` with `<button type="button">`
- Remove `peer-checked:` Tailwind pattern (only works for binary checkboxes)
- Use conditional classes based on `value` prop
- Cycle logic: `null → true → false → null`
- ARIA: `role="button"` with `aria-label` including current state, e.g. `aria-label="breakfast: untouched"`, `aria-label="breakfast: done"`, `aria-label="breakfast: not done"`
- Keep the same wrapper pattern: `flex flex-col items-center gap-1 cursor-pointer select-none min-w-[56px] min-h-[56px] justify-center`

### Cycle Function (Pure, Testable)

```typescript
function nextAnchorState(current: AnchorState): AnchorState {
  if (current === null) return true    // untouched → done
  if (current === true) return false   // done → not done
  return null                          // not done → untouched
}
```

---

## 5. Ground Page Weekly Restriction

### Options Analyzed

**Option A: Remove from nav only (RECOMMENDED)**
- Simply remove `/ground` from `NAV_ITEMS` in nav.tsx (or remove nav entirely since it becomes single-item)
- Page remains accessible at `/os/ground` via direct URL
- Zero logic, zero enforcement, trust-based

**Option B: Client-side day-of-week gate**
- Add check in `ground/page.tsx`: `if (new Date().getDay() !== desiredDay) show gate message`
- More enforcement but adds code to a page that should remain simple
- Can be bypassed by changing system clock (irrelevant for single-user tool)

**Option C: Middleware route protection**
- Add day-of-week check in `middleware.ts` for `/ground` path
- Over-engineered for a personal tool

### Recommendation: Option A (Remove from nav)

Rationale aligned with vision:
1. The vision says Ground is "removed from daily navigation" -- nav removal achieves this directly
2. SelahOS is a single-user personal tool where enforcement contradicts self-trust
3. The philosophy is "contact with reality" -- if the user deliberately types `/os/ground`, that is an intentional act, not a passive habit
4. Adding gating logic increases code complexity in a system that values radical simplicity
5. If behavioral gating is desired later, it can be added as a separate enhancement without changing anything else

### Implementation

The nav is either:
- Reduced to a single "Today" link (which is functionally useless)
- Removed entirely from `layout.tsx`

**Recommended: Remove nav entirely.** With only one active page, a bottom nav bar is visual noise. The Ground page is accessed by URL. The login redirect already sends users to `/` (Today). There is no navigation decision to make in daily use.

If removing nav entirely, update:
1. `src/app/layout.tsx` -- remove `<Nav />` import and render
2. `src/app/page.tsx` -- reduce `pb-24` to something smaller (no nav to clear)
3. `src/app/ground/page.tsx` -- reduce `pb-24` similarly
4. Update or remove `nav.tsx` and `nav.test.tsx`

---

## 6. Database Migration Pattern

### Current Migration Structure

```
/home/ahiya/Selah/selah-os/supabase/
  migrations/
    001_initial_schema.sql   (5218 bytes, created 2026-03-12)
```

There is no `supabase/config.toml` -- migrations are managed manually (applied via Supabase dashboard SQL editor or CLI). The project does not use Supabase local development (`supabase start`).

### Migration Naming Convention

Based on existing: `{sequence_number}_{descriptive_name}.sql`

The next migration should be: `002_anchor_three_state.sql`

### Required Migration SQL

```sql
-- 002_anchor_three_state.sql
-- Convert boolean anchor columns to nullable for 3-state model
-- null = untouched (default), true = done, false = not done

-- Step 1: Backfill existing false values to NULL
-- In the old model, false was the default (meaning "untouched").
-- In the new model, null means untouched. This conversion is semantically correct.
UPDATE daily_records SET breakfast = NULL WHERE breakfast = false;
UPDATE daily_records SET lunch = NULL WHERE lunch = false;
UPDATE daily_records SET dinner = NULL WHERE dinner = false;
UPDATE daily_records SET cipralex_taken = NULL WHERE cipralex_taken = false;
UPDATE daily_records SET hygiene_done = NULL WHERE hygiene_done = false;
UPDATE daily_records SET movement_done = NULL WHERE movement_done = false;
UPDATE daily_records SET ground_maintenance_done = NULL WHERE ground_maintenance_done = false;
UPDATE daily_records SET ground_build_done = NULL WHERE ground_build_done = false;

-- Step 2: Drop NOT NULL constraints and change defaults
ALTER TABLE daily_records ALTER COLUMN breakfast DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN breakfast SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done SET DEFAULT NULL;
```

### Deployment Order

1. Run migration on Supabase (before deploying new code)
2. Deploy code that reads/writes nullable booleans

This order is safe because:
- Old code writing `false` to newly-nullable columns still works
- Old code reading `null` from previously-false columns: the Today page already uses `record.breakfast ?? false` coercion, so `null` renders as `false` (unchecked) -- this is correct behavior during the transition window

---

## 7. Type Changes Required

### `src/lib/types.ts` -- `daily_records` Table Types

**Current (boolean):**
```typescript
Row: {
  breakfast: boolean
  lunch: boolean
  // ...
}
```

**Required (boolean | null):**
```typescript
Row: {
  breakfast: boolean | null
  lunch: boolean | null
  dinner: boolean | null
  cipralex_taken: boolean | null
  hygiene_done: boolean | null
  movement_done: boolean | null
  ground_maintenance_done: boolean | null
  ground_build_done: boolean | null
  // ...
}
Insert: {
  breakfast?: boolean | null
  // ... (these are already optional, just update type)
}
Update: {
  breakfast?: boolean | null
  // ... (these are already optional, just update type)
}
```

### Remove from `types.ts`

Remove `ground_projects` and `weekly_signals` table definitions entirely. No code will reference them after the deletions.

### `EMPTY_RECORD` in `use-daily-record.ts`

**Current:**
```typescript
const EMPTY_RECORD = {
  breakfast: false,
  lunch: false,
  // ...
}
```

**Required:**
```typescript
const EMPTY_RECORD = {
  breakfast: null,
  lunch: null,
  dinner: null,
  cipralex_taken: null,
  hygiene_done: null,
  movement_done: null,
  ground_maintenance_done: null,
  ground_build_done: null,
  // ...
}
```

---

## 8. Ground Integrity View: No Changes Needed

The `recordToIntegrity` function in `use-ground-integrity.ts` uses `!!` coercion:
```typescript
food: !!(record.breakfast && record.lunch && record.dinner)
```

With nullable booleans:
- `!!null === false` -- untouched shows as "not fulfilled" in grid (correct)
- `!!true === true` -- done shows as "fulfilled" (correct)
- `!!false === false` -- not-done shows as "not fulfilled" (correct)

The Ground integrity view is inherently binary (was this anchor domain fulfilled this day?). The 3-state distinction is only for the daily Today interface. No changes needed in `use-ground-integrity.ts` or `integrity-grid.tsx`.

---

## 9. Today Page Changes

### Remove:
- `import { useActiveProjectName } from '@/hooks/use-active-project-name'` (line 6)
- `const { projectName } = useActiveProjectName(userId)` (line 39)
- `{projectName && <p className="text-sm text-warm-600">{projectName}</p>}` (lines 116-118)

### Update AnchorCheckbox usage (8 instances):

**Current pattern:**
```tsx
<AnchorCheckbox
  id="breakfast"
  label="breakfast"
  checked={record.breakfast ?? false}
  onChange={(v) => updateField('breakfast', v)}
/>
```

**New pattern:**
```tsx
<AnchorCheckbox
  id="breakfast"
  label="breakfast"
  value={record.breakfast ?? null}
  onChange={(v) => updateField('breakfast', v)}
/>
```

The `?? null` coercion handles the case where `record.breakfast` is `undefined` (before fetch completes), mapping it to the untouched state.

---

## 10. Test Rewrites Required

### `anchor-checkbox.test.tsx` -- FULL REWRITE

Current tests assume binary checkbox semantics. New tests must cover:

1. Renders with label
2. Shows untouched state (empty circle) when value is null
3. Shows done state (green circle + checkmark) when value is true
4. Shows not-done state (warm circle + dash) when value is false
5. Cycling: null -> click -> onChange called with true
6. Cycling: true -> click -> onChange called with false
7. Cycling: false -> click -> onChange called with null
8. Has minimum tap target size (min-w-[56px] min-h-[56px])
9. Proper ARIA: role="button" and aria-label includes state
10. Keyboard accessibility: responds to Enter/Space

### `use-daily-record.test.ts` -- MODERATE UPDATE

- Change assertion `expect(result.current.record.breakfast).toBe(false)` to `expect(result.current.record.breakfast).toBeNull()`
- Update `mockRecord` objects: change `false` to `null` for anchor fields
- Update `updateField` test: test with `true`, `false`, and `null` values
- Mock records in setSleepStart/setSleepEnd tests need anchor fields changed from `false` to `null`

### `nav.test.tsx` -- REWRITE OR DELETE

If nav is removed: delete test file.
If nav is simplified to single item: rewrite to test single "Today" link.

### `page.test.tsx` (Today) -- MODERATE UPDATE

- Remove `vi.mock('@/hooks/use-active-project-name', ...)`
- Remove test: `it('shows active project name in ground section', ...)`
- Update mock record: change `false` to `null` for anchor fields
- Add test verifying no project name is shown in ground section

### `types.test.ts` -- MODERATE UPDATE

- Update `daily_records Row` test: change `breakfast: false` to `breakfast: null`
- Remove `ground_projects Row` test
- Remove `weekly_signals Row` test

---

## Complexity Assessment

### High Complexity Areas

**AnchorCheckbox 3-State Redesign**
- Changes from native checkbox to custom button
- New visual states (3 instead of 2)
- New cycling logic
- ARIA changes
- Full test rewrite
- Estimated effort: 1-2 hours

### Medium Complexity Areas

**Database Migration + Type Updates**
- Schema migration SQL (straightforward but must be correct)
- Type definition updates in `types.ts`
- `EMPTY_RECORD` update in `use-daily-record.ts`
- Test updates across multiple files
- Estimated effort: 1 hour

**File Deletions + Today Page Cleanup**
- 10 files to delete
- Today page: remove project name import/usage
- Nav: simplify or remove
- Layout: remove Nav if applicable
- Test updates for page.test.tsx and nav.test.tsx
- Estimated effort: 1 hour

### Low Complexity Areas

**Ground Page Restriction**
- Remove from nav (or remove nav entirely)
- No logic changes to ground/page.tsx
- Estimated effort: 15 minutes (included in nav work)

---

## Technology Recommendations

### Primary Stack (No Changes)

| Technology | Version | Rationale |
|-----------|---------|-----------|
| Next.js | 15.5.12 | App Router, existing setup |
| React | 19.2.4 | Latest stable |
| TypeScript | 5.9.3 | Strict mode enabled |
| Supabase | 2.99.1 | Auth + DB, existing setup |
| Tailwind CSS | 4.2.1 | Existing custom theme via `@theme` directive |
| Vitest | 4.0.18 | Testing runner |
| @testing-library/react | 16.3.2 | Component testing |

### No New Libraries Needed

The 3-state toggle is a simple custom button component. No animation library, no state machine library, no new dependencies.

---

## Integration Points

### AnchorCheckbox <-> useDailyRecord <-> Supabase

The data flow is: User taps anchor -> AnchorCheckbox calls `onChange(nextValue)` -> Today page calls `updateField('fieldName', nextValue)` -> useDailyRecord sets optimistic state + queues pending update -> Debounced flush sends `upsert` to Supabase.

The `value` type must be consistent across this entire chain: `boolean | null` everywhere. The type alias `AnchorState = boolean | null` should be defined once (in `types.ts` or in the AnchorCheckbox file) and imported where needed.

### Today Page <-> AnchorCheckbox Props

8 AnchorCheckbox instances in the Today page must all change from `checked={value ?? false}` to `value={value ?? null}`. The `onChange` callback signature changes from `(v: boolean) => void` to `(v: AnchorState) => void`, but the `updateField` function already accepts `DailyRecord[keyof DailyRecord]` which will include `boolean | null` after the type update.

### IntegrityGrid <-> useGroundIntegrity (NO CHANGE)

The `!!` coercion in `recordToIntegrity` handles `null` correctly. No integration changes needed.

---

## Risks & Challenges

### Technical Risks

**Migration ordering:**
- Risk: New code deployed before migration runs; upserts send `null` to NOT NULL columns
- Impact: Database constraint violation errors
- Mitigation: Run migration FIRST, then deploy. The transition is safe in both directions.

### Complexity Risks

**Test mock alignment:**
- Risk: Mock records in page tests still use `false` instead of `null`
- Impact: Tests pass but don't reflect actual behavior
- Mitigation: Update ALL mock records in ALL test files. Search for `breakfast: false` as canary.

---

## Recommendations for Planner

1. **Database migration must be the first task executed**, before any code changes are deployed. The migration is safe to run ahead of time because old code handles null gracefully (existing `?? false` coercion in Today page).

2. **AnchorCheckbox should be redesigned as a `<button>` element** with explicit conditional classes, not a hidden checkbox with peer variants. The peer-checked pattern only works for binary state. Use the cycle function `null -> true -> false -> null` for the tap interaction.

3. **Remove the nav component entirely** rather than reducing it to a single link. A one-item nav bar has no purpose and adds visual noise. Today page is the only daily surface; Ground is accessed by direct URL for weekly review.

4. **Use `boolean | null` (not string enums) for the 3-state data model.** This requires the smallest migration, maps naturally to PostgreSQL nullable columns, and TypeScript handles it cleanly.

5. **The "not done" visual state must use warm tones (warm-300 fill, warm-600 dash), NOT red/error colors.** This is a design constraint from the vision: "not done is first-class, not secondary."

6. **All 8 AnchorCheckbox instances in the Today page use the same prop pattern.** A builder can update them mechanically once the component API is finalized.

7. **Test updates are mechanical but mandatory.** The anchor-checkbox tests need a full rewrite (8 tests -> ~10 tests). The use-daily-record tests need `false` -> `null` in ~12 assertion sites. The page.test.tsx needs mock cleanup. Search for `breakfast: false` across all test files to find every location.

---

## Resource Map

### Critical Files to Modify

| Path | Purpose |
|------|---------|
| `src/components/anchor-checkbox.tsx` | Core 3-state component (REWRITE) |
| `src/components/anchor-checkbox.test.tsx` | Tests for 3-state component (REWRITE) |
| `src/hooks/use-daily-record.ts` | EMPTY_RECORD defaults (null instead of false) |
| `src/hooks/use-daily-record.test.ts` | Update assertions and mocks |
| `src/lib/types.ts` | boolean -> boolean | null, remove unused tables |
| `src/lib/types.test.ts` | Update type tests |
| `src/app/page.tsx` | Remove project name, update AnchorCheckbox props |
| `src/app/page.test.tsx` | Remove project mock, update assertions |
| `src/components/nav.tsx` | Remove or reduce to nothing |
| `src/components/nav.test.tsx` | Remove or rewrite |
| `src/app/layout.tsx` | Remove Nav component |
| `supabase/migrations/002_anchor_three_state.sql` | NEW: schema migration |

### Files to Delete (10 files)

| Path | Reason |
|------|--------|
| `src/app/project/page.tsx` | Project tab removed |
| `src/app/project/project.test.tsx` | Test for removed page |
| `src/app/signals/page.tsx` | Signals tab removed |
| `src/app/signals/signals.test.tsx` | Test for removed page |
| `src/hooks/use-ground-project.ts` | Only used by Project page |
| `src/hooks/use-ground-project.test.ts` | Test for removed hook |
| `src/hooks/use-active-project-name.ts` | Only used by Today page (being removed) |
| `src/hooks/use-active-project-name.test.ts` | Test for removed hook |
| `src/hooks/use-weekly-signals.ts` | Only used by Signals page |
| `src/hooks/use-weekly-signals.test.ts` | Test for removed hook |

### Files Unchanged

| Path | Reason |
|------|--------|
| `src/components/sleep-button.tsx` | Independent component |
| `src/components/section-group.tsx` | Independent component |
| `src/components/note-field.tsx` | Independent component |
| `src/components/date-header.tsx` | Independent component |
| `src/components/integrity-grid.tsx` | Uses !! coercion, handles null correctly |
| `src/hooks/use-ground-integrity.ts` | Uses !! coercion, handles null correctly |
| `src/hooks/use-debounced-save.ts` | Already unused, untouched |
| `src/lib/dates.ts` | Utility functions, keep all |
| `src/lib/constants.ts` | DAY_BOUNDARY_HOUR, untouched |
| `src/app/ground/page.tsx` | Remains functional, no changes |
| `src/app/login/page.tsx` | Auth flow, untouched |
| `middleware.ts` | Auth middleware, untouched |

### Testing Infrastructure

| Tool | Command | Purpose |
|------|---------|---------|
| Vitest run | `npm test` / `npx vitest run` | Run all tests once |
| Vitest watch | `npm run test:watch` | Watch mode during development |
| Coverage | `npm run test:coverage` | V8 coverage report |
| Type check | `npm run type-check` (`tsc --noEmit`) | Verify TypeScript compilation |
| Build | `npm run build` | Full Next.js production build |

---

## Questions for Planner

1. **Should the nav be removed entirely or kept as a minimal header?** With only one active page, the nav serves no functional purpose. Removing it saves code and simplifies layout. But a minimal "SelahOS" text header could provide orientation. The current nav is a bottom bar with links, not a header.

2. **Should `project/` and `signals/` directories be removed or just their contents?** Deleting the `page.tsx` and test files removes all functionality, but leaving empty directories is messy. Recommend deleting the entire directories.

3. **Should `use-debounced-save.ts` and its test be cleaned up?** This hook has never been used by production code (it was extracted but never adopted). Not related to plan-3 but it is dead code. Low priority.

---

*Exploration completed: 2026-04-01*
*Explorer-2: Technology Patterns & Current Implementation*
*All 177 tests passing, 92.26% coverage baseline established*
