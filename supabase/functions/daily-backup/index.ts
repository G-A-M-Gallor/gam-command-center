// supabase/functions/daily-backup/index.ts
// GAM Command Center — Daily Backup Edge Function v2

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALERT_WEBHOOK = Deno.env.get("BACKUP_ALERT_WEBHOOK");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ALERT_EMAIL = Deno.env.get("BACKUP_ALERT_EMAIL");
const ENCRYPTION_KEY = Deno.env.get("BACKUP_ENCRYPTION_KEY");
const RETENTION_DAYS = 30;
const FUNCTION_DEADLINE_MS = 50_000;

const BACKUP_TABLES = [
  { name: "pm_apps" },
  { name: "pm_sprints" },
  { name: "pm_tasks" },
  { name: "semantic_memory", excludeColumns: ["embedding"], isSemanticMemory: true },
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
    // Authentication check
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');

    const { data: secretData } = await createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      .rpc('get_secret', { secret_name: 'cron_sync_secret' });
    const expectedSecret = secretData?.[0]?.secret;

    if (cronSecret !== expectedSecret && !authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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

        // Check if table exists
        const { data: tableExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', table.name)
          .eq('table_schema', 'public')
          .limit(1);

        if (!tableExists || tableExists.length === 0) {
          console.log(`[daily-backup] Table ${table.name} does not exist, skipping`);
          continue;
        }

        // Get table data
        let query = supabase.from(table.name).select('*');

        if (table.excludeColumns && table.excludeColumns.length > 0) {
          const allColumns = await getTableColumns(supabase, table.name);
          const columnsToSelect = allColumns.filter(col => !table.excludeColumns!.includes(col));
          query = supabase.from(table.name).select(columnsToSelect.join(','));
        }

        const { data, error } = await query;

        if (error) {
          console.error(`[daily-backup] Error fetching ${table.name}:`, error);
          result.tables_failed.push(table.name);
          continue;
        }

        if (!data || data.length === 0) {
          console.log(`[daily-backup] Table ${table.name} is empty, skipping`);
          continue;
        }

        // Prepare backup data
        let backupData = JSON.stringify(data);

        // Encrypt if encryption key is available
        if (ENCRYPTION_KEY) {
          backupData = await encryptData(backupData, ENCRYPTION_KEY);
        }

        // Upload to storage
        const fileName = `${timestamp}/${table.name}.json${ENCRYPTION_KEY ? '.enc' : ''}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
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