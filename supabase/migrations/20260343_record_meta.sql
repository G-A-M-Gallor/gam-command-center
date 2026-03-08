-- Extend vb_records with meta (field values) and entity_type (what lens to use)
-- The note is the universal atom — entity_type just tells the UI which fields to show

ALTER TABLE vb_records ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';
ALTER TABLE vb_records ADD COLUMN IF NOT EXISTS entity_type TEXT;

CREATE INDEX IF NOT EXISTS idx_vb_records_meta ON vb_records USING GIN (meta);
CREATE INDEX IF NOT EXISTS idx_vb_records_entity_type ON vb_records(entity_type) WHERE NOT is_deleted;

-- Note Relations — any note can link to any note, unlimited many-to-many
-- A note can be a task, a project, a contact — and link to anything
CREATE TABLE IF NOT EXISTS note_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id, target_id, relation_type)
);

CREATE INDEX idx_note_relations_source ON note_relations(source_id);
CREATE INDEX idx_note_relations_target ON note_relations(target_id);

ALTER TABLE note_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "note_relations_all_access" ON note_relations FOR ALL USING (true) WITH CHECK (true);
