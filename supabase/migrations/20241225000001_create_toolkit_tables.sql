-- ===================================================
-- GAM Command Center — Toolkit Tables
-- Tables for tools, MCP connections, and automations
-- ===================================================

-- ─── Tools Table ────────────────────────────────────
CREATE TABLE cc_toolkit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🔧',
  category TEXT CHECK (category IN ('development', 'ai', 'automation', 'database', 'analytics', 'communication', 'security', 'media', 'transcription', 'download', 'general')) DEFAULT 'general',
  status TEXT CHECK (status IN ('installed', 'recommended', 'optional', 'broken')) DEFAULT 'optional',
  description TEXT,
  install_command TEXT,
  link TEXT,
  claude_prompt TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MCP Connections Table ──────────────────────────
CREATE TABLE vb_mcp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  health_status TEXT CHECK (health_status IN ('healthy', 'unhealthy', 'timeout', 'warning')) DEFAULT 'unhealthy',
  health_latency_ms INTEGER,
  health_last_check TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Automations Table ──────────────────────────────
CREATE TABLE cc_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('deployment', 'backup', 'sync', 'security', 'monitoring', 'webhook', 'scheduled')) DEFAULT 'scheduled',
  status TEXT CHECK (status IN ('active', 'inactive', 'error', 'paused')) DEFAULT 'inactive',
  trigger_config JSONB DEFAULT '{}',
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────
CREATE INDEX idx_cc_toolkit_category ON cc_toolkit(category);
CREATE INDEX idx_cc_toolkit_status ON cc_toolkit(status);
CREATE INDEX idx_vb_mcp_connections_workspace ON vb_mcp_connections(workspace_id);
CREATE INDEX idx_vb_mcp_connections_health ON vb_mcp_connections(health_status);
CREATE INDEX idx_cc_automations_type ON cc_automations(type);
CREATE INDEX idx_cc_automations_status ON cc_automations(status);
CREATE INDEX idx_cc_automations_next_run ON cc_automations(next_run);

-- ─── Updated At Triggers ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cc_toolkit_updated_at BEFORE UPDATE ON cc_toolkit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vb_mcp_connections_updated_at BEFORE UPDATE ON vb_mcp_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cc_automations_updated_at BEFORE UPDATE ON cc_automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS Policies ───────────────────────────────────
ALTER TABLE cc_toolkit ENABLE ROW LEVEL SECURITY;
ALTER TABLE vb_mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_automations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all
CREATE POLICY "Allow authenticated read on cc_toolkit"
  ON cc_toolkit FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on vb_mcp_connections"
  ON vb_mcp_connections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on cc_automations"
  ON cc_automations FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated write on cc_toolkit"
  ON cc_toolkit FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated write on vb_mcp_connections"
  ON vb_mcp_connections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated write on cc_automations"
  ON cc_automations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);