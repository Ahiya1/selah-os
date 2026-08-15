-- An anchor is either met or it isn't yet. Both are fine.
--
-- The three-state system (migration 002) carried an explicit "not done" mark
-- alongside "untouched". The distinction asked the day to be accounted for,
-- which is a different thing from noticing the ground. Only the meeting is
-- marked now; everything else is simply blank.
--
-- Existing `false` values are the old middle state. They already read as blank
-- and count as unheld everywhere, so this only makes the stored data say what
-- the app can express.

UPDATE daily_records SET breakfast = NULL WHERE breakfast IS FALSE;
UPDATE daily_records SET lunch = NULL WHERE lunch IS FALSE;
UPDATE daily_records SET dinner = NULL WHERE dinner IS FALSE;
UPDATE daily_records SET cipralex_taken = NULL WHERE cipralex_taken IS FALSE;
UPDATE daily_records SET hygiene_done = NULL WHERE hygiene_done IS FALSE;
UPDATE daily_records SET movement_done = NULL WHERE movement_done IS FALSE;
UPDATE daily_records SET ground_maintenance_done = NULL WHERE ground_maintenance_done IS FALSE;
UPDATE daily_records SET ground_build_done = NULL WHERE ground_build_done IS FALSE;
UPDATE daily_records SET rest_done = NULL WHERE rest_done IS FALSE;
