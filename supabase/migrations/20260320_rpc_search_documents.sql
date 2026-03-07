-- =============================================
-- Full-Text Search for Documents
-- Replaces: client-side filter in SearchWidget
-- Uses 'simple' tokenizer (language-agnostic, works for Hebrew + English)
-- =============================================

-- Add search vector column
ALTER TABLE vb_records ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing records
UPDATE vb_records
SET search_vector = to_tsvector('simple', COALESCE(title, ''))
WHERE search_vector IS NULL;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('simple', COALESCE(NEW.title, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vb_records_search_vector ON vb_records;
CREATE TRIGGER trg_vb_records_search_vector
  BEFORE INSERT OR UPDATE OF title ON vb_records
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_vb_records_search ON vb_records USING GIN (search_vector);

-- Search RPC with FTS + ILIKE fallback
-- Uses CTE to count FTS results before deciding on fallback
CREATE OR REPLACE FUNCTION search_documents(
  query TEXT,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  record_type TEXT,
  last_edited_at TIMESTAMPTZ,
  rank REAL
) AS $$
DECLARE
  tsquery_val tsquery;
  safe_query TEXT;
BEGIN
  tsquery_val := plainto_tsquery('simple', query);

  -- Escape ILIKE special characters for fallback
  safe_query := replace(replace(replace(query, '\', '\\'), '%', '\%'), '_', '\_');

  -- Try FTS first, fall back to ILIKE if no results
  RETURN QUERY
    WITH fts AS (
      SELECT
        r.id,
        r.title,
        r.record_type,
        r.last_edited_at,
        ts_rank(r.search_vector, tsquery_val) AS rank
      FROM vb_records r
      WHERE r.is_deleted = false
        AND r.search_vector @@ tsquery_val
      ORDER BY ts_rank(r.search_vector, tsquery_val) DESC, r.last_edited_at DESC
      LIMIT max_results
    ),
    ilike_fallback AS (
      SELECT
        r.id,
        r.title,
        r.record_type,
        r.last_edited_at,
        1.0::REAL AS rank
      FROM vb_records r
      WHERE r.is_deleted = false
        AND r.title ILIKE '%' || safe_query || '%'
        AND NOT EXISTS (SELECT 1 FROM fts)
      ORDER BY r.last_edited_at DESC
      LIMIT max_results
    )
    SELECT * FROM fts
    UNION ALL
    SELECT * FROM ilike_fallback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
