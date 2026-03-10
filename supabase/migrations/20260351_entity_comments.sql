-- ===================================================
-- ENT13: Entity Comments with Threading
-- ===================================================
-- Separate from note_activity_log because comments need:
-- - Threading (parent_id)
-- - Edit/delete (logs are immutable)
-- - @mentions and reactions (comment-specific)

CREATE TABLE IF NOT EXISTS entity_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  record_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES entity_comments(id) ON DELETE CASCADE,
  mentions TEXT[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by record
CREATE INDEX idx_comments_record ON entity_comments(record_id, is_deleted);

-- Fast lookup for thread replies
CREATE INDEX idx_comments_parent ON entity_comments(parent_id);

-- RLS
ALTER TABLE entity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
  ON entity_comments FOR SELECT TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert comments"
  ON entity_comments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own comments"
  ON entity_comments FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Enable Realtime for live comment updates
ALTER PUBLICATION supabase_realtime ADD TABLE entity_comments;
