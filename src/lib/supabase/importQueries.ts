// ===================================================
// Import Engine — Supabase Queries (Browser Client)
// ===================================================

import { supabase } from '@/lib/supabaseClient';
import type { ImportLog, ImportLogStatus, ValidationError } from '@/lib/import/types';

// ─── Create Import Log ──────────────────────────────

export async function createImportLog(log: {
  file_name: string;
  file_size_bytes: number;
  entity_type: string;
  total_rows: number;
  column_mapping: Record<string, unknown>;
  created_by: string;
}): Promise<ImportLog | null> {
  const { data, error } = await supabase
    .from('import_logs')
    .insert([{
      ...log,
      status: 'pending' as ImportLogStatus,
      imported_rows: 0,
      failed_rows: 0,
      errors: [],
    }])
    .select()
    .single();
  if (error) { console.error('createImportLog:', error.message); return null; }
  return data as ImportLog;
}

// ─── Update Import Log ──────────────────────────────

export async function updateImportLog(
  id: string,
  patch: Partial<{
    status: ImportLogStatus;
    imported_rows: number;
    failed_rows: number;
    errors: ValidationError[];
    started_at: string;
    completed_at: string;
  }>,
): Promise<boolean> {
  const { error } = await supabase
    .from('import_logs')
    .update(patch)
    .eq('id', id);
  if (error) { console.error('updateImportLog:', error.message); return false; }
  return true;
}

// ─── Fetch Import Logs ──────────────────────────────

export async function fetchImportLogs(limit = 50): Promise<ImportLog[]> {
  const { data, error } = await supabase
    .from('import_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchImportLogs:', error.message); return []; }
  return (data ?? []) as ImportLog[];
}

// ─── Fetch Single Import Log ────────────────────────

export async function fetchImportLog(id: string): Promise<ImportLog | null> {
  const { data, error } = await supabase
    .from('import_logs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchImportLog:', error.message); return null; }
  return data as ImportLog;
}
