// ===================================================
// KPI Event Tracking — Supabase Queries
// ===================================================
// Tracks events for KPI aggregation: status transitions,
// field changes, and custom triggers. Hooked into updateNoteMeta.

import { supabase } from '@/lib/supabaseClient';
import type { NoteEvent } from '@/lib/entities/types';

// ─── Track Events ──────────────────────────────────

export async function trackEvent(
  noteId: string,
  entityType: string,
  eventType: string,
  eventKey?: string | null,
  eventValue?: string | null,
  actorId?: string | null,
): Promise<boolean> {
  const { error } = await supabase
    .from('note_events')
    .insert([{
      note_id: noteId,
      entity_type: entityType,
      event_type: eventType,
      event_key: eventKey ?? null,
      event_value: eventValue ?? null,
      actor_id: actorId ?? null,
    }]);
  if (error) { console.error('trackEvent:', error.message); return false; }
  return true;
}

export async function trackFieldChange(
  noteId: string,
  entityType: string,
  fieldKey: string,
  newValue: string,
  actorId?: string | null,
): Promise<boolean> {
  return trackEvent(noteId, entityType, 'field_change', fieldKey, newValue, actorId);
}

// ─── Query Events ──────────────────────────────────

export async function getEventCounts(
  entityType: string,
  eventType: string,
  since?: string,
): Promise<{ key: string; count: number }[]> {
  let query = supabase
    .from('note_events')
    .select('event_key, event_value')
    .eq('entity_type', entityType)
    .eq('event_type', eventType);

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) { console.error('getEventCounts:', error.message); return []; }

  // Aggregate counts by event_key
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.event_key ?? 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, count]) => ({ key, count }));
}

export async function getStatusTransitions(
  entityType: string,
  since?: string,
): Promise<NoteEvent[]> {
  let query = supabase
    .from('note_events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('event_type', 'status_change')
    .order('created_at', { ascending: false });

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query.limit(200);
  if (error) { console.error('getStatusTransitions:', error.message); return []; }
  return (data ?? []) as NoteEvent[];
}

export async function getFieldChangeFrequency(
  entityType: string,
  fieldKey: string,
  since?: string,
): Promise<number> {
  let query = supabase
    .from('note_events')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', entityType)
    .eq('event_type', 'field_change')
    .eq('event_key', fieldKey);

  if (since) {
    query = query.gte('created_at', since);
  }

  const { count, error } = await query;
  if (error) { console.error('getFieldChangeFrequency:', error.message); return 0; }
  return count ?? 0;
}

// ─── Note-level Events ─────────────────────────────

export async function getNoteEvents(
  noteId: string,
  limit = 50,
): Promise<NoteEvent[]> {
  const { data, error } = await supabase
    .from('note_events')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('getNoteEvents:', error.message); return []; }
  return (data ?? []) as NoteEvent[];
}
