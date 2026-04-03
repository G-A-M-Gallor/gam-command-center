/**
 * Knowledge App — Supabase Queries
 * Handles all knowledge_items related operations
 */

import { supabase } from '@/lib/supabaseClient';

// ─── Types ──────────────────────────────────────────────────

export interface KnowledgeItem {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  content_hash: string;
  language: string;
  knowledge_type_id: string;
  department_ids: string[];
  stream_ids: string[];
  use_case_ids: string[];
  lens_ids: string[];
  tags: string[];
  status: 'draft' | 'classified' | 'reviewed' | 'approved' | 'locked_to_sot' | 'deprecated' | 'archived' | 'rejected';
  confidence: 'low' | 'medium' | 'high' | 'verified';
  priority: 'critical' | 'high' | 'normal' | 'low';
  regulatory_sensitivity: 'none' | 'low' | 'high' | 'critical';
  visibility: 'internal' | 'ai_internal' | 'ai_external' | 'published';
  review_due_date?: string;
  valid_until?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  needs_resolution: boolean;
  resolution_note?: string;
  owner_domain?: 'case_preparation' | 'sales' | 'recruitment' | 'finance' | 'systems' | 'management';
  source_type_id?: string;
  source_reference?: string;
  notion_page_id?: string;
  sot_level: number;
  source_chunk_ids: string[];
  embedding_status: 'pending' | 'synced' | 'stale';
  search_weight: number;
  version: number;
  previous_version_id?: string;
  change_reason?: string;
  created_by: string;
  created_by_type: 'human' | 'ai' | 'system';
  created_at: string;
  updated_by?: string;
  updated_at?: string;

  // Joined data
  knowledge_type?: KnowledgeType;
  departments?: KnowledgeDepartment[];
  streams?: KnowledgeStream[];
  use_cases?: KnowledgeUseCase[];
  lenses?: KnowledgeLens[];
  source_type?: KnowledgeSourceType;
}

export interface KnowledgeType {
  id: string;
  name: string;
  name_he?: string;
  description?: string;
  example?: string;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeDepartment {
  id: string;
  name: string;
  name_he?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeStream {
  id: string;
  name: string;
  name_he?: string;
  description?: string;
  origami_stream_name?: string;
  origami_object_type?: number;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeUseCase {
  id: string;
  code: string;
  name: string;
  name_he?: string;
  description?: string;
  parent_use_case_id?: string;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeLens {
  id: string;
  name: string;
  name_he?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeSourceType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface KnowledgeRelation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: 'parent' | 'related' | 'contradicts' | 'supports' | 'replaces';
  notes?: string;
  created_by?: string;
  created_at: string;
  target_item?: KnowledgeItem;
}

// ─── Search & Filter Types ──────────────────────────────

export interface KnowledgeSearchFilters {
  search?: string;
  type_id?: string;
  status?: string;
  department_id?: string;
  stream_id?: string;
  owner_domain?: string;
  confidence?: string;
  priority?: string;
  needs_resolution?: boolean;
}

export interface KnowledgeSearchOptions {
  filters?: KnowledgeSearchFilters;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'priority' | 'confidence';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ─── Dictionary Queries ─────────────────────────────────

export async function fetchKnowledgeTypes(): Promise<KnowledgeType[]> {
  const { data, error } = await supabase
    .from('knowledge_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch knowledge types: ${error.message}`);
  return data || [];
}

export async function fetchKnowledgeDepartments(): Promise<KnowledgeDepartment[]> {
  const { data, error } = await supabase
    .from('knowledge_departments')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
  return data || [];
}

export async function fetchKnowledgeStreams(): Promise<KnowledgeStream[]> {
  const { data, error } = await supabase
    .from('knowledge_streams')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch streams: ${error.message}`);
  return data || [];
}

export async function fetchKnowledgeUseCases(): Promise<KnowledgeUseCase[]> {
  const { data, error } = await supabase
    .from('knowledge_use_cases')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch use cases: ${error.message}`);
  return data || [];
}

export async function fetchKnowledgeLenses(): Promise<KnowledgeLens[]> {
  const { data, error } = await supabase
    .from('knowledge_lenses')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch lenses: ${error.message}`);
  return data || [];
}

export async function fetchKnowledgeSourceTypes(): Promise<KnowledgeSourceType[]> {
  const { data, error } = await supabase
    .from('knowledge_source_types')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch source types: ${error.message}`);
  return data || [];
}

// ─── Knowledge Items Queries ────────────────────────────

export async function searchKnowledgeItems(options: KnowledgeSearchOptions = {}): Promise<KnowledgeItem[]> {
  let query = supabase
    .from('knowledge_items')
    .select(`
      *,
      knowledge_type:knowledge_types!knowledge_items_knowledge_type_id_fkey(
        id, name, name_he, description, example
      ),
      source_type:knowledge_source_types!knowledge_items_source_type_id_fkey(
        id, name, description
      )
    `);

  // Apply filters
  if (options.filters) {
    const { search, type_id, status, owner_domain, confidence, priority, needs_resolution } = options.filters;

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (type_id) {
      query = query.eq('knowledge_type_id', type_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (owner_domain) {
      query = query.eq('owner_domain', owner_domain);
    }

    if (confidence) {
      query = query.eq('confidence', confidence);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (needs_resolution !== undefined) {
      query = query.eq('needs_resolution', needs_resolution);
    }

    // JSONB array filtering for departments and streams
    if (options.filters.department_id) {
      query = query.contains('department_ids', `["${options.filters.department_id}"]`);
    }

    if (options.filters.stream_id) {
      query = query.contains('stream_ids', `["${options.filters.stream_id}"]`);
    }
  }

  // Apply sorting
  const sortBy = options.sortBy || 'created_at';
  const sortDirection = options.sortDirection || 'desc';
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to search knowledge items: ${error.message}`);
  return data || [];
}

export async function fetchKnowledgeItem(id: string): Promise<KnowledgeItem | null> {
  const { data, error } = await supabase
    .from('knowledge_items')
    .select(`
      *,
      knowledge_type:knowledge_types!knowledge_items_knowledge_type_id_fkey(*),
      source_type:knowledge_source_types!knowledge_items_source_type_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch knowledge item: ${error.message}`);
  return data;
}

export async function fetchKnowledgeItemRelations(itemId: string): Promise<KnowledgeRelation[]> {
  const { data, error } = await supabase
    .from('knowledge_relations')
    .select(`
      *,
      target_item:knowledge_items!knowledge_relations_target_id_fkey(
        id, title, status, confidence, knowledge_type:knowledge_types(name, name_he)
      )
    `)
    .eq('source_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch knowledge item relations: ${error.message}`);
  return data || [];
}

// ─── Populate Related Data ─────────────────────────────

export async function populateKnowledgeItemRelations(item: KnowledgeItem): Promise<KnowledgeItem> {
  const [_types, departments, streams, useCases, lenses] = await Promise.all([
    fetchKnowledgeTypes(),
    fetchKnowledgeDepartments(),
    fetchKnowledgeStreams(),
    fetchKnowledgeUseCases(),
    fetchKnowledgeLenses()
  ]);

  return {
    ...item,
    departments: departments.filter(d => item.department_ids.includes(d.id)),
    streams: streams.filter(s => item.stream_ids.includes(s.id)),
    use_cases: useCases.filter(u => item.use_case_ids.includes(u.id)),
    lenses: lenses.filter(l => item.lens_ids.includes(l.id))
  };
}

// ─── Create Knowledge Item ─────────────────────────────

export async function createKnowledgeItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
  const { data, error } = await supabase
    .from('knowledge_items')
    .insert({
      ...item,
      content_hash: generateContentHash(item.content || ''),
      created_by: await getCurrentUserId(),
      created_by_type: 'human'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create knowledge item: ${error.message}`);
  return data;
}

// ─── Update Knowledge Item ─────────────────────────────

export async function updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
  const updateData = {
    ...updates,
    updated_by: await getCurrentUserId(),
    updated_at: new Date().toISOString()
  };

  if (updates.content) {
    updateData.content_hash = generateContentHash(updates.content);
    updateData.embedding_status = 'stale'; // Mark for re-embedding
  }

  const { data, error } = await supabase
    .from('knowledge_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update knowledge item: ${error.message}`);
  return data;
}

// ─── Delete Knowledge Item ─────────────────────────────

export async function deleteKnowledgeItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_items')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete knowledge item: ${error.message}`);
}

// ─── Helpers ───────────────────────────────────────────

function generateContentHash(content: string): string {
  // Simple hash function for content change detection
  let hash = 0;
  if (content.length === 0) return hash.toString();

  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

// ─── Stats ─────────────────────────────────────────────

export async function fetchKnowledgeStats() {
  const { data, error } = await supabase
    .from('knowledge_items')
    .select('status, confidence, needs_resolution, valid_until, review_due_date')
    .neq('status', 'archived');

  if (error) throw new Error(`Failed to fetch knowledge stats: ${error.message}`);

  const items = data || [];
  const now = new Date();

  return {
    total: items.length,
    byStatus: {
      draft: items.filter(i => i.status === 'draft').length,
      approved: items.filter(i => i.status === 'approved').length,
      reviewed: items.filter(i => i.status === 'reviewed').length
    },
    needsReview: items.filter(i => i.needs_resolution).length,
    expiringSoon: items.filter(i => {
      if (!i.valid_until) return false;
      const validUntil = new Date(i.valid_until);
      const daysUntilExpiry = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length
  };
}