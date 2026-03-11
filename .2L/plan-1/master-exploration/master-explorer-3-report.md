# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points

## Vision Summary
SelahOS is a minimal personal ground-layer operating system -- a quiet instrument panel for daily physiological anchors (sleep, food, medication, hygiene, movement, ground contact). Three screens, single user, designed for decades of calm, stable daily use.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 5 must-have features (Today Screen, Project Screen, Signals Screen, Auth, Navigation)
- **User stories/acceptance criteria:** 24 acceptance criteria across all features
- **Estimated total work:** 14-20 hours (from a UX/integration perspective)

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- Only 3 screens with simple data models, but the UX demands are unusually specific: half-asleep usability, sub-5-second interactions, instrument-panel aesthetic
- Supabase Auth (magic link) + RLS + real-time record upsert requires careful integration choreography
- The design constraint "no urge to change" means getting UX right the first time is critical -- rework is a failure signal, not a process step
- Day boundary logic and sleep timestamp handling introduce non-trivial edge cases

---

## User Experience Analysis

### Interaction Paradigm: "Half-Asleep Usability"

This is the defining UX constraint. The user interacts with SelahOS immediately upon waking (groggy, eyes half-open, phone in hand) and just before sleep (tired, winding down). Every design decision flows from this.

**Design implications:**
- Minimum tap target size: 48x48px (WCAG), but recommend 56x56px or larger for this use case
- No precision-required interactions (no small toggles, no swipe gestures, no long-press)
- No confirmation dialogs for routine actions (checking a box should just work)
- No loading spinners that require watching -- optimistic UI updates with background sync
- No state that can be accidentally lost (auto-save everything)
- High contrast between interactive and non-interactive elements despite the muted palette
- No animations that delay interaction readiness

### Color and Visual Design Requirements

**Palette specification for implementation:**
- Background: warm grey (e.g., `#F5F3F0` or similar parchment-grey)
- Text: deep warm brown/charcoal (e.g., `#3D3632`) -- NOT pure black
- Checkboxes/interactive elements: muted state = warm grey border; checked state = soft garden green (e.g., `#6B8F71` or `#7A9E7E`)
- Navigation bar: slightly darker than background, text labels in muted brown
- Active nav item: garden green text, no underline or bold -- just color shift
- Timestamps: slightly lighter text, secondary hierarchy
- Note field: subtle inset or border, same palette

**Critical:** Garden green must be earthy/desaturated. Think moss, sage, dried herbs -- not grass, lime, or emerald. Test: if you saw it on a terracotta pot, would it feel natural?

**Single palette -- no dark/light toggle.** The chosen palette should work well on OLED screens at low brightness (the half-asleep use case). This means avoiding pure white backgrounds which are harsh at low brightness. A warm off-white/light grey works better.

### Typography Requirements

- System font stack preferred (no external font loading = faster load)
- Body text: 16px minimum (mobile), likely 17-18px for comfortable reading
- Checkbox labels: same size as body or larger
- Timestamps: 14px, lighter weight or color
- Notes field: same as body
- No bold text except possibly the date header
- Line height: generous (1.5+) for calm readability

### Screen-by-Screen UX Design Requirements

#### Screen 1: Today (Primary Screen -- Default Route)

**Layout (top to bottom, single column, mobile-first):**

1. **Date header** -- "Wednesday, March 12" (full text, no abbreviations, calm and grounding)
2. **Sleep section**
   - Two large buttons: "going to sleep" / "woke up"
   - When tapped, records current timestamp and button text changes to show time (e.g., "woke up 07:14")
   - Button becomes muted/completed state after tap
   - Tapping again should toggle (undo) -- clears timestamp
   - Buttons must be large enough to tap half-asleep: full-width, 56px+ height
3. **Food section**
   - Three checkboxes in a row: breakfast, lunch, dinner
   - Text labels below each checkbox
   - Horizontal layout to save vertical space
4. **Medication section**
   - Single checkbox: "cipralex"
   - Same style as food checkboxes
5. **Body section**
   - Two checkboxes: "hygiene", "movement"
   - Horizontal layout
6. **Ground section**
   - Two checkboxes: "maintenance", "build"
   - Below: current ground project name displayed as quiet text (read-only here, links to Project screen)
7. **Note field**
   - Single-line or small textarea (2-3 lines max)
   - Placeholder: empty or very subtle "..." -- no instructional text like "Write your thoughts"
   - Auto-saves on blur or after typing pause (debounced)
8. **No submit button.** Everything auto-saves. This is critical for half-asleep use.

**Vertical space budget:** Everything must fit in one viewport on a standard phone (375x667 logical pixels) with minimal scrolling. If scrolling is needed, only the note field should be below the fold.

**State management for Today screen:**
- On mount: fetch today's record from Supabase (or create empty one)
- Each interaction (checkbox toggle, button tap, note edit): optimistic local update + debounced upsert to Supabase
- No loading skeleton needed -- show empty state immediately, populate when data arrives
- If record doesn't exist: first interaction creates it via upsert

#### Screen 2: Project

**Layout:**
1. **Project name** -- large text, editable (tap to edit inline, or simple input field)
2. **Status** -- "active" or "paused" (toggle between the two, large tap target)
3. **Start date** -- displayed as text, set automatically when project created
4. **Changing project:** Input field to type new project name. When project is changed, old one becomes inactive. Only one active at a time. This is a rare interaction (weekly/monthly), so it can be slightly more deliberate.

**This screen is the least-visited.** It should feel stable and quiet. The user glances at it occasionally to confirm their focus.

#### Screen 3: Signals (Weekly)

**Layout:**
1. **Week indicator** -- "Week of March 9, 2026" (Monday start)
2. **Financial note** -- text input or small textarea
3. **Sleep state** -- text input (free text: "stable", "fragmented", etc.)
4. **Weekly note** -- slightly larger textarea
5. **Save button** -- this screen CAN have an explicit save, since it's a weekly deliberate action (not half-asleep). But auto-save is also acceptable.
6. **Recent signals** -- below the form, a simple list of past 4-6 weeks' entries. Plain text, minimal styling. No charts.

**Week calculation:** Week starts on Monday (ISO standard). The current week's signal is determined by the Monday of the current week.

#### Navigation Bar

**Position:** Fixed bottom bar (standard mobile pattern)
**Content:** Three text labels: "Today" | "Project" | "Signals"
**Style:**
- No icons. Text only.
- No badges, dots, or indicators.
- Active state: garden green text color
- Inactive state: muted grey-brown text
- No border-top or shadow -- just a subtle background color shift
- Height: 56px minimum for comfortable tap targets
- Text centered in each third of the screen width

### Mobile-First Responsive Strategy

**Primary target:** Mobile phone, portrait orientation (375-428px width)
**Secondary target:** Tablet and desktop should work but don't need special treatment -- just center the content column with a max-width (e.g., 480px)
**No breakpoint-specific layouts needed.** The three screens are simple enough that a single-column layout works everywhere.

**Viewport considerations:**
- `viewport` meta tag with `width=device-width, initial-scale=1, viewport-fit=cover`
- Safe area insets for notched phones (bottom navigation must respect `env(safe-area-inset-bottom)`)
- Prevent zoom on input focus (set font-size >= 16px on all inputs)

---

## Integration Points Analysis

### 1. Supabase Auth Integration

**Flow: Magic Link Login**
1. User navigates to app (unauthenticated)
2. App shows login screen: email input + "Send magic link" button
3. Supabase `auth.signInWithOtp({ email })` sends email
4. User taps link in email --> redirected to app with auth token in URL
5. Supabase client library handles token exchange automatically
6. Session stored in browser (localStorage/cookie)
7. Subsequent visits: session persists, no re-login needed

**Integration details:**
- Use `@supabase/ssr` package for Next.js App Router integration
- Middleware in `middleware.ts` to check auth on every request and refresh session
- Supabase client created server-side (for SSR/API routes) and client-side (for real-time interactions)
- Auth callback route: `/auth/callback` to handle magic link redirect
- Redirect URL must be configured in Supabase dashboard

**Security integration points:**
- RLS policies on all three tables: `user_id = auth.uid()`
- No API routes that bypass RLS -- all data access through Supabase client with user session
- Single authorized email address -- no signup flow. If someone tries another email, Supabase will still send a magic link but they will have no data (RLS blocks everything). Consider adding a check: if `auth.uid()` doesn't match the expected user, show "not authorized" and sign out.
- Session refresh: Supabase sessions expire (default 1 hour JWT, with refresh token). The middleware must handle refresh transparently.

**Edge cases:**
- Magic link expires (default: 1 hour) -- user must request new one
- Magic link opened in different browser than where it was requested -- should still work but session lands in new browser
- Network offline when clicking magic link -- graceful error
- Session expires during use -- should refresh silently, not kick user to login mid-interaction

**Test requirements:**
- E2E test: full magic link login flow (may need to mock email delivery)
- E2E test: session persistence across page reloads
- E2E test: unauthorized user sees login screen
- E2E test: RLS prevents cross-user data access (less relevant for single-user but important for correctness)

### 2. Supabase Database Integration

**Three tables, all accessed via Supabase JS client:**

**daily_records:**
- Primary interaction: upsert on `(user_id, date)` unique constraint
- Every checkbox toggle and button tap triggers an upsert
- Debounce strategy: batch rapid interactions (e.g., user checks 3 boxes in 2 seconds = 1 upsert, not 3)
- Recommended: 500ms debounce after last interaction before sending upsert
- Optimistic updates: UI reflects change immediately, upsert happens in background
- Conflict resolution: last-write-wins is fine (single user, single device typically)

**ground_projects:**
- Read: fetch active project (status = 'active') on Today screen and Project screen
- Write: update project name/status, create new project
- When creating new project: deactivate all existing active projects first (transaction or sequential)
- Low frequency: edited weekly/monthly

**weekly_signals:**
- Read: fetch current week's signal + recent signals (ORDER BY week_start DESC LIMIT 6)
- Write: upsert on `(user_id, week_start)` unique constraint
- Low frequency: once per week

**Data flow pattern (Today screen):**
```
User taps checkbox
  --> Local state updates immediately (optimistic)
  --> Debounce timer resets (500ms)
  --> After 500ms of no interaction:
      --> Upsert entire daily_record to Supabase
      --> On success: no visible change (already reflected)
      --> On failure: show subtle error indicator, retry
```

**API strategy decision: Server Actions vs. Direct Supabase Client**
- Recommendation: Use Supabase JS client directly from client components for mutations (simpler, lower latency for the optimistic update pattern)
- Use Server Components for initial data fetch (SSR the Today screen with today's record)
- This hybrid approach gives fast initial load (SSR) + fast interactions (client-side mutations)

### 3. Vercel Deployment Integration

**Deployment configuration:**
- Next.js App Router on Vercel (default, no special config needed)
- Environment variables in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase service role key should NOT be in `NEXT_PUBLIC_` -- only used server-side if needed
- Domain: initially Vercel default URL, later `selah.im/os` (requires Vercel domain config + DNS)

**Build/deploy considerations:**
- Static pages: login page can be statically generated
- Dynamic pages: Today, Project, Signals all need user-specific data (SSR or client-side fetch)
- Middleware runs on Vercel Edge Runtime -- Supabase auth check is fast

**GitHub Actions CI/CD:**
- Lint + type-check on PR
- Vercel handles deployment (auto-deploy on push to main)
- GitHub Actions can run E2E tests before merge

### 4. Day Boundary Logic (Critical Integration Point)

**Open question from vision: what time is "new day"?**

**Recommendation:** Use 4:00 AM as the day boundary.

**Rationale:** The user takes cipralex and records "going to sleep" around 22:00-midnight. If they check the app at 1:00 AM, they should still see today's (the day they lived through) record, not tomorrow's empty record. 4:00 AM is a safe boundary -- very unlikely to be awake and interacting at that hour, and it handles the "fell asleep at 1 AM, woke at 7 AM" case naturally.

**Implementation:** When determining "today's date" for the daily_record:
```
if currentTime < 4:00 AM:
  effectiveDate = yesterday
else:
  effectiveDate = today
```

This must be consistent across:
- Server-side initial data fetch
- Client-side record creation
- The date header displayed on the Today screen

**Timezone handling:**
- User's timezone should be detected from browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- All date calculations happen in user's local timezone
- Store `sleep_start` and `sleep_end` as UTC timestamps in the database
- Store `date` as a date string (YYYY-MM-DD) representing the effective local date

---

## User Flow Analysis with Edge Cases

### Flow 1: Morning Check-in (Critical Path)

**Happy path:** Open app -> see today -> tap "woke up" -> done (5 seconds)

**Edge cases requiring handling:**
1. **First ever use:** No daily_record exists. First interaction (tapping "woke up") creates one via upsert.
2. **App opened at 3:30 AM:** Day boundary logic shows yesterday's record (correct behavior).
3. **App opened at 4:15 AM:** Shows new day's empty record (correct).
4. **Network slow/offline:** "Woke up" button should respond instantly (optimistic). If network fails, show subtle indicator but don't block.
5. **Session expired overnight:** Middleware detects expired session, attempts refresh. If refresh fails, redirect to login. This should be rare with long-lived refresh tokens.
6. **Double-tap "woke up":** First tap records timestamp, second tap clears it (undo). This is intentional per the vision.

### Flow 2: Evening Completion (Most Complex)

**Happy path:** Open app -> check boxes -> write note -> tap "going to sleep" -> done (20 seconds)

**Edge cases:**
1. **Rapid checkbox toggling:** Debounce ensures only one upsert fires after user finishes.
2. **Note field with special characters:** Standard text input, no sanitization concerns for Supabase (parameterized queries). But limit length in UI (200-300 chars for daily note).
3. **User forgets morning, does everything at night:** All fields available, no time-gating. "Woke up" can be tapped retroactively (records current time, which is "wrong" but acceptable -- the user understands).
4. **App loses focus mid-interaction (phone call, etc.):** Debounced save fires on visibility change (`document.visibilitychange` event) to prevent data loss.
5. **Sleep start at 23:50, sleep end at 07:15 next day:** sleep_start stored on today's record, sleep_end stored on tomorrow's record. This is naturally handled by the day boundary logic -- the user taps "going to sleep" tonight (today's record) and "woke up" tomorrow morning (tomorrow's record).

### Flow 3: Weekly Signal Entry

**Happy path:** Open Signals -> fill three fields -> save -> done (1-2 minutes)

**Edge cases:**
1. **Which week is "this week"?** Calculated from Monday of current week. If user opens on Sunday, they're still entering for the week that started last Monday.
2. **User enters signal twice in same week:** Upsert on `(user_id, week_start)` -- second entry updates the first.
3. **Recent signals list:** Show last 4-6 entries. If none exist, show empty state with subtle text like "No previous entries."
4. **Long text in notes:** Allow reasonable length (500-1000 chars for weekly note, 200 for financial note and sleep state). No character counter -- just set maxLength on the input.

### Flow 4: Authentication (First Use / Re-auth)

**Happy path:** Enter email -> receive magic link -> tap link -> authenticated

**Edge cases:**
1. **Email not received:** User waits, tries again. Show "Check your email" with option to resend after 60 seconds.
2. **Magic link clicked on desktop, app used on phone:** Sessions are per-device. Each device needs its own magic link. This is fine.
3. **Unauthorized email:** Supabase sends magic link anyway (can't prevent this without custom logic). User authenticates but sees empty app with no data. Consider: after auth, check if `user_id` matches expected ID. If not, show "This system is private" and sign out. This prevents confusion if someone somehow gets the URL.
4. **Token in URL after callback:** Clean the URL after processing (Supabase client library does this, but verify).

---

## Error Handling Strategy

### Principles
- **Never block the user with an error for routine interactions.** If a checkbox save fails, show a subtle indicator (e.g., small red dot) but don't pop up an alert.
- **Retry silently.** Failed upserts should retry 2-3 times with exponential backoff.
- **Degrade gracefully.** If Supabase is down, the user can still toggle checkboxes (local state). Data syncs when connection returns (if PWA/offline is added later; in v1, show "Connection issue" and retry).
- **Login errors deserve clear messaging.** "Check your email for the magic link" / "Link expired, please request a new one."

### Error states by screen

**Today screen:**
- Database fetch fails on load: Show yesterday's cached data if available (via browser cache headers), or show empty state with "Couldn't load data" and a retry button
- Upsert fails: Subtle indicator near the affected field, auto-retry
- No error toasts, modals, or alerts for routine operations

**Project screen:**
- Fetch fails: "Couldn't load project" with retry
- Update fails: Revert optimistic update, show subtle error

**Signals screen:**
- Fetch fails: "Couldn't load signals" with retry
- Save fails: Keep form data, show "Couldn't save" near save button, retry button

**Login screen:**
- Invalid email format: Inline validation below input
- Rate limited: "Too many requests, try again in a minute"
- Network error: "No internet connection"

---

## Performance Requirements and Optimization

### Target Metrics
- **Time to Interactive (TTI):** < 2 seconds on 4G mobile
- **First Contentful Paint (FCP):** < 1 second
- **Largest Contentful Paint (LCP):** < 1.5 seconds
- **Cumulative Layout Shift (CLS):** < 0.05 (no layout jumps)
- **Interaction to Next Paint (INP):** < 100ms (checkbox toggles feel instant)

### Optimization Strategies (UX-facing)
1. **SSR the Today screen** with today's record pre-fetched. User sees populated data on first paint, no loading flash.
2. **Optimistic UI updates** for all mutations. No waiting for server response before reflecting changes.
3. **Debounced writes** (500ms) to batch rapid interactions into single database calls.
4. **Minimal JavaScript bundle:**
   - No UI framework beyond React (no component libraries like MUI, Chakra, etc.)
   - No chart libraries (no charts in the app)
   - No animation libraries
   - Estimated JS budget: < 80KB gzipped total (Next.js + Supabase client + app code)
5. **System font stack** -- no web font downloads.
6. **No images** in the UI (no logos, illustrations, or decorative elements). Pure text and CSS.
7. **Prefetch navigation targets:** When user is on Today screen, prefetch Project and Signals screen data. Three screens, tiny data footprint.
8. **Static login page:** Can be fully static/cached, no server-side work needed.

### Supabase Client Optimization
- Single Supabase client instance per session (singleton pattern)
- Connection pooling handled by Supabase
- Queries are tiny (single row fetches, single row upserts) -- no optimization needed at query level
- Consider `stale-while-revalidate` pattern: show cached data immediately, refresh in background

---

## Accessibility Considerations

### WCAG 2.1 AA Compliance Targets

**Color contrast:**
- Text on background must meet 4.5:1 ratio minimum
- The muted palette is a risk here -- warm grey text on warm grey background could fail contrast checks
- Interactive elements (garden green checkboxes) on background must meet 3:1 ratio for non-text elements
- Recommend testing all color combinations with a contrast checker before finalizing palette

**Keyboard navigation:**
- All checkboxes must be keyboard-accessible (Tab, Space to toggle)
- Sleep buttons must be keyboard-accessible (Tab, Enter to activate)
- Navigation bar must be keyboard-navigable
- Focus indicators must be visible (but can be styled to match the calm aesthetic -- e.g., soft green outline instead of default blue)

**Screen reader support:**
- Checkboxes: use native `<input type="checkbox">` with associated `<label>` -- not custom div-based toggles
- Sleep buttons: use `<button>` with descriptive text ("Record wake-up time")
- Navigation: use `<nav>` landmark with `aria-label="Main navigation"`
- Date header: proper heading hierarchy (`<h1>` on each screen)
- Status updates (saved, error): use `aria-live="polite"` regions for non-intrusive announcements

**Motor accessibility:**
- Large tap targets (56px+) already satisfy this
- No time-limited interactions
- No gesture-dependent interactions (no swipe, drag, pinch)

**Cognitive accessibility:**
- Minimal text, clear labels
- Consistent layout across visits (never rearranges)
- No unexpected changes or popups
- Predictable interaction patterns

---

## Browser Workflow Definitions for E2E Testing

### Test Suite 1: Authentication Flow

**Test 1.1: Login screen renders for unauthenticated user**
- Navigate to `/`
- Expect: redirect to `/login`
- Expect: email input field visible
- Expect: "Send magic link" button visible

**Test 1.2: Magic link request**
- Navigate to `/login`
- Enter email in input
- Click "Send magic link"
- Expect: confirmation message "Check your email"
- Expect: resend button appears after 60 seconds

**Test 1.3: Auth callback processes token**
- Navigate to `/auth/callback?code=...` (with valid test token)
- Expect: redirect to `/` (Today screen)
- Expect: user is authenticated (no login screen)

**Test 1.4: Session persistence**
- Authenticate user
- Reload page
- Expect: still on Today screen (not redirected to login)

**Test 1.5: Unauthorized access prevention**
- Navigate to `/` without session
- Expect: redirect to `/login`

### Test Suite 2: Today Screen (Core UX)

**Test 2.1: Empty state on first visit**
- Authenticate user
- Navigate to `/` (Today)
- Expect: today's date displayed
- Expect: all checkboxes unchecked
- Expect: sleep buttons show "going to sleep" and "woke up" (not timestamps)
- Expect: note field empty

**Test 2.2: Wake up button records timestamp**
- Click "woke up" button
- Expect: button text changes to include current time (e.g., "woke up 07:14")
- Expect: button appears in completed/muted state
- Reload page
- Expect: woke up time persisted

**Test 2.3: Checkbox toggles save correctly**
- Check "breakfast" checkbox
- Check "cipralex" checkbox
- Wait 600ms (debounce + margin)
- Reload page
- Expect: breakfast checked, cipralex checked, all others unchecked

**Test 2.4: Checkbox undo (double toggle)**
- Check "lunch" checkbox
- Uncheck "lunch" checkbox
- Wait 600ms
- Reload page
- Expect: lunch unchecked

**Test 2.5: Note field auto-saves**
- Type "quiet day" in note field
- Click elsewhere (blur)
- Wait 600ms
- Reload page
- Expect: note field contains "quiet day"

**Test 2.6: Going to sleep button**
- Click "going to sleep" button
- Expect: button text changes to include current time
- Reload page
- Expect: sleep start time persisted

**Test 2.7: All fields in single viewport**
- Authenticate and navigate to Today
- Expect: date header, sleep buttons, all checkboxes, ground project name visible without scrolling (on 375x667 viewport)

### Test Suite 3: Project Screen

**Test 3.1: Empty project state**
- Navigate to `/project`
- Expect: ability to create a new project (input field or similar)

**Test 3.2: Create project**
- Enter project name "SelahOS"
- Set status to "active"
- Expect: project displayed with name, status, start date

**Test 3.3: Project name shows on Today screen**
- Create active project "SelahOS"
- Navigate to Today screen
- Expect: "SelahOS" displayed in ground section

**Test 3.4: Change project status**
- Toggle project status to "paused"
- Reload page
- Expect: status shows "paused"

### Test Suite 4: Signals Screen

**Test 4.1: Empty signals state**
- Navigate to `/signals`
- Expect: current week indicator displayed
- Expect: empty form fields (financial note, sleep state, weekly note)
- Expect: no recent signals displayed (or "no previous entries" text)

**Test 4.2: Create weekly signal**
- Fill in financial note: "stable"
- Fill in sleep state: "fragmented"
- Fill in weekly note: "settling in"
- Save (or trigger auto-save)
- Reload page
- Expect: all three fields populated with entered values

**Test 4.3: Recent signals display**
- Create signals for 3 different weeks (test data setup)
- Navigate to Signals
- Expect: recent signals list shows entries in reverse chronological order

### Test Suite 5: Navigation

**Test 5.1: Navigation between screens**
- Authenticate user
- Expect: on Today screen
- Tap "Project" in navigation
- Expect: Project screen displayed
- Tap "Signals" in navigation
- Expect: Signals screen displayed
- Tap "Today" in navigation
- Expect: Today screen displayed

**Test 5.2: Active state indication**
- Navigate to Today
- Expect: "Today" nav item has active styling (garden green)
- Expect: "Project" and "Signals" have inactive styling (muted grey)

**Test 5.3: Navigation bar always visible**
- Navigate to each screen
- Scroll down (if content exceeds viewport)
- Expect: navigation bar remains fixed at bottom

### Test Suite 6: Edge Cases

**Test 6.1: Day boundary at 4 AM**
- Set system time to 3:30 AM on March 13
- Navigate to Today
- Expect: shows March 12's record (previous day)

**Test 6.2: Day boundary after 4 AM**
- Set system time to 4:15 AM on March 13
- Navigate to Today
- Expect: shows March 13's record (new day)

**Test 6.3: Rapid interaction batching**
- Check breakfast, lunch, dinner in quick succession (< 500ms between each)
- Wait 600ms
- Verify: only 1 database upsert was made (not 3)

**Test 6.4: Network failure resilience**
- Check a checkbox
- Simulate network failure
- Expect: checkbox appears checked (optimistic)
- Expect: subtle error indicator appears
- Restore network
- Expect: data syncs, error indicator disappears

---

## Integration Considerations

### Cross-Phase Integration Points

- **Supabase client setup** is foundational -- auth, database reads, and database writes all depend on it. Must be established in iteration 1 with correct patterns (server-side client for SSR, browser client for mutations, middleware for session management).
- **Day boundary logic** is used by the Today screen data fetch, the date header display, and potentially the Signals week calculation. Must be a shared utility function, not duplicated.
- **Optimistic update pattern** for the Today screen should be established as a reusable pattern (custom hook or utility) since the same pattern applies to Project and Signals screens.

### Potential Integration Challenges

- **Supabase SSR + Client-Side Hybrid:** The Today screen benefits from SSR (fast initial paint with data) but also needs client-side Supabase access for mutations. Getting both Supabase clients (server and browser) configured correctly with the same session is the trickiest integration point. Use `@supabase/ssr` package which handles this, but it requires careful middleware setup.
- **Magic Link Redirect URL:** The auth callback URL must match between Supabase dashboard configuration and the Next.js route. In development vs. production, these URLs differ. Environment-specific configuration needed.
- **Date/Timezone Consistency:** Server-rendered dates (UTC by default on Vercel) vs. client-side dates (user's timezone) can cause hydration mismatches. The date header and day boundary logic must render consistently on server and client. Recommendation: render the date header client-side only (inside a `useEffect` or with `suppressHydrationWarning`), or pass timezone from middleware.

---

## Recommendations for Master Plan

1. **Prioritize the Today screen as the core UX deliverable.**
   - This is where the user spends 95% of their time. If the Today screen feels perfect, the app succeeds. If it feels off, nothing else matters.

2. **Establish the Supabase integration pattern once, in iteration 1, and reuse it.**
   - Auth middleware, server-side client, browser-side client, and the optimistic-update-with-debounced-upsert pattern. These four pieces are the integration backbone. Getting them right early prevents rework.

3. **Implement the day boundary logic as a shared utility from the start.**
   - It affects data fetching, display, and record creation. Changing it later would be disruptive.

4. **Use native HTML elements for all interactive components.**
   - Native `<input type="checkbox">`, `<button>`, `<input type="text">`, `<textarea>`. No custom components, no UI library. This gives maximum accessibility, minimum bundle size, and maximum durability.

5. **Test the color palette on a phone at low screen brightness before committing.**
   - The half-asleep use case means low brightness. Warm off-white backgrounds and muted colors need to be legible and distinguishable at 20-30% screen brightness.

6. **E2E tests should focus on the Today screen's save/load cycle.**
   - The critical path is: open app -> interact -> close app -> open app -> see same state. If this works reliably, the user builds trust. If data is ever lost, trust is broken permanently.

7. **Consider a simple service worker registration (without offline support) for PWA "add to home screen" capability.**
   - Even in v1, being installable as a home screen icon dramatically improves the daily ritual feel. This is a low-effort, high-impact addition. However, if this is explicitly post-MVP, defer it.

---

## Notes & Observations

- The vision's success criterion "no urge to change" is unusual and important. It means the UX must be so quiet and correct that it becomes invisible. This requires restraint: resist adding helpful text, progress indicators, or "nice to have" UI elements. When in doubt, remove.

- The single-user constraint simplifies everything dramatically. No user management, no permissions beyond RLS, no onboarding flow, no account settings. The login screen and the three app screens are the entire UI surface.

- Shabbat usage is mentioned explicitly. This means the app must work without any interactions that feel like "work" or "technology management." The instrument-panel metaphor is key: you glance at a thermometer, you don't "use" it.

- The medication tracking (cipralex) is private health data. While RLS protects it at the database level, consider that the app should not display any health-related labels in the browser tab title or in any way that could be visible to someone glancing at the user's screen. The tab title should just be "SelahOS" or "Today", not "Track your medication."

- The three-screen constraint is load-bearing. It prevents scope creep at the UX level. Any future feature must fit within these three screens or justify adding a fourth (which should be extremely rare).

---

*Exploration completed: 2026-03-12*
*This report informs master planning decisions*
