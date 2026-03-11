# Code Patterns & Conventions - Iteration 2

This document extends the Iteration 1 patterns with specific patterns for the three Iteration 2 builders. All Iteration 1 patterns remain in force. This document provides the exact code patterns builders must follow.

## File Structure (Iteration 2 additions)

```
src/
  app/
    page.tsx                # MODIFY: add project name display in ground section
    project/
      page.tsx              # REPLACE: full Ground Project screen
      project.test.tsx      # NEW: page-level tests
    signals/
      page.tsx              # REPLACE: full Weekly Signals screen
      signals.test.tsx      # NEW: page-level tests

  components/
    section-group.test.tsx  # NEW: component test
    date-header.test.tsx    # NEW: component test
    note-field.test.tsx     # NEW: component test

  hooks/
    use-ground-project.ts       # NEW: Ground Project data hook
    use-ground-project.test.ts  # NEW: hook tests
    use-weekly-signals.ts       # NEW: Weekly Signals data hook
    use-weekly-signals.test.ts  # NEW: hook tests
    use-active-project-name.ts       # NEW: thin read-only hook
    use-active-project-name.test.ts  # NEW: hook tests

  lib/
    dates.ts                # MODIFY: add formatWeekRange
    dates.test.ts           # MODIFY: add formatWeekRange tests
```

## Naming Conventions (unchanged from Iteration 1)

- Components: PascalCase (`SectionGroup.tsx`)
- Hook files: kebab-case (`use-ground-project.ts`)
- Hook exports: camelCase (`useGroundProject`)
- Test files: co-located, `.test.ts` or `.test.tsx` suffix
- Types: PascalCase (`GroundProject`, `WeeklySignal`)
- Constants: SCREAMING_SNAKE_CASE (`DEBOUNCE_MS`)

## Import Order Convention

```typescript
// 1. React imports
import React, { useState, useEffect, useCallback } from 'react'

// 2. External library imports
import type { User } from '@supabase/supabase-js'

// 3. Internal imports (path alias @/)
import { createClient } from '@/lib/supabase/client'
import { getWeekStart } from '@/lib/dates'
import type { Database } from '@/lib/types'

// 4. Relative imports (co-located)
import { useGroundProject } from './use-ground-project'
```

---

## Page Pattern (Auth Wrapper)

Every page follows this exact pattern. Both new pages MUST use it.

```typescript
'use client'

import React, { useEffect, useState } from 'react'
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
    return <div className="p-4" />
  }

  return <PageContent userId={user.id} />
}

function PageContent({ userId }: { userId: string }) {
  // Hook calls go here
  // JSX goes here
  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
      {/* Page content */}
    </div>
  )
}
```

**Key points:**
- `'use client'` directive at top
- Auth wrapper renders empty `<div className="p-4" />` while loading (no flash)
- Content component receives `userId` as prop
- Layout container: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`
- `pb-24` clears the fixed bottom nav bar

---

## Data Hook Pattern

### Reference: useDailyRecord (canonical pattern)

All new hooks follow the structure of `src/hooks/use-daily-record.ts`:

1. Type aliases extracted from `Database` interface
2. Hook function accepting `userId: string`
3. `createClient()` inside hook
4. `useState` for data, isLoading, error
5. `useEffect` for initial fetch on mount
6. `useCallback` for mutation functions
7. Return object with state + mutations

### useGroundProject Hook

**File:** `src/hooks/use-ground-project.ts`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types'

type GroundProject = Database['public']['Tables']['ground_projects']['Row']

export function useGroundProject(userId: string) {
  const supabase = createClient()
  const [project, setProject] = useState<GroundProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch active project on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('ground_projects')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else {
        setProject(data)
      }
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Update project name (immediate save, not debounced)
  const updateName = useCallback(async (name: string) => {
    if (!project || !name.trim()) return
    setError(null)

    // Optimistic update
    setProject(prev => prev ? { ...prev, name } : null)

    const { data, error } = await supabase
      .from('ground_projects')
      .update({ name })
      .eq('id', project.id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      // Revert optimistic update
      setProject(prev => prev ? { ...prev, name: project.name } : null)
    } else if (data) {
      setProject(data)
    }
  }, [project, supabase])

  // Toggle status between active and paused (immediate save)
  const toggleStatus = useCallback(async () => {
    if (!project) return
    setError(null)

    const newStatus = project.status === 'active' ? 'paused' : 'active'

    // Optimistic update
    setProject(prev => prev ? { ...prev, status: newStatus } : null)

    const { data, error } = await supabase
      .from('ground_projects')
      .update({ status: newStatus })
      .eq('id', project.id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      // Revert
      setProject(prev => prev ? { ...prev, status: project.status } : null)
    } else if (data) {
      setProject(data)
    }
  }, [project, supabase])

  // Create new project (deactivates current active project first)
  const createProject = useCallback(async (name: string) => {
    if (!name.trim()) return
    setError(null)

    const previousProject = project

    // Step 1: Deactivate current active project
    if (previousProject) {
      const { error: deactivateError } = await supabase
        .from('ground_projects')
        .update({ status: 'completed' })
        .eq('id', previousProject.id)

      if (deactivateError) {
        setError(deactivateError.message)
        return
      }
    }

    // Step 2: Insert new project
    const { data, error } = await supabase
      .from('ground_projects')
      .insert({ user_id: userId, name, status: 'active' })
      .select()
      .single()

    if (error) {
      setError(error.message)
      // Re-activate previous project if insert failed
      if (previousProject) {
        await supabase
          .from('ground_projects')
          .update({ status: 'active' })
          .eq('id', previousProject.id)
        setProject(previousProject)
      }
    } else if (data) {
      setProject(data)
    }
  }, [project, userId, supabase])

  return { project, isLoading, error, updateName, toggleStatus, createProject }
}
```

**Key design decisions:**
- **Immediate save** for all mutations (not debounced). Project edits are infrequent, and immediate save prevents data loss.
- **Optimistic updates** with revert on error, matching the Today screen pattern.
- **createProject** uses two sequential operations: deactivate old, insert new. If insert fails, it re-activates the old project.
- Status toggle only switches between `active` and `paused`. Creating a new project sets old to `completed`.
- No delete functionality (schema has no DELETE RLS policy).

### useWeeklySignals Hook

**File:** `src/hooks/use-weekly-signals.ts`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekStart } from '@/lib/dates'
import type { Database } from '@/lib/types'

type WeeklySignal = Database['public']['Tables']['weekly_signals']['Row']

const EMPTY_SIGNAL = {
  financial_note: '',
  sleep_state: '',
  note: '',
}

export function useWeeklySignals(userId: string) {
  const supabase = createClient()
  const weekStart = getWeekStart()
  const [currentSignal, setCurrentSignal] = useState<Partial<WeeklySignal>>({
    ...EMPTY_SIGNAL,
    week_start: weekStart,
  })
  const [recentSignals, setRecentSignals] = useState<WeeklySignal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current week signal + recent history on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)

      // Fetch current week
      const { data: current, error: currentError } = await supabase
        .from('weekly_signals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (currentError) {
        setError(currentError.message)
        setIsLoading(false)
        return
      }

      if (current) {
        setCurrentSignal(current)
      }

      // Fetch recent signals (last 4 weeks, excluding current)
      const { data: recent, error: recentError } = await supabase
        .from('weekly_signals')
        .select('*')
        .eq('user_id', userId)
        .neq('week_start', weekStart)
        .order('week_start', { ascending: false })
        .limit(4)

      if (recentError) {
        setError(recentError.message)
      } else if (recent) {
        setRecentSignals(recent)
      }

      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, weekStart])

  // Update a field in the current signal (local state only, no save)
  const updateField = useCallback(
    (field: 'financial_note' | 'sleep_state' | 'note', value: string) => {
      setCurrentSignal(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  // Explicit save (upsert current week's signal)
  const save = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    const { data, error } = await supabase
      .from('weekly_signals')
      .upsert(
        {
          user_id: userId,
          week_start: weekStart,
          financial_note: currentSignal.financial_note ?? '',
          sleep_state: currentSignal.sleep_state ?? '',
          note: currentSignal.note ?? '',
        },
        { onConflict: 'user_id,week_start' }
      )
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else if (data) {
      setCurrentSignal(data)
    }

    setIsSaving(false)
  }, [userId, weekStart, currentSignal, supabase])

  return {
    currentSignal,
    recentSignals,
    weekStart,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
  }
}
```

**Key design decisions:**
- **Explicit save** with a save button, not auto-save. Signals are weekly reflections -- deliberate, not rapid. A save button provides clear feedback and matches the weekly cadence.
- `updateField` only updates local state. The `save` function upserts to Supabase.
- `isSaving` separate from `isLoading` so the save button can show saving state.
- Recent signals exclude the current week and show last 4 weeks.
- Uses `getWeekStart()` from `src/lib/dates.ts` (already implemented and tested).
- Upsert on `(user_id, week_start)` is idempotent -- safe to call repeatedly.

### useActiveProjectName Hook

**File:** `src/hooks/use-active-project-name.ts`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useActiveProjectName(userId: string) {
  const supabase = createClient()
  const [projectName, setProjectName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data } = await supabase
        .from('ground_projects')
        .select('name')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      setProjectName(data?.name ?? null)
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { projectName, isLoading }
}
```

**Key design decisions:**
- Thin, read-only hook. Only fetches the project name, not the full project record.
- Independent from `useGroundProject` -- Builder 3 does not depend on Builder 1.
- No error state needed. If fetch fails, `projectName` stays null (graceful absence).
- No mutation functions. This hook is for display only.

---

## Utility Pattern: formatWeekRange

**File:** `src/lib/dates.ts` (add to existing file)

```typescript
/**
 * Formats a week start date (YYYY-MM-DD Monday) as a display range.
 * Example: "2026-03-09" -> "Mar 9 -- 15"
 * Handles month boundaries: "2026-03-30" -> "Mar 30 -- Apr 5"
 */
const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatWeekRange(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const monday = new Date(year, month - 1, day)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startMonth = MONTH_ABBREVS[monday.getMonth()]
  const endMonth = MONTH_ABBREVS[sunday.getMonth()]

  if (startMonth === endMonth) {
    return `${startMonth} ${monday.getDate()} \u2013 ${sunday.getDate()}`
  }

  return `${startMonth} ${monday.getDate()} \u2013 ${endMonth} ${sunday.getDate()}`
}
```

**Key decisions:**
- Uses explicit `MONTH_ABBREVS` array instead of `toLocaleDateString()` to avoid locale sensitivity in tests.
- Uses en-dash (`\u2013`) for range separator, not double hyphen.
- Handles month boundary correctly (Mar 30 -- Apr 5).

**Tests to add in `src/lib/dates.test.ts`:**

```typescript
describe('formatWeekRange', () => {
  it('formats a week within a single month', () => {
    expect(formatWeekRange('2026-03-09')).toBe('Mar 9 \u2013 15')
  })

  it('formats a week spanning two months', () => {
    expect(formatWeekRange('2026-03-30')).toBe('Mar 30 \u2013 Apr 5')
  })

  it('formats a week spanning December to January', () => {
    expect(formatWeekRange('2026-12-28')).toBe('Dec 28 \u2013 Jan 3')
  })

  it('formats first week of a month', () => {
    expect(formatWeekRange('2026-04-06')).toBe('Apr 6 \u2013 12')
  })
})
```

---

## Page Implementation Patterns

### Ground Project Page

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGroundProject } from '@/hooks/use-ground-project'
import { SectionGroup } from '@/components/section-group'
import type { User } from '@supabase/supabase-js'

export default function ProjectPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  if (!user) {
    return <div className="p-4" />
  }

  return <ProjectContent userId={user.id} />
}

function ProjectContent({ userId }: { userId: string }) {
  const { project, isLoading, error, updateName, toggleStatus, createProject } =
    useGroundProject(userId)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  // ... render logic
}
```

**UX decisions for the Project page:**
- Page header: lowercase "ground project" matching SectionGroup label style
- Active project shows: name (tap to edit inline), status badge, start date
- Status toggle: text button showing "active" or "paused", tap to switch
- "new project" as quiet text button at bottom
- Create flow: inline input + confirm, no modal or separate route
- Empty state: "no active project" with prompt to create
- No delete functionality
- Start date displayed as "since Mar 9, 2026" format
- Name editing: tap name to enter edit mode, input with save/cancel

### Weekly Signals Page

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWeeklySignals } from '@/hooks/use-weekly-signals'
import { formatWeekRange } from '@/lib/dates'
import { SectionGroup } from '@/components/section-group'
import { NoteField } from '@/components/note-field'
import type { User } from '@supabase/supabase-js'

export default function SignalsPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  if (!user) {
    return <div className="p-4" />
  }

  return <SignalsContent userId={user.id} />
}

function SignalsContent({ userId }: { userId: string }) {
  const {
    currentSignal,
    recentSignals,
    weekStart,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
  } = useWeeklySignals(userId)

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 pt-5 pb-24"><div className="h-8" /></div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
      <h1 className="text-xl text-warm-800">{formatWeekRange(weekStart)}</h1>

      {error && (
        <p className="text-error text-sm" role="alert">{error}</p>
      )}

      <SectionGroup label="financial">
        <NoteField
          value={currentSignal.financial_note ?? ''}
          onChange={(v) => updateField('financial_note', v)}
        />
      </SectionGroup>

      <SectionGroup label="sleep">
        <NoteField
          value={currentSignal.sleep_state ?? ''}
          onChange={(v) => updateField('sleep_state', v)}
        />
      </SectionGroup>

      <SectionGroup label="note">
        <NoteField
          value={currentSignal.note ?? ''}
          onChange={(v) => updateField('note', v)}
        />
      </SectionGroup>

      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        className="w-full p-3 rounded-lg bg-green-600 text-warm-50 text-base disabled:opacity-50"
      >
        {isSaving ? 'saving...' : 'save'}
      </button>

      {recentSignals.length > 0 && (
        <div className="pt-4 border-t border-warm-300 space-y-4">
          <h2 className="text-sm text-warm-600 uppercase tracking-wide">recent weeks</h2>
          {recentSignals.map((signal) => (
            <div key={signal.id} className="space-y-1">
              <p className="text-sm text-warm-600">{formatWeekRange(signal.week_start)}</p>
              {signal.financial_note && (
                <p className="text-sm text-warm-700 truncate">{signal.financial_note}</p>
              )}
              {signal.sleep_state && (
                <p className="text-sm text-warm-700 truncate">{signal.sleep_state}</p>
              )}
              {signal.note && (
                <p className="text-sm text-warm-700 truncate">{signal.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**UX decisions for the Signals page:**
- Week header shows current week range: "Mar 9 -- 15"
- Three labeled text areas using SectionGroup + NoteField (reusing existing components)
- Labels: "financial", "sleep", "note" (lowercase, matching SectionGroup convention)
- Explicit "save" button styled like login button (`bg-green-600 text-warm-50`)
- Save button shows "saving..." while in progress
- Below form: divider + "recent weeks" section
- Each past week shows: week range + truncated preview of non-empty fields
- Past weeks are read-only
- Show last 4 weeks of history

### Today Screen Enhancement

**Modification to `src/app/page.tsx`:**

```typescript
// Add import
import { useActiveProjectName } from '@/hooks/use-active-project-name'

// In TodayContent component, add hook call:
function TodayContent({ userId }: { userId: string }) {
  const { record, error, updateField, setSleepStart, setSleepEnd } = useDailyRecord(userId)
  const { projectName } = useActiveProjectName(userId)

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
      {/* ... existing sections ... */}

      <SectionGroup label="ground">
        {projectName && (
          <p className="text-sm text-warm-600">{projectName}</p>
        )}
        <div className="flex justify-around">
          {/* existing checkboxes unchanged */}
        </div>
      </SectionGroup>

      {/* ... rest unchanged ... */}
    </div>
  )
}
```

**Key points:**
- Project name displayed in `text-sm text-warm-600` (muted, not attention-grabbing)
- Uses `text-warm-600` (not `text-warm-500`) for contrast compliance
- If no active project, renders nothing (graceful absence, not "no project" text)
- Project name appears above the ground checkboxes, inside the SectionGroup

---

## Accessibility Fix: Contrast Compliance

**Change:** Replace `text-warm-500` with `text-warm-600` in the following locations:

1. **`src/components/section-group.tsx`** line 11:
   - Before: `<h2 className="text-sm text-warm-500 uppercase tracking-wide">`
   - After: `<h2 className="text-sm text-warm-600 uppercase tracking-wide">`

2. **`src/components/nav.tsx`** line 31 (inactive nav items):
   - Before: `` ${isActive ? 'text-green-600' : 'text-warm-500'} ``
   - After: `` ${isActive ? 'text-green-600' : 'text-warm-600'} ``

**Rationale:** `text-warm-500` (#8C8279) on `bg-warm-100` (#F5F3F0) has approximately 3.2:1 contrast ratio, failing WCAG AA 4.5:1 minimum. `text-warm-600` (#6B6158) achieves approximately 5.1:1, passing AA.

---

## Testing Patterns

### Test File Structure

All tests follow this structure:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
// or for components:
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Module-level mocks
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ /* mock shape */ }),
}))

import { hookOrComponent } from './target-file'

describe('HookOrComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup mock chains
  })

  afterEach(() => {
    vi.useRealTimers()
    // Restore any modified globals
  })

  it('does something specific', () => {
    // Arrange, Act, Assert
  })
})
```

### Supabase Mock Pattern for ground_projects

```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
const mockSelectAfterMutation = vi.fn().mockReturnValue({ single: mockSingle })
const mockUpdate = vi.fn().mockReturnValue({ select: mockSelectAfterMutation })
const mockInsert = vi.fn().mockReturnValue({ select: mockSelectAfterMutation })

function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    update: mockUpdate,
    insert: mockInsert,
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

**Key difference from daily_records mock:** Adds `update` and `insert` to the chain (ground_projects uses update/insert rather than upsert).

### Supabase Mock Pattern for weekly_signals

```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
const mockSelectAfterUpsert = vi.fn().mockReturnValue({ single: mockSingle })
const mockUpsert = vi.fn().mockReturnValue({ select: mockSelectAfterUpsert })
const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })

function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
    order: mockOrder,
    limit: mockLimit,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.neq.mockReturnValue(chain)
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

vi.mock('@/lib/dates', () => ({
  getWeekStart: () => '2026-03-09',
  formatWeekRange: (ws: string) => `Mar 9 \u2013 15`,
}))
```

**Key differences from daily_records mock:** Adds `neq`, `order`, `limit` to the chain. Also mocks `@/lib/dates` to control week calculation.

### Supabase Mock Pattern for useActiveProjectName (thin hook)

```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

function createFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  return vi.fn().mockReturnValue(chain)
}

const mockFrom = createFromMock()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))
```

### Component Test Pattern (for SectionGroup, DateHeader, NoteField)

```typescript
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionGroup } from './section-group'

describe('SectionGroup', () => {
  it('renders the label as uppercase heading', () => {
    render(<SectionGroup label="sleep"><div>content</div></SectionGroup>)
    expect(screen.getByText('sleep')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('sleep')
  })

  it('renders children', () => {
    render(<SectionGroup label="test"><p>child content</p></SectionGroup>)
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('has uppercase tracking-wide styling on label', () => {
    render(<SectionGroup label="food"><div /></SectionGroup>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveClass('uppercase')
    expect(heading).toHaveClass('tracking-wide')
  })

  it('uses section element for semantic grouping', () => {
    const { container } = render(<SectionGroup label="test"><div /></SectionGroup>)
    expect(container.querySelector('section')).toBeInTheDocument()
  })
})
```

### Page-Level Test Pattern

```typescript
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock Supabase client (full chain for page needs)
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
// ... full mock setup

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  }),
}))

import PageComponent from './page'

describe('PageName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup mock chains
  })

  it('renders loading state initially', () => {
    // Override getUser to not resolve immediately
    // Verify empty div renders
  })

  it('displays content after user loads', async () => {
    render(<PageComponent />)
    await waitFor(() => {
      expect(screen.getByText('expected text')).toBeInTheDocument()
    })
  })
})
```

### Test Data Factories

```typescript
// Reusable mock data for tests

export function createMockGroundProject(overrides: Partial<GroundProject> = {}): GroundProject {
  return {
    id: 'project-123',
    user_id: 'user-123',
    name: 'Test Project',
    status: 'active',
    start_date: '2026-03-01',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockWeeklySignal(overrides: Partial<WeeklySignal> = {}): WeeklySignal {
  return {
    id: 'signal-123',
    user_id: 'user-123',
    week_start: '2026-03-09',
    financial_note: '',
    sleep_state: '',
    note: '',
    created_at: '2026-03-09T00:00:00.000Z',
    updated_at: '2026-03-09T00:00:00.000Z',
    ...overrides,
  }
}
```

Define these inline within each test file (not in a shared factory file). Keep tests self-contained.

### Coverage Expectations

| Module | Minimum Coverage | Target |
|--------|-----------------|--------|
| Hooks (use-ground-project, use-weekly-signals, use-active-project-name) | 90% | 95% |
| Pages (project, signals) | 80% | 85% |
| Components (section-group, date-header, note-field) | 90% | 100% |
| Utilities (dates.ts formatWeekRange) | 100% | 100% |

---

## Error Handling Patterns

### Hook Error State

All hooks expose `error: string | null`. The pattern:

```typescript
const [error, setError] = useState<string | null>(null)

// Before mutation
setError(null)

// After mutation
if (error) {
  setError(error.message)
}
```

### Page Error Display

All pages display errors the same way:

```typescript
{error && (
  <p className="text-error text-sm" role="alert">{error}</p>
)}
```

- Uses `role="alert"` for screen reader announcement
- Uses `text-error` (#B85C5C) color
- `text-sm` size, placed below the header

### Optimistic Update Revert

When a mutation fails, revert the optimistic update:

```typescript
const previous = project  // Save before mutation

// Optimistic update
setProject(prev => prev ? { ...prev, name: newName } : null)

const { error } = await supabase.from('ground_projects').update({ name: newName }).eq('id', project.id).select().single()

if (error) {
  setError(error.message)
  setProject(previous)  // Revert
}
```

---

## Security Patterns

### Input Validation

SelahOS has minimal input surfaces. Validation is done at two levels:

1. **Database constraints** -- the schema enforces:
   - `ground_projects.status` CHECK: must be one of `'active', 'paused', 'completed', 'dropped'`
   - `ground_projects` UNIQUE on `(user_id, name)`: no duplicate project names
   - `weekly_signals` UNIQUE on `(user_id, week_start)`: idempotent upsert
   - All `TEXT NOT NULL DEFAULT ''`: no null text fields

2. **Application-level** -- hooks validate before sending:
   - `updateName`: reject empty strings with `if (!name.trim()) return`
   - `createProject`: reject empty strings with `if (!name.trim()) return`
   - NoteField: `maxLength={500}` on the textarea element

### Auth Verification

Every page verifies the user session before rendering content:

```typescript
useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setUser(user)
  })
}, [supabase.auth])

if (!user) {
  return <div className="p-4" />
}
```

The middleware (`middleware.ts`) handles route protection. Pages never need to redirect unauthenticated users -- that is the middleware's job.

### RLS Enforcement

All Supabase queries include `user_id` in the payload. RLS policies ensure:
- Users can only SELECT/INSERT/UPDATE their own rows
- No DELETE operations are possible (no DELETE policy)
- The `updated_at` field is auto-set by trigger (do not include in upsert payloads)

### Environment Variables

Only two env vars exist, both prefixed `NEXT_PUBLIC_` (safe for client exposure):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is safe to expose because RLS enforces all access control. Never use or expose the `SUPABASE_SERVICE_ROLE_KEY`.

---

## CI/CD Patterns

### Branch Strategy

- `main` -- production branch (protected, CI must pass)
- Feature branches: `feature/ground-project`, `feature/weekly-signals`, `feature/today-enhancement`

### Existing CI Pipeline (no changes needed)

```yaml
# .github/workflows/ci.yml (already exists, unchanged)
jobs:
  quality:   # TypeScript check + ESLint
  test:      # vitest run --coverage, upload artifact
  build:     # next build with placeholder env vars
```

### Pre-merge Checklist

Before merging any builder's work:
1. `npm run type-check` passes
2. `npm run lint` passes
3. `npm run test` passes (all tests)
4. `npm run build` succeeds
5. No `console.log` statements in production code (use them only in error handlers if needed)

---

## Performance Patterns

### Minimal Re-renders

Hooks use `useCallback` for all mutation functions to prevent unnecessary re-renders:

```typescript
const updateName = useCallback(async (name: string) => {
  // ...
}, [project, supabase])
```

### No Unnecessary Loading States

- Today screen and Project screen show empty `<div className="p-4" />` while loading (no skeleton, no spinner -- matches the calm aesthetic)
- Signals screen can show the same empty div during load
- Save button shows "saving..." text change only (no spinner animation)

### Single Query Optimization

- `useActiveProjectName` selects only `name` field: `.select('name')` not `.select('*')`
- Recent signals limited to 4: `.limit(4)`
- Both reduce payload size for the single-user, low-volume use case

---

## Styling Conventions

### Container

All page content uses: `max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6`

### Headings

- Page title: `<h1 className="text-xl text-warm-800">`
- Section label: via SectionGroup (`<h2 className="text-sm text-warm-600 uppercase tracking-wide">`)

### Buttons

- Primary action (save): `bg-green-600 text-warm-50 text-base p-3 rounded-lg`
- Quiet action (new project, toggle): `text-warm-600 text-sm` or similar muted treatment
- Disabled state: `disabled:opacity-50`
- All buttons: `type="button"` unless inside a form

### Input Fields

- Use existing NoteField component for text areas
- For single-line input: `w-full p-3 rounded-lg border border-warm-300 bg-warm-50 text-warm-700 text-base`
- Placeholder text: `placeholder:text-warm-400`

### Status Display

- Active status: `text-green-600` (matches nav active state)
- Paused status: `text-warm-500` (muted)
- Start date: `text-sm text-warm-600`

### Dividers

- Between sections: `border-t border-warm-300` with `pt-4` spacing

### Recent Signals History

- Week range label: `text-sm text-warm-600`
- Content preview: `text-sm text-warm-700 truncate`
- Each entry separated by `space-y-1`, entries separated by `space-y-4`
