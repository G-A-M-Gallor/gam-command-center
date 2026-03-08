-- Field Groups — repeating groups of fields (e.g., work experience, call log)
-- A group is a template of fields that can be added multiple times to a note's meta

CREATE TABLE IF NOT EXISTS field_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_key TEXT UNIQUE NOT NULL,
  label JSONB NOT NULL DEFAULT '{}',
  description JSONB DEFAULT '{}',
  field_refs JSONB DEFAULT '[]',
  icon TEXT,
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_field_groups_meta_key ON field_groups(meta_key);
CREATE INDEX idx_field_groups_category ON field_groups(category);

ALTER TABLE field_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "field_groups_all_access" ON field_groups FOR ALL USING (true) WITH CHECK (true);
