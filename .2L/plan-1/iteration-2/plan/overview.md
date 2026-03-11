# 2L Iteration 2 Plan - SelahOS: Secondary Screens + Production Hardening

## Project Vision

Complete SelahOS by implementing the two remaining screens (Ground Project, Weekly Signals), enhancing the Today screen with project name display, and hardening the codebase with comprehensive tests and accessibility fixes. After this iteration, all three screens are functional and the app is ready for production deployment.

## What Already Exists (Iteration 1 Output)

Everything below is built, tested, and working. Do NOT modify these foundations:

- **Next.js 15.5.12** project with App Router, TypeScript strict, Tailwind v4
- **Supabase auth** with magic link login, middleware route protection, session persistence
- **Database schema**: all 3 tables deployed (`daily_records`, `ground_projects`, `weekly_signals`) with RLS policies, indexes, auto-update triggers
- **TypeScript types** for all 3 tables in `src/lib/types.ts`
- **Today screen**: fully functional with auto-save, optimistic updates, debounced persistence
- **Navigation shell**: fixed bottom bar with Today / Project / Signals links
- **Reusable components**: SectionGroup, NoteField, AnchorCheckbox, SleepButton, DateHeader, Nav
- **Reusable hooks**: useDailyRecord (canonical data hook), useDebouncedSave (generic debounce)
- **Date utilities**: getEffectiveDate, formatDateString, formatDisplayDate, formatTime, getWeekStart
- **CI pipeline**: GitHub Actions with lint, type-check, test with coverage, build
- **82 tests passing** across 9 test files, 92.98% branch coverage
- **5 production deps, 12 dev deps** (minimal footprint)
- **Placeholder pages** at `/project` and `/signals` (to be replaced)

## What This Iteration Builds

1. **Ground Project screen** -- display and manage the active ground project
2. **Weekly Signals screen** -- weekly reflection entry with recent history
3. **Today screen enhancement** -- display active project name in ground section
4. **Tests for untested components** -- SectionGroup, DateHeader, NoteField, page-level tests
5. **Accessibility fix** -- contrast ratio improvement (text-warm-500 to text-warm-600)

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] Ground Project screen displays active project (name, status, start date)
- [ ] Ground Project screen supports edit name, toggle status, create new project
- [ ] Creating a new project deactivates the previous active project
- [ ] Weekly Signals screen shows current week form (financial, sleep, note)
- [ ] Weekly Signals screen saves via explicit "save" button with upsert
- [ ] Weekly Signals screen displays last 4 weeks of history
- [ ] Today screen shows active project name in the ground section
- [ ] formatWeekRange utility function exists and is tested
- [ ] SectionGroup, DateHeader, NoteField have dedicated test files
- [ ] Today page has a smoke test
- [ ] All text using text-warm-500 for content/labels updated to text-warm-600
- [ ] All new hooks have comprehensive tests (useGroundProject ~15, useWeeklySignals ~12, useActiveProjectName ~3)
- [ ] All new pages have page-level tests (project ~10, signals ~9)
- [ ] TypeScript compiles with strict mode, zero errors
- [ ] ESLint passes with zero warnings
- [ ] All tests pass (target: ~130 total tests)
- [ ] Coverage remains >= 70% (expect ~85-90% given existing 93% baseline)
- [ ] `npm run build` succeeds
- [ ] No console errors in production build

## MVP Scope

**In Scope:**
- Ground Project screen (full CRUD minus delete)
- Weekly Signals screen (current week entry + recent history)
- Today screen project name display
- Component tests for SectionGroup, DateHeader, NoteField
- Page-level tests for Project, Signals, Today
- Accessibility contrast fix
- formatWeekRange utility

**Out of Scope (Post-MVP / separate task):**
- Vercel production deployment (manual step after code ships)
- Supabase Cloud project configuration (manual step)
- Domain setup (selah.im/os)
- PWA / offline support
- Historical data browsing
- Coverage threshold enforcement in vitest.config.ts (optional enhancement)
- npm audit CI step (optional enhancement)

## Development Phases

1. **Exploration** -- Complete
2. **Planning** -- Current (this document)
3. **Building** -- 3 parallel builders, estimated 2-3 hours each
4. **Integration** -- Merge builder outputs, ~15 minutes
5. **Validation** -- Run full test suite + build, ~10 minutes

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~3 hours (3 parallel builders)
- Integration: ~15 minutes
- Validation: ~10 minutes
- Total: ~3.5 hours

## Risk Assessment

### Low Risks (all risks are low for this iteration)

- **"Create new project" two-step operation**: Deactivating old project then inserting new requires two sequential Supabase calls. If insert fails, user has no active project. Mitigation: wrap in try/catch, re-activate previous on failure. Single-user, single-device usage makes this negligible.

- **Unique constraint on project name**: Schema has `UNIQUE(user_id, name)`. Creating a project with a duplicate name fails. Mitigation: show error message in UI. This is actually desirable behavior.

- **formatWeekRange locale sensitivity**: Month abbreviations depend on locale. Mitigation: use explicit month abbreviation array rather than `toLocaleDateString()`.

- **Contrast ratio on text-warm-500**: Current `text-warm-500` (#8C8279) on `bg-warm-100` (#F5F3F0) is approximately 3.2:1, failing WCAG AA 4.5:1. Mitigation: update to `text-warm-600` (#6B6158) which achieves ~5.1:1.

## Integration Strategy

All 3 builders work on completely independent files. No shared file modifications except:

- **Builder 2** adds `formatWeekRange` to `src/lib/dates.ts` and tests to `src/lib/dates.test.ts`
- **Builder 3** modifies `src/app/page.tsx` (Today screen) to add project name display

These modifications are additive (new function export, new JSX lines) and will not conflict. Builder 1 and Builder 2 create entirely new files. Builder 3's hook (`useActiveProjectName`) is independent from Builder 1's hook (`useGroundProject`).

Merge order does not matter. All builders can merge independently.

## Deployment Plan

After all builders merge and CI passes:

1. Verify locally: `npm run build && npm run test:coverage`
2. Push to `main` branch
3. Configure Supabase Cloud project (manual, one-time)
4. Connect GitHub repo to Vercel (manual, one-time)
5. Set environment variables in Vercel dashboard
6. Auto-deploy triggers on push to main
7. Verify login flow and all three screens on deployed URL
