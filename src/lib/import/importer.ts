// ===================================================
// Import Engine — Batch Importer
// ===================================================
// Inserts validated rows into vb_records as entity notes.

import { _createClient } from '@supabase/supabase-js';
import type { ImportConfig, ImportRow, ImportResult, ValidationError } from './types';

const BATCH_SIZE = 100;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Execute the import: batch-insert valid rows into vb_records.
 * Updates import_logs with progress as it goes.
 */
export async function executeImport(
  config: ImportConfig,
  rows: ImportRow[],
  userId: string,
  importLogId: string,
): Promise<ImportResult> {
  const supabase = getServiceClient();
  const validRows = rows.filter(r => r.valid);
  const allErrors: ValidationError[] = rows.flatMap(r => r.errors);

  let importedCount = 0;
  let failedCount = rows.length - validRows.length; // start with pre-validation failures

  // Get workspace context from an existing record
  const { data: existing } = await supabase
    .from('vb_records')
    .select('workspace_id, entity_id')
    .limit(1)
    .maybeSingle();

  // Update import log: processing
  await supabase
    .from('import_logs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', importLogId);

  // Batch insert
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);

    const records = batch.map(row => {
      // Use the first mapped field value as title, or a generic title
      const title = findTitle(row, config) || `Import Row ${row.rowIndex + 1}`;

      return {
        title,
        entity_type: config.entityType,
        meta: row.data,
        record_type: config.entityType,
        status: 'active',
        source: 'import',
        workspace_id: existing?.workspace_id ?? null,
        entity_id: existing?.entity_id ?? null,
        created_by: userId,
      };
    });

    const { error } = await supabase
      .from('vb_records')
      .insert(records);

    if (error) {
      // Mark entire batch as failed
      failedCount += batch.length;
      allErrors.push({
        row: batch[0].rowIndex,
        column: '_batch',
        message: `Batch insert failed: ${error.message}`,
        value: '',
      });
    } else {
      importedCount += batch.length;
    }

    // Update progress on import log
    await supabase
      .from('import_logs')
      .update({
        imported_rows: importedCount,
        failed_rows: failedCount,
      })
      .eq('id', importLogId);
  }

  // Finalize import log
  const finalStatus = failedCount === rows.length ? 'failed' : 'completed';
  await supabase
    .from('import_logs')
    .update({
      status: finalStatus,
      imported_rows: importedCount,
      failed_rows: failedCount,
      errors: allErrors,
      completed_at: new Date().toISOString(),
    })
    .eq('id', importLogId);

  return {
    totalRows: rows.length,
    importedRows: importedCount,
    failedRows: failedCount,
    errors: allErrors,
    importLogId,
  };
}

/**
 * Find the best title for a record from its data.
 * Looks for common title-like fields.
 */
function findTitle(row: ImportRow, config: ImportConfig): string | null {
  // Try common title fields
  const titleKeys = ['name', 'title', 'full_name', 'company_name', 'business_name', 'display_name'];
  for (const key of titleKeys) {
    if (row.data[key] && typeof row.data[key] === 'string' && (row.data[key] as string).trim()) {
      return row.data[key] as string;
    }
  }

  // Use the first mapped field value
  if (config.mappings.length > 0) {
    const firstKey = config.mappings[0].targetField;
    const val = row.data[firstKey];
    if (val && typeof val === 'string' && val.trim()) {
      return val;
    }
  }

  return null;
}
