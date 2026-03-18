-- ===================================================
-- Matching Shortlist — Candidate tracking per position
-- ===================================================
-- Tracks candidates added to a shortlist for a specific source entity (position/client).
-- Each row = one source-target pair with a recruitment status.

CREATE TABLE IF NOT EXISTS matching_shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'added',
  notes TEXT DEFAULT '',
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, target_id)
);

-- Status values: added, contacted, interview, accepted, rejected, withdrawn

-- Indexes
CREATE INDEX idx_shortlist_source ON matching_shortlist(source_id, status);
CREATE INDEX idx_shortlist_target ON matching_shortlist(target_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_shortlist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shortlist_updated_at
  BEFORE UPDATE ON matching_shortlist
  FOR EACH ROW EXECUTE FUNCTION update_shortlist_timestamp();

-- RLS
ALTER TABLE matching_shortlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read shortlist" ON matching_shortlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert shortlist" ON matching_shortlist FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update shortlist" ON matching_shortlist FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete shortlist" ON matching_shortlist FOR DELETE TO authenticated USING (true);
