-- ============================================================
-- Functional Map Cells — 3×5 locked grid
-- 3 levels (strategy/management/operations) × 5 functions
-- Grid is immutable: only UPDATE allowed after seed
-- ============================================================

CREATE TABLE IF NOT EXISTS functional_map_cells (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('strategy', 'management', 'operations')),
  func TEXT NOT NULL CHECK (func IN ('sales', 'delivery', 'finance', 'hr', 'technology')),
  owner TEXT DEFAULT '',
  tools TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'planned' CHECK (status IN ('active', 'partial', 'planned')),
  description TEXT DEFAULT '',
  description_he TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
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

INSERT INTO functional_map_cells (id, level, func) VALUES
  ('strategy-sales',       'strategy',    'sales'),
  ('strategy-delivery',    'strategy',    'delivery'),
  ('strategy-finance',     'strategy',    'finance'),
  ('strategy-hr',          'strategy',    'hr'),
  ('strategy-technology',  'strategy',    'technology'),
  ('management-sales',     'management',  'sales'),
  ('management-delivery',  'management',  'delivery'),
  ('management-finance',   'management',  'finance'),
  ('management-hr',        'management',  'hr'),
  ('management-technology','management',  'technology'),
  ('operations-sales',     'operations',  'sales'),
  ('operations-delivery',  'operations',  'delivery'),
  ('operations-finance',   'operations',  'finance'),
  ('operations-hr',        'operations',  'hr'),
  ('operations-technology','operations',  'technology')
ON CONFLICT (id) DO NOTHING;
