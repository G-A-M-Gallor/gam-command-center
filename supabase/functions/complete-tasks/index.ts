// complete-tasks v1 — Rule 16 bulk executor
// POST { task_ids: string[], completed_by?: string, session?: string }
// 1. Single UPDATE in Supabase
// 2. Parallel PATCH to Notion API
// 3. Returns { updated, failed, details }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = "gam-cron-2026-sync-secret-x9k";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const cronSecret = req.headers.get("x-cron-secret");
  const auth = req.headers.get("authorization") ?? "";
  if (cronSecret !== CRON_SECRET && !auth.startsWith("Bearer "))
    return resp({ error: "Unauthorized" }, 401);

  let body: { task_ids?: string[]; completed_by?: string; session?: string };
  try { body = await req.json(); }
  catch { return resp({ error: "Invalid JSON" }, 400); }

  const { task_ids, completed_by = "claude-code", session = "" } = body;
  if (!Array.isArray(task_ids) || task_ids.length === 0)
    return resp({ error: "task_ids must be a non-empty array" }, 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get Notion key from Vault
  const { data: vault } = await supabase.rpc("get_secret", { secret_name: "notion_api_key_new" });
  const notionKey = vault?.[0]?.secret;
  if (!notionKey) return resp({ error: "notion_api_key_new not in vault" }, 500);

  console.log(`[complete-tasks] ${task_ids.length} tasks | by=${completed_by} | session=${session}`);

  // 1. Single Supabase UPDATE
  const { data: dbRows, error: dbErr } = await supabase
    .from("pm_tasks")
    .update({ status: "הושלם", completed_at: new Date().toISOString() })
    .in("notion_id", task_ids)
    .select("notion_id, title");

  if (dbErr) {
    console.error("[complete-tasks] DB error:", dbErr.message);
    return resp({ error: dbErr.message }, 500);
  }

  const updatedIds = (dbRows ?? []).map((r: { notion_id: string }) => r.notion_id);
  console.log(`[complete-tasks] DB updated ${updatedIds.length}/${task_ids.length}`);

  // 2. Parallel Notion PATCH
  const notionResults = await Promise.allSettled(
    updatedIds.map((notionId: string) =>
      fetch(`https://api.notion.com/v1/pages/${notionId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: { Status: { select: { name: "הושלם" } } },
        }),
      }).then(async (r) => ({
        notion_id: notionId,
        ok: r.ok,
        status: r.status,
        error: r.ok ? null : await r.text(),
      }))
    )
  );

  const details = notionResults.map((r) =>
    r.status === "fulfilled" ? r.value : { notion_id: "unknown", ok: false, error: String(r.reason) }
  );
  const notionUpdated = details.filter((d) => d.ok).length;
  const notionFailed = details.filter((d) => !d.ok).length;

  console.log(`[complete-tasks] Notion updated=${notionUpdated} failed=${notionFailed}`);

  return resp({
    updated: notionUpdated,
    failed: notionFailed,
    db_updated: updatedIds.length,
    completed_by,
    session,
    details,
  });
});

function resp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}