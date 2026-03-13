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

// ─── Fetch All Messages (Page-level) ────────────────

export interface FetchAllCommOptions {
  search?: string;
  channel?: ChannelFilter;
  direction?: 'inbound' | 'outbound' | 'internal';
  isRead?: boolean;
  cursor?: string | null;
  limit?: number;
  sortField?: 'created_at' | 'sender_name' | 'channel';
  sortDir?: 'asc' | 'desc';
}

export async function fetchAllCommMessages(
  options: FetchAllCommOptions = {},
): Promise<{ data: CommMessage[]; nextCursor: string | null; total: number }> {
  const {
    search,
    channel,
    direction,
    isRead,
    cursor,
    limit = 50,
    sortField = 'created_at',
    sortDir = 'desc',
  } = options;

  // Count query (for unread badge / total)
  let countQuery = supabase
    .from('comm_messages')
    .select('*', { count: 'exact', head: true });

  // Data query
  let query = supabase
    .from('comm_messages')
    .select('*')
    .order(sortField, { ascending: sortDir === 'asc' })
    .limit(limit);

  // Apply filters to both queries
  if (channel && channel !== 'all') {
    query = query.eq('channel', channel);
    countQuery = countQuery.eq('channel', channel);
  }
  if (direction) {
    query = query.eq('direction', direction);
    countQuery = countQuery.eq('direction', direction);
  }
  if (typeof isRead === 'boolean') {
    query = query.eq('is_read', isRead);
    countQuery = countQuery.eq('is_read', isRead);
  }
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    const orFilter = `body.ilike.${term},sender_name.ilike.${term},entity_phone.ilike.${term}`;
    query = query.or(orFilter);
    countQuery = countQuery.or(orFilter);
  }

  // Cursor pagination — use created_at
  if (cursor) {
    if (sortDir === 'desc') {
      query = query.lt('created_at', cursor);
    } else {
      query = query.gt('created_at', cursor);
    }
  }

  const [{ data, error }, { count }] = await Promise.all([query, countQuery]);

  if (error) {
    console.error('fetchAllCommMessages:', error.message);
    return { data: [], nextCursor: null, total: 0 };
  }

  const messages = (data ?? []) as CommMessage[];
  const nextCursor = messages.length === limit
    ? messages[messages.length - 1].created_at ?? null
    : null;

  return { data: messages, nextCursor, total: count ?? 0 };
}

// ─── Notification Log ───────────────────────────────

export interface NotificationLogRow {
  id: number;
  user_id: string | null;
  comm_message_id: string | null;
  title: string;
  body: string | null;
  source_type: 'comm' | 'system' | 'manual';
  device_type: string | null;
  delivery_status: 'sent' | 'failed' | 'clicked';
  url: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export async function fetchNotificationLog(
  options: { cursor?: string | null; limit?: number; deviceType?: string | null } = {},
): Promise<{ data: NotificationLogRow[]; nextCursor: string | null }> {
  const { cursor, limit = 50, deviceType } = options;

  let query = supabase
    .from('notification_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (deviceType) {
    query = query.eq('device_type', deviceType);
  }
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchNotificationLog:', error.message); return { data: [], nextCursor: null }; }

  const rows = (data ?? []) as NotificationLogRow[];
  const nextCursor = rows.length === limit
    ? rows[rows.length - 1].created_at ?? null
    : null;

  return { data: rows, nextCursor };
}

// ─── Unread Count (Global) ──────────────────────────

export async function getGlobalUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('comm_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) { console.error('getGlobalUnreadCount:', error.message); return 0; }
  return count ?? 0;
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
