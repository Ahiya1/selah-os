# 2L Iteration Plan - SelahOS Iteration 1: Foundation + Today Screen

## Project Vision

SelahOS is a quiet instrument panel for the ground layer of life. It tracks daily physiological anchors -- sleep, food, medication, hygiene, movement, ground contact -- with zero friction, zero gamification, and zero behavioral nudging. It is designed for a single user (Ahiya), meant to be usable half-asleep, and built to remain stable for decades.

Iteration 1 delivers the daily-use minimum: the complete backend foundation (auth, schema, design system) plus the fully functional Today screen, which handles 95% of all interactions.

## Success Criteria

Specific, measurable criteria for Iteration 1 completion:

- [ ] User can log in via magic link email (Supabase Auth)
- [ ] Auth session persists across browser sessions (no daily re-login)
- [ ] Unauthenticated users are redirected to /login
- [ ] Today screen displays all daily anchors in a single viewport on 375x667 screen
- [ ] Checkboxes toggle instantly (optimistic UI) and persist across page reloads
- [ ] Sleep timestamp buttons record current time and persist across reloads
- [ ] Daily note auto-saves on blur and typing pause (500ms debounce)
- [ ] Day boundary works correctly: before 4:00 AM shows previous day's record
- [ ] First interaction on a new day auto-creates the daily record (upsert)
- [ ] Pending saves flush when the app goes to background (visibilitychange)
- [ ] Bottom navigation bar shows three text labels: Today, Project, Signals
- [ ] /project and /signals routes render placeholder pages (no 404s)
- [ ] RLS policies prevent unauthorized data access
- [ ] TypeScript compiles with strict mode, zero errors
- [ ] All tests pass (date utilities, hook basics, component smoke tests)
- [ ] `npm run build` succeeds without errors

## MVP Scope

**In Scope (Iteration 1):**
- Next.js 15 project scaffolding with TypeScript strict mode
- Tailwind CSS v4 design system (warm palette, system fonts)
- Supabase database migration (all 3 tables + RLS + indexes + triggers)
- Three Supabase client variants (browser, server, middleware)
- Magic link authentication flow (login page, callback route, middleware protection)
- Root layout with auth check and navigation shell
- Fixed bottom navigation bar (Today / Project / Signals, text only)
- Today screen -- complete implementation:
  - Date header with 4 AM day boundary
  - Sleep section (going to sleep / woke up timestamp buttons)
  - Food section (breakfast, lunch, dinner checkboxes)
  - Medication section (cipralex checkbox)
  - Body section (hygiene, movement checkboxes)
  - Ground section (maintenance, build checkboxes)
  - Note field (auto-save, debounced)
- Optimistic UI updates with 500ms debounced upserts
- Day boundary utility (getEffectiveDate, formatDisplayDate)
- Debounced upsert hook
- Vitest test suite (date utilities, hook tests, component smoke tests)
- Placeholder pages for /project and /signals

**Out of Scope (Iteration 2 and beyond):**
- Ground Project screen functionality (display, edit, create projects)
- Weekly Signals screen functionality (create, view signal entries)
- Ground project name display on Today screen
- GitHub Actions CI/CD pipeline
- Production deployment to Vercel
- PWA / offline support
- Historical data browsing
- Analytics, charts, or dashboards
- Dark/light mode toggle

## Key Design Decisions

These decisions are locked. Builders must follow them exactly.

1. **Day boundary at 4:00 AM**: Before 4 AM local time, the app shows the previous day's record. At or after 4 AM, it shows the current day's record. This handles the night-owl pattern where "going to sleep" at 1 AM belongs to the day just lived.

2. **Auto-save everything**: No submit buttons on the Today screen. Every checkbox toggle, button tap, and note edit triggers a debounced upsert. Sleep button taps flush immediately.

3. **Optimistic UI**: UI reflects changes instantly. Database writes happen in the background after a 500ms debounce. Rapid interactions batch into a single upsert.

4. **56px+ tap targets**: All interactive elements (checkboxes, buttons) have a minimum 56px touch target for half-asleep usability.

5. **Warm palette**: Off-white background (#F5F3F0), warm brown text (#524840), garden green accents (#6B8F71). No pure black, no bright colors. Single palette -- no dark/light toggle.

6. **System font stack**: No web fonts. Uses -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.

7. **Native HTML elements**: Native `<input type="checkbox">`, `<button>`, `<textarea>`. No UI component library.

8. **Client-side date rendering**: The Today page renders dates client-side only to avoid server/client timezone hydration mismatches.

9. **No custom API routes**: All data access through the Supabase client with user session + RLS. The only server route is /auth/callback.

10. **Tailwind CSS v4**: CSS-first configuration via `@theme` directive in globals.css. No tailwind.config.ts file.

## Development Phases

1. **Exploration** -- Complete
2. **Planning** -- Current (this document)
3. **Building** -- Estimated 5-7 hours (3 parallel builders)
4. **Integration** -- Estimated 15-30 minutes
5. **Validation** -- Estimated 15-30 minutes

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 5-7 hours (3 builders, partially parallel)
  - Builder 1 (Foundation): 1.5-2 hours
  - Builder 2 (Auth + Nav): 2-2.5 hours (starts after Builder 1)
  - Builder 3 (Today Screen): 2.5-3 hours (starts after Builder 1)
- Integration: 15-30 minutes (merge builder outputs, resolve any conflicts)
- Validation: 15-30 minutes (manual testing of auth flow, Today screen, navigation)
- Total wall-clock: ~4-5 hours (Builders 2 and 3 run in parallel)

## Risk Assessment

### Medium Risks

- **Supabase SSR client setup**: The `@supabase/ssr` package (pre-1.0) requires exact cookie handling patterns across three execution contexts (browser, server, middleware). Misconfiguration causes auth loops or session loss.
  - *Mitigation*: patterns.md provides exact copy-pasteable code for all three clients. Builder 2 must follow these patterns verbatim.

- **Tailwind v4 configuration**: Tailwind v4 uses CSS-first configuration (no tailwind.config.ts), which differs from v3. Builders familiar with v3 may need to adjust.
  - *Mitigation*: patterns.md provides the exact globals.css with @theme directive. Builder 1 sets this up.

- **Hydration mismatch on dates**: Server (UTC on Vercel) and client (local timezone) compute different effective dates.
  - *Mitigation*: Date header is rendered as a client-only component using useEffect. The Today page is a client component.

### Low Risks

- **Builder coordination**: Builders 2 and 3 depend on Builder 1's scaffolding. If Builder 1 is slow, others are blocked.
  - *Mitigation*: Builder 1 has the smallest, most mechanical scope. It should complete first.

- **Supabase free tier**: Database pauses after 7 days of inactivity.
  - *Mitigation*: Daily use prevents pausing. Cold-start delay (~10s) is acceptable if it occurs.

## Integration Strategy

Builder outputs have zero file overlap. Each builder creates a distinct set of files:

- **Builder 1**: Configuration files, globals.css, types.ts, constants.ts, schema SQL, vitest config
- **Builder 2**: Supabase clients, middleware.ts, login page, auth callback, layout.tsx, nav, placeholder pages
- **Builder 3**: dates.ts, hooks, Today page (page.tsx), all Today screen components, tests

Integration is a merge operation. The only cross-builder import dependency is:
- Builder 3 imports `@/lib/supabase/client` (created by Builder 2) inside `use-daily-record.ts`
- Both Builders 2 and 3 import `@/lib/types` (created by Builder 1)

After merging, run:
1. `npm install` (verify all deps resolve)
2. `npm run type-check` (verify TypeScript compiles)
3. `npm run test` (verify all tests pass)
4. `npm run build` (verify Next.js builds successfully)
5. Manual test: auth flow, Today screen interactions, navigation

## Deployment Plan

Iteration 1 is not deployed to production. It establishes a working local development environment. Deployment to Vercel happens in Iteration 2.

Pre-requisites for local testing:
1. Create Supabase cloud project (manual step by Ahiya)
2. Apply migration SQL via Supabase SQL Editor
3. Configure Supabase Auth: enable magic link, set redirect URL to `http://localhost:3000/auth/callback`
4. Disable email signup in Supabase dashboard (single-user enforcement)
5. Create `.env.local` from `.env.local.example` with actual Supabase credentials
6. `npm install && npm run dev`
