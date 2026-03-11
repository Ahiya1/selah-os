# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
SelahOS is a minimal personal operating system for maintaining physiological stability -- three screens (Today, Project, Signals) backed by Supabase, deployed on Vercel with Next.js App Router. Single-user, private-first, designed for decades of quiet durability.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 5 must-have (Daily Record, Ground Project, Weekly Signals, Authentication, Navigation)
- **User stories/acceptance criteria:** 22 acceptance criteria across all features
- **Estimated total work:** 10-16 hours
- **External integrations:** 1 (Supabase -- auth, database, and RLS are all within this single service)

### Complexity Rating
**Overall Complexity: SIMPLE**

**Rationale:**
- Small feature count (3 data screens + auth + navigation)
- Single external dependency (Supabase handles auth, database, and security)
- No complex third-party integrations (no payment, no email services, no external APIs)
- CRUD-only data operations with straightforward schema
- Single-user system eliminates multi-tenancy complexity

---

## Dependency Chain Analysis

### Feature Dependency Map

```
Supabase Project Setup (external prerequisite)
  |
  v
Database Schema + RLS Policies (foundation)
  |
  v
Supabase Client Configuration (connects app to backend)
  |
  +---> Authentication Flow (magic link login)
  |       |
  |       v
  +---> Daily Record CRUD (Today screen data layer)
  |       |
  |       v
  +---> Ground Project CRUD (Project screen data layer)
  |       |
  |       v
  +---> Weekly Signals CRUD (Signals screen data layer)
  |
  v
Navigation Shell (layout wrapping all screens)
  |
  +---> Today Screen UI (depends on Daily Record CRUD + Auth)
  +---> Project Screen UI (depends on Ground Project CRUD + Auth)
  +---> Signals Screen UI (depends on Weekly Signals CRUD + Auth)
```

### Critical Path

The critical path is linear and short:

1. **Supabase project creation** (external, manual) -- blocks everything
2. **Schema + RLS** -- blocks all data operations
3. **Supabase client + Auth** -- blocks all authenticated UI
4. **Screen implementations** -- can proceed in parallel once auth works

### Feature Independence Assessment

Once the foundation (schema + client + auth) is in place, the three screens are **fully independent** of each other. They share no data relationships (no foreign keys between daily_records, ground_projects, and weekly_signals). The only shared dependency is the auth context (user_id).

This means: after foundation is built, screens can be built in any order or in parallel.

---

## Production Dependencies (Runtime)

### Core Framework

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `next` | `^15.5.0` | App Router framework, SSR, routing | LOW -- use 15.x LTS, not 16.x which is too new for production stability |
| `react` | `^19.0.0` | UI library | LOW -- stable, required by Next.js 15 |
| `react-dom` | `^19.0.0` | DOM rendering | LOW -- paired with React |

**Version decision -- Next.js 15 vs 16:** Next.js 16 (16.1.6) is the latest but was released recently. For a system designed to last decades, Next.js 15.5.x is the safer choice -- it is the current LTS line with proven stability on Vercel. If the team prefers living on the edge, 16.x works but carries slightly higher risk of breaking changes in early patches.

### Supabase

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `@supabase/supabase-js` | `^2.99.0` | Supabase client (database queries, auth) | LOW -- mature, well-maintained |
| `@supabase/ssr` | `^0.9.0` | Server-side auth for Next.js App Router (cookie handling, middleware) | MEDIUM -- pre-1.0 semver, API may shift |

**Note on `@supabase/ssr`:** This package is required for proper auth cookie handling in Next.js App Router (server components, middleware, route handlers). The `@supabase/auth-helpers-nextjs` package (0.15.0) is the older approach and is being deprecated in favor of `@supabase/ssr`. Use `@supabase/ssr` despite its pre-1.0 status -- it is the officially recommended path.

### Total Production Dependencies: 5 packages

This is intentionally minimal. No UI library, no state management library, no CSS framework beyond what Next.js provides. This aligns with the core design value of minimal dependencies.

---

## Dev Dependencies

### TypeScript

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `typescript` | `^5.9.0` | Type checking | LOW |
| `@types/react` | `^19.0.0` | React type definitions | LOW |
| `@types/node` | `^22.0.0` | Node.js type definitions | LOW |

### Testing

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `vitest` | `^4.0.0` | Test runner (fast, Vite-native, TypeScript-first) | LOW |
| `@testing-library/react` | `^16.0.0` | Component testing utilities | LOW |
| `@testing-library/jest-dom` | `^6.0.0` | DOM assertion matchers | LOW |
| `jsdom` | `^28.0.0` | DOM environment for unit tests | LOW |

**Why Vitest over Jest:** Vitest is natively compatible with the Vite-based tooling in the Next.js ecosystem, requires zero configuration for TypeScript, and is significantly faster. For a project this small, either works, but Vitest is the more modern choice.

**Why no Playwright/E2E in v1:** The application has 3 screens with simple CRUD. Component-level tests with Testing Library provide sufficient coverage. E2E tests add significant CI complexity (browser installation, Supabase test instance). Recommend deferring E2E to post-MVP if the system proves stable.

### Linting

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `eslint` | `^9.0.0` | Code linting (flat config format) | LOW |
| `eslint-config-next` | `^15.5.0` | Next.js ESLint rules | LOW |

**Note:** ESLint 9 uses the new flat config format. `eslint-config-next` supports this. No additional ESLint plugins needed for a project this size.

### Total Dev Dependencies: 9 packages

---

## Explicitly Excluded Dependencies (and why)

| Package | Why excluded |
|---------|-------------|
| Tailwind CSS | Next.js built-in CSS Modules or inline styles suffice for 3 screens. Tailwind adds build complexity and a large utility class vocabulary that is unnecessary here. However, if the team prefers Tailwind for rapid styling, it is a reasonable addition (low risk). |
| Prisma / Drizzle | Supabase client handles all queries directly. An ORM adds a layer of abstraction over what are simple CRUD operations on 3 tables. |
| Zustand / Redux / Jotai | No client state management needed. Server state comes from Supabase queries. React's built-in useState is sufficient for local UI state (checkbox toggles). |
| React Query / SWR | For 3 screens with simple fetches, native `fetch` in server components or Supabase client calls are sufficient. Adding a caching layer is over-engineering for single-user CRUD. |
| date-fns / dayjs / luxon | The app needs minimal date handling (today's date, week_start calculation). Native `Date` and `Intl.DateTimeFormat` are sufficient. |
| Zod | Schema validation is handled by Supabase's database constraints and RLS. For 3 simple forms, inline validation is adequate. |
| Prettier | Optional. If desired, add it, but for a single-developer project it is not critical. |
| Husky / lint-staged | Optional pre-commit hooks. For a single-developer project, CI linting is sufficient. |

**Design principle:** Every dependency is a future maintenance burden. For a system designed to last decades, each package must justify its existence. The bar is: "Does this save significant complexity that would otherwise be hand-written?"

---

## Supabase-Specific Considerations

### Client Setup Architecture

```
lib/supabase/
  client.ts     -- Browser client (for client components)
  server.ts     -- Server client (for server components, using cookies)
  middleware.ts  -- Auth middleware (session refresh)
```

**Three client variants are required** because Next.js App Router has distinct execution contexts:
1. **Browser client:** Used in `"use client"` components for real-time interactions (checkbox toggles, form submissions)
2. **Server client:** Used in server components and route handlers for initial data fetching
3. **Middleware client:** Used in `middleware.ts` to refresh auth sessions on every request

This is the standard `@supabase/ssr` pattern. All three clients share the same Supabase project URL and anon key.

### Authentication Setup

- **Auth method:** Magic link (email OTP)
- **Session persistence:** Handled by `@supabase/ssr` via HTTP-only cookies
- **Session refresh:** Middleware refreshes the session on every request, preventing expiration during daily use
- **Single-user enforcement:** RLS policies ensure `user_id = auth.uid()`. No application-level user restriction is strictly needed, but as a defense-in-depth measure, the Supabase project should have signups disabled after the initial user is created.

### Row Level Security (RLS) Policies

All three tables need identical RLS policies:

```sql
-- Enable RLS
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_signals ENABLE ROW LEVEL SECURITY;

-- Policy pattern (same for all tables):
CREATE POLICY "Users can only access own data"
  ON {table_name}
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Risk note:** If RLS is not enabled or policies are misconfigured, any authenticated user (or the anon key) could access all data. This is the single most critical security configuration.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**Security note:** The anon key is intentionally public (it is used in the browser). Security is enforced by RLS, not by key secrecy. The service role key should NEVER be in the frontend environment.

---

## Security Risk Assessment

### CRITICAL Risks

1. **RLS misconfiguration**
   - **Impact:** Complete data exposure to any authenticated user or potentially public access
   - **Mitigation:** Write RLS policies as part of the database migration (not manually in dashboard). Test with a non-owner user to verify access is denied. Include RLS verification in CI if possible.
   - **Recommendation:** Implement RLS in iteration 1 as part of schema setup, not as an afterthought.

### MEDIUM Risks

2. **Supabase anon key exposure in client-side code**
   - **Impact:** Minimal if RLS is correctly configured. The anon key is designed to be public.
   - **Mitigation:** Ensure RLS is active. Never use the service_role key in frontend code.
   - **Recommendation:** Use `NEXT_PUBLIC_` prefix only for anon key and URL.

3. **Magic link email delivery**
   - **Impact:** If Supabase's email provider rate-limits or delays, login becomes impossible.
   - **Mitigation:** Supabase free tier uses a built-in email provider with rate limits (4 emails/hour). For single-user with persistent sessions, this is rarely an issue since login happens infrequently.
   - **Recommendation:** Accept the default for v1. If login friction appears, consider configuring a custom SMTP provider in Supabase settings.

4. **Session token in cookies**
   - **Impact:** Standard web auth risk (XSS could steal tokens, CSRF if misconfigured)
   - **Mitigation:** `@supabase/ssr` uses HTTP-only cookies by default. Next.js has built-in CSRF protections for server actions. Vercel provides automatic HTTPS.
   - **Recommendation:** No additional action needed for v1.

### LOW Risks

5. **Supabase service availability**
   - **Impact:** App is non-functional if Supabase is down (online-only v1)
   - **Mitigation:** Supabase has strong uptime. For single-user, brief outages are tolerable.
   - **Recommendation:** Accept for v1. PWA/offline is planned for post-MVP.

6. **Dependency supply chain attacks**
   - **Impact:** Malicious code in npm packages
   - **Mitigation:** Minimal dependency count (5 production packages) dramatically reduces attack surface. Use lockfile (`package-lock.json`) and pin exact versions in CI.
   - **Recommendation:** Run `npm audit` in CI pipeline.

---

## Non-Security Risk Assessment

### HIGH Risks

1. **`@supabase/ssr` pre-1.0 API instability**
   - **Impact:** Breaking changes in minor versions could require code changes
   - **Mitigation:** Pin to exact version (not caret range). Monitor Supabase changelog.
   - **Recommendation:** Use `0.9.0` exactly. Update deliberately, not automatically.

### MEDIUM Risks

2. **Supabase free tier limitations**
   - **Impact:** Database pauses after 7 days of inactivity on free tier
   - **Mitigation:** Daily use prevents pausing. If the user misses a week, the database auto-resumes on next request (with a cold-start delay of ~10 seconds).
   - **Recommendation:** Acceptable for v1. If this becomes irritating, upgrade to Supabase Pro ($25/month).

3. **Day boundary logic**
   - **Impact:** Edge case where opening the app at 1am shows "wrong" day
   - **Mitigation:** This is a product decision, not a dependency risk. Use server-side date calculation with a configurable boundary (e.g., 4am).
   - **Recommendation:** Flag as an open question. Default to midnight, make it configurable later.

4. **Next.js major version upgrade path**
   - **Impact:** Next.js major versions sometimes require significant migration effort
   - **Mitigation:** The app is extremely simple (3 pages, no complex routing). Migrations should be straightforward.
   - **Recommendation:** Use Next.js 15.x (current LTS). Defer upgrading to 16+ until it stabilizes.

### LOW Risks

5. **Vercel deployment limits (free tier)**
   - **Impact:** Bandwidth and serverless function limits
   - **Mitigation:** Single-user app with minimal traffic. Free tier is more than sufficient.
   - **Recommendation:** No action needed.

6. **Schema migration complexity**
   - **Impact:** Future schema changes could be painful if not planned
   - **Mitigation:** The schema is deliberately simple and stable. Use nullable columns for any future additions to avoid breaking migrations.
   - **Recommendation:** Design schema with nullable optional fields from the start. Use Supabase migrations (SQL files in version control).

---

## Testing Strategy Recommendations

### Layer 1: Unit Tests (Vitest)

**What to test:**
- Date utility functions (day boundary logic, week_start calculation)
- Data transformation functions (if any)
- Form validation logic (if any)

**Estimated count:** 5-10 tests
**When to write:** During iteration 1 for utility functions

### Layer 2: Component Tests (Vitest + Testing Library)

**What to test:**
- Today screen renders correctly with mock data
- Checkbox interactions toggle state
- Sleep timestamp buttons record correctly
- Project screen displays active project
- Signals screen form submission

**Estimated count:** 10-15 tests
**When to write:** During screen implementation

### Layer 3: Integration Tests (Vitest with mocked Supabase)

**What to test:**
- Supabase client calls for create/update daily record
- Auth session handling (mock middleware behavior)
- RLS-protected queries return correct data

**Approach:** Mock `@supabase/supabase-js` at the module level. Do not require a running Supabase instance for CI tests.

**Estimated count:** 5-8 tests
**When to write:** After CRUD logic is implemented

### What NOT to test in v1

- E2E tests (Playwright) -- overhead too high for 3 simple screens
- Visual regression tests -- the design is minimal and hand-verified
- Load/performance tests -- single-user system
- Supabase RLS policies directly -- verify manually during setup, or use Supabase's built-in SQL test capabilities

### Test Configuration

```
vitest.config.ts
  - environment: jsdom
  - setupFiles: ./test/setup.ts (Testing Library matchers)
  - include: ['src/**/*.test.{ts,tsx}']
```

---

## Build and Deployment Pipeline

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm audit --audit-level=moderate
```

### Deployment (Vercel)

- **Strategy:** Vercel auto-deploys from GitHub on push to `main`
- **Preview deployments:** Automatic on PRs (Vercel's default behavior)
- **Environment variables:** Set in Vercel dashboard (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- **Build command:** `next build` (Vercel default)
- **No custom infrastructure needed** -- Vercel handles everything

### Pipeline Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Supabase Schema Management

- **Approach:** Store SQL migration files in `supabase/migrations/` within the repo
- **Application method:** Apply manually via Supabase dashboard or CLI during setup
- **Supabase CLI:** Optional for v1. Manual SQL execution in the dashboard is sufficient for 3 tables.
- **Recommendation:** Keep migration SQL in version control even if applied manually. This ensures reproducibility.

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (2 iterations)

### Iteration 1: Foundation + Core Screen

**Vision:** Establish the complete backend foundation and deliver the primary daily-use screen (Today).

**Scope:**
- Next.js project scaffolding with TypeScript
- Supabase client configuration (browser, server, middleware)
- Database schema (all 3 tables + RLS policies)
- Magic link authentication flow
- Navigation shell (bottom bar with 3 labels)
- Today screen (full implementation with all daily anchors)
- Vitest setup with initial tests

**Dependencies:** Supabase project must be created (external manual step)

**Why first:** Auth + schema + Today screen constitute the daily-use core. If only iteration 1 ships, the user has a functional daily ground-state tracker. The Today screen is used every day; the other screens are used weekly or rarely.

**Estimated duration:** 6-8 hours
**Risk level:** LOW
**Success criteria:** User can log in, see today's record, mark checkboxes, record sleep timestamps, and write a daily note. Data persists across sessions.

### Iteration 2: Secondary Screens + Polish

**Vision:** Complete the remaining screens and production hardening.

**Scope:**
- Ground Project screen (display + edit active project)
- Weekly Signals screen (create + view signal entries)
- Display current ground project name on Today screen
- Component tests for all screens
- CI pipeline (GitHub Actions)
- Production deployment to Vercel

**Dependencies from Iteration 1:**
- Requires: Auth system, Supabase client, database schema, navigation shell
- Imports: Supabase client utilities, auth context, layout components, TypeScript types

**Estimated duration:** 4-6 hours
**Risk level:** LOW
**Success criteria:** All three screens functional. CI pipeline passes. App deployed to Vercel and accessible via URL.

---

## Dependency Graph

```
External Prerequisites (manual)
  Supabase project creation
  Vercel project link
  Environment variables configured

Iteration 1: Foundation + Daily Use
  +-- Next.js scaffolding (TypeScript, App Router)
  +-- Supabase client setup (browser + server + middleware)
  +-- Database schema (3 tables + RLS)
  +-- Auth flow (magic link login + session persistence)
  +-- Navigation shell (bottom bar)
  +-- Today screen (daily record CRUD + UI)
  +-- Test setup (Vitest + Testing Library)
      |
      v
Iteration 2: Complete + Deploy
  +-- Ground Project screen (CRUD + UI)
  +-- Weekly Signals screen (CRUD + UI)
  +-- Today screen enhancement (show project name)
  +-- Component tests for all screens
  +-- CI pipeline (GitHub Actions)
  +-- Production deployment (Vercel)
```

---

## Cross-Phase Integration Points

### Shared Supabase Client Pattern
The Supabase client setup from iteration 1 is used identically in iteration 2. The pattern (browser/server/middleware clients) must be established correctly in iteration 1 to avoid rework.

### Shared Auth Context
All screens depend on the same auth middleware and session handling. This is built once in iteration 1 and reused.

### Shared Layout/Navigation
The navigation shell and page layout from iteration 1 wrap all screens in iteration 2. The layout must be designed to accommodate all 3 screen slots from the start.

### TypeScript Types
Database types (generated from schema or manually defined) are shared across all screens. Define them in iteration 1 in a shared `types/` or `lib/types.ts` file.

### Potential Integration Challenge
- **Today screen showing ground project name:** This creates a read-dependency from the daily_records screen to the ground_projects table. It is a simple query but should be planned for in iteration 1's data fetching pattern even if the Project screen UI is built in iteration 2.

---

## Recommendations for Master Plan

1. **Use Next.js 15.5.x, not 16.x**
   - Next.js 15 is the stable LTS line. For a project designed for decades of stability, avoid adopting a major version in its first months. 16.x can be adopted later once it matures.

2. **Pin `@supabase/ssr` to exact version**
   - Pre-1.0 packages can have breaking changes in minor releases. Pin to `0.9.0` exactly and upgrade deliberately.

3. **Disable Supabase signups after creating the initial user**
   - In Supabase dashboard: Authentication > Settings > disable "Enable email signup". This prevents unauthorized account creation and is the simplest single-user enforcement.

4. **Store SQL migrations in version control from day one**
   - Even if applied manually via dashboard, having migration files in `supabase/migrations/` ensures reproducibility and serves as documentation.

5. **Keep iteration 1 as the "daily use minimum"**
   - The Today screen is the only screen used every day. If iteration 2 is delayed, the user still has a working daily ground-state tracker. This de-risks the project.

6. **CSS approach: use Next.js CSS Modules**
   - No CSS framework needed for 3 screens with a muted palette. CSS Modules provide scoping without any additional dependency. If Tailwind is desired, it is a reasonable low-risk addition but not necessary.

7. **Run `npm audit` in CI**
   - With only 5 production dependencies, the audit surface is small. Automate it to catch issues early.

---

## Technology Recommendations

### Existing Codebase Findings
- **Stack detected:** None -- this is a greenfield project
- **Patterns observed:** No existing code to follow
- **Constraints:** Must use locked stack (Next.js App Router, Supabase, Vercel, TypeScript, GitHub Actions)

### Recommended Final Dependency Manifest

**Production (5 packages):**
```
next@^15.5.0
react@^19.0.0
react-dom@^19.0.0
@supabase/supabase-js@^2.99.0
@supabase/ssr@0.9.0
```

**Dev (9 packages):**
```
typescript@^5.9.0
@types/react@^19.0.0
@types/node@^22.0.0
eslint@^9.0.0
eslint-config-next@^15.5.0
vitest@^4.0.0
@testing-library/react@^16.0.0
@testing-library/jest-dom@^6.0.0
jsdom@^28.0.0
```

**Total: 14 packages.** This is a deliberately minimal footprint for a production-grade Next.js application.

---

## Notes & Observations

- The project's philosophy of minimal dependencies aligns perfectly with its technical requirements. Three screens, one user, simple CRUD -- there is no justification for a heavy dependency tree.

- Supabase's free tier is well-suited for single-user usage. The main limitation (database pausing after 7 days of inactivity) is irrelevant for a daily-use app.

- The biggest risk to this project is not technical but philosophical: the temptation to add dependencies "just in case." Each package added is a maintenance commitment measured in years, given the project's longevity goal. The bar should be: "Is hand-writing this significantly harder than importing a library?"

- The schema is stable by design. Three tables with simple columns and no complex relationships. This should not require migrations for years, which is exactly the goal.

- Authentication is the only complex subsystem, and Supabase handles it entirely. The application code only needs to wire up the client correctly and trust RLS for authorization.

---

*Exploration completed: 2026-03-12*
*This report informs master planning decisions*
