-- Phase I: AI Hub — ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  model TEXT DEFAULT 'claude',
  mode TEXT DEFAULT 'chat',
  messages JSONB DEFAULT '[]',
  title TEXT,
  total_tokens_input INT DEFAULT 0,
  total_tokens_output INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for listing conversations by recency
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated
  ON ai_conversations (updated_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversations_updated_at();
