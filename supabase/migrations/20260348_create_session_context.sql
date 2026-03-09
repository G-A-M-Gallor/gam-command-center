-- ===================================================
-- Session Context — Dynamic AI prompt enrichment
-- ===================================================
-- Stores per-user session context that gets injected into
-- AI system prompts at conversation start.

CREATE TABLE IF NOT EXISTS session_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  context_key TEXT NOT NULL,           -- e.g. 'open_projects', 'recent_decisions', 'active_tasks'
  context_value JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,              -- NULL = permanent, otherwise auto-expires
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, context_key)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_session_context_user
  ON session_context(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_session_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_session_context_updated
  BEFORE UPDATE ON session_context
  FOR EACH ROW EXECUTE FUNCTION update_session_context_timestamp();

-- RLS
ALTER TABLE session_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context"
  ON session_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own context"
  ON session_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context"
  ON session_context FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own context"
  ON session_context FOR DELETE
  USING (auth.uid() = user_id);
