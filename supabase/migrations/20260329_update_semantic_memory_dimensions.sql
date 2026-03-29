-- =============================================
-- Update semantic_memory to support Gemini embeddings (3072 dimensions)
-- =============================================

-- First, backup existing data structure
CREATE TABLE IF NOT EXISTS semantic_memory_backup AS
SELECT id, source_type, source_id, content, content_hash, memory_type, domain, embedded_at
FROM semantic_memory
WHERE 1=0; -- Just create structure, no data initially

-- Drop existing vector column and recreate with correct dimensions
ALTER TABLE semantic_memory
DROP COLUMN IF EXISTS embedding;

ALTER TABLE semantic_memory
ADD COLUMN embedding vector(3072);

-- Drop and recreate the vector index
DROP INDEX IF EXISTS idx_semantic_memory_embedding;

CREATE INDEX idx_semantic_memory_embedding
  ON semantic_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Update search function signature
CREATE OR REPLACE FUNCTION search_semantic_memory(
  query_embedding vector(3072),
  match_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10,
  filter_source_type TEXT DEFAULT NULL,
  filter_domain TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  content TEXT,
  domain TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.source_type,
      s.source_id,
      s.content,
      s.domain,
      (1 - (s.embedding <=> query_embedding))::FLOAT AS similarity
    FROM semantic_memory s
    WHERE
      s.embedding IS NOT NULL
      AND (filter_source_type IS NULL OR s.source_type = filter_source_type)
      AND (filter_domain IS NULL OR s.domain = filter_domain)
      AND (1 - (s.embedding <=> query_embedding)) >= match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Existing data will need to be re-embedded with Gemini
-- Old 768-dimension embeddings are no longer compatible