-- =============================================
-- Utility RPCs — atomic operations
-- =============================================

-- ── cleanup_soft_deletes ─────────────────────────
-- Permanently removes soft-deleted records older than N days
CREATE OR REPLACE FUNCTION cleanup_soft_deletes(days_old INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM vb_records
  WHERE is_deleted = true
    AND updated_at < now() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── check_ai_budget ──────────────────────────────
-- Atomic budget check + update — prevents race conditions
-- Returns: allowed (bool), remaining (int), total_used (int)
CREATE OR REPLACE FUNCTION check_ai_budget(
  p_user_id UUID,
  p_tokens_in INT DEFAULT 0,
  p_tokens_out INT DEFAULT 0
)
RETURNS TABLE (allowed BOOLEAN, remaining INT, total_used INT) AS $$
DECLARE
  daily_limit INT := 100000;
  current_input INT;
  current_output INT;
  current_count INT;
  current_total INT;
BEGIN
  -- Lock the row for atomic read-modify-write
  SELECT
    COALESCE(a.tokens_input, 0),
    COALESCE(a.tokens_output, 0),
    COALESCE(a.request_count, 0)
  INTO current_input, current_output, current_count
  FROM ai_usage a
  WHERE a.user_id = p_user_id AND a.date = CURRENT_DATE
  FOR UPDATE;

  IF NOT FOUND THEN
    current_input := 0;
    current_output := 0;
    current_count := 0;
  END IF;

  current_total := current_input + current_output;

  -- Pre-check only (no tokens to record)
  IF p_tokens_in = 0 AND p_tokens_out = 0 THEN
    allowed := current_total < daily_limit;
    remaining := GREATEST(daily_limit - current_total, 0);
    total_used := current_total;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Record usage atomically
  INSERT INTO ai_usage (user_id, date, tokens_input, tokens_output, request_count)
  VALUES (
    p_user_id,
    CURRENT_DATE,
    current_input + p_tokens_in,
    current_output + p_tokens_out,
    current_count + 1
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    tokens_input = EXCLUDED.tokens_input,
    tokens_output = EXCLUDED.tokens_output,
    request_count = EXCLUDED.request_count;

  current_total := current_total + p_tokens_in + p_tokens_out;
  allowed := current_total <= daily_limit;
  remaining := GREATEST(daily_limit - current_total, 0);
  total_used := current_total;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── batch_update_card_positions ──────────────────
-- Single query instead of N separate updates
-- Input: JSONB array of {id, col, sort_order}
CREATE OR REPLACE FUNCTION batch_update_card_positions(updates JSONB)
RETURNS void AS $$
BEGIN
  UPDATE story_cards sc SET
    col = (u->>'col')::INT,
    sort_order = (u->>'sort_order')::INT
  FROM jsonb_array_elements(updates) AS u
  WHERE sc.id = (u->>'id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── save_document_version ────────────────────────
-- Atomic: gets next version number + inserts in one transaction
-- Prevents race condition from read MAX + INSERT
CREATE OR REPLACE FUNCTION save_document_version(
  p_doc_id UUID,
  p_title TEXT,
  p_content JSONB
)
RETURNS INT AS $$
DECLARE
  next_version INT;
BEGIN
  -- Lock existing rows for atomic read-modify-write
  PERFORM 1 FROM doc_versions WHERE document_id = p_doc_id FOR UPDATE;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM doc_versions
  WHERE document_id = p_doc_id;

  INSERT INTO doc_versions (document_id, title, content, version_number)
  VALUES (p_doc_id, p_title, p_content, next_version);

  RETURN next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
