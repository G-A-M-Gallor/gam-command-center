-- ===================================================
-- Matching Scores — Cache for entity compatibility scores
-- ===================================================
-- Stores pre-computed match scores between entity pairs.
-- Supports semantic (embedding), field-based, and recency scoring.

CREATE TABLE IF NOT EXISTS matching_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  semantic_score FLOAT NOT NULL DEFAULT 0,
  field_score FLOAT NOT NULL DEFAULT 0,
  recency_score FLOAT NOT NULL DEFAULT 0,
  total_score FLOAT NOT NULL DEFAULT 0,
  field_breakdown JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, target_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_matching_scores_source ON matching_scores(source_id, total_score DESC);
CREATE INDEX idx_matching_scores_source_type ON matching_scores(source_id, target_type, total_score DESC);
CREATE INDEX idx_matching_scores_stale ON matching_scores(computed_at) WHERE computed_at < now() - interval '24 hours';

-- RLS
ALTER TABLE matching_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read matching scores" ON matching_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert matching scores" ON matching_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update matching scores" ON matching_scores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete matching scores" ON matching_scores FOR DELETE TO authenticated USING (true);
