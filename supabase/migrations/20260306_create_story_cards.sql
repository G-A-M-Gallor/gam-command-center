-- story_cards: Story Map cards (epics + stories)

CREATE TABLE IF NOT EXISTS story_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  col INT NOT NULL,
  row INT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'story',
  color TEXT,
  subs JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_cards_project ON story_cards (project_id);
CREATE INDEX IF NOT EXISTS idx_story_cards_col ON story_cards (project_id, col);

ALTER TABLE story_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "story_cards_all_access"
  ON story_cards FOR ALL
  USING (true) WITH CHECK (true);
