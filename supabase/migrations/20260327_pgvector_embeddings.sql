-- =============================================
-- pgvector + Document Embeddings
-- Semantic search on document content via Voyage AI
-- =============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(512) NOT NULL,
  embedded_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_document_embeddings_doc UNIQUE (document_id)
);

-- IVFFlat index for approximate nearest neighbor search
-- lists = sqrt(expected_rows) — start with 100, adjust as data grows
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector
  ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index on document_id for lookups
CREATE INDEX IF NOT EXISTS idx_document_embeddings_doc_id
  ON document_embeddings (document_id);

-- RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read embeddings"
  ON document_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- Semantic search RPC
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(512),
  match_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id,
      r.title,
      (1 - (e.embedding <=> query_embedding))::FLOAT AS similarity
    FROM document_embeddings e
    JOIN vb_records r ON r.id = e.document_id
    WHERE r.is_deleted = false
      AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
