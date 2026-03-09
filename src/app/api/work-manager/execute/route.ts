import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { workManagerExecuteSchema } from "@/lib/api/schemas";

// ─── Supabase admin client (service role for DB writes) ─────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Action Handlers ────────────────────────────────────────

async function handleCreateTask(
  title: string,
  details: Record<string, string>,
  userId: string
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("story_cards")
    .insert({
      text: title,
      type: "story",
      col: 0,
      row: 0,
      color: details.color || null,
      subs: details.assignee ? JSON.stringify([{ text: details.assignee }]) : "[]",
    })
    .select("id, text")
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);

  return { id: data.id, text: data.text, created_by: userId };
}

async function handleUpdateStatus(
  title: string,
  details: Record<string, string>
) {
  const supabase = getSupabase();

  const projectName = details.project || title;
  const newStatus = details.status || details.new_status;

  if (!newStatus) {
    throw new Error("Missing status in details — provide details.status or details.new_status");
  }

  // Find project by name (case-insensitive partial match)
  const { data: projects, error: findError } = await supabase
    .from("projects")
    .select("id, name, status")
    .ilike("name", `%${projectName}%`)
    .limit(1);

  if (findError) throw new Error(`Failed to find project: ${findError.message}`);
  if (!projects || projects.length === 0) {
    throw new Error(`No project found matching "${projectName}"`);
  }

  const project = projects[0];
  const previousStatus = project.status;

  const { error: updateError } = await supabase
    .from("projects")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", project.id);

  if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);

  return {
    project_id: project.id,
    project_name: project.name,
    previous_status: previousStatus,
    new_status: newStatus,
  };
}

async function handleAddNote(
  title: string,
  details: Record<string, string>,
  userId: string
) {
  const supabase = getSupabase();

  const noteContent = details.content || details.note || title;

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      model: "work-manager",
      mode: "note",
      messages: JSON.stringify([
        {
          role: "user",
          content: noteContent,
          timestamp: Date.now(),
          meta: { title, added_by: userId },
        },
      ]),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to add note: ${error.message}`);

  return { id: data.id, title, content: noteContent };
}

function handleInvokePersona(
  title: string,
  details: Record<string, string>
) {
  // Stub — log and acknowledge for now
  const persona = details.persona || "claude";
  return {
    persona,
    title,
    status: "stub",
    message: `Persona "${persona}" invocation logged — not yet implemented`,
  };
}

// ─── Route Handler ──────────────────────────────────────────

export async function POST(request: Request) {
  // Auth
  const authResult = await requireAuth(request);
  if (authResult.error !== null) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  const userId = authResult.user.id;

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate
  const parsed = workManagerExecuteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action_type, title, details, session_id } = parsed.data;

  // Execute
  try {
    let result: Record<string, unknown>;

    switch (action_type) {
      case "create_task":
        result = await handleCreateTask(title, details, userId);
        break;
      case "update_status":
        result = await handleUpdateStatus(title, details);
        break;
      case "add_note":
        result = await handleAddNote(title, details, userId);
        break;
      case "invoke_persona":
        result = handleInvokePersona(title, details);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action_type: ${action_type}` },
          { status: 400 }
        );
    }

    console.log(`[WorkManager/Execute] ${action_type} by ${userId} session=${session_id}`, result);

    return NextResponse.json({
      success: true,
      action_type,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution failed";
    console.error(`[WorkManager/Execute] ${action_type} FAILED:`, message);

    return NextResponse.json(
      { success: false, error: message, action_type },
      { status: 500 }
    );
  }
}
