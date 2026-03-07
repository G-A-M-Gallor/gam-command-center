-- Add notes and diagram columns to story_cards
ALTER TABLE story_cards
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS diagram TEXT DEFAULT '';

-- diagram = Mermaid syntax string (empty = no diagram)
