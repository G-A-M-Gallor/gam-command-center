-- projects: Synced from Origami via n8n
-- This table may already exist in Supabase — run only if missing.

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origami_id TEXT UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  health_score INT DEFAULT 0,
  layer TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_layer ON projects (layer);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "projects_all_access"
  ON projects FOR ALL
  USING (true) WITH CHECK (true);
