-- ============================================================
-- RLS Hardening Phase 2
-- Fixes security gaps found in post-audit:
-- 1. doc_shares: add created_by, scope UPDATE/DELETE to creator
-- 2. ai_conversations: backfill NULL user_id
-- ============================================================

-- ─── Fix 1: doc_shares — add creator scoping ─────────────────

-- Add created_by column for ownership tracking
ALTER TABLE doc_shares
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: inherit created_by from the parent document's creator
UPDATE doc_shares s
SET created_by = r.created_by
FROM vb_records r
WHERE s.document_id = r.id AND s.created_by IS NULL;

-- Replace permissive UPDATE/DELETE with creator-scoped policies
DROP POLICY IF EXISTS "doc_shares_update" ON doc_shares;
DROP POLICY IF EXISTS "doc_shares_delete" ON doc_shares;

CREATE POLICY "doc_shares_update"
  ON doc_shares FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "doc_shares_delete"
  ON doc_shares FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);


-- ─── Fix 2: ai_conversations — backfill NULL user_id ─────────

-- Close the NULL fallback gap: assign orphaned conversations
-- to the first auth user (single-tenant GAM installation)
UPDATE ai_conversations
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);
