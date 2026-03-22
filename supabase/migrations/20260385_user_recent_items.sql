-- Recent items tracking per user
CREATE TABLE IF NOT EXISTS user_recent_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  route TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, route)
);

-- RLS
ALTER TABLE user_recent_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recent items"
  ON user_recent_items
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast queries
CREATE INDEX idx_recent_items_user_visited
  ON user_recent_items (user_id, visited_at DESC);
