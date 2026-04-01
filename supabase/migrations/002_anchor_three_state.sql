-- supabase/migrations/002_anchor_three_state.sql
-- Convert boolean anchor columns to nullable for 3-state model
-- null = untouched (default), true = done, false = not done

-- Step 1: Backfill existing false values to NULL
-- In the old model, false was the default (meaning "untouched").
-- In the new model, null means untouched. This conversion is semantically correct.
UPDATE daily_records SET breakfast = NULL WHERE breakfast = false;
UPDATE daily_records SET lunch = NULL WHERE lunch = false;
UPDATE daily_records SET dinner = NULL WHERE dinner = false;
UPDATE daily_records SET cipralex_taken = NULL WHERE cipralex_taken = false;
UPDATE daily_records SET hygiene_done = NULL WHERE hygiene_done = false;
UPDATE daily_records SET movement_done = NULL WHERE movement_done = false;
UPDATE daily_records SET ground_maintenance_done = NULL WHERE ground_maintenance_done = false;
UPDATE daily_records SET ground_build_done = NULL WHERE ground_build_done = false;

-- Step 2: Drop NOT NULL constraints and change defaults to NULL
ALTER TABLE daily_records ALTER COLUMN breakfast DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN breakfast SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN lunch SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN dinner SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN cipralex_taken SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN hygiene_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN movement_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_maintenance_done SET DEFAULT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done DROP NOT NULL;
ALTER TABLE daily_records ALTER COLUMN ground_build_done SET DEFAULT NULL;
