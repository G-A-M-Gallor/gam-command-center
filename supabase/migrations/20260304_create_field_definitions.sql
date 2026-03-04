-- Field Definitions table for GAM CC Field Library
-- Stores configured field instances created by users

CREATE TABLE IF NOT EXISTS field_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID,
  field_type TEXT NOT NULL,           -- 'short-text', 'checkbox', 'dropdown', etc.
  label TEXT NOT NULL,
  config JSONB DEFAULT '{}',          -- type-specific settings
  category TEXT,                      -- 'text', 'selection', 'time'
  sort_order INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_edited_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (same workspace)
CREATE POLICY "Users can manage field definitions"
  ON field_definitions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for common queries
CREATE INDEX idx_field_definitions_workspace ON field_definitions(workspace_id) WHERE NOT is_deleted;
CREATE INDEX idx_field_definitions_type ON field_definitions(field_type) WHERE NOT is_deleted;
