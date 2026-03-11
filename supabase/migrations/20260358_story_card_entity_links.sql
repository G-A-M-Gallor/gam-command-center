-- Junction table: link story cards to any entity (vb_records)
-- Enables Story Map ↔ Entity Platform bidirectional references

CREATE TABLE IF NOT EXISTS story_card_entity_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_card_id UUID NOT NULL REFERENCES story_cards(id) ON DELETE CASCADE,
  entity_note_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_card_id, entity_note_id)
);

CREATE INDEX idx_scel_story_card ON story_card_entity_links(story_card_id);
CREATE INDEX idx_scel_entity_note ON story_card_entity_links(entity_note_id);

ALTER TABLE story_card_entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_card_entity_links_all_access"
  ON story_card_entity_links FOR ALL
  USING (true) WITH CHECK (true);
