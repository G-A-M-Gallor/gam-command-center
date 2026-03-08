// ===================================================
// Entity Platform — Supabase Queries
// ===================================================
// CRUD for global fields, entity types, notes, and relations.
// Cross-entity search: find a phone number across all entity types.

import { supabase } from '@/lib/supabaseClient';
import type {
  GlobalField, GlobalFieldInsert,
  EntityType, EntityTypeInsert,
  EntityConnection, EntityConnectionInsert,
  FieldGroup, FieldGroupInsert,
  NoteRecord, NoteRelation,
  NoteStakeholder, NoteStakeholderInsert,
  ViewFilter, ViewSort,
  ActivityLogEntry, ActivityType, NoteEvent,
} from '@/lib/entities/types';

// ─── Global Fields ──────────────────────────────────

export async function fetchGlobalFields(): Promise<GlobalField[]> {
  const { data, error } = await supabase
    .from('global_fields')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('fetchGlobalFields:', error.message); return []; }
  return (data ?? []) as GlobalField[];
}

export async function createGlobalField(field: GlobalFieldInsert): Promise<GlobalField | null> {
  const { data, error } = await supabase
    .from('global_fields')
    .insert([field])
    .select()
    .single();
  if (error) { console.error('createGlobalField:', error.message); return null; }
  return data as GlobalField;
}

export async function updateGlobalField(id: string, patch: Partial<GlobalFieldInsert>): Promise<boolean> {
  const { error } = await supabase
    .from('global_fields')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateGlobalField:', error.message); return false; }
  return true;
}

export async function deleteGlobalField(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('global_fields')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteGlobalField:', error.message); return false; }
  return true;
}

// ─── Field Groups ───────────────────────────────────

export async function fetchFieldGroups(): Promise<FieldGroup[]> {
  const { data, error } = await supabase
    .from('field_groups')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('fetchFieldGroups:', error.message); return []; }
  return (data ?? []) as FieldGroup[];
}

export async function createFieldGroup(group: FieldGroupInsert): Promise<FieldGroup | null> {
  const { data, error } = await supabase
    .from('field_groups')
    .insert([group])
    .select()
    .single();
  if (error) { console.error('createFieldGroup:', error.message); return null; }
  return data as FieldGroup;
}

export async function updateFieldGroup(id: string, patch: Partial<FieldGroupInsert>): Promise<boolean> {
  const { error } = await supabase
    .from('field_groups')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateFieldGroup:', error.message); return false; }
  return true;
}

// ─── Entity Types ───────────────────────────────────

export async function fetchEntityTypes(): Promise<EntityType[]> {
  const { data, error } = await supabase
    .from('entity_types')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('fetchEntityTypes:', error.message); return []; }
  return (data ?? []) as EntityType[];
}

export async function createEntityType(type: EntityTypeInsert): Promise<EntityType | null> {
  const { data, error } = await supabase
    .from('entity_types')
    .insert([type])
    .select()
    .single();
  if (error) { console.error('createEntityType:', error.message); return null; }
  return data as EntityType;
}

export async function updateEntityType(id: string, patch: Partial<EntityTypeInsert>): Promise<boolean> {
  const { error } = await supabase
    .from('entity_types')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateEntityType:', error.message); return false; }
  return true;
}

export async function deleteEntityType(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('entity_types')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteEntityType:', error.message); return false; }
  return true;
}

// ─── Entity Connections ─────────────────────────────

export async function fetchEntityConnections(): Promise<EntityConnection[]> {
  const { data, error } = await supabase
    .from('entity_connections')
    .select('*');
  if (error) { console.error('fetchEntityConnections:', error.message); return []; }
  return (data ?? []) as EntityConnection[];
}

export async function createEntityConnection(conn: EntityConnectionInsert): Promise<EntityConnection | null> {
  const { data, error } = await supabase
    .from('entity_connections')
    .insert([conn])
    .select()
    .single();
  if (error) { console.error('createEntityConnection:', error.message); return null; }
  return data as EntityConnection;
}

export async function deleteEntityConnection(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('entity_connections')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteEntityConnection:', error.message); return false; }
  return true;
}

// ─── Notes (vb_records) ─────────────────────────────

export async function fetchNotes(
  entityType?: string,
  filters: ViewFilter[] = [],
  sort?: ViewSort,
  page = 0,
  pageSize = 50,
): Promise<{ data: NoteRecord[]; count: number }> {
  let query = supabase
    .from('vb_records')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  // Apply meta filters
  for (const f of filters) {
    const path = `meta->>${f.field}`;
    switch (f.operator) {
      case 'eq': query = query.eq(path, f.value); break;
      case 'neq': query = query.neq(path, f.value); break;
      case 'contains': query = query.ilike(path, `%${f.value}%`); break;
      case 'gt': query = query.gt(path, f.value); break;
      case 'lt': query = query.lt(path, f.value); break;
      case 'is_empty': query = query.is(path, null); break;
      case 'is_not_empty': query = query.not(path, 'is', null); break;
    }
  }

  // Sort
  if (sort) {
    if (sort.field === 'title' || sort.field === 'created_at' || sort.field === 'last_edited_at') {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      // Sort by meta field — Supabase supports JSONB path ordering
      query = query.order(`meta->>${sort.field}` as string, { ascending: sort.direction === 'asc' });
    }
  } else {
    query = query.order('last_edited_at', { ascending: false });
  }

  // Pagination
  const from = page * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) { console.error('fetchNotes:', error.message); return { data: [], count: 0 }; }
  return { data: (data ?? []) as NoteRecord[], count: count ?? 0 };
}

export async function createNote(
  title: string,
  entityType?: string,
  meta: Record<string, unknown> = {},
): Promise<NoteRecord | null> {
  const { data, error } = await supabase
    .from('vb_records')
    .insert([{
      title,
      entity_type: entityType ?? null,
      meta,
      record_type: entityType ?? 'note',
      status: 'active',
      source: 'manual',
    }])
    .select()
    .single();
  if (error) { console.error('createNote:', error.message); return null; }
  return data as NoteRecord;
}

export async function updateNoteMeta(
  id: string,
  metaPatch: Record<string, unknown>,
  options?: { trackActivity?: boolean; actorId?: string | null },
): Promise<boolean> {
  // Merge meta — fetch current, merge, update
  const { data: current, error: fetchErr } = await supabase
    .from('vb_records')
    .select('meta, entity_type')
    .eq('id', id)
    .single();
  if (fetchErr || !current) return false;

  const oldMeta = (current.meta as Record<string, unknown>) ?? {};
  const merged = { ...oldMeta, ...metaPatch };
  const { error } = await supabase
    .from('vb_records')
    .update({ meta: merged, last_edited_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('updateNoteMeta:', error.message); return false; }

  // Auto-log field changes when track_activity is enabled
  if (options?.trackActivity) {
    for (const [key, newVal] of Object.entries(metaPatch)) {
      const oldVal = oldMeta[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const activityType: ActivityType = key === 'status' ? 'status_change' : 'field_change';
        await logActivity(id, activityType, {
          actorId: options.actorId ?? null,
          fieldKey: key,
          oldValue: oldVal != null ? String(oldVal) : null,
          newValue: newVal != null ? String(newVal) : null,
        });
      }
    }
  }

  return true;
}

export async function updateNoteEntityType(id: string, entityType: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('vb_records')
    .update({ entity_type: entityType })
    .eq('id', id);
  if (error) { console.error('updateNoteEntityType:', error.message); return false; }
  return true;
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vb_records')
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) { console.error('deleteNote:', error.message); return false; }
  return true;
}

// ─── Note Relations ─────────────────────────────────

export async function fetchNoteRelations(noteId: string): Promise<NoteRelation[]> {
  const { data, error } = await supabase
    .from('note_relations')
    .select('*')
    .or(`source_id.eq.${noteId},target_id.eq.${noteId}`);
  if (error) { console.error('fetchNoteRelations:', error.message); return []; }
  return (data ?? []) as NoteRelation[];
}

export async function createNoteRelation(
  sourceId: string,
  targetId: string,
  relationType = 'related',
): Promise<NoteRelation | null> {
  const { data, error } = await supabase
    .from('note_relations')
    .insert([{ source_id: sourceId, target_id: targetId, relation_type: relationType }])
    .select()
    .single();
  if (error) { console.error('createNoteRelation:', error.message); return null; }
  return data as NoteRelation;
}

export async function deleteNoteRelation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('note_relations')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteNoteRelation:', error.message); return false; }
  return true;
}

// ─── Cross-Entity Search ────────────────────────────
// Search a meta_key value across ALL entity types.
// e.g., search phone "050-1234567" → finds in clients, contacts, etc.

export async function searchByMetaKey(
  metaKey: string,
  value: string,
): Promise<NoteRecord[]> {
  const { data, error } = await supabase
    .from('vb_records')
    .select('*')
    .eq('is_deleted', false)
    .ilike(`meta->>${metaKey}`, `%${value}%`)
    .order('last_edited_at', { ascending: false })
    .limit(50);
  if (error) { console.error('searchByMetaKey:', error.message); return []; }
  return (data ?? []) as NoteRecord[];
}

// Full-text search across title + meta values
export async function searchNotes(
  query: string,
  entityType?: string,
): Promise<NoteRecord[]> {
  let q = supabase
    .from('vb_records')
    .select('*')
    .eq('is_deleted', false)
    .ilike('title', `%${query}%`);

  if (entityType) {
    q = q.eq('entity_type', entityType);
  }

  q = q.order('last_edited_at', { ascending: false }).limit(50);

  const { data, error } = await q;
  if (error) { console.error('searchNotes:', error.message); return []; }
  return (data ?? []) as NoteRecord[];
}

// ─── Bulk Operations ────────────────────────────────

export async function bulkUpdateMeta(
  ids: string[],
  metaPatch: Record<string, unknown>,
): Promise<boolean> {
  // Update meta for multiple notes at once
  for (const id of ids) {
    const ok = await updateNoteMeta(id, metaPatch);
    if (!ok) return false;
  }
  return true;
}

// ─── Field Usage Across Entities ────────────────────
// Check which entity types use a given global field

export async function getFieldUsage(metaKey: string): Promise<string[]> {
  const types = await fetchEntityTypes();
  return types
    .filter(t => t.field_refs.includes(metaKey))
    .map(t => t.slug);
}

// ─── Stakeholders ───────────────────────────────────
// Stakeholders are people connected to a note/deal with specific roles,
// access levels, and notification preferences.

export async function fetchStakeholders(noteId: string): Promise<NoteStakeholder[]> {
  const { data, error } = await supabase
    .from('note_stakeholders')
    .select('*')
    .eq('note_id', noteId)
    .order('is_primary', { ascending: false });

  if (error) { console.error('fetchStakeholders:', error.message); return []; }

  const stakeholders = (data ?? []) as NoteStakeholder[];

  // Enrich with contact info
  if (stakeholders.length > 0) {
    const contactIds = stakeholders.map(s => s.contact_note_id);
    const { data: contacts } = await supabase
      .from('vb_records')
      .select('id, title, meta')
      .in('id', contactIds);

    if (contacts) {
      const contactMap = new Map(contacts.map(c => [c.id, c]));
      for (const s of stakeholders) {
        const contact = contactMap.get(s.contact_note_id);
        if (contact) {
          s.contact_title = contact.title;
          s.contact_meta = (contact.meta as Record<string, unknown>) ?? {};
        }
      }
    }
  }

  return stakeholders;
}

export async function addStakeholder(insert: NoteStakeholderInsert): Promise<NoteStakeholder | null> {
  const { data, error } = await supabase
    .from('note_stakeholders')
    .insert([insert])
    .select()
    .single();
  if (error) { console.error('addStakeholder:', error.message); return null; }
  return data as NoteStakeholder;
}

export async function updateStakeholder(
  id: string,
  patch: Partial<NoteStakeholderInsert>,
): Promise<boolean> {
  const { error } = await supabase
    .from('note_stakeholders')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateStakeholder:', error.message); return false; }
  return true;
}

export async function removeStakeholder(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('note_stakeholders')
    .delete()
    .eq('id', id);
  if (error) { console.error('removeStakeholder:', error.message); return false; }
  return true;
}

// Get all notes where a contact is a stakeholder
export async function fetchStakeholderDeals(contactNoteId: string): Promise<{
  noteId: string;
  role: string;
  accessLevel: string;
}[]> {
  const { data, error } = await supabase
    .from('note_stakeholders')
    .select('note_id, role, access_level')
    .eq('contact_note_id', contactNoteId);
  if (error) { console.error('fetchStakeholderDeals:', error.message); return []; }
  return (data ?? []).map(d => ({
    noteId: d.note_id,
    role: d.role,
    accessLevel: d.access_level,
  }));
}

// ─── Activity Log ──────────────────────────────────

export async function fetchActivityLog(
  noteId: string,
  limit = 50,
): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('note_activity_log')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchActivityLog:', error.message); return []; }
  return (data ?? []) as ActivityLogEntry[];
}

export async function logActivity(
  noteId: string,
  activityType: ActivityType,
  opts: {
    actorId?: string | null;
    fieldKey?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    metadata?: Record<string, unknown> | null;
    noteText?: string | null;
  } = {},
): Promise<boolean> {
  const { error } = await supabase
    .from('note_activity_log')
    .insert([{
      note_id: noteId,
      actor_id: opts.actorId ?? null,
      activity_type: activityType,
      field_key: opts.fieldKey ?? null,
      old_value: opts.oldValue ?? null,
      new_value: opts.newValue ?? null,
      metadata: opts.metadata ?? null,
      note_text: opts.noteText ?? null,
    }]);
  if (error) { console.error('logActivity:', error.message); return false; }
  return true;
}

export async function addComment(
  noteId: string,
  text: string,
  actorId?: string | null,
): Promise<boolean> {
  return logActivity(noteId, 'comment', { actorId, noteText: text });
}

export async function addCallLogEntry(
  noteId: string,
  summary: string,
  metadata?: Record<string, unknown>,
  actorId?: string | null,
): Promise<boolean> {
  return logActivity(noteId, 'call_log', {
    actorId,
    noteText: summary,
    metadata,
  });
}

// ─── Active / Inactive Toggle ──────────────────────

export async function deactivateNote(id: string, actorId?: string | null): Promise<boolean> {
  // Save current status as last_active_status before deactivating
  const { data: current, error: fetchErr } = await supabase
    .from('vb_records')
    .select('meta, status')
    .eq('id', id)
    .single();
  if (fetchErr || !current) return false;

  const meta = (current.meta as Record<string, unknown>) ?? {};
  const { error } = await supabase
    .from('vb_records')
    .update({
      status: 'inactive',
      meta: { ...meta, last_active_status: current.status },
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) { console.error('deactivateNote:', error.message); return false; }

  await logActivity(id, 'deactivated', {
    actorId,
    oldValue: current.status,
    newValue: 'inactive',
  });
  return true;
}

export async function reactivateNote(id: string, actorId?: string | null): Promise<boolean> {
  // Restore last_active_status
  const { data: current, error: fetchErr } = await supabase
    .from('vb_records')
    .select('meta')
    .eq('id', id)
    .single();
  if (fetchErr || !current) return false;

  const meta = (current.meta as Record<string, unknown>) ?? {};
  const restoredStatus = (meta.last_active_status as string) || 'active';
  const { last_active_status: _, ...cleanMeta } = meta;

  const { error } = await supabase
    .from('vb_records')
    .update({
      status: restoredStatus,
      meta: cleanMeta,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) { console.error('reactivateNote:', error.message); return false; }

  await logActivity(id, 'reactivated', {
    actorId,
    oldValue: 'inactive',
    newValue: restoredStatus,
  });
  return true;
}
