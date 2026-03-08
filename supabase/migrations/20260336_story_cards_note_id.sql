-- Add note_id to story_cards — links a story card to an editor note (vb_records)
ALTER TABLE story_cards ADD COLUMN note_id UUID REFERENCES vb_records(id) ON DELETE SET NULL;
