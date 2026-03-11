-- Import Logs table for tracking file imports
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  entity_type TEXT NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  column_mapping JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_import_logs_user_date ON import_logs(created_by, created_at DESC);
CREATE INDEX idx_import_logs_entity_type ON import_logs(entity_type);
CREATE INDEX idx_import_logs_status ON import_logs(status);

-- RLS: users see only their own imports
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own import logs" ON import_logs FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Users can insert own import logs" ON import_logs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own import logs" ON import_logs FOR UPDATE TO authenticated USING (created_by = auth.uid());
