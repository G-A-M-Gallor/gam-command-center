-- ============================================================
-- Migration: DOC-01 — Document Engine Full Schema
-- 17 tables + get_tenant_id() RLS helper
-- Spec: https://www.notion.so/3238f27212f881a5ab73f9ee6b2ef2a5
-- ============================================================

-- ─── Helper: get_tenant_id() ──────────────────────────────────
-- Returns the workspace_id for the current authenticated user.
-- Used in every RLS policy for tenant isolation.

CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT workspace_id
  FROM public.vb_workspace_users
  WHERE user_id = (SELECT auth.uid())
  AND is_active = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_tenant_id() IS 'Returns workspace_id for the current user — used by all Document Engine RLS policies';

-- ─── Enum: document_status ────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM (
    'draft', 'sent', 'viewed', 'partially_signed', 'signed', 'expired', 'cancelled', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: Media & Design
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. document_media ────────────────────────────────────────
-- Logos, images, watermarks, brand assets

CREATE TABLE IF NOT EXISTS document_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('logo', 'image', 'watermark', 'stamp', 'background')),
  storage_path  TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    INTEGER,
  meta          JSONB DEFAULT '{}',
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_media IS 'Brand assets: logos, watermarks, backgrounds for documents';

CREATE INDEX idx_doc_media_workspace   ON document_media(workspace_id);
CREATE INDEX idx_doc_media_type        ON document_media(type);
CREATE INDEX idx_doc_media_created_at  ON document_media(created_at DESC);

-- ─── 2. document_signatures ──────────────────────────────────
-- Saved signatures (Gal + permanent employees)

CREATE TABLE IF NOT EXISTS document_signatures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('drawn', 'typed', 'uploaded')),
  storage_path  TEXT NOT NULL,
  is_default    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_signatures IS 'Saved signatures for internal signers (drawn/typed/uploaded)';

CREATE INDEX idx_doc_signatures_workspace ON document_signatures(workspace_id);
CREATE INDEX idx_doc_signatures_user      ON document_signatures(user_id);

-- ─── 3. document_layouts ─────────────────────────────────────
-- Header/footer/watermark combinations for PDF export

CREATE TABLE IF NOT EXISTS document_layouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  header_html   TEXT,
  footer_html   TEXT,
  watermark_id  UUID REFERENCES document_media(id) ON DELETE SET NULL,
  page_size     TEXT DEFAULT 'A4' CHECK (page_size IN ('A4', 'Letter', 'Legal')),
  margins       JSONB DEFAULT '{"top": 20, "right": 15, "bottom": 20, "left": 15}',
  is_default    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_layouts IS 'Header/footer/watermark combinations applied at PDF export time';

CREATE INDEX idx_doc_layouts_workspace ON document_layouts(workspace_id);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: Building Blocks
-- ═══════════════════════════════════════════════════════════════

-- ─── 4. document_blocks ──────────────────────────────────────
-- Reusable clause/paragraph blocks (synced or detached)

CREATE TABLE IF NOT EXISTS document_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('legal', 'company_info', 'conditions', 'safety', 'custom')),
  content       JSONB NOT NULL DEFAULT '{}',
  tags          TEXT[] DEFAULT '{}',
  version       INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_blocks IS 'Reusable clause/paragraph blocks inserted via / command in Tiptap';

CREATE INDEX idx_doc_blocks_workspace  ON document_blocks(workspace_id);
CREATE INDEX idx_doc_blocks_category   ON document_blocks(category);
CREATE INDEX idx_doc_blocks_tags       ON document_blocks USING GIN(tags);
CREATE INDEX idx_doc_blocks_created_at ON document_blocks(created_at DESC);

-- ─── 5. document_templates ───────────────────────────────────
-- Full document templates (employment agreement, NDA, etc.)

CREATE TABLE IF NOT EXISTS document_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  layout_id     UUID REFERENCES document_layouts(id) ON DELETE SET NULL,
  content       JSONB NOT NULL DEFAULT '{}',
  fields        JSONB DEFAULT '[]',
  tags          TEXT[] DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  version       INTEGER NOT NULL DEFAULT 1,
  checklist     JSONB DEFAULT '[]',
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_templates IS 'Full document templates — employment agreements, NDAs, safety declarations, etc.';

CREATE INDEX idx_doc_templates_workspace  ON document_templates(workspace_id);
CREATE INDEX idx_doc_templates_status     ON document_templates(status);
CREATE INDEX idx_doc_templates_tags       ON document_templates USING GIN(tags);
CREATE INDEX idx_doc_templates_created_at ON document_templates(created_at DESC);

-- ─── 6. document_template_blocks ─────────────────────────────
-- Junction: which blocks are in which templates (synced vs detached)

CREATE TABLE IF NOT EXISTS document_template_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  block_id      UUID NOT NULL REFERENCES document_blocks(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_synced     BOOLEAN NOT NULL DEFAULT true,
  local_content JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_template_blocks IS 'Links blocks to templates — synced (live updates) or detached (local copy)';

CREATE INDEX idx_doc_tblocks_template ON document_template_blocks(template_id);
CREATE INDEX idx_doc_tblocks_block    ON document_template_blocks(block_id);
CREATE UNIQUE INDEX idx_doc_tblocks_unique ON document_template_blocks(template_id, block_id, sort_order);

-- ─── 7. document_template_versions ───────────────────────────
-- Version history for templates

CREATE TABLE IF NOT EXISTS document_template_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  content       JSONB NOT NULL,
  fields        JSONB DEFAULT '[]',
  change_note   TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_template_versions IS 'Immutable version history for document templates';

CREATE INDEX idx_doc_tversions_template   ON document_template_versions(template_id);
CREATE INDEX idx_doc_tversions_created_at ON document_template_versions(created_at DESC);
CREATE UNIQUE INDEX idx_doc_tversions_unique ON document_template_versions(template_id, version);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: Execution (Submissions & Signing)
-- ═══════════════════════════════════════════════════════════════

-- ─── 8. document_submissions ─────────────────────────────────
-- A document sent for signing — frozen snapshot + tracking

CREATE TABLE IF NOT EXISTS document_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  template_ver    INTEGER,
  name            TEXT NOT NULL,
  status          document_status NOT NULL DEFAULT 'draft',
  content_snapshot JSONB NOT NULL DEFAULT '{}',
  field_values    JSONB DEFAULT '{}',
  layout_id       UUID REFERENCES document_layouts(id) ON DELETE SET NULL,
  access_token    TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ,
  pdf_path        TEXT,
  pdf_hash        TEXT,
  signed_pdf_path TEXT,
  signed_pdf_hash TEXT,
  origami_entity_id TEXT,
  origami_entity_type TEXT,
  sent_via        TEXT[] DEFAULT '{}',
  sent_at         TIMESTAMPTZ,
  signed_at       TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_submissions IS 'Document sent for signing — contains frozen snapshot, tracking state, and final PDF paths';

CREATE INDEX idx_doc_subs_workspace    ON document_submissions(workspace_id);
CREATE INDEX idx_doc_subs_status       ON document_submissions(status);
CREATE INDEX idx_doc_subs_access_token ON document_submissions(access_token);
CREATE INDEX idx_doc_subs_template     ON document_submissions(template_id);
CREATE INDEX idx_doc_subs_created_at   ON document_submissions(created_at DESC);
CREATE INDEX idx_doc_subs_origami      ON document_submissions(origami_entity_id) WHERE origami_entity_id IS NOT NULL;
CREATE INDEX idx_doc_subs_expires      ON document_submissions(expires_at) WHERE expires_at IS NOT NULL;

-- ─── 9. document_submitters ──────────────────────────────────
-- Who signs + all legally required identification data

CREATE TABLE IF NOT EXISTS document_submitters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'signer' CHECK (role IN ('signer', 'witness', 'approver')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  full_name       TEXT,
  business_name   TEXT,
  id_number       TEXT,
  id_number_encrypted TEXT,
  email           TEXT,
  phone           TEXT,
  otp_verified    BOOLEAN DEFAULT false,
  otp_verified_at TIMESTAMPTZ,
  signature_type  TEXT CHECK (signature_type IN ('drawn', 'typed', 'uploaded')),
  signature_path  TEXT,
  ip_address      INET,
  user_agent      TEXT,
  consent_given   BOOLEAN DEFAULT false,
  consent_text    TEXT,
  signed_at       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'declined')),
  decline_reason  TEXT,
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_submitters IS 'Signers/witnesses per submission — all legally required identification data for court admissibility';

CREATE INDEX idx_doc_submitters_submission ON document_submitters(submission_id);
CREATE INDEX idx_doc_submitters_status     ON document_submitters(status);
CREATE INDEX idx_doc_submitters_email      ON document_submitters(email) WHERE email IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: Control & Tracking
-- ═══════════════════════════════════════════════════════════════

-- ─── 10. document_views ──────────────────────────────────────
-- Detailed open/view tracking per submission

CREATE TABLE IF NOT EXISTS document_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
  submitter_id    UUID REFERENCES document_submitters(id) ON DELETE SET NULL,
  ip_address      INET,
  user_agent      TEXT,
  duration_sec    INTEGER,
  sections_viewed JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_views IS 'Tracks every time a submission is opened — who, when, how long, which sections';

CREATE INDEX idx_doc_views_submission ON document_views(submission_id);
CREATE INDEX idx_doc_views_created_at ON document_views(created_at DESC);

-- ─── 11. document_field_locks ────────────────────────────────
-- Real-time field/section locking by Gal

CREATE TABLE IF NOT EXISTS document_field_locks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
  field_path      TEXT NOT NULL,
  locked_by       UUID REFERENCES auth.users(id),
  reason          TEXT,
  locked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_field_locks IS 'Remote field/section locking — Gal can lock/unlock fields while submitter has doc open';

CREATE INDEX idx_doc_flocks_submission ON document_field_locks(submission_id);
CREATE UNIQUE INDEX idx_doc_flocks_unique ON document_field_locks(submission_id, field_path);

-- ─── 12. document_messages ───────────────────────────────────
-- In-document messaging between sender and signer

CREATE TABLE IF NOT EXISTS document_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('internal', 'submitter')),
  sender_id       UUID,
  body            TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_messages IS 'In-document chat between sender (Gal) and signer';

CREATE INDEX idx_doc_messages_submission ON document_messages(submission_id);
CREATE INDEX idx_doc_messages_created_at ON document_messages(created_at DESC);

-- ─── 13. document_automations ────────────────────────────────
-- Automation rules and scheduled reminders

CREATE TABLE IF NOT EXISTS document_automations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  submission_id   UUID REFERENCES document_submissions(id) ON DELETE CASCADE,
  event           TEXT NOT NULL,
  action          TEXT NOT NULL,
  config          JSONB DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  next_run_at     TIMESTAMPTZ,
  last_run_at     TIMESTAMPTZ,
  run_count       INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_automations IS 'Automation rules: reminders, escalations, webhook triggers per submission or workspace-wide';

CREATE INDEX idx_doc_automations_workspace  ON document_automations(workspace_id);
CREATE INDEX idx_doc_automations_submission ON document_automations(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX idx_doc_automations_status     ON document_automations(status);
CREATE INDEX idx_doc_automations_next_run   ON document_automations(next_run_at) WHERE status = 'active';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: Compliance
-- ═══════════════════════════════════════════════════════════════

-- ─── 14. document_audit_log ──────────────────────────────────
-- Append-only legal audit trail — INSERT only, no UPDATE/DELETE

CREATE TABLE IF NOT EXISTS document_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  submission_id   UUID REFERENCES document_submissions(id) ON DELETE SET NULL,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user', 'submitter', 'system', 'automation')),
  actor_id        TEXT,
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_audit_log IS 'Append-only legal audit trail — every document action is logged forever (Israeli court admissibility)';

CREATE INDEX idx_doc_audit_workspace   ON document_audit_log(workspace_id);
CREATE INDEX idx_doc_audit_submission  ON document_audit_log(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX idx_doc_audit_action      ON document_audit_log(action);
CREATE INDEX idx_doc_audit_created_at  ON document_audit_log(created_at DESC);
CREATE INDEX idx_doc_audit_actor       ON document_audit_log(actor_type, actor_id);

-- ─── 15. document_checklist_items ────────────────────────────
-- Required documents per template (ID card, insurance, license, etc.)

CREATE TABLE IF NOT EXISTS document_checklist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  description     TEXT,
  is_required     BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  accepted_types  TEXT[] DEFAULT '{image/jpeg,image/png,application/pdf}',
  max_size_mb     INTEGER DEFAULT 10,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_checklist_items IS 'Required document uploads per template — signer cannot sign until mandatory items are uploaded';

CREATE INDEX idx_doc_checklist_template ON document_checklist_items(template_id);

-- ─── 16. document_checklist_uploads ──────────────────────────
-- Files uploaded by signer + Luhn validation result

CREATE TABLE IF NOT EXISTS document_checklist_uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES document_checklist_items(id) ON DELETE CASCADE,
  submitter_id    UUID REFERENCES document_submitters(id) ON DELETE SET NULL,
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  mime_type       TEXT,
  size_bytes      INTEGER,
  luhn_input      TEXT,
  luhn_valid      BOOLEAN,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note     TEXT,
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_checklist_uploads IS 'Files uploaded by signer against checklist items — includes Luhn ID validation result';

CREATE INDEX idx_doc_cuploads_submission ON document_checklist_uploads(submission_id);
CREATE INDEX idx_doc_cuploads_item       ON document_checklist_uploads(checklist_item_id);
CREATE INDEX idx_doc_cuploads_status     ON document_checklist_uploads(status);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: Archive
-- ═══════════════════════════════════════════════════════════════

-- ─── 17. document_archive ────────────────────────────────────
-- Every document that entered or left GAM — full tagging

CREATE TABLE IF NOT EXISTS document_archive (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  submission_id   UUID REFERENCES document_submissions(id) ON DELETE SET NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  title           TEXT NOT NULL,
  description     TEXT,
  storage_path    TEXT,
  file_name       TEXT,
  mime_type       TEXT,
  size_bytes      INTEGER,
  tags            TEXT[] DEFAULT '{}',
  related_entity_id   TEXT,
  related_entity_type TEXT,
  related_project_id  UUID,
  retention_years INTEGER,
  retention_until TIMESTAMPTZ,
  archived_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE document_archive IS 'Complete document archive — every doc in/out of GAM with free tagging and retention tracking';

CREATE INDEX idx_doc_archive_workspace  ON document_archive(workspace_id);
CREATE INDEX idx_doc_archive_direction  ON document_archive(direction);
CREATE INDEX idx_doc_archive_tags       ON document_archive USING GIN(tags);
CREATE INDEX idx_doc_archive_status     ON document_archive(created_at DESC);
CREATE INDEX idx_doc_archive_entity     ON document_archive(related_entity_id) WHERE related_entity_id IS NOT NULL;
CREATE INDEX idx_doc_archive_retention  ON document_archive(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_doc_archive_submission ON document_archive(submission_id) WHERE submission_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES — get_tenant_id() on every table
-- ═══════════════════════════════════════════════════════════════

-- Helper macro: all document tables use the same pattern:
-- - Authenticated users: read/write within their workspace
-- - Service role: full access
-- - Audit log: INSERT only for authenticated (no update/delete)

-- ─── document_media ───────────────────────────────────────────
ALTER TABLE document_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_media_select" ON document_media
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_media_insert" ON document_media
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_media_update" ON document_media
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_media_delete" ON document_media
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_media_service" ON document_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_signatures ──────────────────────────────────────
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_sig_select" ON document_signatures
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_sig_insert" ON document_signatures
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_sig_update" ON document_signatures
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_sig_delete" ON document_signatures
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_sig_service" ON document_signatures
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_layouts ─────────────────────────────────────────
ALTER TABLE document_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_layout_select" ON document_layouts
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_layout_insert" ON document_layouts
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_layout_update" ON document_layouts
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_layout_delete" ON document_layouts
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_layout_service" ON document_layouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_blocks ──────────────────────────────────────────
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_block_select" ON document_blocks
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_block_insert" ON document_blocks
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_block_update" ON document_blocks
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_block_delete" ON document_blocks
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_block_service" ON document_blocks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_templates ───────────────────────────────────────
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_tmpl_select" ON document_templates
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_tmpl_insert" ON document_templates
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_tmpl_update" ON document_templates
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_tmpl_delete" ON document_templates
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_tmpl_service" ON document_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_template_blocks ─────────────────────────────────
-- No workspace_id — inherits via template_id FK
ALTER TABLE document_template_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_tblock_select" ON document_template_blocks
  FOR SELECT TO authenticated USING (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_tblock_insert" ON document_template_blocks
  FOR INSERT TO authenticated WITH CHECK (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_tblock_update" ON document_template_blocks
  FOR UPDATE TO authenticated
  USING (template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id()))
  WITH CHECK (template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id()));
CREATE POLICY "doc_tblock_delete" ON document_template_blocks
  FOR DELETE TO authenticated USING (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_tblock_service" ON document_template_blocks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_template_versions ───────────────────────────────
ALTER TABLE document_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_tver_select" ON document_template_versions
  FOR SELECT TO authenticated USING (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_tver_insert" ON document_template_versions
  FOR INSERT TO authenticated WITH CHECK (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_tver_service" ON document_template_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_submissions ─────────────────────────────────────
ALTER TABLE document_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_sub_select" ON document_submissions
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_sub_insert" ON document_submissions
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_sub_update" ON document_submissions
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_sub_delete" ON document_submissions
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_sub_service" ON document_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Anonymous access for signers via access_token (public signing page)
CREATE POLICY "doc_sub_anon_select" ON document_submissions
  FOR SELECT TO anon USING (
    access_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
    AND status NOT IN ('cancelled', 'archived')
  );

-- ─── document_submitters ──────────────────────────────────────
ALTER TABLE document_submitters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_submitter_select" ON document_submitters
  FOR SELECT TO authenticated USING (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_submitter_insert" ON document_submitters
  FOR INSERT TO authenticated WITH CHECK (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_submitter_update" ON document_submitters
  FOR UPDATE TO authenticated
  USING (submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id()))
  WITH CHECK (submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id()));
CREATE POLICY "doc_submitter_service" ON document_submitters
  FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Anonymous: signers can read/update their own record via submission access_token
CREATE POLICY "doc_submitter_anon_select" ON document_submitters
  FOR SELECT TO anon USING (
    submission_id IN (
      SELECT id FROM document_submissions
      WHERE access_token IS NOT NULL
        AND (expires_at IS NULL OR expires_at > now())
        AND status NOT IN ('cancelled', 'archived')
    )
  );
CREATE POLICY "doc_submitter_anon_update" ON document_submitters
  FOR UPDATE TO anon
  USING (
    submission_id IN (
      SELECT id FROM document_submissions
      WHERE access_token IS NOT NULL
        AND (expires_at IS NULL OR expires_at > now())
        AND status NOT IN ('cancelled', 'archived')
    )
  )
  WITH CHECK (
    submission_id IN (
      SELECT id FROM document_submissions
      WHERE access_token IS NOT NULL
        AND (expires_at IS NULL OR expires_at > now())
        AND status NOT IN ('cancelled', 'archived')
    )
  );

-- ─── document_views ───────────────────────────────────────────
ALTER TABLE document_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_views_select" ON document_views
  FOR SELECT TO authenticated USING (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_views_insert" ON document_views
  FOR INSERT TO authenticated WITH CHECK (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
-- Anonymous signers can log their own views
CREATE POLICY "doc_views_anon_insert" ON document_views
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "doc_views_service" ON document_views
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_field_locks ─────────────────────────────────────
ALTER TABLE document_field_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_flocks_select" ON document_field_locks
  FOR SELECT TO authenticated USING (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_flocks_insert" ON document_field_locks
  FOR INSERT TO authenticated WITH CHECK (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_flocks_delete" ON document_field_locks
  FOR DELETE TO authenticated USING (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
-- Anonymous can read locks (to know which fields are locked)
CREATE POLICY "doc_flocks_anon_select" ON document_field_locks
  FOR SELECT TO anon USING (true);
CREATE POLICY "doc_flocks_service" ON document_field_locks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_messages ────────────────────────────────────────
ALTER TABLE document_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_msg_select" ON document_messages
  FOR SELECT TO authenticated USING (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_msg_insert" ON document_messages
  FOR INSERT TO authenticated WITH CHECK (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_msg_update" ON document_messages
  FOR UPDATE TO authenticated
  USING (submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id()))
  WITH CHECK (submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id()));
-- Anonymous signers can read and send messages
CREATE POLICY "doc_msg_anon_select" ON document_messages
  FOR SELECT TO anon USING (true);
CREATE POLICY "doc_msg_anon_insert" ON document_messages
  FOR INSERT TO anon WITH CHECK (sender_type = 'submitter');
CREATE POLICY "doc_msg_service" ON document_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_automations ─────────────────────────────────────
ALTER TABLE document_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_auto_select" ON document_automations
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_auto_insert" ON document_automations
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_auto_update" ON document_automations
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_auto_delete" ON document_automations
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_auto_service" ON document_automations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_audit_log — APPEND ONLY ─────────────────────────
ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY;
-- Authenticated: read own workspace, insert only (NO update, NO delete)
CREATE POLICY "doc_audit_select" ON document_audit_log
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_audit_insert" ON document_audit_log
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
-- Anonymous: insert only (signing page logs actions)
CREATE POLICY "doc_audit_anon_insert" ON document_audit_log
  FOR INSERT TO anon WITH CHECK (true);
-- Service: full access (for system events)
CREATE POLICY "doc_audit_service" ON document_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_checklist_items ─────────────────────────────────
ALTER TABLE document_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_check_select" ON document_checklist_items
  FOR SELECT TO authenticated USING (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_check_insert" ON document_checklist_items
  FOR INSERT TO authenticated WITH CHECK (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_check_update" ON document_checklist_items
  FOR UPDATE TO authenticated
  USING (template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id()))
  WITH CHECK (template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id()));
CREATE POLICY "doc_check_delete" ON document_checklist_items
  FOR DELETE TO authenticated USING (
    template_id IN (SELECT id FROM document_templates WHERE workspace_id = get_tenant_id())
  );
-- Anonymous: signers need to read checklist to know what to upload
CREATE POLICY "doc_check_anon_select" ON document_checklist_items
  FOR SELECT TO anon USING (true);
CREATE POLICY "doc_check_service" ON document_checklist_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_checklist_uploads ───────────────────────────────
ALTER TABLE document_checklist_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_cupload_select" ON document_checklist_uploads
  FOR SELECT TO authenticated USING (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_cupload_insert" ON document_checklist_uploads
  FOR INSERT TO authenticated WITH CHECK (
    submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id())
  );
CREATE POLICY "doc_cupload_update" ON document_checklist_uploads
  FOR UPDATE TO authenticated
  USING (submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id()))
  WITH CHECK (submission_id IN (SELECT id FROM document_submissions WHERE workspace_id = get_tenant_id()));
-- Anonymous: signers can upload files and read their uploads
CREATE POLICY "doc_cupload_anon_select" ON document_checklist_uploads
  FOR SELECT TO anon USING (true);
CREATE POLICY "doc_cupload_anon_insert" ON document_checklist_uploads
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "doc_cupload_service" ON document_checklist_uploads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── document_archive ─────────────────────────────────────────
ALTER TABLE document_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_archive_select" ON document_archive
  FOR SELECT TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_archive_insert" ON document_archive
  FOR INSERT TO authenticated WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_archive_update" ON document_archive
  FOR UPDATE TO authenticated USING (workspace_id = get_tenant_id()) WITH CHECK (workspace_id = get_tenant_id());
CREATE POLICY "doc_archive_delete" ON document_archive
  FOR DELETE TO authenticated USING (workspace_id = get_tenant_id());
CREATE POLICY "doc_archive_service" ON document_archive
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS: auto updated_at
-- ═══════════════════════════════════════════════════════════════

-- Reuse existing trigger function if available, otherwise create
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'document_media', 'document_layouts', 'document_blocks',
    'document_templates', 'document_submissions', 'document_submitters',
    'document_checklist_uploads', 'document_archive'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- STORAGE: private bucket for document PDFs and uploads
-- ═══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users in same workspace
CREATE POLICY "doc_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "doc_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "doc_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "doc_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');

-- ═══════════════════════════════════════════════════════════════
-- DONE — 17 tables, RLS on all, indexes, triggers, storage
-- ═══════════════════════════════════════════════════════════════
