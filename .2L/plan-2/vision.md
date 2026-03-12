# Vision: Ground Integrity Check

**Created:** 2026-03-12
**Plan:** plan-2
**Extends:** plan-1 (SelahOS core)

---

## Problem Statement

SelahOS tracks daily anchors but provides no way to see patterns over time. The user needs a quiet way to notice ground-level drift — not to optimize, but to see clearly.

**Key constraint:** Must not be addictive. No streaks, no scores, no gamification. Just truthful visibility.

---

## Feature: Ground Integrity View

A single read-only view showing recent anchor completion. Accessible from the existing navigation.

### Requirements

1. **7-day anchor grid**
   - Shows the last 7 days (including today)
   - Each day shows which anchors were completed
   - Visual: filled/empty dots or subtle marks per anchor
   - No numbers, no percentages, no scores

2. **Anchor categories displayed:**
   - Sleep (did both sleep_start and sleep_end exist?)
   - Food (breakfast + lunch + dinner)
   - Medication (cipralex_taken)
   - Body (hygiene + movement)
   - Ground (maintenance + build)

3. **Design principles:**
   - Read-only — no interactions beyond viewing
   - Same warm palette as the rest of the app
   - Feels like glancing at an instrument panel, not a fitness tracker
   - No text labels for days (just subtle date indicators)
   - No call to action, no encouragement, no judgment

4. **Navigation:**
   - Add "Ground" tab to bottom nav (Today | Project | Signals | Ground)
   - Or replace one — discuss with vision

5. **Data:**
   - Query daily_records for the last 7 days
   - No new database tables needed
   - Server-side or client-side fetch, whichever is simpler

### What this is NOT

- Not a dashboard with charts
- Not a streak counter
- Not a progress tracker
- Not motivational
- Not a weekly summary (that's Signals)

It's a quiet 7-day mirror. You glance at it and see the shape of your ground.

---

## Success Criteria

1. Glanceable in under 3 seconds
2. Doesn't trigger "I need to fill in more dots" anxiety
3. Feels like it belongs in SelahOS — same calm energy
4. User checks it once every few days, not compulsively

---

## Technical Approach

- New route: `/ground` (at basePath `/os/ground`)
- New hook: `useGroundIntegrity` — fetches last 7 days of daily_records
- Simple grid component — no external charting library
- Add to bottom nav

---

**Vision Status:** VISIONED
**Mode:** PRODUCTION
