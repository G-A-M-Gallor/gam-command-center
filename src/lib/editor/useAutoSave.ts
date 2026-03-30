// ===================================================
// GAM Command Center — useAutoSave Hook
// Debounced autosave with retry + offline fallback
// + optimistic locking for concurrent edit detection
// ===================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { JSONContent } from '@tiptap/react';
import { supabase } from '@/lib/supabaseClient';
import { saveToOfflineQueue, flushOfflineQueue, getPendingCount } from './offlineQueue';

export type SaveState = 'idle' | 'saving' | 'saved' | 'retrying' | 'error' | 'offline' | 'conflict';

interface UseAutoSaveOptions {
  recordId: string;
  debounceMs?: number;
  maxRetries?: number;
}

/** Result from a Supabase persist attempt */
type PersistResult =
  | { outcome: 'success'; lastEditedAt: string }
  | { outcome: 'conflict' }
  | { outcome: 'error' };

interface UseAutoSaveReturn {
  saveState: SaveState;
  lastSavedAt: Date | undefined;
  retryCount: number;
  /** Trigger a save manually (e.g., Ctrl+S) */
  saveNow: (json: JSONContent) => void;
  /** Queue content for debounced save */
  queueSave: (json: JSONContent) => void;
  /** Resolve a conflict — fetch latest or force-save */
  resolveConflict: (strategy: 'reload' | 'force') => Promise<{ content?: unknown; title?: string }>;
}

/**
 * Persist a single document to Supabase with optimistic locking.
 *
 * When `lastKnownTimestamp` is provided, the UPDATE includes an equality
 * check on `last_edited_at`. If someone else saved in the meantime, the
 * row won't match and we get 0 rows back — that's a conflict.
 *
 * On FIRST save (lastKnownTimestamp is null), we skip the lock check.
 */
async function persistToSupabase(
  recordId: string,
  content: unknown,
  lastKnownTimestamp: string | null,
): Promise<PersistResult> {
  const now = new Date().toISOString();

  let query = supabase
    .from('vb_records')
    .update({ content, last_edited_at: now })
    .eq('id', recordId);

  // Optimistic lock: only update if nobody else has saved since our last save
  if (lastKnownTimestamp) {
    query = query.eq('last_edited_at', lastKnownTimestamp);
  }

  const { data, error } = await query.select('id, last_edited_at');

  if (error) {
    console.error('AutoSave: Supabase error', error.message, error.code);
    return { outcome: 'error' };
  }

  if (!data || data.length === 0) {
    // If we had an optimistic lock, 0 rows means conflict
    if (lastKnownTimestamp) {
      console.warn('AutoSave: conflict detected — document was modified in another tab');
      return { outcome: 'conflict' };
    }
    // Without a lock, 0 rows means RLS block or record not found
    console.error('AutoSave: 0 rows updated — RLS may be blocking. recordId:', recordId);
    return { outcome: 'error' };
  }

  return { outcome: 'success', lastEditedAt: data[0].last_edited_at };
}

export function useAutoSave({
  recordId,
  debounceMs = 1000,
  maxRetries = 3,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>(undefined);
  const [retryCount, setRetryCount] = useState(0);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);
  const latestContent = useRef<JSONContent | null>(null);

  // Optimistic locking — tracks the last_edited_at from the most recent successful save
  const lastKnownTimestamp = useRef<string | null>(null);
  const executeSaveRef = useRef<(json: JSONContent, attempt?: number) => Promise<void>>(async () => { /* no-op */ });

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  // Flush offline queue on mount + online event
  useEffect(() => {
    const doFlush = async () => {
      const count = await getPendingCount();
      if (count > 0) {
        const flushed = await flushOfflineQueue(
          (docId, content) => persistToSupabase(docId, content, null).then((r) => r.outcome === 'success'),
        );
        if (flushed > 0) {
          // offline saves flushed successfully
        }
      }
    };

    doFlush();
    window.addEventListener('online', doFlush);
    return () => window.removeEventListener('online', doFlush);
  }, []);

  /** Core save with retry logic + optimistic lock */
  const executeSave = useCallback(
    async (json: JSONContent, attempt = 0) => {
      if (!recordId) return;
      isSaving.current = true;

      if (attempt === 0) {
        setSaveState('saving');
        setRetryCount(0);
      } else {
        setSaveState('retrying');
        setRetryCount(attempt);
      }

      const result = await persistToSupabase(recordId, json, lastKnownTimestamp.current);

      if (result.outcome === 'success') {
        isSaving.current = false;
        lastKnownTimestamp.current = result.lastEditedAt;
        setSaveState('saved');
        setLastSavedAt(new Date());
        setRetryCount(0);
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
        return;
      }

      if (result.outcome === 'conflict') {
        // Conflict — do NOT retry. Surface to the user.
        isSaving.current = false;
        setSaveState('conflict');
        setRetryCount(0);
        return;
      }

      // outcome === 'error'
      // Check if we're offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        isSaving.current = false;
        await saveToOfflineQueue(recordId, json);
        setSaveState('offline');
        setRetryCount(0);
        return;
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        retryTimer.current = setTimeout(() => {
          executeSaveRef.current(json, attempt + 1);
        }, delay);
        return;
      }

      // All retries exhausted — save to offline queue
      isSaving.current = false;
      await saveToOfflineQueue(recordId, json);
      setSaveState('error');
      setRetryCount(0);
    },
    [recordId, maxRetries],
  );

  // Keep ref in sync for recursive calls
  executeSaveRef.current = executeSave;

  /** Queue a debounced save (called on every keystroke via onUpdate) */
  const queueSave = useCallback(
    (json: JSONContent) => {
      latestContent.current = json;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (latestContent.current) {
          executeSave(latestContent.current);
        }
      }, debounceMs);
    },
    [debounceMs, executeSave],
  );

  /** Immediate save (Ctrl+S) — cancel debounce and save now */
  const saveNow = useCallback(
    (json: JSONContent) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      latestContent.current = json;
      executeSave(json);
    },
    [executeSave],
  );

  /** Resolve a conflict — either reload the latest version or force-save */
  const resolveConflict = useCallback(
    async (strategy: 'reload' | 'force'): Promise<{ content?: unknown; title?: string }> => {
      if (strategy === 'reload') {
        // Fetch the latest version from the DB
        const { data, error } = await supabase
          .from('vb_records')
          .select('content, title, last_edited_at')
          .eq('id', recordId)
          .single();

        if (error || !data) {
          console.error('AutoSave: failed to fetch latest version', error?.message);
          return {};
        }

        // Update our timestamp to the latest
        lastKnownTimestamp.current = data.last_edited_at;
        setSaveState('idle');
        return { content: data.content, title: data.title };
      }

      // strategy === 'force': fetch latest timestamp then save with it
      const { data: latest } = await supabase
        .from('vb_records')
        .select('last_edited_at')
        .eq('id', recordId)
        .single();

      if (latest) {
        lastKnownTimestamp.current = latest.last_edited_at;
      } else {
        // If we can't fetch, clear the lock to allow an unlocked save
        lastKnownTimestamp.current = null;
      }

      // Re-save with the updated timestamp
      if (latestContent.current) {
        setSaveState('idle');
        await executeSave(latestContent.current);
      }

      return {};
    },
    [recordId, executeSave],
  );

  return { saveState, lastSavedAt, retryCount, saveNow, queueSave, resolveConflict };
}
