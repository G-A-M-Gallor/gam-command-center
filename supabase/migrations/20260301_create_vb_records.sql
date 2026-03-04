-- vb_records: Core records table (documents, forms, etc.)
-- This table likely already exists in Supabase — run only if missing.
-- To check: SELECT to_regclass('public.vb_records');

CREATE TABLE IF NOT EXISTS vb_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID,
  entity_id UUID,
  title TEXT NOT NULL DEFAULT 'ללא כותרת',
  content JSONB,
  record_type TEXT NOT NULL DEFAULT 'document',
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'active',
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_edited_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_vb_records_record_type ON vb_records (record_type);
CREATE INDEX IF NOT EXISTS idx_vb_records_workspace_id ON vb_records (workspace_id);
CREATE INDEX IF NOT EXISTS idx_vb_records_is_deleted ON vb_records (is_deleted);
CREATE INDEX IF NOT EXISTS idx_vb_records_last_edited ON vb_records (last_edited_at DESC);

-- RLS
ALTER TABLE vb_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "vb_records_all_access"
  ON vb_records FOR ALL
  USING (true) WITH CHECK (true);
