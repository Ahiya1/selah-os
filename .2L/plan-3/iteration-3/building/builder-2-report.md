# Builder-2 Report: TRANSFORMATION (3-state anchors)

## Status
COMPLETE

## Summary
Transformed the anchor system from binary (boolean checkbox) to 3-state (boolean | null button). Created the database migration, updated type definitions, rewrote the AnchorCheckbox component as a 3-state button with proper ARIA support, updated all 8 usages in the Today page, and rewrote/updated 6 test files. All 120 tests pass with 92.12% overall coverage.

## Files Created

### Database Migration
- `supabase/migrations/002_anchor_three_state.sql` - Backfills false->NULL, drops NOT NULL constraints, sets DEFAULT NULL on all 8 anchor columns

## Files Modified

### Type Definitions
- `src/lib/types.ts` - Changed 8 anchor fields from `boolean` to `boolean | null` in Row, Insert, and Update types

### Data Layer
- `src/hooks/use-daily-record.ts` - Changed EMPTY_RECORD defaults from `false` to `null` for all 8 anchor fields

### Components
- `src/components/anchor-checkbox.tsx` - **FULL REWRITE**: Converted from `<label>` wrapping `<input type="checkbox">` to `<div>` wrapping `<button>` with 3-state cycling (null -> true -> false -> null). Props changed: `checked: boolean` to `value: AnchorState` (boolean | null). Implements `nextAnchorState()` cycle function, `stateLabel()` for ARIA, `circleClass()` for visual states. Uses `role="checkbox"` with `aria-checked="mixed|true|false"`.

### Pages
- `src/app/page.tsx` - Changed all 8 AnchorCheckbox instances from `checked={record.X ?? false}` to `value={record.X ?? null}`
- `src/app/ground/page.tsx` - No changes needed. Builder-1 already updated padding. The `useGroundIntegrity` hook uses `!!` coercion which correctly handles `null` (!!null === false).

### Tests (6 files updated)
- `src/components/anchor-checkbox.test.tsx` - **FULL REWRITE**: 15 tests covering all 3 visual states, all 3 cycle transitions, tap target size, ARIA attributes for each state, ARIA updates on rerender, button semantics, id attribute, and warm-only colors for not-done state
- `src/hooks/use-daily-record.test.ts` - Updated 3 sites: "starts with empty record" assertions changed from `.toBe(false)` to `.toBeNull()` for 4 anchor fields; 2 mock records updated (setSleepStart clears, setSleepEnd clears) changing anchor defaults from `false` to `null`
- `src/app/page.test.tsx` - Updated mock record: all 8 anchor values changed from `false` to `null`
- `src/lib/types.test.ts` - Updated mock Row: all 8 anchor values changed from `false` to `null`; assertion changed from `.toBe(false)` to `.toBeNull()`
- `src/hooks/use-ground-integrity.test.ts` - Updated 5 mock records: anchor defaults changed from `false` to `null` to exercise the `!!null === false` path
- `src/components/integrity-grid.test.tsx` - No changes needed (uses `DayIntegrity` which is already plain boolean)

### Files Not Changed (documented)
- `src/components/sleep-button.tsx` - Uses a separate component pattern (timestamp-based button, not anchor checkbox). No changes needed.
- `src/components/sleep-button.test.tsx` - No changes needed.
- `src/lib/constants.ts` / `src/lib/constants.test.ts` - Not affected by anchor changes.

## Success Criteria Met
- [x] Migration file `002_anchor_three_state.sql` created with correct SQL
- [x] `types.ts` anchor fields changed from `boolean` to `boolean | null` in Row, Insert, and Update
- [x] `EMPTY_RECORD` in `use-daily-record.ts` has all 8 anchor defaults as `null` instead of `false`
- [x] `AnchorCheckbox` rewritten as `<button>` with 3-state cycling: null -> true -> false -> null
- [x] Untouched state: empty circle with `border-warm-400`, no fill, no icon
- [x] Done state: green circle with `bg-green-600 border-green-600`, white checkmark SVG
- [x] Not-done state: warm circle with `bg-warm-300 border-warm-400`, warm-600 dash SVG
- [x] ARIA: `role="checkbox"`, `aria-checked="mixed|true|false"`, `aria-label` includes state name
- [x] All 8 AnchorCheckbox usages in `page.tsx` changed from `checked={...??false}` to `value={...??null}`
- [x] `anchor-checkbox.test.tsx` fully rewritten with 15 tests covering all states and transitions
- [x] `use-daily-record.test.ts` updated: `false` assertions changed to `null` for anchor defaults
- [x] `page.test.tsx` mock record updated: anchor values `false` changed to `null`
- [x] `types.test.ts` updated to test `boolean | null` types
- [x] `npx tsc --noEmit` passes
- [x] `npx vitest run` passes
- [x] Coverage target: >= 70% (actual: 92.12%)

## Test Generation Summary (Production Mode)

### Test Files Created/Rewritten
- `src/components/anchor-checkbox.test.tsx` - Full rewrite, 15 tests

### Test Files Updated
- `src/hooks/use-daily-record.test.ts` - 3 update sites (12 assertion changes)
- `src/app/page.test.tsx` - 1 update site (8 value changes)
- `src/lib/types.test.ts` - 2 update sites (8 value changes + 1 assertion change)
- `src/hooks/use-ground-integrity.test.ts` - 5 update sites (mock record changes)

### Test Statistics
- **Anchor checkbox tests:** 15 tests (all new)
- **Total tests across codebase:** 120 tests
- **All tests:** PASSING
- **Overall coverage:** 92.12% statements, 88.63% branches, 85.71% functions, 92.01% lines

### Test Verification
```bash
npx tsc --noEmit     # Clean - no errors
npx vitest run       # 120 tests, 15 files, all passing
npx vitest run --coverage  # 92.12% overall coverage
npm run build        # Production build succeeds
```

## Security Checklist

- [x] No hardcoded secrets
- [x] Input validation: `nextAnchorState()` cycle function produces only null/true/false
- [x] Parameterized queries: Supabase ORM handles all DB access
- [x] Auth unchanged: existing RLS policies still enforce `auth.uid() = user_id`
- [x] No `dangerouslySetInnerHTML` usage
- [x] Error messages don't expose internals
- [x] No red/error colors for "not done" state (warm tones only)

## Patterns Followed
- **AnchorCheckbox Component pattern** from patterns.md: Clean className approach with `circleClass()` function
- **Three-State Anchor Pattern**: `nextAnchorState()` and `stateLabel()` pure functions
- **AnchorCheckbox Usage Pattern**: `value={record.X ?? null}` with `onChange={(v) => updateField('X', v)}`
- **AnchorCheckbox Test Pattern**: All test cases from patterns.md plus additional tests
- **EMPTY_RECORD Pattern**: All anchor defaults as `null`
- **Database Migration Pattern**: Backfill then ALTER

## Integration Notes

### Coordination with Builder-1
Builder-1 had already completed their changes when I started:
- `types.ts`: `ground_projects` and `weekly_signals` already removed. My changes targeted different lines (Row/Insert/Update boolean fields).
- `page.tsx`: `useActiveProjectName` import/usage already removed, `pb-24` already changed to `pb-8`. My changes targeted AnchorCheckbox props only.
- `page.test.tsx`: `useActiveProjectName` mock already removed. My changes targeted the mock record values.
- `types.test.ts`: `ground_projects` and `weekly_signals` tests already removed. My changes targeted the daily_records test values.
- `ground/page.tsx`: `pb-24` already changed to `pb-8`. No additional changes needed from me.

All merges were clean with no conflicts.

### Exports
- `AnchorCheckbox` component: prop interface changed (`checked: boolean` -> `value: boolean | null`)
- `Database` types: anchor fields widened from `boolean` to `boolean | null`

### Type Impact
- `DailyRecord` type (derived from Database types) automatically picks up `boolean | null` for anchor fields
- `updateField` signature (`value: DailyRecord[keyof DailyRecord]`) automatically accepts `boolean | null`
- `useGroundIntegrity` uses `!!` coercion which handles null correctly

## Challenges Overcome
- Builder-1 had already modified shared files (types.ts, page.tsx, page.test.tsx, types.test.ts, ground/page.tsx) before my changes. All modifications targeted non-overlapping sections, so integration was seamless.
- The page.tsx file had `useActiveProjectName` usage on line 38 without an import -- Builder-1 had already cleaned this up by the time I read the file.

## Testing Notes
- Run migration `002_anchor_three_state.sql` on Supabase BEFORE deploying code
- After migration: existing `false` values become `NULL` (untouched), `true` values preserved (done)
- After code deploy: anchors show empty circles (untouched), tap cycles through done (green check) -> not done (warm dash) -> untouched (empty)
