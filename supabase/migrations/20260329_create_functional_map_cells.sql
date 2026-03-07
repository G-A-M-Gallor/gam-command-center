-- ============================================================
-- Functional Map Cells — 3×5 locked grid
-- 3 levels (strategy/management/operations) × 5 functions
-- Grid is immutable: only UPDATE allowed after seed
-- NOTE: Table was created in Supabase before this file.
--       id is UUID (gen_random_uuid), not TEXT.
-- ============================================================

CREATE TABLE IF NOT EXISTS functional_map_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('strategy', 'management', 'operations')),
  func TEXT NOT NULL CHECK (func IN ('sales', 'delivery', 'finance', 'hr', 'technology')),
  owner TEXT DEFAULT '',
  tools TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'planned' CHECK (status IN ('active', 'partial', 'planned')),
  description TEXT DEFAULT '',
  description_he TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_functional_map_level_func UNIQUE (level, func)
);

-- Index for grid lookups
CREATE INDEX IF NOT EXISTS idx_functional_map_level
  ON functional_map_cells (level);

-- RLS: authenticated can read + update only (grid structure is immutable)
ALTER TABLE functional_map_cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "functional_map_cells_select"
  ON functional_map_cells FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "functional_map_cells_update"
  ON functional_map_cells FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime
ALTER TABLE functional_map_cells REPLICA IDENTITY FULL;

-- ─── Seed all 15 cells ──────────────────────────────────────

INSERT INTO functional_map_cells (level, func) VALUES
  ('strategy',    'sales'),
  ('strategy',    'delivery'),
  ('strategy',    'finance'),
  ('strategy',    'hr'),
  ('strategy',    'technology'),
  ('management',  'sales'),
  ('management',  'delivery'),
  ('management',  'finance'),
  ('management',  'hr'),
  ('management',  'technology'),
  ('operations',  'sales'),
  ('operations',  'delivery'),
  ('operations',  'finance'),
  ('operations',  'hr'),
  ('operations',  'technology')
ON CONFLICT ON CONSTRAINT uq_functional_map_level_func DO NOTHING;
