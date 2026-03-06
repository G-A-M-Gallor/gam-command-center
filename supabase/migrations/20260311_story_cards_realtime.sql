-- Phase K: Story Map — add updated_at + enable Realtime

ALTER TABLE story_cards
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_story_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_story_cards_updated_at
  BEFORE UPDATE ON story_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_story_cards_updated_at();

-- Enable Realtime for story_cards
ALTER PUBLICATION supabase_realtime ADD TABLE story_cards;
