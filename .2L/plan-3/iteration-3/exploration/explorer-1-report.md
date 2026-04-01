# Explorer 1 Report: Architecture & Structure Deep-Read (Iteration 3)

## Executive Summary

Every file targeted for deletion or modification has been read in full. This report documents the exact current state of each file -- imports, exports, line numbers, dependencies, and data structures -- so builders can make surgical changes with zero ambiguity. The codebase is small, well-structured, and has clean dependency boundaries that make this simplification safe.

---

## Part 1: Files to DELETE (10 files)

### 1.1 `src/app/project/page.tsx` (173 lines)

**Imports (lines 1-7):**
- `React, useEffect, useState` from `react`
- `createClient` from `@/lib/supabase/client`
- `useGroundProject` from `@/hooks/use-ground-project`
- `SectionGroup` from `@/components/section-group` (SHARED -- also used by Today, Signals)
- `User` type from `@supabase/supabase-js`

**Exports:**
- `default function ProjectPage()` (line 9) -- default export, used only by Next.js routing

**Internal components:**
- `ProjectContent` (line 35) -- internal, not exported
- `formatStartDate` (line 26) -- internal helper

**Who imports this:** No file imports it. Only used via Next.js App Router (`/project` route).

**Safe to delete:** YES -- standalone page, no consumers.

---

### 1.2 `src/app/project/project.test.tsx` (205 lines)

**Mocks:** Supabase client chain mock, imports `ProjectPage` from `./page`

**Safe to delete:** YES -- test for deleted page.

---

### 1.3 `src/app/signals/page.tsx` (104 lines)

**Imports (lines 1-9):**
- `React, useEffect, useState` from `react`
- `createClient` from `@/lib/supabase/client`
- `useWeeklySignals` from `@/hooks/use-weekly-signals` (ONLY consumer)
- `formatWeekRange` from `@/lib/dates` (ONLY consumer in production code)
- `SectionGroup` from `@/components/section-group` (SHARED)
- `NoteField` from `@/components/note-field` (SHARED -- also used by Today)
- `User` type from `@supabase/supabase-js`

**Exports:**
- `default function SignalsPage()` (line 11)

**Who imports this:** No file imports it. Only used via Next.js App Router (`/signals` route).

**Safe to delete:** YES -- standalone page, no consumers.

**Side effect:** After deletion, `formatWeekRange` and `getWeekStart` in `dates.ts` become dead code. However, they should be KEPT because the Ground weekly view may need them, and they are tested.

---

### 1.4 `src/app/signals/signals.test.tsx` (208 lines)

**Mocks:** Supabase client, `@/lib/dates` mock, imports `SignalsPage` from `./page`

**Safe to delete:** YES -- test for deleted page.

---

### 1.5 `src/hooks/use-ground-project.ts` (132 lines)

**Imports (lines 1-5):**
- `useState, useEffect, useCallback` from `react`
- `createClient` from `@/lib/supabase/client`
- `Database` type from `@/lib/types`

**Exports:**
- `function useGroundProject(userId: string)` (line 9) -- named export

**Return value (line 130):**
```typescript
{ project, isLoading, error, updateName, toggleStatus, createProject }
```

**Internal types (line 7):**
```typescript
type GroundProject = Database['public']['Tables']['ground_projects']['Row']
```

**Who imports this:**
- `src/app/project/page.tsx` line 5 (being deleted)
- `src/hooks/use-ground-project.test.ts` line 39 (being deleted)

**Safe to delete:** YES -- only consumers are being deleted.

---

### 1.6 `src/hooks/use-ground-project.test.ts` (407 lines)

**Imports:** Supabase chain mock, `useGroundProject` from `./use-ground-project`

**Safe to delete:** YES -- test for deleted hook.

---

### 1.7 `src/hooks/use-weekly-signals.ts` (121 lines)

**Imports (lines 1-6):**
- `useState, useEffect, useCallback` from `react`
- `createClient` from `@/lib/supabase/client`
- `getWeekStart` from `@/lib/dates`
- `Database` type from `@/lib/types`

**Exports:**
- `function useWeeklySignals(userId: string)` (line 16) -- named export

**Return value (line 110-119):**
```typescript
{ currentSignal, recentSignals, weekStart, isLoading, isSaving, error, updateField, save }
```

**Internal types (line 8):**
```typescript
type WeeklySignal = Database['public']['Tables']['weekly_signals']['Row']
```

**Who imports this:**
- `src/app/signals/page.tsx` line 5 (being deleted)
- `src/hooks/use-weekly-signals.test.ts` line 45 (being deleted)

**Safe to delete:** YES -- only consumers are being deleted.

---

### 1.8 `src/hooks/use-weekly-signals.test.ts` (326 lines)

**Imports:** Supabase chain mock, `@/lib/dates` mock, `useWeeklySignals` from `./use-weekly-signals`

**Safe to delete:** YES -- test for deleted hook.

---

### 1.9 `src/hooks/use-active-project-name.ts` (31 lines)

**Imports (lines 1-4):**
- `useState, useEffect` from `react`
- `createClient` from `@/lib/supabase/client`

**Exports:**
- `function useActiveProjectName(userId: string)` (line 6) -- named export

**Return value (line 29):**
```typescript
{ projectName, isLoading }
```

**Who imports this:**
- **`src/app/page.tsx` line 6** -- CRITICAL DEPENDENCY
- `src/hooks/use-active-project-name.test.ts` line 26 (being deleted)
- `src/app/page.test.tsx` line 41 (mock)

**BLOCKING DEPENDENCY:** Cannot delete this file without first removing the import from `src/app/page.tsx` (line 6) and usage on line 39. Also must update `src/app/page.test.tsx` to remove the mock on lines 41-46 and the test on lines 83-89.

---

### 1.10 `src/hooks/use-active-project-name.test.ts` (95 lines)

**Imports:** Supabase chain mock, `useActiveProjectName` from `./use-active-project-name`

**Safe to delete:** YES -- test for deleted hook.

---

## Part 2: Files to MODIFY

### 2.1 `src/lib/types.ts` (137 lines)

**Current structure:** Single `Database` interface with 3 table definitions:

**`daily_records` (lines 12-68):**
- Row type (lines 13-30): All anchor fields are `boolean` (not nullable)
  - `breakfast: boolean` (line 19)
  - `lunch: boolean` (line 20)
  - `dinner: boolean` (line 21)
  - `cipralex_taken: boolean` (line 22)
  - `hygiene_done: boolean` (line 23)
  - `movement_done: boolean` (line 24)
  - `ground_maintenance_done: boolean` (line 25)
  - `ground_build_done: boolean` (line 26)
  - `sleep_start: string | null` (line 17) -- already nullable
  - `sleep_end: string | null` (line 18) -- already nullable
  - `note: string` (line 27)
- Insert type (lines 31-48): All anchor fields are `boolean` (optional)
- Update type (lines 49-66): All anchor fields are `boolean` (optional)

**`ground_projects` (lines 69-98):** Row, Insert, Update types for project table.

**`weekly_signals` (lines 99-132):** Row, Insert, Update types for signals table.

**Required changes:**
1. Change 8 anchor boolean fields in Row to `boolean | null` (lines 19-26)
2. Change 8 anchor boolean fields in Insert to `boolean | null` (lines 37-44)
3. Change 8 anchor boolean fields in Update to `boolean | null` (lines 55-62)
4. Remove `ground_projects` table definition (lines 69-98) -- OPTIONAL, no code will reference it
5. Remove `weekly_signals` table definition (lines 99-132) -- OPTIONAL, no code will reference it

**Who imports this:**
- `src/hooks/use-daily-record.ts` line 6 (uses `Database` type)
- `src/hooks/use-ground-integrity.ts` line 6 (uses `Database` type)
- `src/hooks/use-ground-project.ts` line 5 (being deleted)
- `src/hooks/use-weekly-signals.ts` line 6 (being deleted)
- `src/lib/types.test.ts` line 2 (needs update)

---

### 2.2 `src/hooks/use-daily-record.ts` (163 lines)

**Imports (lines 1-6):**
- `useState, useEffect, useRef, useCallback` from `react`
- `createClient` from `@/lib/supabase/client`
- `getEffectiveDate` from `@/lib/dates`
- `Database` type from `@/lib/types`

**Internal types (lines 8-9):**
```typescript
type DailyRecord = Database['public']['Tables']['daily_records']['Row']
type DailyRecordInsert = Database['public']['Tables']['daily_records']['Insert']
```

**EMPTY_RECORD constant (lines 13-26):**
```typescript
const EMPTY_RECORD: Omit<DailyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  date: '',
  sleep_start: null,
  sleep_end: null,
  breakfast: false,       // Must change to null
  lunch: false,           // Must change to null
  dinner: false,          // Must change to null
  cipralex_taken: false,  // Must change to null
  hygiene_done: false,    // Must change to null
  movement_done: false,   // Must change to null
  ground_maintenance_done: false,  // Must change to null
  ground_build_done: false,        // Must change to null
  note: '',
}
```

**updateField function (lines 100-107):**
```typescript
const updateField = useCallback(
  (field: keyof DailyRecord, value: DailyRecord[keyof DailyRecord]) => {
    setRecord((prev) => ({ ...prev, [field]: value }))
    pendingUpdates.current[field] = value as never
    scheduleSave()
  },
  [scheduleSave]
)
```

The type signature `value: DailyRecord[keyof DailyRecord]` automatically adjusts when `DailyRecord` types change to `boolean | null`, so no explicit change is needed on the updateField signature itself.

**Return value (lines 153-161):**
```typescript
{ record, isLoading, error, effectiveDate, updateField, setSleepStart, setSleepEnd }
```

**Required changes:**
1. Lines 17-24: Change all `false` defaults to `null` in `EMPTY_RECORD`
2. Type definitions on lines 8-9 will auto-update when `types.ts` changes

---

### 2.3 `src/components/anchor-checkbox.tsx` (44 lines)

**Full current implementation:**

**Props interface (lines 5-10):**
```typescript
interface AnchorCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}
```

**Component (lines 12-44):**
- Uses `<label>` wrapping a hidden `<input type="checkbox">` with `sr-only peer` class
- Visual indicator: `<span>` with `peer-checked:bg-green-600` and `peer-checked:border-green-600`
- Check icon: SVG rendered conditionally when `checked` is true (lines 29-38)
- Tap target: `min-w-[56px] min-h-[56px]`
- Label text: `<span className="text-sm text-warm-600">{label}</span>`

**Required changes for tri-state:**
The component must change from a binary checkbox to a tri-state button. The new interface should be:

```typescript
interface AnchorCheckboxProps {
  label: string
  value: boolean | null  // null=untouched, true=done, false=not_done
  onChange: (value: boolean | null) => void
  id: string
}
```

**Cycling logic:** null -> true -> false -> null (untouched -> done -> not done -> untouched)

**Visual states needed:**
- `null` (untouched): Empty circle, border only (`border-warm-400`)
- `true` (done): Green filled circle with checkmark (`bg-green-600`)
- `false` (not done): Circle with dash/line (`border-warm-400` or similar neutral)

**Implementation note:** The `<input type="checkbox">` and `peer-checked:` pattern must be replaced entirely. Use a `<button>` element with appropriate ARIA attributes (`role="checkbox"`, `aria-checked="true|false|mixed"` or just `aria-label` with state).

**Who imports this:**
- `src/app/page.tsx` line 8 -- 8 usage sites (lines 66-69, 72-75, 78-81, 89-91, 99-102, 105-108, 120-123, 126-129)
- `src/components/anchor-checkbox.test.tsx` line 4

---

### 2.4 `src/components/nav.tsx` (42 lines)

**Full current implementation:**

**Imports (lines 1-5):**
```typescript
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
```

**NAV_ITEMS constant (lines 7-12):**
```typescript
const NAV_ITEMS = [
  { href: '/', label: 'Today' },
  { href: '/project', label: 'Project' },
  { href: '/signals', label: 'Signals' },
  { href: '/ground', label: 'Ground' },
]
```

**Component (lines 14-41):**
- Fixed bottom nav with `bg-warm-200` background
- `pb-[env(safe-area-inset-bottom)]` for mobile safe area
- Max width `max-w-lg mx-auto`
- Active state: `text-green-600`, inactive: `text-warm-600`
- Height: `h-14`
- Uses `usePathname()` for active detection
- ARIA: `aria-label="Main navigation"`

**Required changes:** Remove Project, Signals, Ground from `NAV_ITEMS`. With only Today remaining, the nav serves no purpose. Two approaches:

**Option A (minimal):** Remove 3 items from `NAV_ITEMS`, keep nav with single "Today" item.
**Option B (recommended):** Remove nav entirely since single-tab nav is functionally useless. This requires also updating `src/app/layout.tsx` (line 26) to remove `<Nav />`.

**Who imports this:**
- `src/app/layout.tsx` line 4

---

### 2.5 `src/app/page.tsx` (144 lines) -- Today Page

**Imports (lines 1-12):**
```typescript
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDailyRecord } from '@/hooks/use-daily-record'
import { useActiveProjectName } from '@/hooks/use-active-project-name'  // LINE 6 -- DELETE
import { DateHeader } from '@/components/date-header'
import { AnchorCheckbox } from '@/components/anchor-checkbox'
import { SleepButton } from '@/components/sleep-button'
import { NoteField } from '@/components/note-field'
import { SectionGroup } from '@/components/section-group'
import type { User } from '@supabase/supabase-js'
```

**TodayContent component (line 31):**
- Line 39: `const { projectName } = useActiveProjectName(userId)` -- DELETE THIS LINE
- Lines 116-118: `{projectName && (<p className="text-sm text-warm-600">{projectName}</p>)}` -- DELETE THESE LINES

**AnchorCheckbox usage sites (all need prop change from `checked` to `value`):**

| Lines | ID | Label | Current prop | Field |
|-------|-----|-------|-------------|-------|
| 66-69 | `breakfast` | `breakfast` | `checked={record.breakfast ?? false}` | `breakfast` |
| 72-75 | `lunch` | `lunch` | `checked={record.lunch ?? false}` | `lunch` |
| 78-81 | `dinner` | `dinner` | `checked={record.dinner ?? false}` | `dinner` |
| 89-91 | `cipralex` | `cipralex` | `checked={record.cipralex_taken ?? false}` | `cipralex_taken` |
| 99-102 | `hygiene` | `hygiene` | `checked={record.hygiene_done ?? false}` | `hygiene_done` |
| 105-108 | `movement` | `movement` | `checked={record.movement_done ?? false}` | `movement_done` |
| 120-123 | `maintenance` | `maintenance` | `checked={record.ground_maintenance_done ?? false}` | `ground_maintenance_done` |
| 126-129 | `build` | `build` | `checked={record.ground_build_done ?? false}` | `ground_build_done` |

**Required changes:**
1. Delete line 6 (`useActiveProjectName` import)
2. Delete line 39 (`const { projectName } = useActiveProjectName(userId)`)
3. Delete lines 116-118 (project name display)
4. Change all 8 AnchorCheckbox usages: `checked={record.X ?? false}` -> `value={record.X ?? null}` and `onChange={(v) => updateField('X', v)}` (onChange signature changes to cycle through null/true/false)

**CRITICAL:** The `?? false` fallback on each checkbox currently converts null/undefined to false. With tri-state, this must become `?? null` so untouched state flows through. The onChange callback currently passes `boolean` but will now pass `boolean | null`.

---

### 2.6 `src/app/ground/page.tsx` (41 lines)

**Full current implementation read.**

**Imports (lines 1-7):**
```typescript
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGroundIntegrity } from '@/hooks/use-ground-integrity'
import { IntegrityGrid } from '@/components/integrity-grid'
import type { User } from '@supabase/supabase-js'
```

**GroundContent (line 26):** Uses `useGroundIntegrity(userId)` to get `{ days, error }`.

**Required changes:** NONE for the core page. The Ground page stays as-is. The `recordToIntegrity` function in `use-ground-integrity.ts` uses `!!` coercion which correctly handles `null` (since `!!null === false`). No code changes needed for the tri-state migration.

**Access restriction decision:** Per vision and master exploration, removing Ground from the nav is sufficient. The page at `/ground` remains accessible via direct URL. No time-gating logic needed.

---

### 2.7 `src/components/integrity-grid.tsx` (57 lines)

**Imports (lines 1-2):**
```typescript
import React from 'react'
import type { DayIntegrity } from '@/hooks/use-ground-integrity'
```

**ANCHORS constant (line 4):**
```typescript
const ANCHORS = ['sleep', 'food', 'medication', 'body', 'ground'] as const
```

**Visual logic (lines 41-49):** Uses `day[anchor]` as boolean to set `bg-green-600` (filled) or `bg-warm-300` (empty). With tri-state, `DayIntegrity` fields remain boolean (the `recordToIntegrity` mapping handles the conversion), so this component needs NO changes.

**Required changes:** NONE.

---

### 2.8 `src/hooks/use-ground-integrity.ts` (93 lines)

**Exported types (line 10-17):**
```typescript
export interface DayIntegrity {
  date: string
  sleep: boolean
  food: boolean
  medication: boolean
  body: boolean
  ground: boolean
}
```

**recordToIntegrity function (lines 33-46):**
```typescript
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
```

**With tri-state:** `!!null` is `false`, `!!true` is `true`, `!!false` is `false`. So "untouched" and "not done" both map to `false` in the integrity grid, which is correct behavior (the grid shows whether an anchor was fulfilled). No changes needed.

**Required changes:** NONE (but consider adding a comment about null handling for clarity).

---

### 2.9 `src/app/layout.tsx` (31 lines)

**Current (lines 17-30):**
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Nav />
      </body>
    </html>
  )
}
```

**Import (line 4):** `import { Nav } from '@/components/nav'`

**Required changes:** If nav is removed entirely (recommended), delete line 4 and line 26 (`<Nav />`). If nav is kept as single-tab, no changes needed here.

---

## Part 3: Test Files That Need Updates (for modified files)

### 3.1 `src/app/page.test.tsx` (91 lines)

**Key areas to change:**

- **Lines 17-38:** Mock of `useDailyRecord` -- all `false` defaults become `null`:
  ```typescript
  breakfast: false,  // -> null
  lunch: false,      // -> null
  // ... etc
  ```

- **Lines 41-46:** Mock of `useActiveProjectName` -- DELETE ENTIRELY:
  ```typescript
  vi.mock('@/hooks/use-active-project-name', () => ({
    useActiveProjectName: () => ({
      projectName: 'Build SelahOS',
      isLoading: false,
    }),
  }))
  ```

- **Lines 83-89:** Test "shows active project name in ground section" -- DELETE ENTIRELY:
  ```typescript
  it('shows active project name in ground section', async () => {
    render(<TodayPage />)
    await waitFor(() => {
      expect(screen.getByText('Build SelahOS')).toBeInTheDocument()
    })
  })
  ```

### 3.2 `src/hooks/use-daily-record.test.ts` (505 lines)

**Key areas to change:**

- **Lines 89-98:** Test "starts with empty record for effective date" -- assertions change from `false` to `null`:
  ```typescript
  expect(result.current.record.breakfast).toBe(false)   // -> toBe(null)
  expect(result.current.record.lunch).toBe(false)       // -> toBe(null)
  expect(result.current.record.dinner).toBe(false)      // -> toBe(null)
  expect(result.current.record.cipralex_taken).toBe(false) // -> toBe(null)
  ```

- **Lines 106-136:** Test "populates record when fetch returns data" -- mock record still uses `true`/`false` booleans for anchor fields, which is fine (these represent actual DB values, not defaults).

- **Line 83:** `result.current.updateField('breakfast', true)` -- still valid, `true` is a valid tri-state value.

### 3.3 `src/components/anchor-checkbox.test.tsx` (79 lines)

**FULL REWRITE NEEDED.** All 9 tests assume binary checkbox behavior:

- Tests reference `checked` prop (must become `value`)
- Tests use `screen.getByRole('checkbox')` (must change if component becomes a button)
- Tests assert `.toBeChecked()` / `.not.toBeChecked()` (must test 3 states)
- Line 18: `expect(onChange).toHaveBeenCalledWith(true)` (must test cycling: null->true, true->false, false->null)

### 3.4 `src/components/nav.test.tsx` (51 lines)

**FULL REWRITE NEEDED if nav is removed, or MAJOR UPDATE if kept:**

Current tests (4 tests):
- "renders four navigation links" -- must change to zero or one
- "has correct href attributes" -- references `/project`, `/signals`, `/ground`
- "has main navigation aria-label" -- still valid if nav kept
- "highlights the active nav item" -- references Project link

### 3.5 `src/lib/types.test.ts` (78 lines)

**Areas to change:**

- **Lines 5-29:** Test "daily_records Row type has all required fields" -- change boolean assertions:
  ```typescript
  breakfast: false,  // -> null (or keep false, both are valid boolean|null)
  ```
  Actually, the mock value just needs to type-check. With `boolean | null`, both `false` and `null` are valid. But the assertion on line 26 (`expect(mockRow.breakfast).toBe(false)`) should probably test `null` to confirm the new type allows it.

- **Lines 49-61:** Test "ground_projects Row type has status field" -- DELETE (type being removed)

- **Lines 63-76:** Test "weekly_signals Row type has all signal fields" -- DELETE (type being removed)

---

## Part 4: Database Schema

### Current Schema (`supabase/migrations/001_initial_schema.sql`)

**daily_records anchor columns (lines 16-23):**
```sql
breakfast BOOLEAN NOT NULL DEFAULT FALSE,
lunch BOOLEAN NOT NULL DEFAULT FALSE,
dinner BOOLEAN NOT NULL DEFAULT FALSE,
cipralex_taken BOOLEAN NOT NULL DEFAULT FALSE,
hygiene_done BOOLEAN NOT NULL DEFAULT FALSE,
movement_done BOOLEAN NOT NULL DEFAULT FALSE,
ground_maintenance_done BOOLEAN NOT NULL DEFAULT FALSE,
ground_build_done BOOLEAN NOT NULL DEFAULT FALSE,
```

**Constraints:**
- `UNIQUE (user_id, date)` on line 29 -- `daily_records_user_date_unique`
- Index: `idx_daily_records_user_date` on `(user_id, date)` -- line 32
- RLS: SELECT, INSERT, UPDATE policies based on `auth.uid() = user_id`
- No DELETE policy (intentional)
- Trigger: `set_updated_at_daily_records` updates `updated_at` on UPDATE

**Required migration (`002_anchor_three_state.sql`):**

```sql
-- Step 1: Backfill false -> NULL (old false = untouched semantics)
UPDATE daily_records SET breakfast = NULL WHERE breakfast = false;
UPDATE daily_records SET lunch = NULL WHERE lunch = false;
UPDATE daily_records SET dinner = NULL WHERE dinner = false;
UPDATE daily_records SET cipralex_taken = NULL WHERE cipralex_taken = false;
UPDATE daily_records SET hygiene_done = NULL WHERE hygiene_done = false;
UPDATE daily_records SET movement_done = NULL WHERE movement_done = false;
UPDATE daily_records SET ground_maintenance_done = NULL WHERE ground_maintenance_done = false;
UPDATE daily_records SET ground_build_done = NULL WHERE ground_build_done = false;

-- Step 2: Drop NOT NULL, change default
ALTER TABLE daily_records ALTER COLUMN breakfast DROP NOT NULL, ALTER COLUMN breakfast SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch DROP NOT NULL, ALTER COLUMN lunch SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner DROP NOT NULL, ALTER COLUMN dinner SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken DROP NOT NULL, ALTER COLUMN cipralex_taken SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done DROP NOT NULL, ALTER COLUMN hygiene_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done DROP NOT NULL, ALTER COLUMN movement_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done DROP NOT NULL, ALTER COLUMN ground_maintenance_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done DROP NOT NULL, ALTER COLUMN ground_build_done SET DEFAULT NULL;
```

**ground_projects table (lines 56-67):** Leave in place. No destructive migration.
**weekly_signals table (lines 94-105):** Leave in place. No destructive migration.

---

## Part 5: Test Infrastructure

### `vitest.config.ts` (17 lines)
- Environment: jsdom
- Setup: `./src/test/setup.ts`
- Include: `src/**/*.test.{ts,tsx}`
- Globals: true
- Path alias: `@` -> `./src`

### `src/test/setup.ts` (1 line)
```typescript
import '@testing-library/jest-dom/vitest'
```

No changes needed to test infrastructure.

---

## Part 6: Complete Dependency Map

### Import chains that cross the deletion/modification boundary:

```
src/app/page.tsx (MODIFY)
  ├── line 6: @/hooks/use-active-project-name (DELETE)
  ├── line 8: @/components/anchor-checkbox (MODIFY)
  └── line 5: @/hooks/use-daily-record (MODIFY)
        └── line 6: @/lib/types (MODIFY)

src/components/nav.tsx (MODIFY/DELETE)
  └── imported by: src/app/layout.tsx (MODIFY if nav removed)

src/app/ground/page.tsx (NO CHANGE)
  └── src/hooks/use-ground-integrity.ts (NO CHANGE)
        └── src/lib/types.ts (MODIFY -- but !! coercion handles null)

src/app/project/page.tsx (DELETE)
  └── src/hooks/use-ground-project.ts (DELETE)

src/app/signals/page.tsx (DELETE)
  └── src/hooks/use-weekly-signals.ts (DELETE)
```

### Critical ordering constraint:
1. `src/app/page.tsx` must have `useActiveProjectName` import removed BEFORE or AT SAME TIME as `src/hooks/use-active-project-name.ts` is deleted
2. `src/lib/types.ts` must be updated BEFORE or AT SAME TIME as `src/hooks/use-daily-record.ts` (since types flow through)
3. `src/components/anchor-checkbox.tsx` must be updated BEFORE or AT SAME TIME as `src/app/page.tsx` (prop name change)
4. Database migration must run BEFORE new code is deployed (null values on NOT NULL columns = constraint violation)

---

## Part 7: Exact Change Manifest for Builders

### Builder A: Deletion + Nav + Layout (mechanical work)

**Delete files (10 files):**
1. `src/app/project/page.tsx`
2. `src/app/project/project.test.tsx`
3. `src/app/signals/page.tsx`
4. `src/app/signals/signals.test.tsx`
5. `src/hooks/use-ground-project.ts`
6. `src/hooks/use-ground-project.test.ts`
7. `src/hooks/use-weekly-signals.ts`
8. `src/hooks/use-weekly-signals.test.ts`
9. `src/hooks/use-active-project-name.ts`
10. `src/hooks/use-active-project-name.test.ts`

**Also delete the empty directories:**
- `src/app/project/`
- `src/app/signals/`

**Modify `src/components/nav.tsx`:** Remove Project, Signals, Ground from NAV_ITEMS (lines 9-11). Or remove nav entirely.

**Modify `src/components/nav.test.tsx`:** Rewrite all 4 tests to match new nav.

**Modify `src/app/layout.tsx`:** If nav removed entirely, delete import (line 4) and `<Nav />` (line 26).

**Modify `src/app/page.tsx`:**
- Delete line 6 (useActiveProjectName import)
- Delete line 39 (useActiveProjectName call)
- Delete lines 116-118 (projectName display)

**Modify `src/app/page.test.tsx`:**
- Delete lines 41-46 (useActiveProjectName mock)
- Delete lines 83-89 (project name test)

**Modify `src/lib/types.ts`:**
- Remove ground_projects definition (lines 69-98)
- Remove weekly_signals definition (lines 99-132)

**Modify `src/lib/types.test.ts`:**
- Delete lines 49-61 (ground_projects test)
- Delete lines 63-76 (weekly_signals test)

### Builder B: Tri-state component + data layer

**Create `supabase/migrations/002_anchor_three_state.sql`:** (migration SQL above)

**Modify `src/lib/types.ts`:**
- Lines 19-26: Change `boolean` to `boolean | null` for all 8 anchor fields in Row
- Lines 37-44: Change `boolean` to `boolean | null` for all 8 anchor fields in Insert
- Lines 55-62: Change `boolean` to `boolean | null` for all 8 anchor fields in Update

**Modify `src/hooks/use-daily-record.ts`:**
- Lines 17-24: Change `EMPTY_RECORD` defaults from `false` to `null` for all 8 anchor fields

**Modify `src/components/anchor-checkbox.tsx`:** Full rewrite:
- Change props from `checked: boolean` to `value: boolean | null`
- Change `onChange` from `(checked: boolean) => void` to `(value: boolean | null) => void`
- Replace `<input type="checkbox">` with `<button>` element
- Implement 3-state cycling: null -> true -> false -> null
- 3 visual states:
  - null: empty circle (current unchecked look -- `border-warm-400`)
  - true: green filled circle with checkmark (current checked look)
  - false: circle with dash/horizontal line (new -- "not done" is first-class)
- ARIA: `role="checkbox"` with `aria-checked="true|false|mixed"` (mixed for untouched)

**Modify `src/app/page.tsx`:**
- All 8 AnchorCheckbox sites: `checked={record.X ?? false}` -> `value={record.X ?? null}`
- onChange handlers remain `(v) => updateField('X', v)` -- type changes automatically

**Modify tests:**
- `src/components/anchor-checkbox.test.tsx`: Full rewrite for 3 states
- `src/hooks/use-daily-record.test.ts`: Lines 93-96 change `false` to `null`
- `src/app/page.test.tsx`: Lines 23-30 change `false` to `null` in mock record
- `src/lib/types.test.ts`: Lines 13, 14, 15, 16, 17, 18, 19, 20 change `false` to `null` (or test both values)

---

## Risks & Challenges

### Build-break risk: useActiveProjectName deletion
**Severity:** HIGH if done out of order
**Exact cause:** `src/app/page.tsx` line 6 imports deleted file
**Mitigation:** Delete import from page.tsx and hook file in same atomic operation

### Data migration ordering
**Severity:** HIGH if deployed wrong
**Exact cause:** New code sends `null` to `NOT NULL` columns
**Mitigation:** Run SQL migration BEFORE deploying new code. Migration is safe (only relaxes constraints).

### Checkbox accessibility regression
**Severity:** MEDIUM
**Exact cause:** Current `<input type="checkbox">` has native accessibility. Custom tri-state button needs explicit ARIA.
**Mitigation:** Use `role="checkbox"` with `aria-checked="true|false|mixed"`, ensure keyboard focus and Enter/Space activation.

---

## Questions for Planner

1. **Should the nav bar be removed entirely, or kept with a single "Today" item?** Recommendation: remove entirely (no functional purpose with one destination). This also frees 56px of vertical space (h-14 + safe-area padding).

2. **Should `ground_projects` and `weekly_signals` type definitions be removed from `types.ts`?** Recommendation: remove (no code references them after deletion). But keeping them is also fine (zero runtime impact).

3. **Should builders A and B work in parallel or sequentially?** They can work in parallel since Builder A's type changes (removing table defs) and Builder B's type changes (boolean -> boolean|null) touch different sections of `types.ts`. However, both modify `src/app/page.tsx` and `src/app/page.test.tsx`. Recommendation: have builders coordinate on those two files, or assign page.tsx entirely to Builder B.

---

## Resource Map

### Critical Files (absolute paths)
- `/home/ahiya/Selah/selah-os/src/lib/types.ts` -- Central type definitions, modified by both builders
- `/home/ahiya/Selah/selah-os/src/hooks/use-daily-record.ts` -- Data layer for Today page
- `/home/ahiya/Selah/selah-os/src/components/anchor-checkbox.tsx` -- Core UI component being redesigned
- `/home/ahiya/Selah/selah-os/src/app/page.tsx` -- Today page, touched by both builders
- `/home/ahiya/Selah/selah-os/src/components/nav.tsx` -- Nav being simplified/removed
- `/home/ahiya/Selah/selah-os/src/app/layout.tsx` -- May need Nav removal
- `/home/ahiya/Selah/selah-os/supabase/migrations/001_initial_schema.sql` -- Current DB schema reference

### Files that need NO changes (confirmed by reading)
- `/home/ahiya/Selah/selah-os/src/hooks/use-ground-integrity.ts` -- `!!` handles null correctly
- `/home/ahiya/Selah/selah-os/src/components/integrity-grid.tsx` -- Consumes boolean DayIntegrity, unchanged
- `/home/ahiya/Selah/selah-os/src/app/ground/page.tsx` -- Ground page stays as-is
- `/home/ahiya/Selah/selah-os/src/lib/dates.ts` -- Utility functions stay (some become unused but harmless)
- `/home/ahiya/Selah/selah-os/src/components/sleep-button.tsx` -- Independent
- `/home/ahiya/Selah/selah-os/src/components/note-field.tsx` -- Independent
- `/home/ahiya/Selah/selah-os/src/components/section-group.tsx` -- Independent
- `/home/ahiya/Selah/selah-os/src/components/date-header.tsx` -- Independent
- `/home/ahiya/Selah/selah-os/vitest.config.ts` -- Test infra unchanged
- `/home/ahiya/Selah/selah-os/src/test/setup.ts` -- Test setup unchanged

---

*Exploration completed: 2026-04-01*
*Mode: PRODUCTION*
*Every file read in full. Line numbers verified against current source.*
