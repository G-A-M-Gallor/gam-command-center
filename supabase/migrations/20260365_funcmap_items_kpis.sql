-- ============================================================
-- Functional Map — add items, KPIs, links, notes columns
-- Turns the static grid into a reusable strategic product
-- ============================================================

ALTER TABLE functional_map_cells
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes_he TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Update the Realtime replica identity (already FULL, but safe to repeat)
ALTER TABLE functional_map_cells REPLICA IDENTITY FULL;
