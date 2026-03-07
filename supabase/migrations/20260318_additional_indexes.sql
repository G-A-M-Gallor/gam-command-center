-- =============================================
-- Additional Performance Indexes
-- =============================================

-- AI conversations: sorted by recency
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated
  ON ai_conversations (updated_at DESC);

-- Doc versions: latest version per document
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_version
  ON doc_versions (document_id, version_number DESC);

-- vb_records: active documents sorted by edit time (partial index)
CREATE INDEX IF NOT EXISTS idx_vb_records_active_docs
  ON vb_records (record_type, last_edited_at DESC)
  WHERE is_deleted = false;

-- Story cards: board layout query
CREATE INDEX IF NOT EXISTS idx_story_cards_board
  ON story_cards (project_id, col, sort_order);

-- Field placements: document fields sorted (partial index)
CREATE INDEX IF NOT EXISTS idx_field_placements_doc_sorted
  ON field_placements (document_id, sort_order)
  WHERE is_deleted = false;
