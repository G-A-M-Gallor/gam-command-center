// sync-origami — Supabase Edge Function
// Syncs Origami CRM entities to origami_mirror table
// Triggered via POST with { wave: 1 | 2 | 3 }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ORIGAMI_API_BASE = "https://gallorgam.origami.ms/api/";
const PAGE_SIZE = 200;

// ── Types ────────────────────────────────────────────────────────

interface EntityConfig {
  entity_name: string;
  entity_data_name: string;
  wave: number;
  is_active: boolean;
  last_modified_field: string | null;
  last_synced_at: string | null;
  last_record_count: number | null;
  notes: string | null;
}

interface SyncStats {
  entities_synced: number;
  rows_inserted: number;
  rows_updated: number;
  rows_unchanged: number;
  rows_archived: number;
  rg_upserted: number;
  api_calls_used: number;
  errors: Array<{ entity: string; error: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function origamiFetch(
  endpoint: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ data: unknown; ok: boolean; status: number }> {
  const res = await fetch(`${ORIGAMI_API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { data, ok: res.ok, status: res.status };
}

// Fetch all instances with pagination
async function fetchAllInstances(
  entityConfig: EntityConfig,
  apiKey: string,
  stats: SyncStats,
): Promise<Array<{ _id: string; data: Record<string, unknown>; groups: Record<string, unknown[]> }>> {
  const allInstances: Array<{
    _id: string;
    data: Record<string, unknown>;
    groups: Record<string, unknown[]>;
  }> = [];

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const body: Record<string, unknown> = {
      entity_data_name: entityConfig.entity_data_name,
      limit: [offset, PAGE_SIZE],
    };

    const endpoint = "get_instance_data";

    const res = await origamiFetch(endpoint, apiKey, body);
    stats.api_calls_used++;

    if (!res.ok || !res.data) {
      throw new Error(
        `Origami API error for ${entityConfig.entity_data_name}: ${res.status}`,
      );
    }

    const responseData = res.data as Record<string, unknown>;
    const instances = (responseData.instances ||
      responseData.data ||
      (Array.isArray(responseData) ? responseData : [])) as Array<
      Record<string, unknown>
    >;

    for (const instance of instances) {
      const id = String(instance._id || instance.id || "");
      if (!id) continue;

      // Separate repeating groups from flat data
      const flatData: Record<string, unknown> = {};
      const groups: Record<string, unknown[]> = {};

      for (const [key, value] of Object.entries(instance)) {
        if (key === "_id" || key === "id") continue;

        // Repeating groups come as arrays of objects with group_data_name pattern
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          groups[key] = value;
        } else {
          flatData[key] = value;
        }
      }

      allInstances.push({ _id: id, data: flatData, groups });
    }

    if (instances.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      offset += PAGE_SIZE;
    }
  }

  return allInstances;
}

// ── Main sync logic ──────────────────────────────────────────────

async function syncWave(wave: number): Promise<SyncStats> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const origamiKey = Deno.env.get("ORIGAMI_API_KEY")!;

  if (!supabaseUrl || !supabaseKey || !origamiKey) {
    throw new Error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ORIGAMI_API_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const stats: SyncStats = {
    entities_synced: 0,
    rows_inserted: 0,
    rows_updated: 0,
    rows_unchanged: 0,
    rows_archived: 0,
    rg_upserted: 0,
    api_calls_used: 0,
    errors: [],
  };

  // 1. Create sync log entry
  const syncStartedAt = new Date().toISOString();
  const { error: logError } = await supabase
    .from("origami_sync_log")
    .insert({ wave, status: "running", started_at: syncStartedAt });

  if (logError) {
    throw new Error(`Failed to create sync log: ${logError.message}`);
  }

  try {
    // 2. Get active entities for this wave
    const { data: entities, error: configError } = await supabase
      .from("origami_entity_config")
      .select("entity_name, entity_data_name, wave, is_active, last_modified_field, last_synced_at, last_record_count, notes")
      .eq("wave", wave)
      .eq("is_active", true);

    if (configError) throw new Error(`Config fetch error: ${configError.message}`);
    if (!entities || entities.length === 0) {
      await supabase
        .from("origami_sync_log")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          ...stats,
        })
        .eq("wave", wave)
        .eq("started_at", syncStartedAt);

      return stats;
    }

    // 3. Sync each entity
    for (const entity of entities) {
      try {
        const instances = await fetchAllInstances(entity, origamiKey, stats);

        if (instances.length === 0) {
          stats.entities_synced++;
          continue;
        }

        // Get existing hashes for change detection
        const { data: existing } = await supabase
          .from("origami_mirror")
          .select("instance_id, content_hash")
          .eq("entity_data_name", entity.entity_data_name);

        const existingMap = new Map(
          (existing || []).map((r: { instance_id: string; content_hash: string }) => [
            r.instance_id,
            { hash: r.content_hash },
          ]),
        );

        // Track which IDs we saw (for archiving removed instances)
        const seenIds = new Set<string>();

        for (const instance of instances) {
          seenIds.add(instance._id);

          const dataJson = JSON.stringify(instance.data);
          const hash = await sha256(dataJson);
          const existingRecord = existingMap.get(instance._id);

          if (existingRecord && existingRecord.hash === hash) {
            // No changes — skip
            stats.rows_unchanged++;
          } else {
            // Upsert to mirror
            const { data: upserted, error: upsertError } = await supabase
              .from("origami_mirror")
              .upsert(
                {
                  entity_data_name: entity.entity_data_name,
                  instance_id: instance._id,
                  data: instance.data,
                  content_hash: hash,
                  is_archived: false,
                  last_synced_at: new Date().toISOString(),
                },
                { onConflict: "entity_data_name,instance_id" },
              )
              .select("entity_data_name, instance_id")
              .single();

            if (upsertError) {
              stats.errors.push({
                entity: entity.entity_data_name,
                error: `Upsert failed for ${instance._id}: ${upsertError.message}`,
              });
              continue;
            }

            if (existingRecord) {
              stats.rows_updated++;
            } else {
              stats.rows_inserted++;
            }

            // Handle repeating groups
            if (Object.keys(instance.groups).length > 0) {
              // Delete old repeating group rows for this instance
              await supabase
                .from("origami_repeating_groups")
                .delete()
                .eq("entity_data_name", entity.entity_data_name)
                .eq("instance_id", instance._id);

              for (const [groupName, rows] of Object.entries(instance.groups)) {
                const rgRows = await Promise.all(
                  rows.map(async (row, index) => {
                    const rgJson = JSON.stringify(row);
                    const rgHash = await sha256(rgJson);
                    return {
                      entity_data_name: entity.entity_data_name,
                      instance_id: instance._id,
                      group_data_name: groupName,
                      group_index: index,
                      data: row,
                      content_hash: rgHash,
                      last_synced_at: new Date().toISOString(),
                    };
                  }),
                );

                if (rgRows.length > 0) {
                  const { error: rgError } = await supabase
                    .from("origami_repeating_groups")
                    .insert(rgRows);

                  if (rgError) {
                    stats.errors.push({
                      entity: entity.entity_data_name,
                      error: `RG insert failed for ${groupName}: ${rgError.message}`,
                    });
                  } else {
                    stats.rg_upserted += rgRows.length;
                  }
                }
              }
            }
          }
        }

        // Archive instances that no longer exist in Origami
        const toArchive = [...existingMap.keys()].filter(
          (id) => !seenIds.has(id),
        );
        if (toArchive.length > 0) {
          await supabase
            .from("origami_mirror")
            .update({ is_archived: true, last_synced_at: new Date().toISOString() })
            .eq("entity_data_name", entity.entity_data_name)
            .in("instance_id", toArchive);

          stats.rows_archived += toArchive.length;
        }

        stats.entities_synced++;
      } catch (err) {
        stats.errors.push({
          entity: entity.entity_data_name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 4. Update sync log
    const status =
      stats.errors.length === 0
        ? "success"
        : stats.entities_synced > 0
          ? "partial"
          : "error";

    await supabase
      .from("origami_sync_log")
      .update({
        finished_at: new Date().toISOString(),
        status,
        ...stats,
      })
      .eq("wave", wave)
      .eq("started_at", syncStartedAt);

    return stats;
  } catch (err) {
    // Fatal error — update log
    await supabase
      .from("origami_sync_log")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        ...stats,
        errors: [
          ...stats.errors,
          { entity: "GLOBAL", error: err instanceof Error ? err.message : String(err) },
        ],
      })
      .eq("wave", wave)
      .eq("started_at", syncStartedAt);

    throw err;
  }
}

// ── HTTP Handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const wave = Number(body.wave);

    if (![1, 2, 3].includes(wave)) {
      return new Response(
        JSON.stringify({ error: "Invalid wave parameter. Must be 1, 2, or 3." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const stats = await syncWave(wave);

    return new Response(
      JSON.stringify({
        success: true,
        wave,
        stats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
