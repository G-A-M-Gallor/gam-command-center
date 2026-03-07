-- Add T-shirt estimation to story cards
ALTER TABLE story_cards ADD COLUMN IF NOT EXISTS estimation TEXT DEFAULT NULL;

-- Valid values: XS, S, M, L, XL (or NULL for no estimation)
COMMENT ON COLUMN story_cards.estimation IS 'T-shirt size estimation: XS, S, M, L, XL';
