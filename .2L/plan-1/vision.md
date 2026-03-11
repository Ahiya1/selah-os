# Project Vision: SelahOS

**Created:** 2026-03-12
**Plan:** plan-1

---

## Problem Statement

The organism needs a ground layer - a minimal system that maintains physiological stability and ground contact. Not productivity, not optimization, not coaching. Just the quiet maintenance of being alive and structurally sound.

**Current pain points:**
- Existing tools are noisy, gamified, and productivity-oriented
- No system exists that simply mirrors the ground state without trying to direct it
- Daily anchors (sleep, food, medication, hygiene, movement) need quiet visibility, not management

---

## Target Users

**Primary user:** Single user (Ahiya)
- Uses the system daily, including Shabbat
- Needs it to work half-asleep
- Values calm, stability, and durability over features
- Will not tolerate behavioral nudging or optimization pressure

---

## Core Value Proposition

A quiet instrument panel for the ground layer of life.

**Key benefits:**
1. Transparent visibility of daily ground state in under 5 seconds
2. Stable enough to use unchanged for decades
3. Feels like touching the ground, not using an app

---

## Feature Breakdown

### Must-Have (MVP)

1. **Daily Record Entry (Today Screen)**
   - Description: Single screen showing all daily ground anchors with simple completion UI
   - User story: As the user, I want to see and mark my daily ground state so I maintain visibility of the organism's stability
   - Acceptance criteria:
     - [ ] Shows sleep (tap "going to sleep" / "woke up" buttons with timestamps)
     - [ ] Shows food (breakfast, lunch, dinner as checkboxes)
     - [ ] Shows medication (cipralex_taken as checkbox)
     - [ ] Shows body (hygiene_done, movement_done as checkboxes)
     - [ ] Shows ground (maintenance_done, build_done as checkboxes)
     - [ ] Displays current ground project name
     - [ ] One short daily note field
     - [ ] Entire state visible in one screen with minimal scrolling
     - [ ] Usable half-asleep
     - [ ] Creates or updates today's record on interaction

2. **Ground Project Display (Project Screen)**
   - Description: Shows the currently active ground-building project
   - User story: As the user, I want to see my current ground project so I maintain focus without fragmentation
   - Acceptance criteria:
     - [ ] Displays project name, status (active/paused), and start date
     - [ ] Ability to update project name and status
     - [ ] Only one active project at a time

3. **Weekly Signals (Signals Screen)**
   - Description: Minimal weekly reflection view, opened once per week
   - User story: As the user, I want to glance at weekly stability signals so I notice ground-level drift
   - Acceptance criteria:
     - [ ] Financial note (free text)
     - [ ] Sleep state (manually reported text, e.g., "stable", "fragmented")
     - [ ] Weekly note (free text)
     - [ ] Simple textual display, no charts or dashboards
     - [ ] Create signal entry for current week
     - [ ] View recent signals

4. **Authentication**
   - Description: Magic link email authentication via Supabase
   - User story: As the user, I want to log in without remembering a password
   - Acceptance criteria:
     - [ ] Magic link (email) login via Supabase Auth
     - [ ] Single authorized user (no signup flow)
     - [ ] Row Level Security on all tables (user_id = auth.uid())
     - [ ] Persistent session (don't require login every day)

5. **Navigation**
   - Description: Minimal navigation between three screens
   - Acceptance criteria:
     - [ ] Subtle bottom bar with text labels: Today, Project, Signals
     - [ ] Muted styling consistent with instrument-panel aesthetic
     - [ ] No icons, no badges, no indicators

### Should-Have (Post-MVP)

1. **PWA / Add to Home Screen** - Installable as home screen app on mobile
2. **Offline support** - Cache today's state, sync when online

### Could-Have (Future)

1. **Sleep stability auto-derivation** - Calculate sleep patterns from daily entries for signals screen
2. **Historical daily records** - Browse past days (read-only)

---

## User Flows

### Flow 1: Morning Check-in

**Steps:**
1. User opens app (already logged in)
2. Today screen loads with current date's record (or empty state)
3. User taps "woke up" - timestamp recorded
4. User glances at ground state
5. Done. Under 10 seconds.

**Edge cases:**
- No record exists for today: create empty record on first interaction
- User opens at 2am: date logic considers day boundary sensibly

### Flow 2: Evening Completion

**Steps:**
1. User opens app around 22:00
2. Marks cipralex_taken, hygiene_done
3. Checks off meals eaten today
4. Marks ground_maintenance and/or ground_build
5. Optionally writes a short note
6. Taps "going to sleep" - timestamp recorded
7. Done. Under 30 seconds.

**Edge cases:**
- User forgot to mark morning: can still mark everything in evening
- Double-tap on checkbox: toggles back (undo)

### Flow 3: Weekly Signal Entry

**Steps:**
1. User opens Signals screen (once per week)
2. Enters financial note, sleep state, weekly note
3. Saves
4. Done. Under 2 minutes.

---

## Data Model Overview

**Key entities:**

1. **daily_records**
   - Fields: id, user_id, date, sleep_start, sleep_end, breakfast, lunch, dinner, cipralex_taken, hygiene_done, movement_done, ground_maintenance_done, ground_build_done, note, created_at
   - Constraints: unique(user_id, date)

2. **ground_projects**
   - Fields: id, user_id, name, status, start_date, created_at
   - Normally only one active project

3. **weekly_signals**
   - Fields: id, user_id, week_start, financial_note, sleep_state, note, created_at

---

## Technical Requirements

**Production Stack (Locked):**

Default:
- **Frontend + API:** Vercel (Next.js App Router, React, mobile-first)
- **Database + Auth:** Supabase (PostgreSQL + Auth + Row Level Security)
- **CI/CD:** GitHub Actions

**Must support:**
- Mobile-first responsive design
- Fast load times (daily interaction under 5 seconds)
- Persistent auth sessions
- Online-only (v1)

**Constraints:**
- Three screens only. No additional screens in v1.
- No notifications, reminders, nudges, streaks, scores, gamification, AI coaching, or productivity metrics. Ever.
- Single-user system. No social or sharing features.

**Preferences:**
- TypeScript throughout
- Next.js App Router
- Minimal dependencies
- Schema designed for decades of stability (avoid frequent migrations)

---

## Design Direction

**Palette:** Grey/brown base tones. Subtle garden green accents (soft, earthy - not marker/neon green).

**Feel:** Calm, stable, minimal, low-stimulation. Quiet instrument panel.

**Avoid:** Bright colors, gamification visuals, data overload, visual noise, icons where text suffices.

**Typography:** Clean, readable, understated.

**Interaction:** Checkboxes/circles for completion. Large tap targets for half-asleep use.

---

## Success Criteria

**The MVP is successful when:**

1. **Stable daily relationship**
   - Metric: Consistent daily use without friction
   - Target: User develops stable relationship with the app

2. **No urge to change**
   - Metric: The design feels so right that it doesn't trigger "fix this" impulses
   - Target: User does not comply with urges to modify the system

3. **Sub-5-second interactions**
   - Metric: Time from open to done
   - Target: Morning check-in < 10 seconds, evening completion < 30 seconds

---

## Out of Scope

**Explicitly not included in MVP:**
- Offline/PWA support
- Historical data browsing
- Analytics or charts of any kind
- Multiple users or sharing
- Notifications or reminders
- Import/export
- API for external integrations
- Dark/light mode toggle (single consistent palette)

**Why:** SelahOS must remain minimal and durable. Feature restraint is a core design value.

---

## Assumptions

1. User has a modern mobile browser
2. Internet connectivity is available during use
3. Supabase free tier is sufficient for single-user usage
4. One ground project at a time is sufficient

---

## Open Questions

1. Domain setup: Deploy to selah.im/os or default Vercel URL initially?
2. Day boundary: What time constitutes "new day"? (Midnight? 4am for night owls?)

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-prod` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
