-- supabase/migrations/003_anchor_timestamps.sql
-- Record WHEN each anchor was marked done, so the moment lives in the ground record.
--
-- Each anchor gains a nullable timestamp companion column (<anchor>_at).
-- It is set to NOW() the moment the anchor becomes "done" (true),
-- and cleared to NULL whenever the anchor leaves the done state.
-- A timestamp is the quiet record of a moment met — not a metric.

-- =============================================================================
-- Safety net: ensure the 3-state model can write NULL.
-- Migration 002 dropped these NOT NULL constraints, but if it never reached
-- this database, marking an anchor "untouched" raises a not-null violation
-- (e.g. dinner). DROP NOT NULL is idempotent, so this is safe to re-run.
-- =============================================================================
ALTER TABLE daily_records ALTER COLUMN breakfast DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done DROP NOT NULL;

-- =============================================================================
-- New columns: the moment each anchor was met.
-- =============================================================================
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS breakfast_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS lunch_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS dinner_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS cipralex_taken_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS hygiene_done_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS movement_done_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS ground_maintenance_done_at TIMESTAMPTZ;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS ground_build_done_at TIMESTAMPTZ;
