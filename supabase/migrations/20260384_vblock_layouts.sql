-- ===================================================
-- vBlock Layouts — block arrangement storage
-- ===================================================

CREATE TABLE IF NOT EXISTS vblock_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL,
  context_id TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES vb_workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vblock_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_layouts" ON vblock_layouts FOR ALL
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM vb_workspace_users
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_vblock_layouts_context ON vblock_layouts(context_type, context_id);
CREATE INDEX idx_vblock_layouts_user ON vblock_layouts(user_id);

-- Auto updated_at trigger
CREATE TRIGGER trg_vblock_layouts_updated_at
  BEFORE UPDATE ON vblock_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feature flag
INSERT INTO feature_flags (app_name, feature_name, enabled)
VALUES ('command-center', 'vblock_shell', false)
ON CONFLICT DO NOTHING;
