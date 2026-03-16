// ===================================================
// Document Engine — Supabase Queries
// ===================================================
// CRUD for document templates, submissions, submitters,
// blocks, audit log, and archive.
// Independent bounded context — separate from entity platform.

import { supabase } from '@/lib/supabaseClient';
import type {
  DocumentTemplate, DocumentBlock, DocumentSubmission,
  DocumentSubmitter, DocumentAuditEntry, DocumentChecklistItem,
  DocumentChecklistUpload, DocumentArchiveEntry, DocumentMedia,
  DocumentLayout, DocumentSignature, DocumentMessage,
  DocumentFieldLock, DocumentView, DocumentTemplateBlock,
  DocumentTemplateVersion, DocumentStatus,
} from './schema';

// ─── Templates ──────────────────────────────────────

export async function fetchDocTemplates(status?: string): Promise<DocumentTemplate[]> {
  let query = supabase
    .from('document_templates')
    .select('*')
    .order('updated_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) { console.error('fetchDocTemplates:', error.message); return []; }
  return (data ?? []) as DocumentTemplate[];
}

export async function fetchDocTemplate(id: string): Promise<DocumentTemplate | null> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchDocTemplate:', error.message); return null; }
  return data as DocumentTemplate;
}

export async function createDocTemplate(
  template: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'version'>,
): Promise<DocumentTemplate | null> {
  const { data, error } = await supabase
    .from('document_templates')
    .insert([template])
    .select()
    .single();
  if (error) { console.error('createDocTemplate:', error.message); return null; }
  return data as DocumentTemplate;
}

export async function updateDocTemplate(
  id: string,
  patch: Partial<DocumentTemplate>,
): Promise<boolean> {
  const { error } = await supabase
    .from('document_templates')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateDocTemplate:', error.message); return false; }
  return true;
}

// ─── Template Versions ──────────────────────────────

export async function fetchTemplateVersions(templateId: string): Promise<DocumentTemplateVersion[]> {
  const { data, error } = await supabase
    .from('document_template_versions')
    .select('*')
    .eq('template_id', templateId)
    .order('version', { ascending: false });
  if (error) { console.error('fetchTemplateVersions:', error.message); return []; }
  return (data ?? []) as DocumentTemplateVersion[];
}

export async function createTemplateVersion(
  version: Omit<DocumentTemplateVersion, 'id' | 'created_at'>,
): Promise<DocumentTemplateVersion | null> {
  const { data, error } = await supabase
    .from('document_template_versions')
    .insert([version])
    .select()
    .single();
  if (error) { console.error('createTemplateVersion:', error.message); return null; }
  return data as DocumentTemplateVersion;
}

// ─── Blocks (reusable clauses) ──────────────────────

export async function fetchDocBlocks(category?: string): Promise<DocumentBlock[]> {
  let query = supabase
    .from('document_blocks')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) { console.error('fetchDocBlocks:', error.message); return []; }
  return (data ?? []) as DocumentBlock[];
}

export async function createDocBlock(
  block: Omit<DocumentBlock, 'id' | 'created_at' | 'updated_at' | 'version'>,
): Promise<DocumentBlock | null> {
  const { data, error } = await supabase
    .from('document_blocks')
    .insert([block])
    .select()
    .single();
  if (error) { console.error('createDocBlock:', error.message); return null; }
  return data as DocumentBlock;
}

export async function updateDocBlock(
  id: string,
  patch: Partial<DocumentBlock>,
): Promise<boolean> {
  const { error } = await supabase
    .from('document_blocks')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateDocBlock:', error.message); return false; }
  return true;
}

// ─── Template-Block Junction ────────────────────────

export async function fetchTemplateBlocks(templateId: string): Promise<DocumentTemplateBlock[]> {
  const { data, error } = await supabase
    .from('document_template_blocks')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order');
  if (error) { console.error('fetchTemplateBlocks:', error.message); return []; }
  return (data ?? []) as DocumentTemplateBlock[];
}

export async function addBlockToTemplate(
  templateId: string,
  blockId: string,
  sortOrder: number,
  isSynced = true,
): Promise<DocumentTemplateBlock | null> {
  const { data, error } = await supabase
    .from('document_template_blocks')
    .insert([{ template_id: templateId, block_id: blockId, sort_order: sortOrder, is_synced: isSynced }])
    .select()
    .single();
  if (error) { console.error('addBlockToTemplate:', error.message); return null; }
  return data as DocumentTemplateBlock;
}

export async function removeBlockFromTemplate(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('document_template_blocks')
    .delete()
    .eq('id', id);
  if (error) { console.error('removeBlockFromTemplate:', error.message); return false; }
  return true;
}

// ─── Submissions ────────────────────────────────────

export async function fetchSubmissions(
  status?: DocumentStatus,
  page = 0,
  pageSize = 50,
): Promise<{ data: DocumentSubmission[]; count: number }> {
  let query = supabase
    .from('document_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  query = query.range(page * pageSize, page * pageSize + pageSize - 1);
  const { data, error, count } = await query;
  if (error) { console.error('fetchSubmissions:', error.message); return { data: [], count: 0 }; }
  return { data: (data ?? []) as DocumentSubmission[], count: count ?? 0 };
}

export async function fetchSubmission(id: string): Promise<DocumentSubmission | null> {
  const { data, error } = await supabase
    .from('document_submissions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchSubmission:', error.message); return null; }
  return data as DocumentSubmission;
}

export async function fetchSubmissionByToken(token: string): Promise<DocumentSubmission | null> {
  const { data, error } = await supabase
    .from('document_submissions')
    .select('*')
    .eq('access_token', token)
    .single();
  if (error) { console.error('fetchSubmissionByToken:', error.message); return null; }
  return data as DocumentSubmission;
}

export async function createSubmission(
  submission: Omit<DocumentSubmission, 'id' | 'created_at' | 'updated_at'>,
): Promise<DocumentSubmission | null> {
  const { data, error } = await supabase
    .from('document_submissions')
    .insert([submission])
    .select()
    .single();
  if (error) { console.error('createSubmission:', error.message); return null; }
  return data as DocumentSubmission;
}

export async function updateSubmissionStatus(
  id: string,
  status: DocumentStatus,
): Promise<boolean> {
  const updates: Record<string, unknown> = { status };
  if (status === 'sent') updates.sent_at = new Date().toISOString();
  if (status === 'signed') updates.signed_at = new Date().toISOString();
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

  const { error } = await supabase
    .from('document_submissions')
    .update(updates)
    .eq('id', id);
  if (error) { console.error('updateSubmissionStatus:', error.message); return false; }
  return true;
}

// ─── Submitters ─────────────────────────────────────

export async function fetchSubmitters(submissionId: string): Promise<DocumentSubmitter[]> {
  const { data, error } = await supabase
    .from('document_submitters')
    .select('*')
    .eq('submission_id', submissionId)
    .order('sort_order');
  if (error) { console.error('fetchSubmitters:', error.message); return []; }
  return (data ?? []) as DocumentSubmitter[];
}

export async function addSubmitter(
  submitter: Omit<DocumentSubmitter, 'id' | 'created_at' | 'updated_at'>,
): Promise<DocumentSubmitter | null> {
  const { data, error } = await supabase
    .from('document_submitters')
    .insert([submitter])
    .select()
    .single();
  if (error) { console.error('addSubmitter:', error.message); return null; }
  return data as DocumentSubmitter;
}

export async function updateSubmitter(
  id: string,
  updates: Partial<Pick<DocumentSubmitter, 'full_name' | 'business_name' | 'email' | 'phone' | 'role' | 'sort_order'>>,
): Promise<boolean> {
  const { error } = await supabase
    .from('document_submitters')
    .update(updates)
    .eq('id', id);
  if (error) { console.error('updateSubmitter:', error.message); return false; }
  return true;
}

export async function deleteSubmitter(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('document_submitters')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteSubmitter:', error.message); return false; }
  return true;
}

// ─── Media & Layouts ────────────────────────────────

export async function fetchDocMedia(): Promise<DocumentMedia[]> {
  const { data, error } = await supabase
    .from('document_media')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchDocMedia:', error.message); return []; }
  return (data ?? []) as DocumentMedia[];
}

export async function fetchDocLayouts(): Promise<DocumentLayout[]> {
  const { data, error } = await supabase
    .from('document_layouts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchDocLayouts:', error.message); return []; }
  return (data ?? []) as DocumentLayout[];
}

export async function fetchDocSignatures(): Promise<DocumentSignature[]> {
  const { data, error } = await supabase
    .from('document_signatures')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchDocSignatures:', error.message); return []; }
  return (data ?? []) as DocumentSignature[];
}

// ─── Document Views ─────────────────────────────────

export async function logDocumentView(
  view: Omit<DocumentView, 'id' | 'created_at'>,
): Promise<boolean> {
  const { error } = await supabase
    .from('document_views')
    .insert([view]);
  if (error) { console.error('logDocumentView:', error.message); return false; }
  return true;
}

export async function fetchDocumentViews(submissionId: string): Promise<DocumentView[]> {
  const { data, error } = await supabase
    .from('document_views')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchDocumentViews:', error.message); return []; }
  return (data ?? []) as DocumentView[];
}

// ─── Field Locks ────────────────────────────────────

export async function fetchFieldLocks(submissionId: string): Promise<DocumentFieldLock[]> {
  const { data, error } = await supabase
    .from('document_field_locks')
    .select('*')
    .eq('submission_id', submissionId);
  if (error) { console.error('fetchFieldLocks:', error.message); return []; }
  return (data ?? []) as DocumentFieldLock[];
}

export async function lockField(
  submissionId: string,
  fieldPath: string,
  lockedBy: string,
  reason?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('document_field_locks')
    .upsert([{ submission_id: submissionId, field_path: fieldPath, locked_by: lockedBy, reason }], {
      onConflict: 'submission_id,field_path',
    });
  if (error) { console.error('lockField:', error.message); return false; }
  return true;
}

export async function unlockField(submissionId: string, fieldPath: string): Promise<boolean> {
  const { error } = await supabase
    .from('document_field_locks')
    .delete()
    .eq('submission_id', submissionId)
    .eq('field_path', fieldPath);
  if (error) { console.error('unlockField:', error.message); return false; }
  return true;
}

// ─── Messages ───────────────────────────────────────

export async function fetchDocMessages(submissionId: string): Promise<DocumentMessage[]> {
  const { data, error } = await supabase
    .from('document_messages')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchDocMessages:', error.message); return []; }
  return (data ?? []) as DocumentMessage[];
}

export async function sendDocMessage(
  submissionId: string,
  senderType: 'internal' | 'submitter',
  body: string,
  senderId?: string,
): Promise<DocumentMessage | null> {
  const { data, error } = await supabase
    .from('document_messages')
    .insert([{ submission_id: submissionId, sender_type: senderType, sender_id: senderId, body }])
    .select()
    .single();
  if (error) { console.error('sendDocMessage:', error.message); return null; }
  return data as DocumentMessage;
}

// ─── Audit Log ──────────────────────────────────────

export async function fetchAuditLog(
  submissionId: string,
  limit = 100,
): Promise<DocumentAuditEntry[]> {
  const { data, error } = await supabase
    .from('document_audit_log')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchAuditLog:', error.message); return []; }
  return (data ?? []) as DocumentAuditEntry[];
}

export async function logAuditEvent(
  entry: Omit<DocumentAuditEntry, 'id' | 'created_at'>,
): Promise<boolean> {
  const { error } = await supabase
    .from('document_audit_log')
    .insert([entry]);
  if (error) { console.error('logAuditEvent:', error.message); return false; }
  return true;
}

// ─── Checklist ──────────────────────────────────────

export async function fetchChecklistItems(templateId: string): Promise<DocumentChecklistItem[]> {
  const { data, error } = await supabase
    .from('document_checklist_items')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order');
  if (error) { console.error('fetchChecklistItems:', error.message); return []; }
  return (data ?? []) as DocumentChecklistItem[];
}

export async function fetchChecklistUploads(submissionId: string): Promise<DocumentChecklistUpload[]> {
  const { data, error } = await supabase
    .from('document_checklist_uploads')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchChecklistUploads:', error.message); return []; }
  return (data ?? []) as DocumentChecklistUpload[];
}

// ─── Archive ────────────────────────────────────────

export async function fetchArchive(
  page = 0,
  pageSize = 50,
): Promise<{ data: DocumentArchiveEntry[]; count: number }> {
  const { data, error, count } = await supabase
    .from('document_archive')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (error) { console.error('fetchArchive:', error.message); return { data: [], count: 0 }; }
  return { data: (data ?? []) as DocumentArchiveEntry[], count: count ?? 0 };
}

export async function archiveDocument(
  entry: Omit<DocumentArchiveEntry, 'id' | 'created_at' | 'updated_at'>,
): Promise<DocumentArchiveEntry | null> {
  const { data, error } = await supabase
    .from('document_archive')
    .insert([entry])
    .select()
    .single();
  if (error) { console.error('archiveDocument:', error.message); return null; }
  return data as DocumentArchiveEntry;
}

// ─── Submission from Template ───────────────────────

export async function createSubmissionFromTemplate(
  template: DocumentTemplate,
  name?: string,
): Promise<DocumentSubmission | null> {
  const token = crypto.randomUUID();
  const submission: Omit<DocumentSubmission, 'id' | 'created_at' | 'updated_at'> = {
    workspace_id: template.workspace_id,
    template_id: template.id,
    template_ver: template.version,
    name: name || template.name,
    status: 'draft',
    content_snapshot: template.content,
    field_values: {},
    layout_id: template.layout_id,
    access_token: token,
    expires_at: null,
    pdf_path: null,
    pdf_hash: null,
    signed_pdf_path: null,
    signed_pdf_hash: null,
    origami_entity_id: null,
    origami_entity_type: null,
    sent_via: [],
    sent_at: null,
    signed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    created_by: null,
  };
  return createSubmission(submission);
}

export async function createBlankSubmission(
  name: string,
  workspaceId = 'default',
): Promise<DocumentSubmission | null> {
  const token = crypto.randomUUID();
  const submission: Omit<DocumentSubmission, 'id' | 'created_at' | 'updated_at'> = {
    workspace_id: workspaceId,
    template_id: null,
    template_ver: null,
    name,
    status: 'draft',
    content_snapshot: { type: 'doc', content: [{ type: 'paragraph' }] },
    field_values: {},
    layout_id: null,
    access_token: token,
    expires_at: null,
    pdf_path: null,
    pdf_hash: null,
    signed_pdf_path: null,
    signed_pdf_hash: null,
    origami_entity_id: null,
    origami_entity_type: null,
    sent_via: [],
    sent_at: null,
    signed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    created_by: null,
  };
  return createSubmission(submission);
}

// ─── Luhn Validation (Israeli ID) ───────────────────
// DOC-08: אלגוריתם לוהן — אימות ת.ז ישראלית

export function validateIsraeliId(id: string): boolean {
  const cleaned = id.replace(/\D/g, '').padStart(9, '0');
  if (cleaned.length !== 9) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleaned[i], 10) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}
