-- ============================================================
-- Migration: RLS Hardening Phase 3
-- 1. Enable RLS on field_mapping, user_action_permissions, push_subscriptions
-- 2. Change 6 views from SECURITY DEFINER to SECURITY INVOKER
-- 3. Replace auth.uid() with (select auth.uid()) and auth.role() with (select auth.role()) in all policies
-- ============================================================

-- ─── 1. Enable RLS + Create Policies for 3 Tables ──────────────

-- field_mapping: system config table, no user_id — authenticated read-only
ALTER TABLE public.field_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read field_mapping" ON public.field_mapping
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service manage field_mapping" ON public.field_mapping
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- user_action_permissions: user-scoped via user_id
ALTER TABLE public.user_action_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own permissions" ON public.user_action_permissions
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Service manage permissions" ON public.user_action_permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- push_subscriptions: user-scoped via user_id
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Service manage subscriptions" ON public.push_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 2. Change 6 Views to SECURITY INVOKER ─────────────────────

ALTER VIEW public.ai_usage_summary SET (security_invoker = true);
ALTER VIEW public.project_summary SET (security_invoker = true);
ALTER VIEW public.fb_records_with_lookups SET (security_invoker = true);
ALTER VIEW public.origami_customer_data SET (security_invoker = true);
ALTER VIEW public.document_list SET (security_invoker = true);
ALTER VIEW public.fb_related_records SET (security_invoker = true);

-- ─── 3. Replace auth.uid() → (select auth.uid()) in all policies ──

-- ai_conversations (4 policies)
DROP POLICY IF EXISTS "ai_conversations_delete" ON public.ai_conversations;
CREATE POLICY "ai_conversations_delete" ON public.ai_conversations FOR DELETE
  USING ((user_id = (select auth.uid())) OR (user_id IS NULL));

DROP POLICY IF EXISTS "ai_conversations_insert" ON public.ai_conversations;
CREATE POLICY "ai_conversations_insert" ON public.ai_conversations FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "ai_conversations_select" ON public.ai_conversations;
CREATE POLICY "ai_conversations_select" ON public.ai_conversations FOR SELECT
  USING ((user_id = (select auth.uid())) OR (user_id IS NULL));

DROP POLICY IF EXISTS "ai_conversations_update" ON public.ai_conversations;
CREATE POLICY "ai_conversations_update" ON public.ai_conversations FOR UPDATE
  USING ((user_id = (select auth.uid())) OR (user_id IS NULL));

-- ai_usage (3 policies)
DROP POLICY IF EXISTS "Users can read own usage" ON public.ai_usage;
CREATE POLICY "Users can read own usage" ON public.ai_usage FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own usage" ON public.ai_usage;
CREATE POLICY "Users can update own usage" ON public.ai_usage FOR UPDATE
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can upsert own usage" ON public.ai_usage;
CREATE POLICY "Users can upsert own usage" ON public.ai_usage FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- canvas_layouts
DROP POLICY IF EXISTS "canvas_layouts_modify" ON public.canvas_layouts;
CREATE POLICY "canvas_layouts_modify" ON public.canvas_layouts FOR ALL
  USING ((select auth.uid()) IS NOT NULL) WITH CHECK ((select auth.uid()) IS NOT NULL);

-- doc_shares (3 policies)
DROP POLICY IF EXISTS "doc_shares_delete" ON public.doc_shares;
CREATE POLICY "doc_shares_delete" ON public.doc_shares FOR DELETE
  USING ((created_by = (select auth.uid())) OR (created_by IS NULL));

DROP POLICY IF EXISTS "doc_shares_insert" ON public.doc_shares;
CREATE POLICY "doc_shares_insert" ON public.doc_shares FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "doc_shares_update" ON public.doc_shares;
CREATE POLICY "doc_shares_update" ON public.doc_shares FOR UPDATE
  USING ((created_by = (select auth.uid())) OR (created_by IS NULL));

-- doc_templates (3 policies)
DROP POLICY IF EXISTS "doc_templates_delete" ON public.doc_templates;
CREATE POLICY "doc_templates_delete" ON public.doc_templates FOR DELETE
  USING ((created_by = (select auth.uid())) OR (created_by IS NULL));

DROP POLICY IF EXISTS "doc_templates_insert" ON public.doc_templates;
CREATE POLICY "doc_templates_insert" ON public.doc_templates FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "doc_templates_update" ON public.doc_templates;
CREATE POLICY "doc_templates_update" ON public.doc_templates FOR UPDATE
  USING ((created_by = (select auth.uid())) OR (created_by IS NULL));

-- doc_versions
DROP POLICY IF EXISTS "doc_versions_insert" ON public.doc_versions;
CREATE POLICY "doc_versions_insert" ON public.doc_versions FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- field_definitions
DROP POLICY IF EXISTS "field_definitions_modify" ON public.field_definitions;
CREATE POLICY "field_definitions_modify" ON public.field_definitions FOR ALL
  USING ((select auth.uid()) IS NOT NULL) WITH CHECK ((select auth.uid()) IS NOT NULL);

-- field_placements
DROP POLICY IF EXISTS "field_placements_modify" ON public.field_placements;
CREATE POLICY "field_placements_modify" ON public.field_placements FOR ALL
  USING ((select auth.uid()) IS NOT NULL) WITH CHECK ((select auth.uid()) IS NOT NULL);

-- notification_log
DROP POLICY IF EXISTS "Users read own notifications" ON public.notification_log;
CREATE POLICY "Users read own notifications" ON public.notification_log FOR SELECT
  USING ((select auth.uid()) = user_id);

-- projects (2 policies)
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

-- session_context (4 policies)
DROP POLICY IF EXISTS "Users can delete own context" ON public.session_context;
CREATE POLICY "Users can delete own context" ON public.session_context FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own context" ON public.session_context;
CREATE POLICY "Users can insert own context" ON public.session_context FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own context" ON public.session_context;
CREATE POLICY "Users can read own context" ON public.session_context FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own context" ON public.session_context;
CREATE POLICY "Users can update own context" ON public.session_context FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- story_cards (3 policies)
DROP POLICY IF EXISTS "story_cards_delete" ON public.story_cards;
CREATE POLICY "story_cards_delete" ON public.story_cards FOR DELETE
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "story_cards_insert" ON public.story_cards;
CREATE POLICY "story_cards_insert" ON public.story_cards FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "story_cards_update" ON public.story_cards;
CREATE POLICY "story_cards_update" ON public.story_cards FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

-- tenants
DROP POLICY IF EXISTS "tenants_self" ON public.tenants;
CREATE POLICY "tenants_self" ON public.tenants FOR ALL
  USING (user_id = (select auth.uid()));

-- user_profiles (2 policies with auth.uid())
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- vb_ai_memory (2 policies with auth.uid() in subqueries)
DROP POLICY IF EXISTS "Users can insert into own workspace" ON public.vb_ai_memory;
CREATE POLICY "Users can insert into own workspace" ON public.vb_ai_memory FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT wu.workspace_id FROM vb_workspace_users wu WHERE wu.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can read own workspace and system memories" ON public.vb_ai_memory;
CREATE POLICY "Users can read own workspace and system memories" ON public.vb_ai_memory FOR SELECT
  USING (
    is_active = true AND (
      memory_scope = 'system' OR
      workspace_id IN (
        SELECT wu.workspace_id FROM vb_workspace_users wu WHERE wu.user_id = (select auth.uid())
      )
    )
  );

-- vb_locale_settings
DROP POLICY IF EXISTS "ws_locale_settings" ON public.vb_locale_settings;
CREATE POLICY "ws_locale_settings" ON public.vb_locale_settings FOR SELECT
  USING ((workspace_id = ANY (vb_user_workspace_ids())) OR (user_id = (select auth.uid())));

-- vb_notifications
DROP POLICY IF EXISTS "Users see own notifications" ON public.vb_notifications;
CREATE POLICY "Users see own notifications" ON public.vb_notifications FOR SELECT
  USING (user_id = (select auth.uid()));

-- vb_platform_admins
DROP POLICY IF EXISTS "admins_self" ON public.vb_platform_admins;
CREATE POLICY "admins_self" ON public.vb_platform_admins FOR SELECT
  USING (user_id = (select auth.uid()));

-- vb_records (3 policies with auth.uid())
DROP POLICY IF EXISTS "vb_records_delete" ON public.vb_records;
CREATE POLICY "vb_records_delete" ON public.vb_records FOR DELETE
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "vb_records_insert" ON public.vb_records;
CREATE POLICY "vb_records_insert" ON public.vb_records FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "vb_records_update" ON public.vb_records;
CREATE POLICY "vb_records_update" ON public.vb_records FOR UPDATE
  USING (created_by = (select auth.uid()));

-- vb_user_lists
DROP POLICY IF EXISTS "lists_owner" ON public.vb_user_lists;
CREATE POLICY "lists_owner" ON public.vb_user_lists FOR ALL
  USING (user_id = (select auth.uid()));

-- vb_user_posts
DROP POLICY IF EXISTS "posts_author" ON public.vb_user_posts;
CREATE POLICY "posts_author" ON public.vb_user_posts FOR ALL
  USING (author_id = (select auth.uid()));

-- vb_user_profiles
DROP POLICY IF EXISTS "profiles_owner" ON public.vb_user_profiles;
CREATE POLICY "profiles_owner" ON public.vb_user_profiles FOR ALL
  USING (user_id = (select auth.uid()));

-- vb_workspaces
DROP POLICY IF EXISTS "Owners manage workspace" ON public.vb_workspaces;
CREATE POLICY "Owners manage workspace" ON public.vb_workspaces FOR ALL
  USING (owner_id = (select auth.uid()));

-- ─── 3b. Replace auth.role() → (select auth.role()) ────────────

-- gam_knowledge
DROP POLICY IF EXISTS "Service write" ON public.gam_knowledge;
CREATE POLICY "Service write" ON public.gam_knowledge FOR ALL
  USING ((select auth.role()) = 'service_role'::text);

-- plugins
DROP POLICY IF EXISTS "plugins_auth" ON public.plugins;
CREATE POLICY "plugins_auth" ON public.plugins FOR ALL
  USING ((select auth.role()) = 'authenticated'::text);

-- template_fields
DROP POLICY IF EXISTS "template_fields_read_all" ON public.template_fields;
CREATE POLICY "template_fields_read_all" ON public.template_fields FOR SELECT
  USING ((select auth.role()) = 'authenticated'::text);

-- templates
DROP POLICY IF EXISTS "templates_read_all" ON public.templates;
CREATE POLICY "templates_read_all" ON public.templates FOR SELECT
  USING ((select auth.role()) = 'authenticated'::text);

-- vb_ai_memory (service role)
DROP POLICY IF EXISTS "Service role full access" ON public.vb_ai_memory;
CREATE POLICY "Service role full access" ON public.vb_ai_memory FOR ALL
  USING ((select auth.role()) = 'service_role'::text);

-- wiki_entries
DROP POLICY IF EXISTS "wiki_auth" ON public.wiki_entries;
CREATE POLICY "wiki_auth" ON public.wiki_entries FOR ALL
  USING ((select auth.role()) = 'authenticated'::text);
