-- ── Notion Sync Tables ───────────────────────────────────────────
-- Mirror tables for the 7 Notion roadmap/intake DBs + sync log.
-- Populated by the notion-sync Edge Function via webhook upserts.

-- ── sync_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  text NOT NULL,
  notion_url  text NOT NULL,
  action      text NOT NULL DEFAULT 'upsert',
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_log_table ON sync_log (table_name);
CREATE INDEX idx_sync_log_created ON sync_log (created_at DESC);

-- ── goals ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url    text NOT NULL UNIQUE,
  created_at    timestamptz,
  name          text,
  status        text,
  priority      text,
  progress_pct  numeric,
  kpi           text,
  why           text,
  what_solves   text,
  what_saves    text,
  learned       text,
  target_date   date,
  entered_date  date,
  synced_at     timestamptz NOT NULL DEFAULT now()
);

-- ── portfolios ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolios (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url    text NOT NULL UNIQUE,
  created_at    timestamptz,
  name          text,
  status        text,
  priority      text,
  progress_pct  numeric,
  description   text,
  why           text,
  what_solves   text,
  what_saves    text,
  goal_url      text REFERENCES goals(notion_url) ON DELETE SET NULL,
  synced_at     timestamptz NOT NULL DEFAULT now()
);

-- ── projects ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url     text NOT NULL UNIQUE,
  created_at     timestamptz,
  name           text,
  status         text,
  priority       text,
  progress_pct   numeric,
  owner          text,
  kpi            text,
  why            text,
  what_solves    text,
  what_saves     text,
  what_not       text,
  learned        text,
  dependencies   text,
  start_date     date,
  target_date    date,
  portfolio_url  text REFERENCES portfolios(notion_url) ON DELETE SET NULL,
  synced_at      timestamptz NOT NULL DEFAULT now()
);

-- ── sprints ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sprints (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url    text NOT NULL UNIQUE,
  created_at    timestamptz,
  name          text,
  status        text,
  goal          text,
  progress_pct  numeric,
  completed     text,
  deferred      text,
  start_date    date,
  end_date      date,
  project_url   text REFERENCES projects(notion_url) ON DELETE SET NULL,
  synced_at     timestamptz NOT NULL DEFAULT now()
);

-- ── tasks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url           text NOT NULL UNIQUE,
  created_at           timestamptz,
  name                 text,
  status               text,
  priority             text,
  owner                text,
  layer                text,
  type                 text,
  effort               text,
  estimate_pts         text,
  conflict_zone        text,
  parallel_safe        boolean DEFAULT false,
  delivers             text,
  depends_on           text,
  acceptance_criteria  text,
  notes                text,
  summary              text,
  code_name            text,
  git_branch           text,
  spec_link            text,
  date_started         date,
  date_done            date,
  sprint_url           text REFERENCES sprints(notion_url) ON DELETE SET NULL,
  goal_url             text REFERENCES goals(notion_url) ON DELETE SET NULL,
  synced_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_tasks_priority ON tasks (priority);
CREATE INDEX idx_tasks_sprint ON tasks (sprint_url);

-- ── sub_tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_tasks (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url  text NOT NULL UNIQUE,
  created_at  timestamptz,
  name        text,
  status      text,
  owner       text,
  notes       text,
  due_date    date,
  task_url    text REFERENCES tasks(notion_url) ON DELETE SET NULL,
  synced_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_tasks_task ON sub_tasks (task_url);

-- ── ceo_intake ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ceo_intake (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notion_url        text NOT NULL UNIQUE,
  created_at        timestamptz,
  request           text,
  is_immediate      boolean DEFAULT false,
  urgency           text,
  priority_order    numeric,
  category          text,
  impact            text,
  instruction_type  text,
  gal_notes         text,
  expected_output   text,
  queue_score       numeric DEFAULT 30,
  claude_response   text,
  execution_status  text,
  completion_date   date,
  synced_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ceo_intake_status ON ceo_intake (execution_status);
CREATE INDEX idx_ceo_intake_queue ON ceo_intake (queue_score ASC);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE sync_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_intake  ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all synced data
CREATE POLICY "auth_read_goals"       ON goals       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_portfolios"  ON portfolios  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_projects"    ON projects    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_sprints"     ON sprints     FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_tasks"       ON tasks       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_sub_tasks"   ON sub_tasks   FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_ceo_intake"  ON ceo_intake  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_sync_log"    ON sync_log    FOR SELECT TO authenticated USING (true);

-- Service role (Edge Function) can do everything — no policy needed (bypasses RLS)
