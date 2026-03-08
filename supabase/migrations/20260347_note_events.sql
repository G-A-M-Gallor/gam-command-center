-- ===================================================
-- Phase 2: KPI / Note Events
-- ===================================================
-- Generic event tracking table for KPI aggregation.
-- Tracks status transitions, field changes, and custom events.

CREATE TABLE IF NOT EXISTS note_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_key TEXT,
  event_value TEXT,
  actor_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_note_events_note ON note_events(note_id, created_at DESC);
CREATE INDEX idx_note_events_type ON note_events(entity_type, event_type);
CREATE INDEX idx_note_events_key ON note_events(event_key, event_value);

-- RLS
ALTER TABLE note_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read note events" ON note_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert note events" ON note_events FOR INSERT TO authenticated WITH CHECK (true);
