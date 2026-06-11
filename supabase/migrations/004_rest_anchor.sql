-- Add the Saturday "rest" anchor.
-- Ground rhythm is not uniform across the week:
--   Sun-Thu: maintenance + build
--   Fri:     maintenance only (no build)
--   Sat:     neither — a distinct practice of rest
-- Same shape as every other anchor: a boolean plus a companion timestamp
-- recording the moment it was met.

ALTER TABLE daily_records
  ADD COLUMN IF NOT EXISTS rest_done BOOLEAN,
  ADD COLUMN IF NOT EXISTS rest_done_at TIMESTAMPTZ;
