-- ===================================================
-- Canvas Tables: field_placements + canvas_layouts
-- ===================================================

-- Field placements on the 2D canvas grid
CREATE TABLE IF NOT EXISTS field_placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  field_definition_id UUID NOT NULL,

  -- Grid position
  grid_col INT NOT NULL DEFAULT 0,
  grid_row INT NOT NULL DEFAULT 0,
  col_span INT NOT NULL DEFAULT 1,
  row_span INT NOT NULL DEFAULT 1,

  -- Zone
  zone TEXT NOT NULL DEFAULT 'canvas',

  -- Metadata
  placed_by UUID,
  placed_at TIMESTAMPTZ DEFAULT now(),
  last_moved_at TIMESTAMPTZ,
  last_moved_by UUID,
  sort_order INT DEFAULT 0,
  display_config JSONB DEFAULT '{}',

  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Canvas layout stored per document
CREATE TABLE IF NOT EXISTS canvas_layouts (
  document_id UUID PRIMARY KEY,
  grid_columns INT DEFAULT 12,
  grid_rows INT DEFAULT 8,
  cell_size INT DEFAULT 80,
  editor_zone JSONB DEFAULT '{"col": 2, "row": 0, "col_span": 8, "row_span": 20}',
  show_grid BOOLEAN DEFAULT true,
  snap_to_grid BOOLEAN DEFAULT true,
  zoom REAL DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE field_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage field placements"
  ON field_placements FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage canvas layouts"
  ON canvas_layouts FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_field_placements_doc ON field_placements(document_id) WHERE NOT is_deleted;
CREATE INDEX idx_field_placements_def ON field_placements(field_definition_id) WHERE NOT is_deleted;
CREATE INDEX idx_field_placements_zone ON field_placements(document_id, zone) WHERE NOT is_deleted;
