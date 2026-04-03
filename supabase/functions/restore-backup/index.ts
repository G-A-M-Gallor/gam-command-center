// supabase/functions/restore-backup/index.ts
// GAM Command Center — Restore Backup Edge Function v2

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENCRYPTION_KEY = Deno.env.get("BACKUP_ENCRYPTION_KEY");

interface RestoreRequest {
  date: string;
  tables: string[];
  dry_run?: boolean;
  target_suffix?: string;
}

interface RestoreResult {
  status: "success" | "partial" | "failed";
  tables_restored: string[];
  tables_failed: string[];
  row_counts: Record<string, number>;
  dry_run: boolean;
  error_message?: string;
  duration_ms: number;
  embedding_regen_required: boolean;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  console.log("[restore-backup] Starting restore process");

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json() as RestoreRequest;
    const { date, tables, dry_run = false, target_suffix = "" } = body;

    if (!date || !tables || !Array.isArray(tables) || tables.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request: date and tables array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const result: RestoreResult = {
      status: "success",
      tables_restored: [],
      tables_failed: [],
      row_counts: {},
      dry_run,
      duration_ms: 0,
      embedding_regen_required: false
    };

    console.log(`[restore-backup] ${dry_run ? 'DRY RUN' : 'LIVE'} restore for ${date}, tables: ${tables.join(', ')}`);

    // Process each table
    for (const tableName of tables) {
      try {
        console.log(`[restore-backup] Processing table: ${tableName}`);

        // Check for backup file
        const fileName = `${date}/${tableName}.json`;
        const encFileName = `${date}/${tableName}.json.enc`;

        let { data: fileData, error: fetchError } = await supabase.storage
          .from('backups')
          .download(fileName);

        let isEncrypted = false;

        if (fetchError) {
          // Try encrypted file
          const { data: encData, error: encError } = await supabase.storage
            .from('backups')
            .download(encFileName);

          if (encError) {
            console.error(`[restore-backup] Backup file not found for ${tableName} on ${date}`);
            result.tables_failed.push(tableName);
            continue;
          }

          fileData = encData;
          isEncrypted = true;
        }

        if (!fileData) {
          console.error(`[restore-backup] No data in backup file for ${tableName}`);
          result.tables_failed.push(tableName);
          continue;
        }

        // Read file content
        let backupContent = await fileData.text();

        // Decrypt if necessary
        if (isEncrypted && ENCRYPTION_KEY) {
          backupContent = await decryptData(backupContent, ENCRYPTION_KEY);
        } else if (isEncrypted && !ENCRYPTION_KEY) {
          console.error(`[restore-backup] Encrypted backup found but no encryption key available for ${tableName}`);
          result.tables_failed.push(tableName);
          continue;
        }

        // Parse backup data
        let backupData: any[];
        try {
          backupData = JSON.parse(backupContent);
        } catch (parseError) {
          console.error(`[restore-backup] Failed to parse backup data for ${tableName}:`, parseError);
          result.tables_failed.push(tableName);
          continue;
        }

        if (!Array.isArray(backupData)) {
          console.error(`[restore-backup] Invalid backup data format for ${tableName}`);
          result.tables_failed.push(tableName);
          continue;
        }

        result.row_counts[tableName] = backupData.length;

        if (dry_run) {
          console.log(`[restore-backup] DRY RUN: Would restore ${backupData.length} rows to ${tableName}${target_suffix}`);
          result.tables_restored.push(tableName);
          continue;
        }

        // Determine target table
        const targetTable = tableName + target_suffix;

        // Check if target table exists
        const { data: tableExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', targetTable)
          .eq('table_schema', 'public')
          .limit(1);

        if (!tableExists || tableExists.length === 0) {
          console.error(`[restore-backup] Target table ${targetTable} does not exist`);
          result.tables_failed.push(tableName);
          continue;
        }

        // Clear target table if no suffix (direct restore)
        if (!target_suffix) {
          const { error: deleteError } = await supabase
            .from(targetTable)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

          if (deleteError) {
            console.error(`[restore-backup] Failed to clear ${targetTable}:`, deleteError);
            result.tables_failed.push(tableName);
            continue;
          }
        }

        // Insert backup data in batches
        const batchSize = 1000;
        let insertedRows = 0;

        for (let i = 0; i < backupData.length; i += batchSize) {
          const batch = backupData.slice(i, i + batchSize);

          const { error: insertError } = await supabase
            .from(targetTable)
            .insert(batch);

          if (insertError) {
            console.error(`[restore-backup] Failed to insert batch for ${tableName}:`, insertError);
            result.tables_failed.push(tableName);
            break;
          }

          insertedRows += batch.length;
        }

        if (insertedRows === backupData.length) {
          console.log(`[restore-backup] Successfully restored ${insertedRows} rows to ${targetTable}`);
          result.tables_restored.push(tableName);

          // Mark embedding regeneration required for semantic_memory
          if (tableName === 'semantic_memory') {
            result.embedding_regen_required = true;
          }
        }

      } catch (error) {
        console.error(`[restore-backup] Error restoring ${tableName}:`, error);
        result.tables_failed.push(tableName);
        if (!result.error_message) {
          result.error_message = `Failed to restore ${tableName}: ${error.message}`;
        }
      }
    }

    // Determine final status
    if (result.tables_failed.length > 0) {
      result.status = result.tables_restored.length > 0 ? "partial" : "failed";
    }

    result.duration_ms = Date.now() - startTime;

    // Log restore operation (if not dry run)
    if (!dry_run) {
      await supabase.from('backup_logs').insert({
        ...result,
        status: result.status === 'success' ? 'restored' : result.status,
        tables_backed_up: result.tables_restored,
        tables_failed: result.tables_failed,
        storage_paths: tables.map(t => `${date}/${t}.json`),
        checksums: {},
        sizes_bytes: {},
        triggered_by: 'manual_restore',
        encrypted: !!ENCRYPTION_KEY,
        embedding_regen_required: result.embedding_regen_required
      });
    }

    console.log(`[restore-backup] Completed: ${result.status}, ${result.tables_restored.length} succeeded, ${result.tables_failed.length} failed`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[restore-backup] Fatal error:", error);

    const errorResult: RestoreResult = {
      status: "failed",
      tables_restored: [],
      tables_failed: [],
      row_counts: {},
      dry_run: false,
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      embedding_regen_required: false
    };

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function decryptData(encryptedData: string, key: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key.slice(0, 32).padEnd(32, '0'));

    // Decode base64
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Decrypt (reverse XOR)
    const decrypted = new Uint8Array(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}