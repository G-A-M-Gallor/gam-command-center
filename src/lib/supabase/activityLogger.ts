// ===================================================
// Server-side Activity Logger
// ===================================================
// Logs entity activities from API routes using the server Supabase client.
// Separate from entityQueries.ts which uses the browser client.

import { createClient } from '@/lib/supabase/server';
import type { ActivityType } from '@/lib/entities/types';

interface LogActivityOpts {
  actorId?: string | null;
  fieldKey?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
  noteText?: string | null;
}

/**
 * Log a single activity entry (server-side).
 * Fire-and-forget — callers should `.catch(() => {})`.
 */
export async function logActivityServer(
  noteId: string,
  activityType: ActivityType,
  opts: LogActivityOpts = {},
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('note_activity_log').insert([{
    note_id: noteId,
    activity_type: activityType,
    actor_id: opts.actorId ?? null,
    field_key: opts.fieldKey ?? null,
    old_value: opts.oldValue ?? null,
    new_value: opts.newValue ?? null,
    metadata: opts.metadata ?? null,
    note_text: opts.noteText ?? null,
  }]);
  if (error) { console.error('logActivityServer:', error.message); return false; }
  return true;
}

/**
 * Compare two meta objects and log each changed field.
 * Used by PATCH handler to auto-log field changes.
 */
export async function logMetaChanges(
  noteId: string,
  oldMeta: Record<string, unknown>,
  newMeta: Record<string, unknown>,
  actorId?: string | null,
): Promise<void> {
  const changedKeys = Object.keys(newMeta).filter(key => {
    if (key.startsWith('__')) return false; // skip internal keys like __icon
    return JSON.stringify(oldMeta[key]) !== JSON.stringify(newMeta[key]);
  });

  await Promise.all(changedKeys.map(key => {
    const activityType = key === 'status' ? 'status_change' as const : 'field_change' as const;
    return logActivityServer(noteId, activityType, {
      actorId,
      fieldKey: key,
      oldValue: oldMeta[key] != null ? String(oldMeta[key]) : null,
      newValue: newMeta[key] != null ? String(newMeta[key]) : null,
    });
  }));
}
