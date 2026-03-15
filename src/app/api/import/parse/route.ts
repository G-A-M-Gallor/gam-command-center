// ===================================================
// Import Engine — Parse API Route
// ===================================================
// POST /api/import/parse
// Accepts FormData with a file, parses it, and returns
// columns, sample rows, and suggested mappings.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { parseFile } from '@/lib/import/parser';
import { autoMapColumns } from '@/lib/import/mapper';
import { createClient } from '@supabase/supabase-js';
import type { GlobalField } from '@/lib/entities/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SAMPLE_ROWS = 10;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function POST(request: Request) {
  // Auth check
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a file in the "file" field.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of 5MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 },
      );
    }

    // Validate file type
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return NextResponse.json(
        { error: 'Unsupported file type. Accepted: .csv, .xlsx, .xls' },
        { status: 400 },
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse the file
    const parseResult = parseFile(buffer, file.name, file.type);

    // Fetch global fields for auto-mapping
    const supabase = getServiceClient();
    const { data: fieldsData } = await supabase
      .from('global_fields')
      .select('*')
      .order('sort_order', { ascending: true });
    const fields = (fieldsData ?? []) as GlobalField[];

    // Auto-map columns
    const suggestedMappings = autoMapColumns(parseResult.columns, fields);

    // Return parse results
    return NextResponse.json({
      columns: parseResult.columns,
      sampleRows: parseResult.rows.slice(0, MAX_SAMPLE_ROWS),
      suggestedMappings,
      totalRows: parseResult.totalRows,
      fileName: parseResult.fileName,
      fileSize: parseResult.fileSize,
      allRows: parseResult.rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
