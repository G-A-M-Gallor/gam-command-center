// ===================================================
// Server-side Notification Helper
// ===================================================
// Creates notifications in dashboard_notifications from API routes.
// Supports user_id targeting, action_url for navigation, and channel.

import { createClient } from '@/lib/supabase/server';

interface NotifyUserOpts {
  userId?: string | null;
  type?: string;
  titleHe: string;
  titleEn: string;
  titleRu?: string;
  actionUrl?: string | null;
  channel?: string;
}

/**
 * Insert a notification for a specific user (or global if userId is null).
 * Fire-and-forget — callers should `.catch(() => {})`.
 */
export async function notifyUser(opts: NotifyUserOpts): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('dashboard_notifications').insert({
    notification_type: opts.type || 'status',
    title: opts.titleEn,
    title_he: opts.titleHe,
    title_ru: opts.titleRu || opts.titleEn,
    is_read: false,
    user_id: opts.userId || null,
    action_url: opts.actionUrl || null,
    channel: opts.channel || 'in-app',
  });
  if (error) { console.error('notifyUser:', error.message); return false; }
  return true;
}
