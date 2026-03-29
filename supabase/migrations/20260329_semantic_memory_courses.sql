-- =============================================
-- Semantic Memory for Courses & Content
-- Unified semantic search using Gemini embeddings (3072 dimensions)
-- =============================================

-- Semantic memory table for courses, lessons, and other content
CREATE TABLE IF NOT EXISTS semantic_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL,                        -- 'course', 'lesson', 'document', etc.
  source_id TEXT NOT NULL,                          -- foreign key reference
  content TEXT NOT NULL,                            -- text content to search
  content_hash TEXT NOT NULL,                       -- hash for change detection
  embedding vector(3072) NOT NULL,                  -- Gemini embedding
  memory_type TEXT DEFAULT 'knowledge',             -- 'knowledge', 'conversation', 'decision'
  domain TEXT,                                      -- 'education', 'business', etc.
  embedded_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT uq_semantic_memory_source UNIQUE (source_type, source_id)
);

-- Vector index for semantic search (Gemini embeddings)
CREATE INDEX IF NOT EXISTS idx_semantic_memory_embedding
  ON semantic_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_semantic_memory_source_type
  ON semantic_memory (source_type);

CREATE INDEX IF NOT EXISTS idx_semantic_memory_domain
  ON semantic_memory (domain);

CREATE INDEX IF NOT EXISTS idx_semantic_memory_type
  ON semantic_memory (memory_type);

-- RLS
ALTER TABLE semantic_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read semantic memory"
  ON semantic_memory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous users can read semantic memory"
  ON semantic_memory FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Service role can manage semantic memory"
  ON semantic_memory FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Semantic search function for courses/content
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
      (filter_source_type IS NULL OR s.source_type = filter_source_type)
      AND (filter_domain IS NULL OR s.domain = filter_domain)
      AND (1 - (s.embedding <=> query_embedding)) >= match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;