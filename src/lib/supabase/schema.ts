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
