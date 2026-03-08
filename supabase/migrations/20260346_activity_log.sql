-- ===================================================
-- Phase 2: Activity log for notes
-- ===================================================
-- Tracks every field change, comment, call log, status change per note.
-- Only active when entity_type has track_activity=true in template_config.

CREATE TABLE IF NOT EXISTS note_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  actor_id UUID,
  activity_type TEXT NOT NULL,
  field_key TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  note_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_log_note ON note_activity_log(note_id, created_at DESC);
CREATE INDEX idx_activity_log_type ON note_activity_log(activity_type);

-- RLS
ALTER TABLE note_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read activity logs" ON note_activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activity logs" ON note_activity_log FOR INSERT TO authenticated WITH CHECK (true);
