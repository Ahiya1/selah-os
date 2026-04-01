# Code Patterns & Conventions

## File Structure

```
src/
  app/
    page.tsx              # Today page (only daily interface)
    page.test.tsx         # Today page tests
    layout.tsx            # Root layout (no nav after this iteration)
    globals.css           # Tailwind theme + custom tokens
    login/
      page.tsx            # Auth login page
      login.test.tsx
    ground/
      page.tsx            # Ground weekly view (direct URL access only)
      ground.test.tsx
  components/
    anchor-checkbox.tsx        # 3-state anchor toggle (REWRITTEN)
    anchor-checkbox.test.tsx   # Tests for 3-state behavior (REWRITTEN)
    sleep-button.tsx           # Sleep timestamp button
    sleep-button.test.tsx
    section-group.tsx          # Section wrapper with label
    section-group.test.tsx
    note-field.tsx             # Optional 1-line note input
    note-field.test.tsx
    date-header.tsx            # Date display
    date-header.test.tsx
    integrity-grid.tsx         # Weekly integrity dot grid
    integrity-grid.test.tsx
  hooks/
    use-daily-record.ts        # Today page data layer
    use-daily-record.test.ts
    use-ground-integrity.ts    # Ground page data layer
    use-ground-integrity.test.ts
  lib/
    supabase/
      client.ts               # Supabase browser client
      server.ts               # Supabase server client
    types.ts                   # Database type definitions
    types.test.ts
    dates.ts                   # Date utility functions
    dates.test.ts
    constants.ts               # DAY_BOUNDARY_HOUR etc.
    constants.test.ts
  test/
    setup.ts                   # Vitest setup (jest-dom import)
supabase/
  migrations/
    001_initial_schema.sql     # Original schema
    002_anchor_three_state.sql # NEW: nullable anchor columns
vitest.config.ts
```

### Deleted in This Iteration

```
REMOVED:
  src/app/project/           # Entire directory
  src/app/signals/           # Entire directory
  src/components/nav.tsx     # Navigation bar
  src/components/nav.test.tsx
  src/hooks/use-ground-project.ts
  src/hooks/use-ground-project.test.ts
  src/hooks/use-weekly-signals.ts
  src/hooks/use-weekly-signals.test.ts
  src/hooks/use-active-project-name.ts
  src/hooks/use-active-project-name.test.ts
```

## Naming Conventions

- Components: PascalCase export, kebab-case file (`AnchorCheckbox` in `anchor-checkbox.tsx`)
- Hooks: camelCase export, kebab-case file (`useDailyRecord` in `use-daily-record.ts`)
- Types: PascalCase (`DailyRecord`, `AnchorState`, `DayIntegrity`)
- Functions: camelCase (`nextAnchorState()`, `updateField()`)
- Constants: SCREAMING_SNAKE_CASE (`EMPTY_RECORD`, `DEBOUNCE_MS`, `DAY_BOUNDARY_HOUR`)
- Test files: same name with `.test.ts` or `.test.tsx` suffix, co-located with source

## Import Order Convention

```typescript
// 1. 'use client' directive (if needed)
'use client'

// 2. React
import React from 'react'
import { useState, useEffect, useCallback } from 'react'

// 3. Third-party libraries
import type { User } from '@supabase/supabase-js'

// 4. Internal lib imports (@ alias)
import { createClient } from '@/lib/supabase/client'
import { getEffectiveDate } from '@/lib/dates'
import type { Database } from '@/lib/types'

// 5. Internal hooks
import { useDailyRecord } from '@/hooks/use-daily-record'

// 6. Internal components
import { AnchorCheckbox } from '@/components/anchor-checkbox'
import { SectionGroup } from '@/components/section-group'
```

No blank lines between groups. No trailing semicolons (project uses no-semicolon style). Single quotes for strings.

---

## Three-State Anchor Pattern

### Type Definition

```typescript
// In anchor-checkbox.tsx (local to the component)
type AnchorState = boolean | null
// null = untouched (default, no pressure)
// true = done (explicit positive mark)
// false = not done (explicit acknowledgment, first-class)
```

### Cycle Function (Pure, Testable)

```typescript
function nextAnchorState(current: AnchorState): AnchorState {
  if (current === null) return true    // untouched -> done
  if (current === true) return false   // done -> not done
  return null                          // not done -> untouched
}
```

### AnchorCheckbox Component (Full Implementation)

```typescript
'use client'

import React from 'react'

type AnchorState = boolean | null

interface AnchorCheckboxProps {
  label: string
  value: AnchorState
  onChange: (value: AnchorState) => void
  id: string
}

function nextAnchorState(current: AnchorState): AnchorState {
  if (current === null) return true
  if (current === true) return false
  return null
}

function stateLabel(value: AnchorState): string {
  if (value === null) return 'untouched'
  if (value === true) return 'done'
  return 'not done'
}

export function AnchorCheckbox({ label, value, onChange, id }: AnchorCheckboxProps) {
  const handleClick = () => {
    onChange(nextAnchorState(value))
  }

  return (
    <div className="flex flex-col items-center gap-1 select-none min-w-[56px] min-h-[56px] justify-center">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={value === null ? 'mixed' : value}
        aria-label={`${label}: ${stateLabel(value)}`}
        onClick={handleClick}
        className="w-7 h-7 rounded-full border-2 transition-colors flex items-center justify-center cursor-pointer"
        style={
          value === true
            ? undefined  // green classes applied via className
            : value === false
            ? undefined  // warm classes applied via className
            : undefined  // neutral classes applied via className
        }
        // Use conditional className instead of style:
        {...(value === true
          ? { className: 'w-7 h-7 rounded-full border-2 border-green-600 bg-green-600 transition-colors flex items-center justify-center cursor-pointer' }
          : value === false
          ? { className: 'w-7 h-7 rounded-full border-2 border-warm-400 bg-warm-300 transition-colors flex items-center justify-center cursor-pointer' }
          : { className: 'w-7 h-7 rounded-full border-2 border-warm-400 transition-colors flex items-center justify-center cursor-pointer' }
        )}
      >
        {value === true && (
          <svg
            className="w-4 h-4 text-warm-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {value === false && (
          <svg
            className="w-4 h-4 text-warm-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
          </svg>
        )}
      </button>
      <span className="text-sm text-warm-600">{label}</span>
    </div>
  )
}
```

**IMPORTANT: Simplified version for builders.** The above shows the intent. The actual implementation should use a cleaner className approach:

```typescript
'use client'

import React from 'react'

type AnchorState = boolean | null

interface AnchorCheckboxProps {
  label: string
  value: AnchorState
  onChange: (value: AnchorState) => void
  id: string
}

function nextAnchorState(current: AnchorState): AnchorState {
  if (current === null) return true
  if (current === true) return false
  return null
}

function stateLabel(value: AnchorState): string {
  if (value === null) return 'untouched'
  if (value === true) return 'done'
  return 'not done'
}

const CIRCLE_BASE = 'w-7 h-7 rounded-full border-2 transition-colors flex items-center justify-center cursor-pointer'

function circleClass(value: AnchorState): string {
  if (value === true) return `${CIRCLE_BASE} border-green-600 bg-green-600`
  if (value === false) return `${CIRCLE_BASE} border-warm-400 bg-warm-300`
  return `${CIRCLE_BASE} border-warm-400`
}

export function AnchorCheckbox({ label, value, onChange, id }: AnchorCheckboxProps) {
  return (
    <div className="flex flex-col items-center gap-1 select-none min-w-[56px] min-h-[56px] justify-center">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={value === null ? 'mixed' : value}
        aria-label={`${label}: ${stateLabel(value)}`}
        onClick={() => onChange(nextAnchorState(value))}
        className={circleClass(value)}
      >
        {value === true && (
          <svg
            className="w-4 h-4 text-warm-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {value === false && (
          <svg
            className="w-4 h-4 text-warm-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
          </svg>
        )}
      </button>
      <span className="text-sm text-warm-600">{label}</span>
    </div>
  )
}
```

### Visual States Reference

```
UNTOUCHED (null):
  Circle: border-warm-400, no fill
  Interior: empty
  Feels: neutral, inviting, no pressure

DONE (true):
  Circle: bg-green-600, border-green-600
  Interior: white checkmark SVG (M5 13l4 4L19 7, strokeWidth 3, text-warm-50)
  Feels: calm confirmation

NOT DONE (false):
  Circle: bg-warm-300, border-warm-400
  Interior: horizontal dash SVG (M6 12h12, strokeWidth 3, text-warm-600)
  Feels: neutral acknowledgment, NOT red/error
```

**Critical design constraint:** "Not done" must NEVER use red, warning colors, or any visual language that implies failure. The warm-300 fill with warm-600 dash keeps it within the calm palette. It is visually distinct from untouched but carries zero negative weight.

---

## Component Patterns

### Props Interface Pattern

Every component uses a TypeScript `interface` with explicit prop names:

```typescript
interface ComponentNameProps {
  propName: type
  anotherProp: type
}

export function ComponentName({ propName, anotherProp }: ComponentNameProps) {
  // ...
}
```

### Client vs Server Components

Components that need hooks or browser APIs begin with `'use client'`. Server components omit it.

**Client components (use `'use client'`):**
- `AnchorCheckbox` -- interactive onClick
- `SleepButton` -- interactive onClick
- `DateHeader` -- uses useState/useEffect
- `NoteField` -- interactive onChange

**Server components (no directive):**
- `SectionGroup` -- pure render
- `IntegrityGrid` -- pure render

### Wrapper/Container Pattern

```typescript
// Outer wrapper: flex column, centered, minimum tap target
<div className="flex flex-col items-center gap-1 select-none min-w-[56px] min-h-[56px] justify-center">
  {/* Interactive element */}
  {/* Label */}
</div>
```

### Page Container Pattern

```typescript
// Today page (after nav removal -- pb-8 instead of pb-24)
<div className="max-w-lg mx-auto px-4 pt-5 pb-8 space-y-6">
  {/* Sections */}
</div>

// Ground page (after nav removal -- pb-8 instead of pb-24)
<div className="max-w-lg mx-auto px-4 pt-5 pb-8">
  {/* Content */}
</div>
```

### Section Layout Patterns

```typescript
// Multiple anchors in a row (food, body, ground sections)
<SectionGroup label="food">
  <div className="flex justify-around">
    <AnchorCheckbox ... />
    <AnchorCheckbox ... />
    <AnchorCheckbox ... />
  </div>
</SectionGroup>

// Single anchor (medication section)
<SectionGroup label="medication">
  <div className="flex">
    <AnchorCheckbox ... />
  </div>
</SectionGroup>
```

---

## AnchorCheckbox Usage Pattern (Today Page)

Every AnchorCheckbox in the Today page follows this exact pattern:

```typescript
<AnchorCheckbox
  id="breakfast"
  label="breakfast"
  value={record.breakfast ?? null}
  onChange={(v) => updateField('breakfast', v)}
/>
```

Key points:
- `value` receives `record.fieldName ?? null` (the `?? null` handles the `undefined` case before fetch completes)
- `onChange` passes the new value directly to `updateField`
- The `updateField` signature is `(field: keyof DailyRecord, value: DailyRecord[keyof DailyRecord])` which accepts `boolean | null` after the type update

All 8 instances follow this pattern. The field names are:
- `breakfast`, `lunch`, `dinner` (food section)
- `cipralex_taken` (medication section)
- `hygiene_done`, `movement_done` (body section)
- `ground_maintenance_done`, `ground_build_done` (ground section)

---

## Database Patterns

### Migration File Convention

```sql
-- supabase/migrations/002_anchor_three_state.sql
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

-- Step 2: Drop NOT NULL constraints and change defaults to NULL
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

### Supabase Query Patterns

```typescript
// Fetch daily record
const { data, error } = await supabase
  .from('daily_records')
  .select('*')
  .eq('user_id', userId)
  .eq('date', effectiveDate)
  .maybeSingle()

// Upsert daily record (debounced)
const payload: DailyRecordInsert = {
  user_id: userId,
  date: effectiveDate,
  ...updates,  // Can include null values for anchor fields
}

const { error } = await supabase
  .from('daily_records')
  .upsert(payload, { onConflict: 'user_id,date' })
  .select()
  .single()
```

### EMPTY_RECORD Pattern (After Update)

```typescript
const EMPTY_RECORD: Omit<DailyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  date: '',
  sleep_start: null,
  sleep_end: null,
  breakfast: null,
  lunch: null,
  dinner: null,
  cipralex_taken: null,
  hygiene_done: null,
  movement_done: null,
  ground_maintenance_done: null,
  ground_build_done: null,
  note: '',
}
```

---

## Type Patterns

### Database Types (After Update)

```typescript
export interface Database {
  public: {
    Tables: {
      daily_records: {
        Row: {
          id: string
          user_id: string
          date: string
          sleep_start: string | null
          sleep_end: string | null
          breakfast: boolean | null
          lunch: boolean | null
          dinner: boolean | null
          cipralex_taken: boolean | null
          hygiene_done: boolean | null
          movement_done: boolean | null
          ground_maintenance_done: boolean | null
          ground_build_done: boolean | null
          note: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          sleep_start?: string | null
          sleep_end?: string | null
          breakfast?: boolean | null
          lunch?: boolean | null
          dinner?: boolean | null
          cipralex_taken?: boolean | null
          hygiene_done?: boolean | null
          movement_done?: boolean | null
          ground_maintenance_done?: boolean | null
          ground_build_done?: boolean | null
          note?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          sleep_start?: string | null
          sleep_end?: string | null
          breakfast?: boolean | null
          lunch?: boolean | null
          dinner?: boolean | null
          cipralex_taken?: boolean | null
          hygiene_done?: boolean | null
          movement_done?: boolean | null
          ground_maintenance_done?: boolean | null
          ground_build_done?: boolean | null
          note?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
```

Note: `ground_projects` and `weekly_signals` table definitions are removed from this interface. The database tables remain but no code references them.

### Null Handling Pattern for Integrity Grid

The Ground integrity view uses `!!` coercion to collapse 3-state to binary:

```typescript
// In use-ground-integrity.ts -- NO CHANGES NEEDED
function recordToIntegrity(date: string, record: DailyRecord | undefined): DayIntegrity {
  if (!record) {
    return { date, sleep: false, food: false, medication: false, body: false, ground: false }
  }
  return {
    date,
    sleep: !!(record.sleep_start && record.sleep_end),
    food: !!(record.breakfast && record.lunch && record.dinner),
    medication: !!record.cipralex_taken,
    body: !!(record.hygiene_done && record.movement_done),
    ground: !!(record.ground_maintenance_done || record.ground_build_done),
  }
}
// !!null === false (untouched -> not fulfilled) -- CORRECT
// !!true === true  (done -> fulfilled) -- CORRECT
// !!false === false (not done -> not fulfilled) -- CORRECT
```

---

## Testing Patterns

### Test File Naming Conventions

- Unit tests: `{component}.test.tsx` or `{module}.test.ts` (same directory as source)
- Page tests: `{page-name}.test.tsx` (same directory as page)
- No separate `__tests__/` directory; all tests co-located

### Test Structure Pattern

All tests follow this exact structure:

```typescript
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  it('renders with label', () => {
    // Arrange + Act
    render(<ComponentName ... />)
    // Assert
    expect(screen.getByText('label')).toBeInTheDocument()
  })

  it('calls handler on interaction', () => {
    // Arrange
    const handler = vi.fn()
    render(<ComponentName onChange={handler} ... />)
    // Act
    fireEvent.click(screen.getByRole('checkbox'))
    // Assert
    expect(handler).toHaveBeenCalledWith(expectedValue)
  })
})
```

Key patterns:
- Use `screen.getByText()`, `screen.getByRole()`, `screen.getByLabelText()` for queries
- Use `fireEvent.click()` for interactions (NOT userEvent)
- Test CSS classes directly: `expect(element).toHaveClass('bg-green-600')`
- Test ARIA attributes: `expect(element).toHaveAttribute('aria-label', ...)`
- Hook tests use `renderHook()` from `@testing-library/react`
- Async hook tests use `waitFor()` for loading state transitions
- Optimistic updates tested with `act(() => { result.current.updateField(...) })`

### AnchorCheckbox Test Pattern (Full Rewrite)

```typescript
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnchorCheckbox } from './anchor-checkbox'

describe('AnchorCheckbox', () => {
  it('renders with label', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    expect(screen.getByText('breakfast')).toBeInTheDocument()
  })

  it('shows untouched state when value is null', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('border-warm-400')
    expect(button).not.toHaveClass('bg-green-600')
    expect(button).not.toHaveClass('bg-warm-300')
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('shows done state when value is true', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('bg-green-600')
    expect(button).toHaveClass('border-green-600')
    // Checkmark SVG present
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-warm-50')
  })

  it('shows not-done state when value is false', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveClass('bg-warm-300')
    expect(button).toHaveClass('border-warm-400')
    // Dash SVG present
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-warm-600')
  })

  it('cycles null -> true on click', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('cycles true -> false on click', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('cycles false -> null on click', () => {
    const onChange = vi.fn()
    render(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('has minimum tap target size', () => {
    const { container } = render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('min-w-[56px]')
    expect(wrapper).toHaveClass('min-h-[56px]')
  })

  it('has proper ARIA attributes', () => {
    render(
      <AnchorCheckbox id="test" label="breakfast" value={null} onChange={() => {}} />
    )
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('aria-checked', 'mixed')
    expect(button).toHaveAttribute('aria-label', 'breakfast: untouched')
  })

  it('updates ARIA when value changes', () => {
    const { rerender } = render(
      <AnchorCheckbox id="test" label="breakfast" value={true} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'breakfast: done')

    rerender(
      <AnchorCheckbox id="test" label="breakfast" value={false} onChange={() => {}} />
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'breakfast: not done')
  })
})
```

### Mocking Strategies

**Supabase client mock (for hooks):**

```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

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

**Supabase client mock (for pages):**

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
    record: {
      date: '2026-03-12',
      sleep_start: null,
      sleep_end: null,
      breakfast: null,       // WAS false, NOW null
      lunch: null,           // WAS false, NOW null
      dinner: null,          // WAS false, NOW null
      cipralex_taken: null,  // WAS false, NOW null
      hygiene_done: null,    // WAS false, NOW null
      movement_done: null,   // WAS false, NOW null
      ground_maintenance_done: null,  // WAS false, NOW null
      ground_build_done: null,        // WAS false, NOW null
      note: '',
    },
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

### Test Data Factories

```typescript
// For use-daily-record.test.ts mock records
const createMockRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'rec-123',
  user_id: 'user-123',
  date: '2026-03-12',
  sleep_start: null,
  sleep_end: null,
  breakfast: null,
  lunch: null,
  dinner: null,
  cipralex_taken: null,
  hygiene_done: null,
  movement_done: null,
  ground_maintenance_done: null,
  ground_build_done: null,
  note: '',
  created_at: '2026-03-12T00:00:00Z',
  updated_at: '2026-03-12T00:00:00Z',
  ...overrides,
})

// Record with some anchors marked
const createActiveRecord = () => createMockRecord({
  breakfast: true,
  lunch: true,
  dinner: null,       // still untouched
  cipralex_taken: true,
  hygiene_done: false, // explicitly not done
  movement_done: null,
})
```

### Coverage Expectations

| Module Type | Minimum Coverage | Baseline Coverage |
|-------------|------------------|-------------------|
| Components | 70% | 100% (current) |
| Hooks | 70% | 98.72% (current) |
| Lib | 70% | 100% (current) |
| Pages | 70% | 55-87% (current) |
| **Overall** | **70%** | **92.26% (current)** |

The iteration removes more code than it adds, so coverage should remain high. The primary risk is the AnchorCheckbox rewrite -- ensure all 3 states and all 3 transitions are tested.

### Running Tests

```bash
# Run all tests
npx vitest run

# Run tests in watch mode during development
npx vitest --watch

# Run with coverage report
npx vitest run --coverage

# Run a specific test file
npx vitest run src/components/anchor-checkbox.test.tsx

# Type check (no test runner needed)
npx tsc --noEmit
```

---

## Error Handling Patterns

### Null Safety for 3-State Values

```typescript
// CORRECT: Use ?? null for anchor values (not ?? false)
value={record.breakfast ?? null}

// WRONG: This collapses null (untouched) to false (not done), losing the distinction
value={record.breakfast ?? false}
```

### API Error Display

```typescript
// Existing pattern -- no change needed
{error && (
  <p className="text-error text-sm" role="alert">{error}</p>
)}
```

### Hook Error Handling

```typescript
// Existing pattern in useDailyRecord -- no change needed
const [error, setError] = useState<string | null>(null)

// On fetch error
if (error) {
  setError(error.message)
}

// On save error
const { error } = await supabase.from('daily_records').upsert(payload, ...)
if (error) {
  setError(error.message)
}
```

### Null Column Handling in Supabase

```typescript
// Supabase JS client sends null values correctly to PostgreSQL nullable columns
// No special handling needed
const payload = {
  user_id: userId,
  date: effectiveDate,
  breakfast: null,  // Sets column to NULL in PostgreSQL
}

const { error } = await supabase
  .from('daily_records')
  .upsert(payload, { onConflict: 'user_id,date' })
```

---

## Security Patterns

### No New Attack Surface

This iteration is primarily subtraction. Security considerations:

1. **RLS policies unchanged:** `daily_records` continues to enforce `auth.uid() = user_id` for all operations
2. **No new API endpoints:** All data access remains client-side Supabase with RLS
3. **No new user input:** The 3-state toggle produces only `null`, `true`, or `false` -- all valid PostgreSQL boolean values
4. **Removed features reduce surface:** Deleting Project and Signals pages removes their Supabase queries

### Input Validation

The AnchorCheckbox produces values from a fixed cycle function. There is no freeform input that could be manipulated:

```typescript
// The cycle function is the only source of values -- always produces null, true, or false
function nextAnchorState(current: AnchorState): AnchorState {
  if (current === null) return true
  if (current === true) return false
  return null
}
```

### Auth Pattern (Existing, Unchanged)

```typescript
// Every page checks auth before rendering content
export default function PageName() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  // Show nothing until auth resolves
  if (!user) {
    return <div className="p-4" />
  }

  return <PageContent userId={user.id} />
}
```

---

## Layout Pattern (After Nav Removal)

### layout.tsx (After Modification)

```typescript
import React from 'react'
import type { Metadata, Viewport } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'SelahOS',
  description: 'Quiet instrument panel for the ground layer of life.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
```

Key changes:
- Remove `import { Nav } from '@/components/nav'` (line 4)
- Remove `<Nav />` from body (line 26)
- No replacement needed -- Today page is the only daily surface

---

## File Deletion Pattern

When deleting files, also delete:
1. The source file
2. Its co-located test file
3. The containing directory if it becomes empty (e.g., `src/app/project/`)

Verify no remaining imports reference deleted files by running:
```bash
npx tsc --noEmit
```

A TypeScript compilation error after deletion means a dangling import was missed.
