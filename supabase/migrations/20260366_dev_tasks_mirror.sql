-- =============================================
-- Dev Tasks Mirror + Activity Log
-- =============================================
-- Mirror of Notion Dev Tasks DB for fast reads,
-- retro display, and status change tracking.
-- Notion remains SOT. Supabase = fast reads + history.

-- ─── Dev Tasks Mirror ────────────────────────

CREATE TABLE IF NOT EXISTS dev_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id     text UNIQUE NOT NULL,
  notion_url    text,
  task_code     text,           -- e.g. "SEC1", "DX2", "#1"
  code_name     text,           -- fun code name
  title         text NOT NULL,
  status        text NOT NULL DEFAULT 'Backlog',
  type          text,           -- Feature/Bug/Tech Debt/Security/QA/Docs/Research
  layer         text,           -- 0-5
  priority      text,           -- P0/P1/P2/P3
  effort        text,           -- XS/S/M/L/XL/XXL
  estimate_pts  integer,
  owner         text,
  sprint        text,           -- sprint name/link
  delivers      text,
  depends_on    text,
  notes         text,
  date_started  timestamptz,
  date_done     timestamptz,
  synced_at     timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_dev_tasks_status ON dev_tasks(status);
CREATE INDEX idx_dev_tasks_priority ON dev_tasks(priority);
CREATE INDEX idx_dev_tasks_sprint ON dev_tasks(sprint);

-- Auto-update updated_at
CREATE TRIGGER set_dev_tasks_updated_at
  BEFORE UPDATE ON dev_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── Activity Log ────────────────────────────

CREATE TABLE IF NOT EXISTS dev_task_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid REFERENCES dev_tasks(id) ON DELETE CASCADE,
  notion_id   text,             -- for linking before task exists in mirror
  action      text NOT NULL,    -- status_change, field_update, created, closed
  field       text,             -- which field changed
  old_value   text,
  new_value   text,
  changed_by  text DEFAULT 'claude',
  summary     text,             -- human-readable summary
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_dev_task_activity_task ON dev_task_activity(task_id);
CREATE INDEX idx_dev_task_activity_time ON dev_task_activity(created_at DESC);

-- ─── RLS ─────────────────────────────────────

ALTER TABLE dev_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_task_activity ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "dev_tasks_read" ON dev_tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_task_activity_read" ON dev_task_activity
  FOR SELECT TO authenticated USING (true);

-- Write access for service role only (API routes)
CREATE POLICY "dev_tasks_write" ON dev_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "dev_task_activity_write" ON dev_task_activity
  FOR ALL TO service_role USING (true) WITH CHECK (true);
