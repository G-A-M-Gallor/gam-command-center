-- Phase J: Editor — doc_templates table
CREATE TABLE IF NOT EXISTS doc_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_he TEXT,
  icon TEXT DEFAULT '📄',
  description TEXT,
  description_he TEXT,
  category TEXT DEFAULT 'general',
  content JSONB NOT NULL,
  canvas_layout JSONB,
  field_placements JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_category
  ON doc_templates (category);
