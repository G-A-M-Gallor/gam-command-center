// ===================================================
// GAM Command Center — useAutoSave Hook
// Debounced autosave with retry + offline fallback
// ===================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { JSONContent } from '@tiptap/react';
import { supabase } from '@/lib/supabaseClient';
import { saveToOfflineQueue, flushOfflineQueue, getPendingCount } from './offlineQueue';

export type SaveState = 'idle' | 'saving' | 'saved' | 'retrying' | 'error' | 'offline';

interface UseAutoSaveOptions {
  recordId: string;
  debounceMs?: number;
  maxRetries?: number;
}

interface UseAutoSaveReturn {
  saveState: SaveState;
  lastSavedAt: Date | undefined;
  retryCount: number;
  /** Trigger a save manually (e.g., Ctrl+S) */
  saveNow: (json: JSONContent) => void;
  /** Queue content for debounced save */
  queueSave: (json: JSONContent) => void;
}

/** Persist a single document to Supabase. Returns true on success. */
async function persistToSupabase(recordId: string, content: unknown): Promise<boolean> {
  const { data, error } = await supabase
    .from('vb_records')
    .update({ content, last_edited_at: new Date().toISOString() })
    .eq('id', recordId)
    .select('id');

  if (error) {
    console.error('AutoSave: Supabase error', error.message, error.code);
    return false;
  }
  if (!data || data.length === 0) {
    console.error('AutoSave: 0 rows updated — RLS may be blocking. recordId:', recordId);
    return false;
  }
  return true;
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
          (docId, content) => persistToSupabase(docId, content),
        );
        if (flushed > 0) {
          console.log(`AutoSave: flushed ${flushed} offline saves`);
        }
      }
    };

    doFlush();
    window.addEventListener('online', doFlush);
    return () => window.removeEventListener('online', doFlush);
  }, []);

  /** Core save with retry logic */
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

      const success = await persistToSupabase(recordId, json);

      if (success) {
        isSaving.current = false;
        setSaveState('saved');
        setLastSavedAt(new Date());
        setRetryCount(0);
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
        return;
      }

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
          executeSave(json, attempt + 1);
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

  return { saveState, lastSavedAt, retryCount, saveNow, queueSave };
}
