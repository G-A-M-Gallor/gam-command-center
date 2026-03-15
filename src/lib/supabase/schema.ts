// ===================================================
// Centralized Supabase Schema Types
// All table row interfaces in one place.
// Query files re-export from here for backwards compat.
// ===================================================

// ─── Projects (synced from Origami via n8n) ─────────
export interface Project {
  id: string;
  origami_id: string | null;
  name: string;
  status: string;
  health_score: number;
  layer: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Documents (vb_records with record_type='document') ─
export interface DocRecord {
  id: string;
  title: string;
  content: unknown;
  status: string | null;
  record_type: string;
  workspace_id: string;
  entity_id: string;
  created_by: string;
  source: string;
  created_at: string;
  last_edited_at: string;
  updated_at: string;
}

// ─── Document Templates ─────────────────────────────
export interface DocTemplate {
  id: string;
  name: string;
  name_he: string | null;
  icon: string;
  description: string | null;
  description_he: string | null;
  category: string;
  content: unknown;
  canvas_layout: unknown | null;
  field_placements: unknown[];
  created_by: string | null;
  created_at: string;
}

// ─── Document Versions ──────────────────────────────
export interface DocVersion {
  id: string;
  document_id: string;
  title: string;
  content: unknown;
  version_number: number;
  created_at: string;
}

// ─── Document Shares ────────────────────────────────
export interface DocShare {
  id: string;
  document_id: string;
  share_token: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

// ═══════════════════════════════════════════════════════
// Document Engine Types (DOC-01)
// 17 tables — independent bounded context
// ═══════════════════════════════════════════════════════

export type DocumentStatus =
  | 'draft' | 'sent' | 'viewed' | 'partially_signed'
  | 'signed' | 'expired' | 'cancelled' | 'archived';

export type SubmitterRole = 'signer' | 'witness' | 'approver';
export type SubmitterStatus = 'pending' | 'viewed' | 'signed' | 'declined';
export type MediaType = 'logo' | 'image' | 'watermark' | 'stamp' | 'background';
export type SignatureType = 'drawn' | 'typed' | 'uploaded';
export type BlockCategory = 'legal' | 'company_info' | 'conditions' | 'safety' | 'custom';
export type DocTemplateStatus = 'draft' | 'active' | 'archived';
export type AuditActorType = 'user' | 'submitter' | 'system' | 'automation';
export type AutomationStatus = 'active' | 'paused' | 'completed' | 'failed';
export type UploadReviewStatus = 'pending' | 'approved' | 'rejected';
export type ArchiveDirection = 'inbound' | 'outbound' | 'internal';
export type PageSize = 'A4' | 'Letter' | 'Legal';

// ─── 1. Document Media ──────────────────────────────
export interface DocumentMedia {
  id: string;
  workspace_id: string;
  name: string;
  type: MediaType;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  meta: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 2. Document Signatures ─────────────────────────
export interface DocumentSignature {
  id: string;
  workspace_id: string;
  user_id: string | null;
  name: string;
  type: SignatureType;
  storage_path: string;
  is_default: boolean;
  created_at: string;
}

// ─── 3. Document Layouts ────────────────────────────
export interface DocumentLayout {
  id: string;
  workspace_id: string;
  name: string;
  header_html: string | null;
  footer_html: string | null;
  watermark_id: string | null;
  page_size: PageSize;
  margins: { top: number; right: number; bottom: number; left: number };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ─── 4. Document Blocks ─────────────────────────────
export interface DocumentBlock {
  id: string;
  workspace_id: string;
  title: string;
  category: BlockCategory;
  content: Record<string, unknown>;
  tags: string[];
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 5. Document Templates ──────────────────────────
export interface DocumentTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  layout_id: string | null;
  content: Record<string, unknown>;
  fields: Record<string, unknown>[];
  tags: string[];
  status: DocTemplateStatus;
  version: number;
  checklist: Record<string, unknown>[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 6. Document Template Blocks ────────────────────
export interface DocumentTemplateBlock {
  id: string;
  template_id: string;
  block_id: string;
  sort_order: number;
  is_synced: boolean;
  local_content: Record<string, unknown> | null;
  created_at: string;
}

// ─── 7. Document Template Versions ──────────────────
export interface DocumentTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  content: Record<string, unknown>;
  fields: Record<string, unknown>[];
  change_note: string | null;
  created_by: string | null;
  created_at: string;
}

// ─── 8. Document Submissions ────────────────────────
export interface DocumentSubmission {
  id: string;
  workspace_id: string;
  template_id: string | null;
  template_ver: number | null;
  name: string;
  status: DocumentStatus;
  content_snapshot: Record<string, unknown>;
  field_values: Record<string, unknown>;
  layout_id: string | null;
  access_token: string;
  expires_at: string | null;
  pdf_path: string | null;
  pdf_hash: string | null;
  signed_pdf_path: string | null;
  signed_pdf_hash: string | null;
  origami_entity_id: string | null;
  origami_entity_type: string | null;
  sent_via: string[];
  sent_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 9. Document Submitters ─────────────────────────
export interface DocumentSubmitter {
  id: string;
  submission_id: string;
  role: SubmitterRole;
  sort_order: number;
  full_name: string | null;
  business_name: string | null;
  id_number: string | null;
  id_number_encrypted: string | null;
  email: string | null;
  phone: string | null;
  otp_verified: boolean;
  otp_verified_at: string | null;
  signature_type: SignatureType | null;
  signature_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  consent_given: boolean;
  consent_text: string | null;
  signed_at: string | null;
  status: SubmitterStatus;
  decline_reason: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── 10. Document Views ─────────────────────────────
export interface DocumentView {
  id: string;
  submission_id: string;
  submitter_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  duration_sec: number | null;
  sections_viewed: string[];
  created_at: string;
}

// ─── 11. Document Field Locks ───────────────────────
export interface DocumentFieldLock {
  id: string;
  submission_id: string;
  field_path: string;
  locked_by: string | null;
  reason: string | null;
  locked_at: string;
}

// ─── 12. Document Messages ──────────────────────────
export interface DocumentMessage {
  id: string;
  submission_id: string;
  sender_type: 'internal' | 'submitter';
  sender_id: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

// ─── 13. Document Automations ───────────────────────
export interface DocumentAutomation {
  id: string;
  workspace_id: string;
  submission_id: string | null;
  event: string;
  action: string;
  config: Record<string, unknown>;
  status: AutomationStatus;
  next_run_at: string | null;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
}

// ─── 14. Document Audit Log ─────────────────────────
export interface DocumentAuditEntry {
  id: string;
  workspace_id: string;
  submission_id: string | null;
  actor_type: AuditActorType;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── 15. Document Checklist Items ───────────────────
export interface DocumentChecklistItem {
  id: string;
  template_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  accepted_types: string[];
  max_size_mb: number;
  created_at: string;
}

// ─── 16. Document Checklist Uploads ─────────────────
export interface DocumentChecklistUpload {
  id: string;
  submission_id: string;
  checklist_item_id: string;
  submitter_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  luhn_input: string | null;
  luhn_valid: boolean | null;
  status: UploadReviewStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ─── 17. Document Archive ───────────────────────────
export interface DocumentArchiveEntry {
  id: string;
  workspace_id: string;
  submission_id: string | null;
  direction: ArchiveDirection;
  title: string;
  description: string | null;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[];
  related_entity_id: string | null;
  related_entity_type: string | null;
  related_project_id: string | null;
  retention_years: number | null;
  retention_until: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}
