-- Global Field Library — reusable field definitions across all entities
-- A field is defined ONCE and referenced by any entity type via meta_key

CREATE TABLE IF NOT EXISTS global_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_key TEXT UNIQUE NOT NULL,
  label JSONB NOT NULL DEFAULT '{}',
  description JSONB DEFAULT '{}',
  field_type TEXT NOT NULL,
  is_composite BOOLEAN DEFAULT false,
  sub_fields JSONB DEFAULT '[]',
  display_template TEXT,
  options JSONB DEFAULT '[]',
  validation JSONB DEFAULT '{}',
  default_value JSONB,
  icon TEXT,
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_global_fields_meta_key ON global_fields(meta_key);
CREATE INDEX idx_global_fields_category ON global_fields(category);

-- RLS
ALTER TABLE global_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "global_fields_all_access" ON global_fields FOR ALL USING (true) WITH CHECK (true);
