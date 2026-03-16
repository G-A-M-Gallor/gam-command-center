-- The original migration tried CREATE TABLE IF NOT EXISTS projects(...)
-- but an Origami 'projects' table already existed, so the roadmap columns
-- were never added.  Create a dedicated roadmap_projects table instead.

CREATE TABLE IF NOT EXISTS roadmap_projects (
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

ALTER TABLE roadmap_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_roadmap_projects" ON roadmap_projects FOR SELECT TO authenticated USING (true);

-- Point sprints.project_url FK to roadmap_projects
ALTER TABLE sprints
  ADD CONSTRAINT fk_sprints_project_url
  FOREIGN KEY (project_url) REFERENCES roadmap_projects(notion_url) ON DELETE SET NULL;
