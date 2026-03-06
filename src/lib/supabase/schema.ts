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

// ─── Story Cards ────────────────────────────────────
export interface SubStory {
  id: string;
  text: string;
  done: boolean;
}

export interface StoryCard {
  id: string;
  project_id: string;
  col: number;
  row: number;
  text: string;
  type: 'epic' | 'feature' | 'story';
  color: string | null;
  subs: SubStory[];
  sort_order: number;
  created_at: string;
}

// ─── AI Conversations ───────────────────────────────
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIConversation {
  id: string;
  project_id?: string | null;
  model: string;
  mode: string;
  messages: AIMessage[];
  title?: string | null;
  total_tokens_input: number;
  total_tokens_output: number;
  created_at: string;
  updated_at: string;
}

// ─── AI Usage (server-side budget) ──────────────────
export interface AIUsage {
  id: string;
  user_id: string;
  date: string;
  tokens_input: number;
  tokens_output: number;
  request_count: number;
  updated_at: string;
}

// ─── User Profiles ──────────────────────────────────
export type UserRole = 'internal' | 'client' | 'talent' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  workspace_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Functional Map Cells ───────────────────────────
export type FunctionalMapLevel = 'strategy' | 'management' | 'operations';
export type FunctionalMapFunc = 'sales' | 'delivery' | 'finance' | 'hr' | 'technology';

export interface FunctionalMapCell {
  id: string;
  level: FunctionalMapLevel;
  func: FunctionalMapFunc;
  owner: string;
  tools: string[];
  status: 'active' | 'partial' | 'planned';
  description: string;
  description_he: string;
  updated_at: string;
}

// ─── Plan Phases ────────────────────────────────────
export interface PlanPhase {
  phase: number;
  status: 'complete' | 'in-progress' | 'planned';
  notes: string;
  notes_he: string;
  updated_at: string;
}

// ─── Field Definitions ──────────────────────────────
export interface FieldDefinition {
  id: string;
  field_type: string;
  label: string;
  config: Record<string, unknown>;
  category: string;
  workspace_id: string | null;
  is_deleted: boolean;
  created_at: string;
  last_edited_at: string;
}
