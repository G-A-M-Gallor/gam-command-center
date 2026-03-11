// ===================================================
// Hub — Aggregation Queries
// ===================================================
// Quick stats, activity feed, and BI chart data for the Command Hub.

import { supabase } from '@/lib/supabaseClient';

// ─── Types ──────────────────────────────────────────

export interface HubActivityItem {
  id: string;
  type: string;
  noteId: string;
  noteTitle: string;
  entityType: string | null;
  fieldKey: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface EntityTypeCount {
  entityType: string;
  count: number;
}

// ─── Quick Stats ────────────────────────────────────

export async function getActiveEntityCount(): Promise<number> {
  const { count, error } = await supabase
    .from('vb_records')
    .select('*', { count: 'exact', head: true })
    .not('entity_type', 'is', null)
    .eq('is_deleted', false);
  if (error) return 0;
  return count ?? 0;
}

export async function getRecentDocumentCount(days = 7): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { count, error } = await supabase
    .from('vb_records')
    .select('*', { count: 'exact', head: true })
    .gte('last_edited_at', since.toISOString())
    .eq('is_deleted', false);
  if (error) return 0;
  return count ?? 0;
}

export async function getOpenStoryCount(): Promise<number> {
  const { count, error } = await supabase
    .from('story_cards')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function getTodayAIConversationCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('ai_conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());
  if (error) return 0;
  return count ?? 0;
}

// ─── Activity Feed ──────────────────────────────────

export async function getRecentActivity(limit = 30): Promise<HubActivityItem[]> {
  const { data, error } = await supabase
    .from('note_activity_log')
    .select('id, note_id, activity_type, field_key, old_value, new_value, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Enrich with note titles
  const noteIds = [...new Set(data.map(a => a.note_id))];
  const { data: notes } = await supabase
    .from('vb_records')
    .select('id, title, entity_type')
    .in('id', noteIds);

  const noteMap = new Map(notes?.map(n => [n.id, n]) ?? []);

  return data.map(a => {
    const note = noteMap.get(a.note_id);
    return {
      id: a.id,
      type: a.activity_type,
      noteId: a.note_id,
      noteTitle: note?.title ?? 'Untitled',
      entityType: note?.entity_type ?? null,
      fieldKey: a.field_key ?? null,
      oldValue: typeof a.old_value === 'string' ? a.old_value : a.old_value ? JSON.stringify(a.old_value) : null,
      newValue: typeof a.new_value === 'string' ? a.new_value : a.new_value ? JSON.stringify(a.new_value) : null,
      timestamp: a.created_at,
    };
  });
}

// ─── BI Chart Data ──────────────────────────────────

export async function getStatusDistribution(): Promise<StatusCount[]> {
  const { data, error } = await supabase
    .from('vb_records')
    .select('status')
    .eq('is_deleted', false)
    .not('entity_type', 'is', null);

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    const s = row.status || 'unknown';
    counts[s] = (counts[s] || 0) + 1;
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export async function getActivityTimeline(days = 7): Promise<TimelinePoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('note_activity_log')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const dayMap: Record<string, number> = {};
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split('T')[0];
    dayMap[key] = 0;
  }

  for (const row of data) {
    const key = row.created_at.split('T')[0];
    if (key in dayMap) dayMap[key]++;
  }

  return Object.entries(dayMap).map(([date, count]) => ({ date, count }));
}

export async function getEntityTypeBreakdown(): Promise<EntityTypeCount[]> {
  const { data, error } = await supabase
    .from('vb_records')
    .select('entity_type')
    .eq('is_deleted', false)
    .not('entity_type', 'is', null);

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    const et = row.entity_type || 'unknown';
    counts[et] = (counts[et] || 0) + 1;
  }

  return Object.entries(counts).map(([entityType, count]) => ({ entityType, count }));
}
