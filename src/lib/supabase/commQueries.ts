// ===================================================
// Communication — Supabase Queries
// ===================================================
// CRUD for comm_messages and comm_templates.
// Follows entityQueries.ts pattern.

import { supabase } from '@/lib/supabaseClient';
import type { CommMessage, CommTemplate, ChannelFilter } from '@/lib/wati/types';

// ─── Fetch Messages ─────────────────────────────────

export async function fetchCommMessages(
  entityId: string,
  filters?: { channel?: ChannelFilter },
  cursor?: string | null,
  limit = 50,
): Promise<{ data: CommMessage[]; nextCursor: string | null }> {
  let query = supabase
    .from('comm_messages')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.channel && filters.channel !== 'all') {
    query = query.eq('channel', filters.channel);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchCommMessages:', error.message); return { data: [], nextCursor: null }; }

  const messages = (data ?? []) as CommMessage[];
  const nextCursor = messages.length === limit
    ? messages[messages.length - 1].created_at ?? null
    : null;

  return { data: messages, nextCursor };
}

// ─── Fetch Messages by Phone ────────────────────────

export async function fetchCommMessagesByPhone(
  phone: string,
  filters?: { channel?: ChannelFilter },
  cursor?: string | null,
  limit = 50,
): Promise<{ data: CommMessage[]; nextCursor: string | null }> {
  let query = supabase
    .from('comm_messages')
    .select('*')
    .eq('entity_phone', phone)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.channel && filters.channel !== 'all') {
    query = query.eq('channel', filters.channel);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchCommMessagesByPhone:', error.message); return { data: [], nextCursor: null }; }

  const messages = (data ?? []) as CommMessage[];
  const nextCursor = messages.length === limit
    ? messages[messages.length - 1].created_at ?? null
    : null;

  return { data: messages, nextCursor };
}

// ─── Insert Message ─────────────────────────────────

export async function insertCommMessage(msg: Omit<CommMessage, 'id'>): Promise<CommMessage | null> {
  const { data, error } = await supabase
    .from('comm_messages')
    .insert([msg])
    .select()
    .single();
  if (error) { console.error('insertCommMessage:', error.message); return null; }
  return data as CommMessage;
}

// ─── Mark as Read ───────────────────────────────────

export async function markAsRead(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const { error } = await supabase
    .from('comm_messages')
    .update({ is_read: true })
    .in('id', ids);
  if (error) { console.error('markAsRead:', error.message); return false; }
  return true;
}

// ─── Templates ──────────────────────────────────────

export async function fetchCommTemplates(channel?: string): Promise<CommTemplate[]> {
  let query = supabase
    .from('comm_templates')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (channel) query = query.eq('channel', channel);

  const { data, error } = await query;
  if (error) { console.error('fetchCommTemplates:', error.message); return []; }
  return (data ?? []) as CommTemplate[];
}

// ─── Unread Count ───────────────────────────────────

export async function getUnreadCount(entityId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comm_messages')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('is_read', false);
  if (error) { console.error('getUnreadCount:', error.message); return 0; }
  return count ?? 0;
}
