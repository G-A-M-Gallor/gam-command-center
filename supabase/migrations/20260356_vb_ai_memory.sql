-- ═══════════════════════════════════════════════════════════
-- Migration: vb_ai_memory
-- Stores CLAUDE.md chunks with embeddings for AI context retrieval.
-- Populated by Edge Function triggered from GitHub Actions on push.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vb_ai_memory (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source      TEXT NOT NULL DEFAULT 'CLAUDE.md',       -- origin file
  chunk_index INT NOT NULL,                            -- position in doc
  heading     TEXT,                                    -- nearest ## heading
  content     TEXT NOT NULL,                           -- chunk text
  content_hash TEXT NOT NULL,                          -- md5 for dedup
  embedding   vector(512),                             -- Voyage AI embedding
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_ai_memory_source_chunk UNIQUE (source, chunk_index)
);

-- Vector index for semantic search
CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding
  ON vb_ai_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_ai_memory_source
  ON vb_ai_memory (source);

-- RLS
ALTER TABLE vb_ai_memory ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (AI queries need this)
CREATE POLICY "Authenticated read ai_memory"
  ON vb_ai_memory FOR SELECT
  TO authenticated
  USING (true);

-- Service role handles writes (Edge Function)

-- Semantic search RPC for AI memory
CREATE OR REPLACE FUNCTION search_ai_memory(
  query_embedding vector(512),
  match_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  heading TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      m.id,
      m.source,
      m.heading,
      m.content,
      (1 - (m.embedding <=> query_embedding))::FLOAT AS similarity
    FROM vb_ai_memory m
    WHERE (filter_source IS NULL OR m.source = filter_source)
      AND m.embedding IS NOT NULL
      AND (1 - (m.embedding <=> query_embedding)) >= match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
