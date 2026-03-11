-- =============================================
-- Automation Runs — tracks manual/scheduled job executions
-- =============================================

CREATE TABLE IF NOT EXISTS automation_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  result JSONB,
  triggered_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Index for recent runs
CREATE INDEX IF NOT EXISTS idx_automation_runs_started
  ON automation_runs (started_at DESC);

-- Index for filtering by job
CREATE INDEX IF NOT EXISTS idx_automation_runs_job
  ON automation_runs (job_name, started_at DESC);

-- RLS
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read automation runs"
  ON automation_runs FOR SELECT TO authenticated
  USING (true);

-- Service role can insert/update (API routes use service role)
CREATE POLICY "Service role can insert automation runs"
  ON automation_runs FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update automation runs"
  ON automation_runs FOR UPDATE TO service_role
  USING (true);

-- Add automation_runs to Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE automation_runs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add audit_log to Realtime publication (for Activity Feed)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
