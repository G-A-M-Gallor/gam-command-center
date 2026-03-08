-- Entity Types — templates that define which global fields a note shows
-- An entity type is just a "lens" on a note — the note is the real thing

CREATE TABLE IF NOT EXISTS entity_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label JSONB NOT NULL DEFAULT '{}',
  icon TEXT DEFAULT '📄',
  color TEXT,
  field_refs JSONB DEFAULT '[]',
  group_refs JSONB DEFAULT '[]',
  default_view TEXT DEFAULT 'table',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entity_types_slug ON entity_types(slug);

-- RLS
ALTER TABLE entity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_types_all_access" ON entity_types FOR ALL USING (true) WITH CHECK (true);

-- Entity Connections — which entity types can relate to which
-- This defines the SCHEMA of relationships, not actual connections
CREATE TABLE IF NOT EXISTS entity_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL REFERENCES entity_types(slug) ON DELETE CASCADE,
  target_type TEXT NOT NULL REFERENCES entity_types(slug) ON DELETE CASCADE,
  relation_label JSONB DEFAULT '{}',
  reverse_label JSONB DEFAULT '{}',
  relation_kind TEXT DEFAULT 'many-to-many',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_type, target_type)
);

ALTER TABLE entity_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_connections_all_access" ON entity_connections FOR ALL USING (true) WITH CHECK (true);
