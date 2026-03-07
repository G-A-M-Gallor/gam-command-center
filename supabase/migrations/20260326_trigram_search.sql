-- =============================================
-- Trigram Search (fuzzy matching)
-- pg_trgm — language-agnostic, works for Hebrew
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for trigram similarity on document titles
CREATE INDEX IF NOT EXISTS idx_vb_records_title_trgm
  ON vb_records USING GIN (title gin_trgm_ops);

-- GIN index for trigram on project names
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm
  ON projects USING GIN (name gin_trgm_ops);
