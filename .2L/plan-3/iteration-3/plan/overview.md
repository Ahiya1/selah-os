# 2L Iteration Plan - SelahOS Ground Phase (plan-3)

## Project Vision

SelahOS is a minimal interface for contact with reality. This iteration performs a structural simplification: removing features that exceed the user's current capacity (Project tab, Signals tab), restricting the Ground weekly view to direct URL access only, removing the navigation bar entirely, and transforming the daily anchor checkboxes from a binary (done/not done) model to a 3-state model (untouched/done/not done) that aligns with the philosophy that "not done" is first-class participation, not failure.

This is primarily a subtraction. The system becomes smaller, calmer, and more honest about what it tracks.

## Success Criteria

Specific, measurable criteria for completion:

- [ ] Project page (`/os/project`) returns 404 -- page files deleted
- [ ] Signals page (`/os/signals`) returns 404 -- page files deleted
- [ ] Navigation bar is completely removed from the layout
- [ ] Bottom padding on Today and Ground pages reduced from `pb-24` to `pb-8` (nav space reclaimed)
- [ ] Each anchor checkbox cycles through 3 states: untouched (null) -> done (true) -> not done (false) -> untouched (null)
- [ ] "Not done" state renders with warm tones (bg-warm-300, warm-600 dash), never red/error
- [ ] "Untouched" state renders as empty circle (border-warm-400), visually identical to current unchecked
- [ ] "Done" state renders as green filled circle with checkmark (identical to current checked)
- [ ] Database migration converts anchor columns from `BOOLEAN NOT NULL DEFAULT FALSE` to nullable `BOOLEAN DEFAULT NULL`
- [ ] Existing `false` values in database backfilled to `NULL` (semantic correction: old false meant untouched)
- [ ] All 8 AnchorCheckbox instances in Today page use `value={record.X ?? null}` instead of `checked={record.X ?? false}`
- [ ] `useActiveProjectName` hook removed; project name no longer displayed on Today page
- [ ] `ground_projects` and `weekly_signals` type definitions removed from `types.ts`
- [ ] All tests pass (`npx vitest run`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Test coverage remains >= 70% overall

## MVP Scope

**In Scope:**
- Delete Project page, Signals page, and all associated hooks/tests (10 files + 2 directories)
- Remove Nav component entirely from layout
- Remove `useActiveProjectName` import and usage from Today page
- Remove `ground_projects` and `weekly_signals` type definitions
- Create database migration `002_anchor_three_state.sql`
- Transform `AnchorCheckbox` from binary checkbox to 3-state button
- Update `types.ts` anchor fields from `boolean` to `boolean | null`
- Update `EMPTY_RECORD` defaults from `false` to `null`
- Update all 8 AnchorCheckbox usages in Today page
- Rewrite `anchor-checkbox.test.tsx` for 3-state behavior
- Update all affected test files (page.test.tsx, use-daily-record.test.ts, types.test.ts)
- Reduce bottom padding on Today and Ground pages

**Out of Scope (Post-MVP):**
- Day-of-week gating for Ground page access (trust-based for now)
- Cleanup of `use-debounced-save.ts` (unused hook, not related to plan-3)
- Cleanup of `formatWeekRange`/`getWeekStart` in dates.ts (now unused by production code, but harmless and tested)
- Drop `ground_projects` and `weekly_signals` database tables (leave in place, no destructive migration)

## Development Phases

1. **Exploration** -- Complete
2. **Planning** -- Current
3. **Building** -- 2 parallel builders (~1.5 hours)
4. **Integration** -- ~15 minutes
5. **Validation** -- ~15 minutes
6. **Deployment** -- Final (migration-first, then code deploy)

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~1.5 hours (2 parallel builders)
- Integration: ~15 minutes (conflict resolution on shared files)
- Validation: ~15 minutes (full test suite, type check, build)
- Total: ~2 hours

## Risk Assessment

### High Risks

- **Migration ordering:** New code deploying before migration runs causes constraint violations (NOT NULL columns receiving null values). Mitigation: Run `002_anchor_three_state.sql` on Supabase BEFORE deploying code. The migration is safe to run ahead of code -- existing `?? false` coercion in current code handles null gracefully during the transition window.

- **useActiveProjectName deletion atomicity:** Deleting the hook file while `page.tsx` still imports it breaks the build. Mitigation: Builder 1 removes the import from `page.tsx` and the mock from `page.test.tsx` atomically with the file deletion. This is explicitly called out in builder tasks.

### Medium Risks

- **Shared file conflicts between builders:** Both builders touch `types.ts`, `page.tsx`, and `page.test.tsx`. Mitigation: Builder 1 owns deletion-related changes (removing table defs from types.ts, removing useActiveProjectName from page.tsx). Builder 2 owns transformation-related changes (boolean -> boolean|null in types.ts, AnchorCheckbox prop changes in page.tsx). Changes target different lines with no overlap.

- **Accessibility regression:** Current `<input type="checkbox">` has native keyboard and screen reader support. Custom `<button>` needs explicit ARIA. Mitigation: Use `role="checkbox"` with `aria-checked="true|false|mixed"`, ensure keyboard Enter/Space activation. Test for ARIA attributes explicitly.

### Low Risks

- **Test mock misalignment:** Mock records in tests still using `false` instead of `null` after type change. Mitigation: Search for `breakfast: false` across all test files to find every location that needs updating.

## Integration Strategy

Two builders work in parallel on isolated concerns:

- **Builder 1 (Subtraction)** deletes files, removes nav, cleans up imports. Changes to shared files: removes `ground_projects` and `weekly_signals` from `types.ts`, removes `useActiveProjectName` from `page.tsx`/`page.test.tsx`.

- **Builder 2 (Transformation)** rewrites AnchorCheckbox, updates data types, creates migration. Changes to shared files: changes `boolean` to `boolean | null` in `types.ts`, changes `checked` to `value` props in `page.tsx`, updates mock records in `page.test.tsx`.

The changes to shared files target **different line ranges** and should merge cleanly. If conflicts arise, they are trivially resolvable because the intent is unambiguous.

## Deployment Plan

1. Run `002_anchor_three_state.sql` on Supabase production database
2. Verify migration: `SELECT breakfast FROM daily_records LIMIT 5` should show null values where false used to be
3. Deploy new code (Vercel auto-deploy on push to master, or manual trigger)
4. Verify: open `/os` -- anchors should show empty circles (untouched state)
5. Verify: tap an anchor -- should cycle through done (green check) -> not done (warm dash) -> untouched (empty)
6. Verify: `/os/project` and `/os/signals` return 404
7. Verify: no navigation bar visible at bottom of screen
