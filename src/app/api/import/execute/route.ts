// ===================================================
// Import Engine — Execute API Route
// ===================================================
// POST /api/import/execute
// Validates and imports rows into vb_records.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { importExecuteSchema } from '@/lib/api/schemas';
import { createClient } from '@supabase/supabase-js';
import { buildImportRows, validateImport } from '@/lib/import/validator';
import { executeImport } from '@/lib/import/importer';
import type { GlobalField } from '@/lib/entities/types';
import type { ColumnMapping } from '@/lib/import/types';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function POST(request: Request) {
  // Auth check
  const { user, error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    // Parse and validate body
    const body = await request.json();
    const parsed = importExecuteSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(e => e.message).join('; ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const { entity_type, mappings, rows, file_name, file_size } = parsed.data;

    // Fetch global fields for validation
    const supabase = getServiceClient();
    const { data: fieldsData } = await supabase
      .from('global_fields')
      .select('*')
      .order('sort_order', { ascending: true });
    const fields = (fieldsData ?? []) as GlobalField[];

    // Convert mappings to the internal format
    const columnMappings: ColumnMapping[] = mappings.map(m => ({
      sourceIndex: m.sourceIndex,
      sourceHeader: m.sourceHeader,
      targetField: m.targetField,
      confidence: m.confidence ?? 1.0,
      autoDetected: false,
    }));

    // Build and validate import rows
    const importRows = buildImportRows(rows, columnMappings, fields);
    const { valid, invalid, errorRate } = validateImport(importRows);

    // Reject if error rate > 10%
    if (errorRate > 0.1) {
      return NextResponse.json({
        error: `Error rate too high: ${(errorRate * 100).toFixed(1)}% of rows have errors (maximum: 10%). Fix the data and try again.`,
        errorRate,
        totalRows: importRows.length,
        invalidRows: invalid.length,
        sampleErrors: invalid.slice(0, 10).flatMap(r => r.errors),
      }, { status: 422 });
    }

    // Create import log
    const { data: logData, error: logError } = await supabase
      .from('import_logs')
      .insert([{
        file_name,
        file_size_bytes: file_size,
        entity_type,
        total_rows: importRows.length,
        column_mapping: Object.fromEntries(columnMappings.map(m => [m.sourceHeader, m.targetField])),
        status: 'pending',
        created_by: user!.id,
      }])
      .select()
      .single();

    if (logError || !logData) {
      return NextResponse.json(
        { error: 'Failed to create import log' },
        { status: 500 },
      );
    }

    // Execute the import
    const result = await executeImport(
      {
        entityType: entity_type,
        mappings: columnMappings,
        skipHeader: true,
        maxRows: 5000,
        dryRun: false,
      },
      importRows,
      user!.id,
      logData.id,
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
