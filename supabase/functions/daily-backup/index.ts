// supabase/functions/daily-backup/index.ts
// GAM Command Center — Daily Backup Edge Function v2

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SYNC_SECRET = Deno.env.get("CRON_SYNC_SECRET")!;
const _ALERT_WEBHOOK = Deno.env.get("BACKUP_ALERT_WEBHOOK");
const _RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const _ALERT_EMAIL = Deno.env.get("BACKUP_ALERT_EMAIL");
const ENCRYPTION_KEY = Deno.env.get("BACKUP_ENCRYPTION_KEY");
const RETENTION_DAYS = 30;
const _FUNCTION_DEADLINE_MS = 50_000;

const BACKUP_TABLES = [
  { name: "pm_apps" },
  { name: "pm_sprints" },
  {
    name: "pm_tasks",
    selectColumns: ["id", "notion_id", "title", "status", "priority", "created_at"],
    limit: 100
  },
  { name: "knowledge_items" },
];

interface BackupResult {
  status: "success" | "partial" | "failed";
  tables_backed_up: string[];
  tables_failed: string[];
  storage_paths: string[];
  row_counts: Record<string, number>;
  checksums: Record<string, string>;
  sizes_bytes: Record<string, number>;
  error_message?: string;
  duration_ms: number;
  triggered_by: string;
  encrypted: boolean;
  embedding_regen_required: boolean;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  console.log("[daily-backup] Starting backup process");

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check - require either valid cron secret OR valid bearer token
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');

    const validCronAuth = cronSecret === CRON_SYNC_SECRET;
    const validBearerAuth = authHeader?.startsWith('Bearer ');

    if (!validCronAuth && !validBearerAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized - valid cron secret or bearer token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const triggeredBy = body.triggered_by || 'manual';

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const result: BackupResult = {
      status: "success",
      tables_backed_up: [],
      tables_failed: [],
      storage_paths: [],
      row_counts: {},
      checksums: {},
      sizes_bytes: {},
      duration_ms: 0,
      triggered_by: triggeredBy,
      encrypted: !!ENCRYPTION_KEY,
      embedding_regen_required: false
    };

    const timestamp = new Date().toISOString().split('T')[0];

    // Backup each table
    for (const table of BACKUP_TABLES) {
      try {
        console.log(`[daily-backup] Processing table: ${table.name}`);

        // Check if table exists by trying to count rows (more reliable than information_schema)
        const { count, error: tableError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (tableError) {
          console.log(`[daily-backup] Table ${table.name} doesn't exist or is inaccessible:`, tableError.message);
          continue;
        }
        console.log(`[daily-backup] Table ${table.name} exists with ${count} rows, proceeding with backup`);

        // Check if this is a large table requiring chunked backup
        if (table.isSemanticMemory || (count && count > 500)) {
          console.log(`[daily-backup] Using chunked backup for large table ${table.name} (${count} rows)`);
          await backupLargeTable(supabase, table, timestamp, result);
          continue;
        }

        // Debug: Log the columns being selected
        if (table.selectColumns) {
          console.log(`[daily-backup] Using selectColumns for ${table.name}:`, table.selectColumns);
        } else if (table.excludeColumns) {
          console.log(`[daily-backup] Using excludeColumns for ${table.name}:`, table.excludeColumns);
        }

        // Get table data with pagination and safe JSON serialization
        const rowLimit = table.limit || 500; // Use table-specific limit or default 500
        let query = supabase.from(table.name).select('*').limit(rowLimit);

        if (table.selectColumns && table.selectColumns.length > 0) {
          // Use specific columns if defined
          query = supabase.from(table.name).select(table.selectColumns.join(',')).limit(rowLimit);
        } else if (table.excludeColumns && table.excludeColumns.length > 0) {
          // Otherwise use exclude logic
          const allColumns = await getTableColumns(supabase, table.name);
          const columnsToSelect = allColumns.filter(col => !table.excludeColumns!.includes(col));
          query = supabase.from(table.name).select(columnsToSelect.join(',')).limit(rowLimit);
        }

        const { data, error } = await query;

        console.log(`[daily-backup] Query result for ${table.name}: error=${!!error}, data length=${data?.length || 0}`);

        if (error) {
          console.error(`[daily-backup] Error fetching ${table.name}:`, error);
          result.tables_failed.push(table.name);
          continue;
        }

        if (!data || data.length === 0) {
          console.log(`[daily-backup] Table ${table.name} is empty or no data returned, skipping`);
          continue;
        }

        // Prepare backup data with safe serialization
        let backupData: string;
        try {
          // Remove potential circular references before serialization
          const safeData = JSON.parse(JSON.stringify(data));
          backupData = JSON.stringify(safeData);
        } catch (serializationError) {
          console.error(`[daily-backup] JSON serialization error for ${table.name}:`, serializationError);
          result.tables_failed.push(table.name);
          if (!result.error_message) {
            result.error_message = `JSON serialization failed for ${table.name}: ${serializationError.message}`;
          }
          continue;
        }

        // Encrypt if encryption key is available
        if (ENCRYPTION_KEY) {
          backupData = await encryptData(backupData, ENCRYPTION_KEY);
        }

        // Upload to storage
        const fileName = `${timestamp}/${table.name}.json${ENCRYPTION_KEY ? '.enc' : ''}`;
        const { data: _uploadData, error: uploadError } = await supabase.storage
          .from('backups')
          .upload(fileName, backupData, {
            contentType: 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          console.error(`[daily-backup] Upload error for ${table.name}:`, uploadError);
          result.tables_failed.push(table.name);
          continue;
        }

        // Record success
        result.tables_backed_up.push(table.name);
        result.storage_paths.push(fileName);
        result.row_counts[table.name] = data.length;
        result.sizes_bytes[table.name] = new Blob([backupData]).size;
        result.checksums[table.name] = await generateChecksum(backupData);

        if (table.isSemanticMemory) {
          result.embedding_regen_required = true;
        }

        console.log(`[daily-backup] Successfully backed up ${table.name}: ${data.length} rows`);

      } catch (error) {
        console.error(`[daily-backup] Error backing up ${table.name}:`, error);
        result.tables_failed.push(table.name);
        if (!result.error_message) {
          result.error_message = `Failed to backup ${table.name}: ${error.message}`;
        }
      }
    }

    // Cleanup old backups
    await cleanupOldBackups(supabase);

    // Determine final status
    if (result.tables_failed.length > 0) {
      result.status = result.tables_backed_up.length > 0 ? "partial" : "failed";
    }

    result.duration_ms = Date.now() - startTime;

    // Log to backup_logs table
    await supabase.from('backup_logs').insert(result);

    console.log(`[daily-backup] Completed: ${result.status}, ${result.tables_backed_up.length} succeeded, ${result.tables_failed.length} failed`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[daily-backup] Fatal error:", error);

    const errorResult: BackupResult = {
      status: "failed",
      tables_backed_up: [],
      tables_failed: [],
      storage_paths: [],
      row_counts: {},
      checksums: {},
      sizes_bytes: {},
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      triggered_by: "unknown",
      encrypted: false,
      embedding_regen_required: false
    };

    // Try to log the error
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await supabase.from('backup_logs').insert(errorResult);
    } catch (logError) {
      console.error("[daily-backup] Failed to log error:", logError);
    }

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getTableColumns(supabase: any, tableName: string): Promise<string[]> {
  const { data } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', tableName)
    .eq('table_schema', 'public');

  return data?.map((row: any) => row.column_name) || [];
}

async function encryptData(data: string, key: string): Promise<string> {
  // Simple encryption implementation
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // For production, use proper encryption like AES-GCM
  // This is a simplified version for demo purposes
  const keyBuffer = encoder.encode(key.slice(0, 32).padEnd(32, '0'));
  const encrypted = new Uint8Array(dataBuffer.length);

  for (let i = 0; i < dataBuffer.length; i++) {
    encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }

  return btoa(String.fromCharCode(...encrypted));
}

async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function backupLargeTable(supabase: any, table: any, timestamp: string, result: BackupResult): Promise<void> {
  const CHUNK_SIZE = table.limit || 200;
  let offset = 0;
  let totalRows = 0;
  let allChunks: any[] = [];

  console.log(`[daily-backup] Starting chunked backup for large table: ${table.name}`);

  while (true) {
    try {
      // Build query with offset pagination - use created_at for reliable ordering
      let query = supabase.from(table.name)
        .select(table.selectColumns ? table.selectColumns.join(',') : '*')
        .range(offset, offset + CHUNK_SIZE - 1)
        .order('created_at', { ascending: true });

      const { data: chunk, error } = await query;

      if (error) {
        console.error(`[daily-backup] Chunked query error for ${table.name} at offset ${offset}:`, error);
        throw error;
      }

      if (!chunk || chunk.length === 0) {
        console.log(`[daily-backup] No more data for ${table.name}, stopping at offset ${offset}`);
        break;
      }

      console.log(`[daily-backup] Fetched chunk for ${table.name}: ${chunk.length} rows (offset ${offset})`);

      allChunks.push(...chunk);
      totalRows += chunk.length;
      offset += CHUNK_SIZE;

      // Safety limit to prevent infinite loops
      if (offset > 10000) {
        console.log(`[daily-backup] Safety limit reached for ${table.name}, stopping at ${offset} rows`);
        break;
      }

      // If chunk is smaller than expected, we've reached the end
      if (chunk.length < CHUNK_SIZE) {
        console.log(`[daily-backup] Final chunk for ${table.name}: ${chunk.length} < ${CHUNK_SIZE}`);
        break;
      }

    } catch (chunkError) {
      console.error(`[daily-backup] Error processing chunk for ${table.name}:`, chunkError);
      throw chunkError;
    }
  }

  // Prepare backup data
  let backupData: string;
  try {
    const safeData = JSON.parse(JSON.stringify(allChunks));
    backupData = JSON.stringify(safeData);
  } catch (serializationError) {
    console.error(`[daily-backup] JSON serialization error for ${table.name}:`, serializationError);
    throw serializationError;
  }

  // Encrypt if encryption key is available
  if (ENCRYPTION_KEY) {
    backupData = await encryptData(backupData, ENCRYPTION_KEY);
  }

  // Upload to storage
  const fileName = `${timestamp}/${table.name}.json${ENCRYPTION_KEY ? '.enc' : ''}`;
  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(fileName, backupData, {
      contentType: 'application/octet-stream',
      upsert: true
    });

  if (uploadError) {
    console.error(`[daily-backup] Upload error for ${table.name}:`, uploadError);
    throw uploadError;
  }

  // Record success
  result.tables_backed_up.push(table.name);
  result.storage_paths.push(fileName);
  result.row_counts[table.name] = totalRows;
  result.sizes_bytes[table.name] = new Blob([backupData]).size;
  result.checksums[table.name] = await generateChecksum(backupData);

  if (table.isSemanticMemory) {
    result.embedding_regen_required = true;
  }

  console.log(`[daily-backup] Successfully backed up large table ${table.name}: ${totalRows} rows in ${Math.ceil(totalRows / CHUNK_SIZE)} chunks`);
}

async function cleanupOldBackups(supabase: any) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const { data: oldBackups } = await supabase.storage
      .from('backups')
      .list('', { limit: 1000 });

    if (oldBackups) {
      const filesToDelete = oldBackups
        .filter((file: any) => new Date(file.created_at) < cutoffDate)
        .map((file: any) => file.name);

      if (filesToDelete.length > 0) {
        await supabase.storage.from('backups').remove(filesToDelete);
        console.log(`[daily-backup] Cleaned up ${filesToDelete.length} old backup files`);
      }
    }
  } catch (error) {
    console.error("[daily-backup] Error cleaning up old backups:", error);
  }
}