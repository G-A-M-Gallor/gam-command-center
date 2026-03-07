-- =============================================
-- Database Views — replace multi-query patterns
-- =============================================

-- ── project_summary ─────────────────────────────
-- Project stats with story card counts
-- NOTE: vb_records.entity_id is NOT a FK to projects.id
-- (it's an Origami entity reference). Document-project
-- relationship is via story_cards.project_id only.
CREATE OR REPLACE VIEW project_summary AS
SELECT
  p.id,
  p.origami_id,
  p.name,
  p.status,
  p.health_score,
  p.layer,
  p.source,
  p.created_at,
  p.updated_at,
  COALESCE(card_counts.card_count, 0) AS card_count,
  card_latest.latest_card AS last_activity
FROM projects p
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS card_count
  FROM story_cards sc
  WHERE sc.project_id = p.id
) card_counts ON true
LEFT JOIN LATERAL (
  SELECT MAX(sc.created_at) AS latest_card
  FROM story_cards sc
  WHERE sc.project_id = p.id
) card_latest ON true;

-- ── document_list ───────────────────────────────
-- Replaces: multiple queries in Editor page
CREATE OR REPLACE VIEW document_list AS
SELECT
  d.id,
  d.title,
  d.record_type,
  d.status,
  d.source,
  d.created_by,
  d.created_at,
  d.last_edited_at,
  COALESCE(v.version_count, 0) AS version_count,
  COALESCE(s.has_active_share, false) AS has_active_share,
  COALESCE(f.field_count, 0) AS field_count
FROM vb_records d
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS version_count
  FROM doc_versions dv
  WHERE dv.document_id = d.id
) v ON true
LEFT JOIN LATERAL (
  SELECT EXISTS(
    SELECT 1 FROM doc_shares ds
    WHERE ds.document_id = d.id AND ds.is_active = true
  ) AS has_active_share
) s ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS field_count
  FROM field_placements fp
  WHERE fp.document_id = d.id AND fp.is_deleted = false
) f ON true
WHERE d.record_type = 'document'
  AND d.is_deleted = false;

-- ── ai_usage_summary ────────────────────────────
-- Replaces: client-side budget calculation
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  u.user_id,
  u.date,
  u.tokens_input,
  u.tokens_output,
  u.tokens_input + u.tokens_output AS total_tokens,
  u.request_count,
  GREATEST(100000 - (u.tokens_input + u.tokens_output), 0) AS remaining_tokens,
  p.display_name,
  p.email
FROM ai_usage u
LEFT JOIN user_profiles p ON p.id = u.user_id
WHERE u.date = CURRENT_DATE;
