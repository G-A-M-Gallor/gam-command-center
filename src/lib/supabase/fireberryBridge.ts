// ===================================================
// Fireberry Bridge — Map fb_records → vb_records entities
// ===================================================
// Maps existing 558K Fireberry/Origami records into the entity system.
// Read-only bridge — doesn't modify fb_records.

import { supabase } from '@/lib/supabaseClient';
import type { GlobalField, EntityType } from '@/lib/entities/types';

export interface FbRecord {
  id: string;
  entity_type: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface FbField {
  id: string;
  field_name: string;
  field_type: string;
  entity_type: string;
  label: string;
  options: unknown;
}

// ─── Fetch Fireberry Records ────────────────────────

export async function fetchFbRecords(
  entityType?: string,
  page = 0,
  pageSize = 50,
): Promise<{ data: FbRecord[]; count: number }> {
  let query = supabase
    .from('fb_records')
    .select('*', { count: 'exact' });

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const from = page * pageSize;
  query = query.range(from, from + pageSize - 1)
    .order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) { console.error('fetchFbRecords:', error.message); return { data: [], count: 0 }; }
  return { data: (data ?? []) as FbRecord[], count: count ?? 0 };
}

// ─── Fetch Fireberry Field Metadata ─────────────────

export async function fetchFbFields(entityType?: string): Promise<FbField[]> {
  let query = supabase
    .from('fb_fields')
    .select('*');

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchFbFields:', error.message); return []; }
  return (data ?? []) as FbField[];
}

// ─── Map Fireberry field → Global Field format ──────

const FB_TYPE_MAP: Record<string, string> = {
  'text': 'text',
  'string': 'text',
  'number': 'number',
  'integer': 'number',
  'date': 'date',
  'datetime': 'date',
  'boolean': 'checkbox',
  'email': 'email',
  'phone': 'phone',
  'url': 'url',
  'select': 'select',
  'multiselect': 'multi-select',
  'lookup': 'relation',
};

export function mapFbFieldToGlobal(fb: FbField): Partial<GlobalField> {
  return {
    meta_key: `fb_${fb.field_name}`,
    label: { he: fb.label || fb.field_name, en: fb.field_name, ru: fb.field_name },
    field_type: (FB_TYPE_MAP[fb.field_type] ?? 'text') as GlobalField['field_type'],
    is_composite: false,
    sub_fields: [],
    display_template: null,
    options: [],
    validation: {},
    default_value: null,
    icon: null,
    category: 'general',
  };
}

// ─── Get distinct Fireberry entity types ────────────

export async function fetchFbEntityTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('fb_fields')
    .select('entity_type')
    .limit(100);

  if (error || !data) return [];
  const unique = [...new Set(data.map(d => d.entity_type as string).filter(Boolean))];
  return unique;
}
