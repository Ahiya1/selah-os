-- SelahOS Initial Schema
-- All 3 tables + RLS policies + indexes + triggers

-- Use gen_random_uuid() (native PostgreSQL 13+, no extension needed)

-- =============================================================================
-- Table: daily_records
-- =============================================================================

CREATE TABLE daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_start TIMESTAMPTZ,
  sleep_end TIMESTAMPTZ,
  breakfast BOOLEAN NOT NULL DEFAULT FALSE,
  lunch BOOLEAN NOT NULL DEFAULT FALSE,
  dinner BOOLEAN NOT NULL DEFAULT FALSE,
  cipralex_taken BOOLEAN NOT NULL DEFAULT FALSE,
  hygiene_done BOOLEAN NOT NULL DEFAULT FALSE,
  movement_done BOOLEAN NOT NULL DEFAULT FALSE,
  ground_maintenance_done BOOLEAN NOT NULL DEFAULT FALSE,
  ground_build_done BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT daily_records_user_date_unique UNIQUE (user_id, date)
);

-- Indexes for daily_records
CREATE INDEX idx_daily_records_user_date ON daily_records (user_id, date);

-- RLS for daily_records
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

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

-- No DELETE policy (intentional: protect against accidental data loss)

-- =============================================================================
-- Table: ground_projects
-- =============================================================================

CREATE TABLE ground_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'dropped')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ground_projects_user_name_unique UNIQUE (user_id, name)
);

-- Indexes for ground_projects
CREATE INDEX idx_ground_projects_user_status ON ground_projects (user_id, status);

-- RLS for ground_projects
ALTER TABLE ground_projects ENABLE ROW LEVEL SECURITY;

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

-- No DELETE policy (intentional: protect against accidental data loss)

-- =============================================================================
-- Table: weekly_signals
-- =============================================================================

CREATE TABLE weekly_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  financial_note TEXT NOT NULL DEFAULT '',
  sleep_state TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_signals_user_week_unique UNIQUE (user_id, week_start)
);

-- Indexes for weekly_signals
CREATE INDEX idx_weekly_signals_user_week ON weekly_signals (user_id, week_start);

-- RLS for weekly_signals
ALTER TABLE weekly_signals ENABLE ROW LEVEL SECURITY;

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

-- No DELETE policy (intentional: protect against accidental data loss)

-- =============================================================================
-- Auto-update trigger for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_daily_records
  BEFORE UPDATE ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_ground_projects
  BEFORE UPDATE ON ground_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_weekly_signals
  BEFORE UPDATE ON weekly_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
