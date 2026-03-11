# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
SelahOS is a minimal personal operating system for daily ground-layer maintenance -- three screens (Today, Project, Signals), single user, backed by Supabase and Next.js, designed to feel like a quiet instrument panel that can remain stable for decades.

---

## Requirements Analysis

### Scope Assessment
- **Total must-have features identified:** 5 (Daily Record Entry, Ground Project Display, Weekly Signals, Authentication, Navigation)
- **User stories/acceptance criteria:** 23 acceptance criteria across all features
- **Post-MVP features:** 2 (PWA, Offline support)
- **Future features:** 2 (Sleep auto-derivation, Historical records)
- **Estimated total work:** 10-16 hours

### Complexity Rating
**Overall Complexity: SIMPLE**

**Rationale:**
- Only 3 screens with well-defined, narrow scope
- Single user, no multi-tenancy or role-based access
- 3 database tables with straightforward schemas, no complex relations or joins
- CRUD operations only -- no real-time features, no complex business logic, no workflows
- Tech stack is fully locked and well-understood (Next.js + Supabase is a standard pairing)
- No external API integrations, no third-party services beyond Supabase
- Greenfield project with no legacy code to navigate
- Authentication is delegated entirely to Supabase (magic link)

---

## Architectural Analysis

### Overall Architecture Pattern

**Monolithic Next.js Application with Supabase Backend-as-a-Service**

This is the simplest viable architecture for this project. Next.js App Router handles both the UI and any server-side logic. Supabase provides the database, authentication, and row-level security -- eliminating the need for a custom API layer. The Supabase client is used directly from the frontend for all data operations.

```
Browser (Mobile-first)
  |
  v
Next.js App Router (Vercel)
  |-- /app/page.tsx            (Today screen - default route)
  |-- /app/project/page.tsx    (Ground Project screen)
  |-- /app/signals/page.tsx    (Signals screen)
  |-- /app/login/page.tsx      (Magic link login)
  |-- /app/layout.tsx          (Shell + nav + auth provider)
  |
  v
Supabase Client (browser-side, @supabase/ssr)
  |
  v
Supabase Platform
  |-- PostgreSQL (3 tables + RLS policies)
  |-- Auth (magic link, session management)
```

### Major Components Identified

1. **Authentication Layer**
   - **Purpose:** Magic link login via Supabase Auth, session persistence, route protection
   - **Complexity:** LOW
   - **Why critical:** Foundation -- all data operations depend on auth.uid() for RLS. Must be in place before any screen can function.
   - **Implementation notes:** Use `@supabase/ssr` for Next.js App Router integration. Middleware for route protection. Auth callback route for magic link handling.

2. **Database Schema & RLS Policies**
   - **Purpose:** 3 tables (daily_records, ground_projects, weekly_signals) with row-level security
   - **Complexity:** LOW
   - **Why critical:** The data foundation. Schema must be designed for decades of stability (per vision). RLS policies enforce single-user security at the database level.
   - **Implementation notes:** Supabase migrations. Unique constraint on (user_id, date) for daily_records. Enum-like status field on ground_projects. RLS policy: `user_id = auth.uid()` on all tables for SELECT, INSERT, UPDATE.

3. **Today Screen (Daily Record)**
   - **Purpose:** Main screen showing all daily ground anchors with completion UI
   - **Complexity:** MEDIUM (highest complexity screen due to number of fields and upsert logic)
   - **Why critical:** Primary daily interaction point. Must be usable half-asleep with large tap targets.
   - **Implementation notes:** Upsert pattern -- create record on first interaction, update on subsequent ones. Sleep timestamps via "going to sleep" / "woke up" buttons. Checkbox/toggle for boolean fields. Auto-save on each interaction (no explicit save button).

4. **Ground Project Screen**
   - **Purpose:** Display and edit the current active ground-building project
   - **Complexity:** LOW
   - **Why critical:** Supports ground-building visibility, but is the simplest screen.
   - **Implementation notes:** Fetch active project (status = 'active'). Simple form for name and status update. Minimal UI.

5. **Signals Screen (Weekly)**
   - **Purpose:** Weekly reflection entry with financial note, sleep state, weekly note
   - **Complexity:** LOW
   - **Why critical:** Weekly stability check. Simple text entry form.
   - **Implementation notes:** Create new signal entry for current week. Display recent signals. Week calculation logic needed (week_start date).

6. **Navigation Shell**
   - **Purpose:** Bottom navigation bar between three screens
   - **Complexity:** LOW
   - **Why critical:** The structural frame. Must be muted, text-only, no icons or badges.
   - **Implementation notes:** Persistent layout component in app/layout.tsx. Three text links: Today, Project, Signals. Active state indication (subtle).

7. **Design System / Shared UI**
   - **Purpose:** Consistent visual language -- grey/brown palette, garden green accents, instrument-panel aesthetic
   - **Complexity:** LOW
   - **Why critical:** The feel of the application IS the product. Getting the palette and typography right is essential to the vision.
   - **Implementation notes:** CSS variables for the palette. Tailwind CSS with custom theme or plain CSS modules. Shared checkbox/toggle component with large tap targets. Mobile-first responsive design.

### Technology Stack (Locked)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 (App Router) | Server components where possible, client components for interactive elements |
| Language | TypeScript | Throughout |
| Styling | Tailwind CSS | Custom theme with grey/brown/garden-green palette. Minimal dependencies. |
| Auth | Supabase Auth | Magic link (email). `@supabase/ssr` for Next.js integration |
| Database | Supabase PostgreSQL | 3 tables, RLS policies |
| ORM/Client | Supabase JS Client | Direct client-side queries. No custom API routes needed. |
| Hosting | Vercel | Automatic deployment from GitHub |
| CI/CD | GitHub Actions | Lint, type-check, test, deploy |

### Technology Decisions Within the Locked Stack

**Styling Approach: Tailwind CSS**
- **Rationale:** Minimal dependency footprint. Utility-first works well for a small app with a custom palette. No need for a component library -- the UI is too simple and too specific to benefit from one.
- **Alternative considered:** CSS Modules -- viable but Tailwind is more efficient for rapid development of a custom design system.

**State Management: None (Supabase client + React state)**
- **Rationale:** With 3 screens and simple CRUD operations, React's built-in useState/useEffect is sufficient. No global state library needed. Supabase client handles data fetching. Consider a thin data-fetching hook per table for consistency.
- **Alternative considered:** React Query / SWR -- could add for cache management, but likely overengineering for a single-user app with simple queries. Re-evaluate if latency becomes noticeable.

**Date Handling: Native Date or date-fns (lightweight)**
- **Rationale:** Need to handle day boundaries (the open question about midnight vs 4am), week_start calculations, and timestamp formatting. Keep it minimal.
- **Open question from vision:** Day boundary definition -- suggest defaulting to 4:00 AM as the day boundary (common for night-owl patterns, aligns with the "going to sleep" / "woke up" model).

---

## Code Organization

### Proposed Directory Structure

```
selah-os/
  src/
    app/
      layout.tsx              # Root layout: auth provider, nav shell, global styles
      page.tsx                # Today screen (default route)
      project/
        page.tsx              # Ground Project screen
      signals/
        page.tsx              # Signals screen
      login/
        page.tsx              # Magic link login form
      auth/
        callback/
          route.ts            # Auth callback handler for magic link
    components/
      nav.tsx                 # Bottom navigation bar
      checkbox.tsx            # Shared large-tap-target checkbox
      sleep-button.tsx        # "Going to sleep" / "Woke up" button
      text-field.tsx          # Shared text input (for notes)
    lib/
      supabase/
        client.ts             # Browser Supabase client
        server.ts             # Server-side Supabase client
        middleware.ts          # Auth middleware helper
      types.ts                # Database types (generated or manual)
      dates.ts                # Day boundary logic, week calculation
    styles/
      globals.css             # Tailwind base + custom palette variables
  supabase/
    migrations/
      001_initial_schema.sql  # Tables + RLS policies
    seed.sql                  # Optional: seed ground project
  middleware.ts               # Next.js middleware for route protection
  tailwind.config.ts          # Custom theme (palette, fonts)
  next.config.ts
  package.json
  tsconfig.json
```

### Module Boundaries

- **app/** -- Pages only. Minimal logic in page files; delegate to components.
- **components/** -- Reusable UI components. No data fetching inside components; receive data via props or hooks.
- **lib/** -- Business logic, Supabase clients, utility functions. No UI concerns.
- **supabase/** -- Database migrations and seed data. Infrastructure-as-code.

---

## Build and Deployment Pipeline

### CI/CD Requirements (GitHub Actions)

**On Pull Request:**
1. Install dependencies
2. TypeScript type-check (`tsc --noEmit`)
3. Lint (`eslint`)
4. Run tests (if any -- see testing section)
5. Build (`next build`) to catch build errors

**On Merge to Main:**
1. All PR checks
2. Deploy to Vercel (via Vercel GitHub integration or `vercel deploy --prod`)

**Supabase Migrations:**
- Managed via Supabase CLI (`supabase db push` or `supabase migration up`)
- For v1, manual migration application is acceptable given single developer
- Future: Add migration step to CI/CD pipeline

### Deployment Topology

```
GitHub (source) --> GitHub Actions (CI) --> Vercel (hosting)
                                       --> Supabase (database, managed separately)
```

---

## Iteration Breakdown Recommendation

### Recommendation: SINGLE ITERATION

**Rationale:**
- The entire application is 3 screens with CRUD operations against 3 tables
- No complex dependencies between screens -- they are independent views of independent data
- The auth foundation and all screens can be built in a single coherent pass
- Total estimated duration: 10-16 hours of builder work
- Splitting into multiple iterations would add overhead (re-exploration, re-planning) that exceeds the work saved
- All components share the same foundation (auth, Supabase client, design system) -- building them together is more efficient

**If the orchestrator prefers multi-iteration (2 iterations):**

**Iteration 1: Foundation + Today Screen (6-8 hours)**
- Supabase project setup, schema migration, RLS policies
- Auth flow (magic link login, session persistence, middleware)
- Design system (palette, shared components, layout shell, navigation)
- Today screen (the most complex screen, validates the full stack end-to-end)
- **Success criteria:** User can log in, see Today screen, mark daily anchors, data persists

**Iteration 2: Remaining Screens + Polish (4-6 hours)**
- Ground Project screen
- Signals screen
- Mobile responsive polish
- Day boundary logic refinement
- Final deployment configuration
- **Success criteria:** All 3 screens functional, deployed to Vercel, usable on mobile

**Why single iteration is preferred:** The total scope is small enough that a single iteration avoids the overhead of re-exploration and re-planning. The "foundation" work (auth, schema, design system) is inseparable from the first screen anyway. Building all three screens in one pass allows the builder to establish patterns on the Today screen and apply them efficiently to the simpler screens.

---

## Component Dependency Map

```
Supabase Setup (schema + RLS + auth config)
  |
  +-- Auth Flow (login page, callback, middleware, session)
  |     |
  |     +-- Layout Shell (nav bar, auth provider, global styles)
  |           |
  |           +-- Today Screen (daily_records CRUD)
  |           |     |
  |           |     +-- Checkbox component
  |           |     +-- Sleep button component
  |           |     +-- Text field component
  |           |
  |           +-- Project Screen (ground_projects CRUD)
  |           |     |
  |           |     +-- Text field component (reused)
  |           |
  |           +-- Signals Screen (weekly_signals CRUD)
  |                 |
  |                 +-- Text field component (reused)
  |
  +-- Design System (palette, typography, shared CSS)
        |
        +-- All screens depend on this
```

Key observation: The three screens are **siblings, not a chain**. They share a foundation (auth, layout, design system) but do not depend on each other. This means they could theoretically be built in parallel, but in practice a single builder will build them sequentially, reusing patterns established on the first screen.

---

## Testing Considerations

### Recommended Testing Strategy

Given the project's simplicity and single-user nature, testing should be proportional:

**Essential (include in v1):**
- **TypeScript strict mode** -- catches type errors at compile time, effectively replaces many unit tests for a CRUD app
- **Build verification** -- `next build` in CI catches SSR/import errors
- **Linting** -- ESLint with standard Next.js config

**Recommended (include if time permits):**
- **Component smoke tests** -- Verify each screen renders without crashing (React Testing Library)
- **Date utility tests** -- Unit tests for day boundary logic and week calculation (these are the only non-trivial business logic)
- **Auth flow integration test** -- Verify protected routes redirect to login

**Not needed for v1:**
- End-to-end tests (Playwright/Cypress) -- overengineering for 3 screens with a single user
- API tests -- no custom API routes; Supabase client is tested by Supabase
- Load testing -- single user
- Visual regression tests -- minimal UI, manual verification is sufficient

### Test Infrastructure
- Jest or Vitest for unit tests
- React Testing Library for component tests
- Tests run in GitHub Actions CI pipeline

---

## Security Considerations

### Authentication Security
- **Magic link auth** is handled entirely by Supabase -- no password storage, no password reset flows
- **Session persistence** via Supabase's built-in session management (refresh tokens)
- **Single authorized user** -- no signup flow exposed. Initial user created manually in Supabase dashboard.
- **Risk:** Magic link emails could be intercepted. Mitigation: Supabase magic links expire after use and have time limits. Acceptable risk for a personal tool.

### Data Security
- **Row Level Security (RLS)** on all tables: `user_id = auth.uid()` -- enforced at the database level, not the application level. This is the strongest guarantee.
- **No custom API routes** -- data access goes through Supabase client with RLS. No risk of forgetting auth checks on an API endpoint.
- **Supabase anon key** is exposed in the browser (this is by design). RLS ensures it cannot access other users' data. Since this is single-user, the exposure surface is minimal.

### Application Security
- **CSRF protection** -- handled by Supabase Auth's token-based approach (no cookie-based auth vulnerabilities)
- **XSS risk** -- minimal. The app has very few user input fields (note text, project name). React's default escaping handles this. No dangerouslySetInnerHTML needed.
- **Environment variables** -- Supabase URL and anon key are public (NEXT_PUBLIC_). Service role key must never be exposed in the browser.

### Security Recommendations
1. Lock down Supabase project: disable signups in Supabase dashboard after creating the single user
2. Enable Supabase's built-in rate limiting
3. Use `NEXT_PUBLIC_` prefix only for anon key and URL; keep service role key server-side only
4. RLS policies should cover SELECT, INSERT, UPDATE, DELETE on all three tables

---

## CI/CD Requirements

### GitHub Actions Workflow

```yaml
# Minimum viable CI pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    - checkout
    - setup node
    - install deps (npm ci)
    - typecheck (tsc --noEmit)
    - lint (eslint)
    - test (if tests exist)
    - build (next build)
```

### Deployment
- **Vercel GitHub Integration** handles deployment automatically on push to main
- No need for a separate deploy step in GitHub Actions -- Vercel's built-in integration is simpler and more reliable
- Preview deployments on PRs (Vercel default behavior)

### Supabase Migration Management
- Store migrations in `supabase/migrations/`
- For v1: apply migrations manually via Supabase CLI or dashboard
- Future enhancement: add `supabase db push` step to CI/CD

---

## Risk Assessment

### Low Risks

- **Day boundary logic:** The vision raises the question of when a "new day" starts (midnight vs 4am). This is a design decision, not a technical risk. Recommend 4:00 AM as the boundary. Implement as a configurable constant.
- **Supabase free tier limits:** Single-user app will use negligible resources. No risk of hitting limits.
- **Schema stability:** The schema is simple and well-defined. Low risk of needing migrations. The unique constraint on (user_id, date) for daily_records is the most important integrity guarantee.

### Medium Risks

- **Supabase Auth SSR integration:** The `@supabase/ssr` package for Next.js App Router has specific patterns for cookie management in middleware and server components. Not complex, but requires following the documentation carefully. Misconfiguration can lead to session loss or auth loops.
  - **Mitigation:** Follow Supabase's official Next.js App Router guide precisely. Test login/logout/session-refresh flow manually.

### No High Risks Identified

This project has no high-risk elements. The scope is narrow, the tech stack is standard, and the requirements are well-defined.

---

## Integration Considerations

### Cross-Component Integration Points

- **Auth context propagation:** The Supabase client instance must be available in all screens. Use a shared client factory in `lib/supabase/client.ts` and pass the auth session through layout context.
- **Design system consistency:** All screens share the same palette, typography, and component library. Establish this in the layout and globals.css early.
- **Today screen + Ground Project:** The Today screen displays the current ground project name. This is a read-only reference -- fetch the active project in the Today screen's data loading. Not a deep coupling.

### Potential Integration Challenges

- **Supabase client initialization in App Router:** Server components vs client components have different Supabase client patterns. Need to be deliberate about which components are server vs client. Recommendation: pages that need interactivity (Today, Project, Signals) should be client components. The layout can be a server component that passes the session down.
- **Auto-save pattern on Today screen:** Each checkbox toggle should immediately persist to the database. This requires an upsert pattern (INSERT ON CONFLICT UPDATE) and debouncing for the note text field. Not complex, but needs to be implemented correctly to avoid race conditions.

---

## Recommendations for Master Plan

1. **Recommend single iteration**
   - The project is deliberately simple. Three screens, three tables, CRUD operations. Breaking this into multiple iterations adds planning overhead that exceeds the complexity of the work itself. A single focused iteration of 10-16 hours can deliver the complete MVP.

2. **Build the Today screen first within the iteration**
   - It is the most complex screen, exercises the full stack (auth, database, UI components), and establishes all patterns that the simpler screens will reuse. If the builder validates the Today screen end-to-end, the remaining screens are straightforward applications of the same patterns.

3. **Establish the design system as part of the first screen, not as a separate phase**
   - The palette and component patterns (checkbox, text field, sleep button) emerge naturally while building the Today screen. Extracting them for reuse in Project and Signals screens is trivial.

4. **Do not over-engineer**
   - No state management library. No component library. No custom API routes. No complex testing infrastructure. The vision explicitly values simplicity and durability. The architecture should reflect this: minimal dependencies, straightforward patterns, code that a single developer can understand and maintain for years.

5. **Address open questions early in the iteration**
   - Day boundary (4am recommended)
   - Deployment URL (start with default Vercel URL, configure custom domain later)

---

## Technology Recommendations

### Greenfield Project

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase (`@supabase/ssr`) + Vercel
- **Minimal dependencies:** next, react, react-dom, @supabase/supabase-js, @supabase/ssr, tailwindcss. That should be nearly the entire dependency list.
- **Dev dependencies:** typescript, eslint, eslint-config-next, @types/react, @types/node, postcss, autoprefixer
- **No additional libraries needed** -- no date library (use Intl.DateTimeFormat + simple date arithmetic), no state management, no form library, no UI component library

### Rationale
This minimal dependency approach aligns with the vision's core value: "stable for decades." Fewer dependencies means fewer breaking changes on upgrade, fewer security vulnerabilities to patch, and less cognitive overhead for the single maintainer.

---

## Notes & Observations

- The vision document is exceptionally well-defined. The schema, screens, interactions, and constraints are all clearly specified. This reduces exploration risk to near zero.
- The project's anti-patterns (no gamification, no nudging, no optimization pressure) are as important as its features. The architecture should make it hard to accidentally add complexity.
- "Usable half-asleep" is a real UX constraint with architectural implications: large tap targets, minimal interaction steps, auto-save, no confirmation dialogs, no loading spinners that block interaction.
- The single-user constraint dramatically simplifies everything: no multi-tenancy, no role-based access, no user management, no onboarding flow. RLS with `user_id = auth.uid()` is the entire security model.
- Supabase free tier is more than sufficient for decades of single-user daily records (365 rows/year in daily_records, 52 in weekly_signals, ~1-5 in ground_projects).

---

*Exploration completed: 2026-03-12*
*This report informs master planning decisions*
