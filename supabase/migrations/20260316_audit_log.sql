-- =============================================
-- Audit Log — automatic change tracking
-- GAM "evidence culture" — every change is logged
-- =============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID DEFAULT auth.uid(),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by record
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log (table_name, record_id, changed_at DESC);
-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log (changed_by, changed_at DESC);
-- Index for cleanup (monthly purge of old entries)
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log (changed_at);

-- RLS: authenticated users can read, only triggers write
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit log"
  ON audit_log FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for users — only triggers write

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables

-- vb_records (documents — evidence)
DROP TRIGGER IF EXISTS trg_audit_vb_records ON vb_records;
CREATE TRIGGER trg_audit_vb_records
  AFTER INSERT OR UPDATE OR DELETE ON vb_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- projects (client data)
DROP TRIGGER IF EXISTS trg_audit_projects ON projects;
CREATE TRIGGER trg_audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- doc_shares (sharing permissions)
DROP TRIGGER IF EXISTS trg_audit_doc_shares ON doc_shares;
CREATE TRIGGER trg_audit_doc_shares
  AFTER INSERT OR UPDATE OR DELETE ON doc_shares
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
