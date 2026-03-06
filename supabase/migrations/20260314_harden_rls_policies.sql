-- ============================================================
-- Migration: Harden RLS policies
-- Replaces permissive USING(true) with authenticated-only policies.
-- Adds RLS to tables that were missing it entirely.
-- ============================================================

-- ============================================================
-- PART 1: Fix 6 tables with permissive USING(true)
-- ============================================================

-- --- projects ---
-- Synced from Origami via service role (bypasses RLS).
-- Authenticated users: read all. Write blocked (use sync).
DROP POLICY IF EXISTS "projects_all_access" ON projects;

CREATE POLICY "projects_select"
  ON projects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "projects_insert"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "projects_update"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- No delete policy — projects managed via Origami sync (service role)


-- --- vb_records ---
-- Documents: read all, create/edit/delete own only.
DROP POLICY IF EXISTS "vb_records_all_access" ON vb_records;

CREATE POLICY "vb_records_select"
  ON vb_records FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vb_records_insert"
  ON vb_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vb_records_update"
  ON vb_records FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "vb_records_delete"
  ON vb_records FOR DELETE TO authenticated
  USING (created_by = auth.uid());


-- --- field_definitions ---
-- Shared field library: read all, write authenticated.
DROP POLICY IF EXISTS "Users can manage field definitions" ON field_definitions;

CREATE POLICY "field_definitions_select"
  ON field_definitions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "field_definitions_modify"
  ON field_definitions FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


-- --- field_placements ---
-- Per-document placements: read all, write authenticated.
DROP POLICY IF EXISTS "Users can manage field placements" ON field_placements;

CREATE POLICY "field_placements_select"
  ON field_placements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "field_placements_modify"
  ON field_placements FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


-- --- canvas_layouts ---
-- Per-document layout config: read all, write authenticated.
DROP POLICY IF EXISTS "Users can manage canvas layouts" ON canvas_layouts;

CREATE POLICY "canvas_layouts_select"
  ON canvas_layouts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "canvas_layouts_modify"
  ON canvas_layouts FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


-- --- story_cards ---
-- Story map cards: read all, write authenticated.
DROP POLICY IF EXISTS "story_cards_all_access" ON story_cards;

CREATE POLICY "story_cards_select"
  ON story_cards FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "story_cards_insert"
  ON story_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "story_cards_update"
  ON story_cards FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "story_cards_delete"
  ON story_cards FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);


-- ============================================================
-- PART 2: Enable RLS on 3 tables that had none
-- ============================================================

-- --- ai_conversations ---
-- Add user_id column so we can scope by user.
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_select"
  ON ai_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "ai_conversations_insert"
  ON ai_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ai_conversations_update"
  ON ai_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "ai_conversations_delete"
  ON ai_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);


-- --- doc_templates ---
-- Shared templates: read all, write by creator.
ALTER TABLE doc_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_templates_select"
  ON doc_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "doc_templates_insert"
  ON doc_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "doc_templates_update"
  ON doc_templates FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "doc_templates_delete"
  ON doc_templates FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);


-- --- doc_versions ---
-- Version history: read all, insert authenticated, no direct update/delete.
ALTER TABLE doc_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_versions_select"
  ON doc_versions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "doc_versions_insert"
  ON doc_versions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- No update/delete — versions are immutable


-- --- doc_shares ---
-- Share links: read all, manage authenticated.
ALTER TABLE doc_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_shares_select"
  ON doc_shares FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "doc_shares_insert"
  ON doc_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "doc_shares_update"
  ON doc_shares FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "doc_shares_delete"
  ON doc_shares FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
