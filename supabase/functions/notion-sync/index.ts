import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTION_SECRET = Deno.env.get("NOTION_WEBHOOK_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── helpers ──────────────────────────────────────────────────────
const text   = (p: any) => p?.rich_text?.map((r:any) => r.plain_text).join("") ?? null;
const title  = (p: any) => p?.title?.map((r:any) => r.plain_text).join("") ?? null;
const sel    = (p: any) => p?.select?.name ?? null;
const msel   = (p: any) => p?.multi_select?.map((s:any) => s.name) ?? [];
const num    = (p: any) => p?.number ?? null;
const bool   = (p: any) => p?.checkbox ?? false;
const date   = (p: any) => p?.date?.start ? p.date.start.split("T")[0] : null;
const rel    = (p: any) => p?.relation?.[0]?.id ? `https://www.notion.so/${p.relation[0].id.replace(/-/g,"")}` : null;
const rels   = (p: any) => p?.relation?.map((r:any) => `https://www.notion.so/${r.id.replace(/-/g,"")}`) ?? [];
const url    = (p: any) => p?.url ?? null;
const autoid = (p: any) => p?.unique_id?.number ?? null;

async function log(table: string, notion_url: string, action: string, payload: any) {
  await supabase.from("sync_log").insert({ table_name: table, notion_url, action, payload });
}

// ── GOALS ────────────────────────────────────────────────────────
async function syncGoal(page: any) {
  const p = page.properties;
  const row = {
    notion_url:   `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at:   page.created_time,
    name:         title(p["שם Goal"]),
    status:       sel(p["סטטוס"]),
    priority:     sel(p["עדיפות"]),
    progress_pct: num(p["התקדמות %"]),
    kpi:          text(p["KPI להצלחה"]),
    why:          text(p["למה עושים את זה?"]),
    what_solves:  text(p["מה זה פותר?"]),
    what_saves:   text(p["מה זה חוסך?"]),
    learned:      text(p["מה למדנו?"]),
    target_date:  date(p["יעד סיום"]),
    entered_date: date(p["מתי הכנסנו"]),
    synced_at:    new Date().toISOString(),
  };
  const { error } = await supabase.from("goals").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("goals", row.notion_url, "upsert", row);
}

// ── PORTFOLIOS ───────────────────────────────────────────────────
async function syncPortfolio(page: any) {
  const p = page.properties;
  const row = {
    notion_url:   `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at:   page.created_time,
    name:         title(p["שם Portfolio"]),
    status:       sel(p["סטטוס"]),
    priority:     sel(p["עדיפות"]),
    progress_pct: num(p["התקדמות %"]),
    description:  text(p["תיאור"]),
    why:          text(p["למה עושים?"]),
    what_solves:  text(p["מה פותר?"]),
    what_saves:   text(p["מה חוסך?"]),
    goal_url:     rel(p["Goal"]),
    synced_at:    new Date().toISOString(),
  };
  const { error } = await supabase.from("portfolios").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("portfolios", row.notion_url, "upsert", row);
}

// ── PROJECTS ─────────────────────────────────────────────────────
async function syncProject(page: any) {
  const p = page.properties;
  const row = {
    notion_url:    `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at:    page.created_time,
    name:          title(p["שם פרויקט"]),
    status:        sel(p["סטטוס"]),
    priority:      sel(p["עדיפות"]),
    progress_pct:  num(p["התקדמות %"]),
    owner:         text(p["בעל הפרויקט"]),
    kpi:           text(p["KPI"]),
    why:           text(p["למה עושים?"]),
    what_solves:   text(p["מה פותר?"]),
    what_saves:    text(p["מה חוסך?"]),
    what_not:      text(p["מה לא עושים?"]),
    learned:       text(p["מה למדנו?"]),
    dependencies:  text(p["תלויות"]),
    start_date:    date(p["תאריך התחלה"]),
    target_date:   date(p["יעד סיום"]),
    portfolio_url: rel(p["Portfolio"]),
    synced_at:     new Date().toISOString(),
  };
  const { error } = await supabase.from("projects").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("projects", row.notion_url, "upsert", row);
}

// ── SPRINTS ──────────────────────────────────────────────────────
async function syncSprint(page: any) {
  const p = page.properties;
  const row = {
    notion_url:   `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at:   page.created_time,
    name:         title(p["שם ספרינט"]),
    status:       sel(p["סטטוס"]),
    goal:         text(p["מטרת הספרינט"]),
    progress_pct: num(p["התקדמות %"]),
    completed:    text(p["מה הושלם?"]),
    deferred:     text(p["מה נדחה?"]),
    start_date:   date(p["תאריך התחלה"]),
    end_date:     date(p["תאריך סיום"]),
    project_url:  rel(p["פרויקט"]),
    synced_at:    new Date().toISOString(),
  };
  const { error } = await supabase.from("sprints").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("sprints", row.notion_url, "upsert", row);
}

// ── TASKS ────────────────────────────────────────────────────────
async function syncTask(page: any) {
  const p = page.properties;
  const row = {
    notion_url:          `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at:          page.created_time,
    name:                title(p["Task"]),
    status:              sel(p["Status"]),
    priority:            sel(p["Priority"]),
    owner:               sel(p["Owner"]),
    layer:               sel(p["Layer"]),
    type:                sel(p["Type"]),
    effort:              sel(p["Effort"]),
    estimate_pts:        sel(p["Estimate (pts)"]),
    conflict_zone:       sel(p["Conflict Zone"]),
    parallel_safe:       bool(p["Parallel Safe"]),
    files_areas:         msel(p["Files / Areas"]),
    delivers:            text(p["Delivers"]),
    depends_on:          text(p["Depends On"]),
    acceptance_criteria: text(p["Acceptance Criteria"]),
    notes:               text(p["Notes"]),
    summary:             text(p["סיכום שורה"]),
    code_name:           text(p["שם קוד"]),
    git_branch:          text(p["Git Branch"]),
    spec_link:           url(p["Spec Link"]),
    date_started:        date(p["Date Started"]),
    date_done:           date(p["Date Done"]),
    sprint_url:          rel(p["Sprint (Roadmap)"]),
    sprint_old_url:      rel(p["Sprint"]),
    goal_url:            rel(p["Goal"]),
    epic_url:            rel(p["Epic"]),
    blocks_urls:         rels(p["Blocks"]),
    synced_at:           new Date().toISOString(),
  };
  const { error } = await supabase.from("tasks").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("tasks", row.notion_url, "upsert", row);
}

// ── SUB-TASKS ────────────────────────────────────────────────────
async function syncSubTask(page: any) {
  const p = page.properties;
  const row = {
    notion_url: `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at: page.created_time,
    name:       title(p["שם"]),
    status:     sel(p["סטטוס"]),
    owner:      sel(p["בעל המשימה"]),
    notes:      text(p["הערות"]),
    due_date:   date(p["תאריך יעד"]),
    task_url:   rel(p["Task"]),
    synced_at:  new Date().toISOString(),
  };
  const { error } = await supabase.from("sub_tasks").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("sub_tasks", row.notion_url, "upsert", row);
}

// ── CEO INTAKE ───────────────────────────────────────────────────
async function syncCEO(page: any) {
  const p = page.properties;
  const isImmediate = bool(p["⚡ מיידי"]);
  const urgencyMap: Record<string,number> = {
    "🔴 דחוף": 10, "🟠 גבוה": 20, "🟡 רגיל": 30, "🟢 נמוך": 40
  };
  const urgency = sel(p["דחיפות"]);
  const order   = num(p["סדר עדיפות"]) ?? 0;
  const score   = isImmediate ? 0 : (urgencyMap[urgency] ?? 30) + order;

  const row = {
    notion_url:       `https://www.notion.so/${page.id.replace(/-/g,"")}`,
    created_at:       page.created_time,
    request:          title(p["בקשה"]),
    is_immediate:     isImmediate,
    urgency:          urgency,
    priority_order:   num(p["סדר עדיפות"]),
    category:         sel(p["קטגוריה"]),
    impact:           sel(p["אימפקט"]),
    instruction_type: sel(p["סוג הנחיה"]),
    gal_notes:        text(p["הערות גל"]),
    expected_output:  text(p["תוצר צפוי"]),
    queue_score:      score,
    code_name:        text(p["שם קוד"]),
    claude_response:  text(p["תגובת Claude"]),
    execution_status: sel(p["סטטוס ביצוע"]),
    completion_date:  date(p["תאריך השלמה"]),
    row_number:       autoid(p["#"]),
    depends_on_urls:  rels(p["תלוי ב-"]),
    synced_at:        new Date().toISOString(),
  };
  const { error } = await supabase.from("ceo_intake").upsert(row, { onConflict: "notion_url" });
  if (error) throw error;
  await log("ceo_intake", row.notion_url, "upsert", row);
}

// ── SYSTEM INDEX ─────────────────────────────────────────────────
async function syncSystemIndex(page: any) {
  const p = page.properties;
  const connectedTo = text(p["מחובר ל"]) || '';
  const dependencies = connectedTo ? connectedTo.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

  const row = {
    component_name:       title(p["שם"]),
    component_type:       sel(p["סוג"]),
    status:               sel(p["סטטוס"]),
    health_status:        'active', // Default value
    path:                 url(p["קישור Command Center"]) || text(p["מיקום ב-Notion"]) || '',
    dependencies:         dependencies,
    dependent_on:         text(p["שייך ל-App"]) || null,
    metadata:             {
      notion_id: page.id,
      notion_url: `https://www.notion.so/${page.id.replace(/-/g,"")}`,
      tags: msel(p["תגיות"]),
      description: text(p["תיאור"])
    },
    notes:                text(p["תיאור"]) || '',
    updated_at:           new Date().toISOString(),
  };
  const { error } = await supabase.from("pm_system_index").upsert(row, { onConflict: "component_name" });
  if (error) throw error;
  await log("pm_system_index", `https://www.notion.so/${page.id.replace(/-/g,"")}`, "upsert", row);
}

// ── DB → handler map ─────────────────────────────────────────────
const DB_HANDLERS: Record<string, (page: any) => Promise<void>> = {
  "5c763111a2a3492da8cd8b1ee8520610": syncGoal,
  "72be2bbcba3e49b59ec91009df235777": syncPortfolio,
  "95e23b99655c4784958f4779f15d5e3c": syncProject,
  "2529dae761334e01ae0a38760df51f27": syncSprint,
  "453d24028c334a9aa6b2c677a109bc05": syncTask,
  "3191236e14584cf081efafee9840460d": syncSubTask,
  "938f1761465b4541aa27e7bc1a327375": syncCEO,
  "a4cb9b51b0f14c0fa9676c6a125cda44": syncSystemIndex,
};

// ── MAIN ─────────────────────────────────────────────────────────
serve(async (req) => {
  const secret = req.headers.get("notion-webhook-secret");
  if (NOTION_SECRET && secret !== NOTION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const page = body.data ?? body.entity ?? body;

    if (!page?.id) {
      return new Response("No page id", { status: 400 });
    }

    const dbId = page.parent?.database_id?.replace(/-/g, "");

    if (dbId && DB_HANDLERS[dbId]) {
      await DB_HANDLERS[dbId](page);
      return new Response(JSON.stringify({ ok: true, db: dbId }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Unknown DB:", dbId);
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
