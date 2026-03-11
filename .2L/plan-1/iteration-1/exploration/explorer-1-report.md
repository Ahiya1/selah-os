# Explorer 1 Report: Architecture & Structure for Iteration 1

## Executive Summary

SelahOS Iteration 1 is a greenfield build delivering a complete foundation (Next.js scaffolding, Supabase auth, database schema, design system) plus the fully functional Today screen. The codebase currently contains only `vision.md` -- everything must be created from scratch. This report defines the exact file structure, component dependency map, database schema SQL, builder task decomposition (3 builders), security policies, and testability considerations. The architecture is deliberately simple: a monolithic Next.js App Router application with direct Supabase client access, no custom API routes, and minimal dependencies.

## Existing Codebase Analysis

**Current state:** True greenfield. The repository contains:
- `.git/` -- initialized git repository
- `vision.md` -- product vision document
- `.2L/` -- planning artifacts

No `package.json`, no `src/`, no configuration files. Everything in this iteration is net-new.

---

## Exact File Structure

The following is the complete file tree that Iteration 1 must produce. Every file is listed with its purpose. Files are grouped by the builder responsible for creating them (see Builder Decomposition section below).

```
selah-os/
├── .env.local.example              # Template for environment variables
├── .eslintrc.json                  # ESLint configuration (flat config)
├── .gitignore                      # Node, Next.js, env ignores
├── middleware.ts                   # Next.js middleware (auth session refresh + route protection)
├── next.config.ts                  # Next.js configuration (minimal)
├── package.json                    # Dependencies and scripts
├── postcss.config.mjs              # PostCSS config for Tailwind v4
├── tsconfig.json                   # TypeScript strict configuration
├── vitest.config.ts                # Vitest test runner configuration
├── vitest.setup.ts                 # Test setup (Testing Library matchers)
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # All 3 tables + RLS policies + indexes
│
├── src/
│   ├── app/
│   │   ├── globals.css             # Tailwind v4 imports + CSS custom properties (palette)
│   │   ├── layout.tsx              # Root layout: metadata, font, auth check, nav shell
│   │   ├── page.tsx                # Today screen (default route, main entry point)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx            # Magic link login form
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts        # Auth callback handler (GET route for magic link)
│   │   │
│   │   ├── project/
│   │   │   └── page.tsx            # Placeholder page ("Coming soon" or minimal shell)
│   │   │
│   │   └── signals/
│   │       └── page.tsx            # Placeholder page ("Coming soon" or minimal shell)
│   │
│   ├── components/
│   │   ├── nav.tsx                 # Fixed bottom navigation bar
│   │   ├── anchor-checkbox.tsx     # Reusable large-tap-target checkbox with label
│   │   ├── sleep-button.tsx        # "Going to sleep" / "Woke up" timestamp button
│   │   ├── note-field.tsx          # Auto-saving textarea for daily note
│   │   ├── section-group.tsx       # Visual grouping wrapper for anchor sections
│   │   └── date-header.tsx         # Today's effective date display
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser-side Supabase client (singleton)
│   │   │   ├── server.ts           # Server-side Supabase client (uses cookies)
│   │   │   └── middleware.ts       # Middleware helper for session refresh
│   │   │
│   │   ├── types.ts                # Database types (manually defined, mirrors schema)
│   │   ├── dates.ts                # Day boundary logic, effective date, week start
│   │   └── constants.ts            # DAY_BOUNDARY_HOUR = 4, palette values if needed
│   │
│   └── hooks/
│       ├── use-daily-record.ts     # Fetch + upsert hook for today's daily record
│       └── use-debounced-upsert.ts # Generic debounced save hook (500ms)
│
└── test/
    ├── lib/
    │   └── dates.test.ts           # Unit tests for day boundary logic
    ├── hooks/
    │   └── use-daily-record.test.ts # Hook tests with mocked Supabase
    └── components/
        └── nav.test.tsx            # Navigation component smoke test
```

### Key Structural Decisions

1. **`src/` directory**: All application code lives under `src/` for clean separation from config files. Next.js App Router supports this natively.

2. **`hooks/` directory**: Separated from `lib/` because hooks contain React-specific logic (useState, useEffect, useCallback). The `lib/` directory remains framework-agnostic.

3. **Tailwind v4**: The current stable release is v4.2.1. Tailwind v4 uses CSS-first configuration (no `tailwind.config.ts`). Custom theme values are defined in `globals.css` using `@theme` directive. This simplifies the setup.

4. **No `tailwind.config.ts`**: Tailwind v4 configures via CSS. The `postcss.config.mjs` points to `@tailwindcss/postcss`. Theme customization happens in `globals.css`.

5. **Placeholder pages for Project and Signals**: These screens are built in Iteration 2, but the routes must exist so navigation works. They show a minimal "Coming soon" or just the section title.

6. **`middleware.ts` at project root** (not inside `src/`): Next.js requires middleware at the project root or `src/` root. Since we use `src/`, it goes at `src/middleware.ts` -- CORRECTION: Next.js only looks for `middleware.ts` at the project root OR `src/middleware.ts`. We place it at project root for clarity.

---

## Component Dependency Map

```
middleware.ts (route protection + session refresh)
  └── lib/supabase/middleware.ts (createServerClient for middleware context)

app/layout.tsx (root layout)
  ├── globals.css (palette, Tailwind base)
  ├── components/nav.tsx (fixed bottom bar)
  └── [children pages]

app/login/page.tsx (magic link form)
  └── lib/supabase/client.ts (browser client for auth.signInWithOtp)

app/auth/callback/route.ts (magic link handler)
  └── lib/supabase/server.ts (server client for auth.exchangeCodeForSession)

app/page.tsx (Today screen)
  ├── hooks/use-daily-record.ts
  │   ├── lib/supabase/client.ts (browser client for queries)
  │   ├── hooks/use-debounced-upsert.ts (500ms debounce)
  │   ├── lib/dates.ts (getEffectiveDate)
  │   └── lib/types.ts (DailyRecord type)
  ├── components/date-header.tsx
  │   └── lib/dates.ts (getEffectiveDate, formatDate)
  ├── components/anchor-checkbox.tsx (pure UI, receives onChange prop)
  ├── components/sleep-button.tsx (receives onTap prop, displays timestamp)
  ├── components/note-field.tsx (receives value + onChange, debounces internally)
  └── components/section-group.tsx (pure layout wrapper)

app/project/page.tsx (placeholder)
  └── (minimal, no dependencies beyond layout)

app/signals/page.tsx (placeholder)
  └── (minimal, no dependencies beyond layout)
```

### Dependency Flow Rules

1. **Components never import Supabase directly.** They receive data and callbacks via props or hooks.
2. **Hooks handle all Supabase interaction.** `use-daily-record.ts` is the single point of data access for the Today screen.
3. **`lib/` has zero React imports.** Pure TypeScript utilities only.
4. **Pages are thin orchestrators.** They wire hooks to components and handle layout.

---

## Database Schema SQL

This is the exact SQL for `supabase/migrations/001_initial_schema.sql`. All three tables are created in Iteration 1 even though Project and Signals screens ship in Iteration 2. This avoids a schema migration between iterations.

```sql
-- ============================================================
-- SelahOS Initial Schema
-- Created: 2026-03-12
-- All three tables + RLS policies + indexes
-- Designed for decades of stability. No unnecessary columns.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: daily_records
-- Tracks all daily ground anchors for a single day.
-- One row per user per effective date.
-- ============================================================
CREATE TABLE daily_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,

  -- Sleep
  sleep_start TIMESTAMPTZ,
  sleep_end   TIMESTAMPTZ,

  -- Food
  breakfast   BOOLEAN NOT NULL DEFAULT FALSE,
  lunch       BOOLEAN NOT NULL DEFAULT FALSE,
  dinner      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Medication
  cipralex_taken BOOLEAN NOT NULL DEFAULT FALSE,

  -- Body
  hygiene_done   BOOLEAN NOT NULL DEFAULT FALSE,
  movement_done  BOOLEAN NOT NULL DEFAULT FALSE,

  -- Ground
  ground_maintenance_done BOOLEAN NOT NULL DEFAULT FALSE,
  ground_build_done       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Note
  note        TEXT DEFAULT '',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT daily_records_user_date_unique UNIQUE (user_id, date)
);

-- Index for fast lookup of today's record
CREATE INDEX idx_daily_records_user_date ON daily_records (user_id, date DESC);

-- ============================================================
-- Table: ground_projects
-- Tracks ground-building projects. Normally only one active.
-- ============================================================
CREATE TABLE ground_projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  start_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching the active project
CREATE INDEX idx_ground_projects_user_status ON ground_projects (user_id, status);

-- ============================================================
-- Table: weekly_signals
-- Minimal weekly reflection entries.
-- One row per user per week (identified by Monday start date).
-- ============================================================
CREATE TABLE weekly_signals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start     DATE NOT NULL,

  financial_note TEXT DEFAULT '',
  sleep_state    TEXT DEFAULT '',
  note           TEXT DEFAULT '',

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_signals_user_week_unique UNIQUE (user_id, week_start)
);

-- Index for fetching recent signals
CREATE INDEX idx_weekly_signals_user_week ON weekly_signals (user_id, week_start DESC);

-- ============================================================
-- Row Level Security
-- All tables: users can only access their own rows.
-- ============================================================

ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_signals ENABLE ROW LEVEL SECURITY;

-- daily_records policies
CREATE POLICY "Users can view own daily records"
  ON daily_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily records"
  ON daily_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily records"
  ON daily_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ground_projects policies
CREATE POLICY "Users can view own ground projects"
  ON ground_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ground projects"
  ON ground_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ground projects"
  ON ground_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- weekly_signals policies
CREATE POLICY "Users can view own weekly signals"
  ON weekly_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly signals"
  ON weekly_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly signals"
  ON weekly_signals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ground_projects_updated_at
  BEFORE UPDATE ON ground_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER weekly_signals_updated_at
  BEFORE UPDATE ON weekly_signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Schema Design Notes

1. **`updated_at` column added**: Not in the original vision but essential for debugging and conflict detection. Auto-updated via trigger.

2. **`TIMESTAMPTZ` for sleep timestamps**: Stores UTC with timezone awareness. The browser sends the timestamp; Supabase stores it in UTC. Display converts back to local timezone.

3. **`TEXT DEFAULT ''` for text fields**: Empty string default rather than NULL. This simplifies frontend handling (no null checks). An empty string and absence of input are semantically equivalent here.

4. **`CHECK` constraint on project status**: Prevents invalid values at the database level. Only 'active' and 'paused' are allowed.

5. **No DELETE policies**: Intentional. The user should not delete records. If needed in the future, a policy can be added. Omitting DELETE protects against accidental data loss.

6. **Foreign key to `auth.users`**: `ON DELETE CASCADE` ensures clean removal if the Supabase user is ever deleted. This is a safety measure, not an expected flow.

---

## TypeScript Type Definitions

The file `src/lib/types.ts` must mirror the schema exactly:

```typescript
export interface DailyRecord {
  id: string
  user_id: string
  date: string // YYYY-MM-DD format
  sleep_start: string | null // ISO 8601 timestamp
  sleep_end: string | null   // ISO 8601 timestamp
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  cipralex_taken: boolean
  hygiene_done: boolean
  movement_done: boolean
  ground_maintenance_done: boolean
  ground_build_done: boolean
  note: string
  created_at: string
  updated_at: string
}

export interface GroundProject {
  id: string
  user_id: string
  name: string
  status: 'active' | 'paused'
  start_date: string // YYYY-MM-DD
  created_at: string
  updated_at: string
}

export interface WeeklySignal {
  id: string
  user_id: string
  week_start: string // YYYY-MM-DD (always a Monday)
  financial_note: string
  sleep_state: string
  note: string
  created_at: string
  updated_at: string
}

// Partial type for upserts (omit server-generated fields)
export type DailyRecordUpsert = Omit<DailyRecord, 'id' | 'created_at' | 'updated_at'>
```

---

## Supabase Client Architecture

Three client variants are required, each for a different Next.js execution context:

### 1. Browser Client (`src/lib/supabase/client.ts`)
- Used in `'use client'` components
- Created with `createBrowserClient` from `@supabase/ssr`
- Singleton pattern (one instance per browser session)
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Used for: checkbox toggles, sleep button taps, note saves, auth.signInWithOtp

### 2. Server Client (`src/lib/supabase/server.ts`)
- Used in Server Components and Route Handlers
- Created with `createServerClient` from `@supabase/ssr`
- Uses `cookies()` from `next/headers` for session access
- One instance per request (not a singleton)
- Used for: auth callback handler, initial data fetch on page load

### 3. Middleware Client (`src/lib/supabase/middleware.ts`)
- Used exclusively in `middleware.ts`
- Created with `createServerClient` from `@supabase/ssr`
- Handles session refresh on every request
- Reads/writes auth cookies via `request.cookies` and `response.cookies`
- Used for: transparent session refresh, route protection redirect

### Auth Flow Sequence

```
1. User visits / (unauthenticated)
   → middleware.ts detects no session
   → redirects to /login

2. User enters email on /login
   → browser client calls auth.signInWithOtp({ email })
   → Supabase sends magic link email

3. User clicks magic link
   → browser navigates to /auth/callback?code=...
   → route.ts exchanges code for session via server client
   → session cookies are set
   → redirects to /

4. User visits / (authenticated)
   → middleware.ts detects valid session, refreshes if needed
   → page.tsx renders Today screen
   → browser client fetches today's daily_record

5. Subsequent visits
   → middleware refreshes session silently
   → user never sees login again (unless session fully expires)
```

---

## Day Boundary Logic

The `src/lib/dates.ts` module is shared critical infrastructure.

### Core Function: `getEffectiveDate(now?: Date): string`

```
If current local time < 04:00 → return yesterday's date (YYYY-MM-DD)
If current local time >= 04:00 → return today's date (YYYY-MM-DD)
```

### Additional Functions Needed

- `formatDateHeader(dateStr: string): string` -- "Wednesday, March 12" format
- `getWeekStart(date: Date): string` -- Monday of the current week (ISO standard)
- `formatTime(isoTimestamp: string): string` -- "07:14" format for sleep timestamps

### Timezone Handling Strategy

- All date calculations use the browser's local timezone
- The date header and effective date are computed client-side only
- Sleep timestamps are stored as UTC (`TIMESTAMPTZ`) but displayed in local time
- The `date` column stores the effective local date as a plain `DATE` (no timezone)
- Server-side initial fetch cannot know the user's timezone, so the Today page must be a client component OR use client-side hydration for the date

### Testability

Day boundary logic is pure function, easily unit-tested:
- Test: 03:59 AM on March 13 returns "2026-03-12"
- Test: 04:00 AM on March 13 returns "2026-03-13"
- Test: 23:59 PM on March 12 returns "2026-03-12"
- Test: 00:01 AM on March 13 returns "2026-03-12"
- Test: midnight exactly returns previous day

---

## Builder Task Decomposition (3 Builders)

The work is divided to minimize cross-builder dependencies while maximizing parallelism. Each builder has a clear "foundation" phase (which must complete before other builders consume it) and an "implementation" phase.

### Builder 1: Foundation + Infrastructure

**Responsibility:** Project scaffolding, configuration, Supabase schema, environment setup, test infrastructure.

**Files to create:**
```
package.json
tsconfig.json
next.config.ts
postcss.config.mjs
.eslintrc.json
.gitignore
.env.local.example
vitest.config.ts
vitest.setup.ts
src/app/globals.css          (Tailwind v4 config + CSS custom properties for palette)
src/lib/constants.ts
src/lib/types.ts
supabase/migrations/001_initial_schema.sql
```

**Deliverables:**
1. Initialize Next.js 15.5.x project with TypeScript + Tailwind v4 + App Router
2. Install all production and dev dependencies at exact versions
3. Configure TypeScript strict mode
4. Configure ESLint with Next.js rules
5. Define the complete CSS design system (palette, typography, spacing)
6. Write the database migration SQL (all 3 tables + RLS + indexes + triggers)
7. Define TypeScript types for all database tables
8. Configure Vitest with jsdom + Testing Library
9. Create `.env.local.example` with placeholder values
10. Create `src/lib/constants.ts` with `DAY_BOUNDARY_HOUR = 4`

**Why this builder goes first (in terms of dependencies):** Every other builder depends on `package.json`, `tsconfig.json`, types, and the design system being in place. However, builders can start in parallel if Builder 1 produces the scaffolding quickly.

**Estimated effort:** 1.5-2 hours

---

### Builder 2: Auth + Supabase Clients + Navigation Shell + Layout

**Responsibility:** All Supabase client wiring, authentication flow, middleware, root layout, navigation.

**Files to create:**
```
middleware.ts
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/app/layout.tsx
src/app/login/page.tsx
src/app/auth/callback/route.ts
src/app/project/page.tsx      (placeholder)
src/app/signals/page.tsx      (placeholder)
src/components/nav.tsx
test/components/nav.test.tsx
```

**Deliverables:**
1. Create all 3 Supabase client variants (browser, server, middleware)
2. Implement Next.js middleware for session refresh and route protection
3. Build login page with email input and "Send magic link" button
4. Build auth callback route handler
5. Build root layout with metadata, body structure, and nav shell
6. Build fixed bottom navigation bar (Today | Project | Signals)
7. Create placeholder pages for `/project` and `/signals`
8. Write nav component smoke test
9. Handle redirect logic: unauthenticated users to `/login`, authenticated users away from `/login`

**Security requirements for this builder:**
- Middleware must refresh the Supabase session on every request
- Protected routes: `/`, `/project`, `/signals`
- Public routes: `/login`, `/auth/callback`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Login page: no signup flow, just email input for magic link
- Auth callback: validate the code parameter, handle errors gracefully
- After auth callback, redirect to `/` (clean URL, no tokens visible)

**Estimated effort:** 2-2.5 hours

---

### Builder 3: Today Screen + Data Hooks + Date Utilities

**Responsibility:** The complete Today screen implementation, all data access hooks, date logic, and the core interactive components.

**Files to create:**
```
src/lib/dates.ts
src/hooks/use-daily-record.ts
src/hooks/use-debounced-upsert.ts
src/app/page.tsx
src/components/date-header.tsx
src/components/anchor-checkbox.tsx
src/components/sleep-button.tsx
src/components/note-field.tsx
src/components/section-group.tsx
test/lib/dates.test.ts
test/hooks/use-daily-record.test.ts
```

**Deliverables:**
1. Implement `dates.ts` with `getEffectiveDate`, `formatDateHeader`, `formatTime`
2. Implement `use-debounced-upsert.ts` (generic 500ms debounce hook)
3. Implement `use-daily-record.ts` (fetch today's record, upsert on change)
4. Build Today page with all sections laid out vertically:
   - Date header
   - Sleep section (two timestamp buttons)
   - Food section (three checkboxes horizontal)
   - Medication section (one checkbox)
   - Body section (two checkboxes horizontal)
   - Ground section (two checkboxes + project name placeholder text)
   - Note field (auto-saving textarea)
5. Build all shared components:
   - `anchor-checkbox.tsx`: large tap target (56px+), garden green checked state, native `<input type="checkbox">`
   - `sleep-button.tsx`: full-width button, shows timestamp when tapped, toggles on re-tap
   - `note-field.tsx`: textarea with debounced auto-save on blur and typing pause
   - `section-group.tsx`: visual grouping with subtle section label
   - `date-header.tsx`: displays effective date in "Wednesday, March 12" format
6. Implement optimistic UI: checkbox toggles reflect immediately, upsert fires after 500ms debounce
7. Handle record creation: first interaction on a new day triggers an upsert that creates the row
8. Handle `document.visibilitychange`: flush pending upsert when app loses focus
9. Write unit tests for date utilities (day boundary edge cases)
10. Write hook test for `use-daily-record` with mocked Supabase client

**UX requirements for this builder:**
- All checkboxes: 56px minimum tap target, large touch-friendly hit area
- Sleep buttons: full-width, 56px height, clear state distinction (untapped vs tapped)
- No submit button anywhere. Everything auto-saves.
- No loading spinners. Show empty state immediately, populate when data arrives.
- No confirmation dialogs.
- Fit all sections in one viewport on 375x667 screen with minimal scrolling
- Note field can be below the fold if needed

**Estimated effort:** 2.5-3 hours

---

### Builder Dependency Graph

```
Builder 1 (Foundation)──────────────────────┐
  produces: package.json, types, palette,   │
  schema SQL, vitest config                 │
                                            │
Builder 2 (Auth + Nav)──────────────────────┤
  depends on: package.json, globals.css,    │
  types.ts (from Builder 1)                 │
  produces: Supabase clients, middleware,   │
  layout.tsx, nav, login, auth callback,    │
  placeholder pages                         │
                                            │
Builder 3 (Today Screen)───────────────────┘
  depends on: package.json, globals.css,
  types.ts (from Builder 1),
  Supabase client.ts (from Builder 2),
  layout.tsx (from Builder 2)
  produces: Today page, all components,
  hooks, date utilities, tests
```

**Parallelism strategy:** Builder 1 must produce the scaffolding first (or at least `package.json` and `globals.css`). Builders 2 and 3 can then work in parallel because:
- Builder 2's Supabase clients are self-contained
- Builder 3's date utilities and components are self-contained
- The only cross-dependency is Builder 3 importing `lib/supabase/client.ts` (from Builder 2) inside `use-daily-record.ts`

**Conflict zones (files both builders touch):** None. The file assignments have zero overlap. The only shared dependency is `lib/supabase/client.ts` which Builder 3 imports but does not modify.

---

## Design System Specification

### CSS Custom Properties (defined in `globals.css`)

Tailwind v4 uses CSS-native theming via `@theme`. The following values define the palette:

```css
@import "tailwindcss";

@theme {
  /* Background */
  --color-ground: #F5F3F0;        /* warm off-white, main background */
  --color-ground-subtle: #EBE8E4; /* slightly darker, nav bar / input bg */
  --color-ground-inset: #E2DFDA;  /* inset areas, card backgrounds */

  /* Text */
  --color-ink: #3D3632;           /* primary text, warm charcoal */
  --color-ink-muted: #8A8279;     /* secondary text, timestamps, labels */
  --color-ink-faint: #B5AFA8;     /* disabled text, placeholders */

  /* Accent */
  --color-garden: #6B8F71;        /* garden green, checked state, active nav */
  --color-garden-muted: #8FAF94;  /* lighter green, hover state */

  /* Functional */
  --color-error: #B85C5C;         /* muted warm red, error indicator */

  /* Spacing */
  --spacing-section: 1.5rem;      /* between anchor sections */
  --tap-target-min: 56px;         /* minimum interactive element size */

  /* Typography */
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-body: 1.0625rem;    /* 17px */
  --font-size-small: 0.875rem;    /* 14px, timestamps */
  --font-size-heading: 1.25rem;   /* 20px, date header */
  --line-height-body: 1.5;
}
```

### Layout Constants

- Max content width: 480px (centered on larger screens)
- Bottom nav height: 56px + safe area inset
- Page padding: 16px horizontal, 20px top
- Section gap: 24px between anchor groups
- Checkbox size: 24px visual, 56px tap target

---

## Security Considerations

### RLS Policy Completeness

The schema defines SELECT, INSERT, UPDATE policies for all tables. DELETE is intentionally omitted -- there is no UI for deleting records, and omitting the policy means even direct API calls cannot delete data. This is a deliberate safety measure for a system designed for decades of use.

### Middleware Route Protection

```
Protected routes (require auth):
  /           (Today)
  /project    (Project)
  /signals    (Signals)

Public routes (no auth required):
  /login
  /auth/callback

Middleware behavior:
  1. Attempt to refresh the Supabase session
  2. If no valid session AND route is protected → redirect to /login
  3. If valid session AND route is /login → redirect to /
  4. Otherwise → proceed
```

### Environment Variable Security

```
NEXT_PUBLIC_SUPABASE_URL       → safe to expose (public API endpoint)
NEXT_PUBLIC_SUPABASE_ANON_KEY  → safe to expose (RLS enforces access control)
SUPABASE_SERVICE_ROLE_KEY      → NEVER in NEXT_PUBLIC_, never in browser code
```

### Single-User Enforcement

At the Supabase dashboard level:
1. Create the single user account manually
2. Disable email signup in Authentication settings
3. The RLS policies handle data isolation even if another user somehow authenticates

At the application level (optional defense-in-depth):
- After auth callback, could check if `user.id` matches an expected value
- If not, sign out and show "This system is private"
- This is an enhancement, not required for Iteration 1 since disabling signup is sufficient

---

## Testability Analysis

### What Is Testable in Iteration 1

| Component | Test Type | Difficulty | Priority |
|-----------|-----------|------------|----------|
| `dates.ts` (getEffectiveDate) | Unit | EASY | HIGH |
| `dates.ts` (formatDateHeader) | Unit | EASY | MEDIUM |
| `dates.ts` (formatTime) | Unit | EASY | MEDIUM |
| `use-debounced-upsert.ts` | Unit (with timers) | MEDIUM | MEDIUM |
| `use-daily-record.ts` | Unit (mock Supabase) | MEDIUM | HIGH |
| `nav.tsx` | Component smoke | EASY | LOW |
| `anchor-checkbox.tsx` | Component interaction | EASY | MEDIUM |
| `sleep-button.tsx` | Component interaction | MEDIUM | MEDIUM |
| `Today page (page.tsx)` | Component integration | HARD | LOW (defer) |
| Auth flow | Integration | HARD | LOW (verify manually) |
| RLS policies | DB-level | HARD | LOW (verify manually) |

### Recommended Tests for Iteration 1

**Must have (6 tests):**
1. `getEffectiveDate` returns previous day before 4 AM
2. `getEffectiveDate` returns current day at/after 4 AM
3. `getEffectiveDate` handles midnight correctly
4. `formatDateHeader` produces correct format
5. `use-daily-record` fetches record on mount (mocked Supabase)
6. `use-daily-record` upserts on field change (mocked Supabase)

**Nice to have (4 tests):**
7. Nav renders three links with correct hrefs
8. Nav highlights active route
9. `anchor-checkbox` toggles on click
10. `sleep-button` displays timestamp after tap

### Test Infrastructure Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['test/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
```

---

## Optimistic UI + Debounced Upsert Pattern

This is the core data interaction pattern for the Today screen.

### How It Works

```
1. User toggles checkbox (e.g., breakfast)
   → useState updates immediately (optimistic)
   → UI reflects the change with zero delay

2. Debounce timer starts (500ms)
   → If another interaction happens within 500ms, timer resets
   → This batches rapid interactions (e.g., checking 3 boxes quickly = 1 upsert)

3. After 500ms of no interaction:
   → Upsert the entire daily_record to Supabase
   → ON CONFLICT (user_id, date) DO UPDATE
   → On success: no visible change (already reflected)
   → On failure: show subtle error indicator, queue retry

4. Special triggers:
   → document.visibilitychange (app goes to background): flush immediately
   → Note field blur: flush immediately (don't wait 500ms)
   → Sleep button tap: flush immediately (timestamp is time-sensitive)
```

### Hook Interface

```typescript
function useDailyRecord() {
  return {
    record: DailyRecord | null,  // current state (optimistic)
    isLoading: boolean,           // true during initial fetch
    error: string | null,         // last upsert error, if any
    updateField: (field: string, value: boolean | string | null) => void,
    setSleepStart: () => void,    // records current timestamp
    setSleepEnd: () => void,      // records current timestamp
  }
}
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Exact Dependency Versions

Based on npm registry checks as of 2026-03-12:

### Production (5 packages)

| Package | Version | Notes |
|---------|---------|-------|
| `next` | `15.5.12` | Latest stable 15.x, LTS line |
| `react` | `19.2.4` | Required by Next.js 15 |
| `react-dom` | `19.2.4` | Required by Next.js 15 |
| `@supabase/supabase-js` | `2.99.1` | Latest stable |
| `@supabase/ssr` | `0.9.0` | Pin exact (pre-1.0, avoid surprises) |

### Dev (12 packages)

| Package | Version | Notes |
|---------|---------|-------|
| `typescript` | `^5.9.0` | Latest 5.x |
| `@types/react` | `^19.0.0` | Match React 19 |
| `@types/node` | `^22.0.0` | Latest LTS types |
| `tailwindcss` | `4.2.1` | V4 (CSS-first config) |
| `@tailwindcss/postcss` | `4.2.1` | PostCSS plugin for Tailwind v4 |
| `eslint` | `^9.0.0` | Flat config |
| `eslint-config-next` | `15.5.12` | Match Next.js version |
| `vitest` | `^4.0.0` | Test runner |
| `@vitejs/plugin-react` | `^5.0.0` | React plugin for Vitest |
| `@testing-library/react` | `^16.0.0` | Component testing |
| `@testing-library/jest-dom` | `^6.0.0` | DOM assertions |
| `jsdom` | `^28.0.0` | DOM environment |

**Total: 17 packages** (5 prod + 12 dev). The master plan estimated 14 (5+9) but Tailwind v4 requires `tailwindcss` + `@tailwindcss/postcss` (2 packages instead of Tailwind v3's 3: tailwindcss + postcss + autoprefixer), and Vitest needs `@vitejs/plugin-react`.

**Note on Tailwind v4 vs v3:** The master exploration reports did not account for Tailwind v4 being the current stable release. Tailwind v4 is a significant rewrite: no `tailwind.config.ts`, no `postcss` or `autoprefixer` peer dependencies, configuration via CSS `@theme` directive. This is actually simpler for our use case -- fewer config files, CSS-native theme definition. Builder 1 must use Tailwind v4, not v3.

---

## Risks Specific to Iteration 1

### 1. Tailwind v4 Configuration (MEDIUM)
The master exploration assumed Tailwind v3 patterns (tailwind.config.ts). Tailwind v4 works differently. Builders must follow v4 documentation. Mitigation: This report provides the exact CSS theme configuration above.

### 2. Supabase SSR Client Setup (MEDIUM)
The `@supabase/ssr` package requires careful cookie handling in three contexts (browser, server, middleware). Misconfiguration leads to auth loops or session loss. Mitigation: Builder 2 should follow the official Supabase "Next.js App Router" guide verbatim.

### 3. Hydration Mismatch on Dates (LOW)
If the Today page is server-rendered, the server (UTC) and client (local timezone) may compute different effective dates, causing a React hydration mismatch. Mitigation: The Today page component that computes the effective date should be a client component (`'use client'`), or the date header should render client-side only.

### 4. Builder Coordination (LOW)
Builders 2 and 3 both depend on Builder 1's output. If Builder 1 is slow, the others are blocked. Mitigation: Builder 1's scope is the smallest and most mechanical (scaffolding, config). It should complete first.

---

## Recommendations for Planner

1. **Start Builder 1 first, even by 5 minutes.** The scaffolding (package.json, tsconfig, globals.css) is a prerequisite for Builders 2 and 3. Once package.json and the CSS file exist, the other builders can start immediately.

2. **Builder 3 should be the strongest builder.** The Today screen is the most complex deliverable and the one the user will interact with daily. Getting the optimistic UI, debounced upserts, and half-asleep UX right requires careful work.

3. **Mandate Tailwind v4 patterns.** The master exploration assumed v3. This report corrects that. Builders should not install `tailwind.config.ts` or `postcss`/`autoprefixer` separately.

4. **The schema SQL should be applied to Supabase manually during or after the build.** Builder 1 writes the migration file; actual application to the cloud Supabase instance is an operational step done by the user (Ahiya) via the Supabase SQL Editor.

5. **All three placeholder routes must exist in Iteration 1.** Navigation links point to `/project` and `/signals`. Without placeholder pages, clicking those links produces 404 errors, which breaks the calm aesthetic and trust.

6. **Do not SSR the Today page data.** Use a client component that fetches on mount. Reason: the effective date depends on the user's local timezone, which the server does not know. SSR would either show the wrong date or require passing timezone through middleware, adding complexity.

7. **Tests are secondary to functionality.** The must-have tests (date utilities, hook basics) provide high value for low effort. Component integration tests can be deferred if builders are time-pressed.

8. **No custom API routes.** All data access goes through the Supabase client with the user's session. The only server-side route is the auth callback (`/auth/callback`).

---

## Questions for Planner

1. **Supabase project creation**: Is the Supabase cloud project already created, or does a builder need to create it? The migration SQL assumes an existing project. The auth redirect URL must be configured in Supabase dashboard settings.

2. **Environment variables**: Should builders use placeholder values in `.env.local.example`, or will actual Supabase credentials be provided? Builders need working credentials to test auth and database operations.

3. **Integration testing approach**: Should builders attempt to test against the real Supabase instance (requires credentials), or mock everything? Recommendation: mock for CI tests, use real credentials for local dev.

4. **Project initialization method**: Should Builder 1 use `create-next-app@15.5.12` or manually create `package.json`? `create-next-app` generates boilerplate that needs cleanup. Manual creation is cleaner for this minimal project, but `create-next-app` ensures correct Next.js defaults.

