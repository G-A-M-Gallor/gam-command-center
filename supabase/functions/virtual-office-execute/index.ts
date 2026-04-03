// virtual-office-execute v1.0
// GAM Command Center — Virtual Office Agent Execution Engine
// POST { persona, tool, params, user_query?, context? }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CALENDAR_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
};

interface ExecutionRequest {
  persona: string;
  tool: string;
  params: Record<string, any>;
  user_query?: string;
  context?: Record<string, any>;
  session_id?: string;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  persona_name: string;
  tool_name: string;
  execution_time_ms: number;
  execution_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Parse request
    const body: ExecutionRequest = await req.json();
    const { persona, tool, params, user_query, context, session_id } = body;

    console.log(`[virtual-office] ${persona} → ${tool}`, { params, user_query });

    // Validate execution
    const { data: validation } = await supabase.rpc('validate_persona_execution', {
      persona_name: persona,
      tool_name: tool,
      params: params || {}
    });

    if (!validation?.valid) {
      return resp({
        success: false,
        error: validation?.error || 'Validation failed',
        persona_name: persona,
        tool_name: tool,
        execution_time_ms: Date.now() - startTime,
        execution_id: crypto.randomUUID(),
      }, 400);
    }

    // Create execution record
    const { data: executionRecord, error: execError } = await supabase
      .from('vb_persona_executions')
      .insert({
        persona_id: validation.persona_id,
        tool_name: tool,
        input_params: params,
        user_query,
        context,
        session_id,
        status: 'running',
        request_id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (execError || !executionRecord) {
      throw new Error(`Failed to create execution record: ${execError?.message}`);
    }

    // Execute tool based on persona and tool type
    let result: any;
    let error: string | null = null;

    try {
      if (persona === 'millie' && tool.startsWith('google_calendar_')) {
        result = await executeMillieCalendarTool(tool, params);
      } else if (persona === 'brandon' && tool.startsWith('pm_tasks_')) {
        result = await executeBrandonTaskTool(supabase, tool, params);
      } else if (persona === 'steve' && tool.startsWith('icount_')) {
        result = await executeSteveAccountingTool(tool, params);
      } else if (persona === 'kelly' && tool.startsWith('origami_')) {
        result = await executeKellyOrigamiTool(tool, params);
      } else if (persona === 'andrea' && tool.startsWith('contract_')) {
        result = await executeAndreaContractTool(supabase, tool, params);
      } else {
        throw new Error(`Unknown persona/tool combination: ${persona}/${tool}`);
      }
    } catch (toolError) {
      error = toolError instanceof Error ? toolError.message : String(toolError);
      console.error(`[virtual-office] Tool execution failed:`, toolError);
    }

    // Update execution record
    const status = error ? 'failed' : 'success';
    await supabase
      .from('vb_persona_executions')
      .update({
        status,
        result: result || null,
        error_message: error,
        execution_time_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionRecord.id);

    // Update persona stats
    if (status === 'success') {
      await supabase
        .from('vb_personas')
        .update({
          last_execution_at: new Date().toISOString(),
          total_executions: validation.persona_record?.total_executions + 1 || 1,
        })
        .eq('id', validation.persona_id);
    }

    return resp({
      success: !error,
      result: result || null,
      error,
      persona_name: persona,
      tool_name: tool,
      execution_time_ms: Date.now() - startTime,
      execution_id: executionRecord.id,
    });

  } catch (error) {
    console.error("[virtual-office] Fatal error:", error);
    return resp({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      persona_name: 'unknown',
      tool_name: 'unknown',
      execution_time_ms: Date.now() - startTime,
      execution_id: crypto.randomUUID(),
    }, 500);
  }
});

// ── MILLIE: Google Calendar Tools ──────────────────────────────────────
async function executeMillieCalendarTool(tool: string, params: any): Promise<any> {
  if (!GOOGLE_CALENDAR_API_KEY) {
    throw new Error('Google Calendar API key not configured');
  }

  switch (tool) {
    case 'google_calendar_create_event':
      return await createGoogleCalendarEvent(params);

    case 'google_calendar_list_events':
      return await listGoogleCalendarEvents(params);

    case 'google_calendar_update_event':
      return await updateGoogleCalendarEvent(params);

    case 'google_calendar_delete_event':
      return await deleteGoogleCalendarEvent(params);

    default:
      throw new Error(`Unknown Millie tool: ${tool}`);
  }
}

async function createGoogleCalendarEvent(params: any) {
  const { summary, description, start_date, end_date, location, attendees, reminder_minutes } = params;

  // Prepare event data for Google Calendar API
  const eventData = {
    summary,
    description,
    start: {
      dateTime: new Date(start_date).toISOString(),
      timeZone: 'Asia/Jerusalem',
    },
    end: {
      dateTime: new Date(end_date).toISOString(),
      timeZone: 'Asia/Jerusalem',
    },
    location,
    attendees: attendees?.map((email: string) => ({ email })) || [],
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: reminder_minutes || 15 }],
    },
  };

  console.log('[millie] Creating calendar event:', { summary, start_date, end_date });

  // Mock implementation for now - replace with actual Google Calendar API
  // TODO: Integrate with actual Google Calendar API
  const mockEvent = {
    id: `evt_${Date.now()}`,
    summary,
    start: start_date,
    end: end_date,
    location,
    created: new Date().toISOString(),
    status: 'confirmed',
    htmlLink: `https://calendar.google.com/calendar/event?eid=${btoa(summary)}`,
  };

  return {
    message: `✅ האירוע "${summary}" נוצר בהצלחה ביומן`,
    event: mockEvent,
    calendar_link: mockEvent.htmlLink,
  };
}

async function listGoogleCalendarEvents(params: any) {
  const { start_date, end_date, max_results = 20 } = params;

  console.log('[millie] Listing calendar events:', { start_date, end_date, max_results });

  // Mock implementation for now
  const mockEvents = [
    {
      id: 'evt_001',
      summary: 'פגישה עם לקוח',
      start: '2026-04-04T10:00:00+02:00',
      end: '2026-04-04T11:00:00+02:00',
      location: 'משרד GAM',
    },
    {
      id: 'evt_002',
      summary: 'ישיבת צוות',
      start: '2026-04-04T14:00:00+02:00',
      end: '2026-04-04T15:00:00+02:00',
      location: 'חדר ישיבות',
    },
  ];

  return {
    message: `📅 נמצאו ${mockEvents.length} אירועים`,
    events: mockEvents,
    total_count: mockEvents.length,
  };
}

async function updateGoogleCalendarEvent(params: any) {
  // TODO: Implement Google Calendar event update
  throw new Error('Google Calendar update not yet implemented');
}

async function deleteGoogleCalendarEvent(params: any) {
  // TODO: Implement Google Calendar event deletion
  throw new Error('Google Calendar delete not yet implemented');
}

// ── BRANDON: PM Tasks Tools ────────────────────────────────────────────
async function executeBrandonTaskTool(supabase: any, tool: string, params: any): Promise<any> {
  switch (tool) {
    case 'pm_tasks_list':
      return await listProjectTasks(supabase, params);

    case 'pm_tasks_update_status':
      return await updateTaskStatus(supabase, params);

    default:
      throw new Error(`Unknown Brandon tool: ${tool}`);
  }
}

async function listProjectTasks(supabase: any, params: any) {
  const { status, owner, limit = 50 } = params;

  let query = supabase.from('pm_tasks').select('*').limit(limit);

  if (status) query = query.eq('status', status);
  if (owner) query = query.eq('owner', owner);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);

  return {
    message: `📋 נמצאו ${data?.length || 0} משימות`,
    tasks: data,
    total_count: data?.length || 0,
  };
}

async function updateTaskStatus(supabase: any, params: any) {
  const { task_id, status, notes } = params;

  const { data, error } = await supabase
    .from('pm_tasks')
    .update({ status, notes, updated_at: new Date().toISOString() })
    .eq('id', task_id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);

  return {
    message: `✅ המשימה עודכנה לסטטוס: ${status}`,
    task: data,
  };
}

// ── STEVE: iCount Tools (Placeholder) ──────────────────────────────────
async function executeSteveAccountingTool(tool: string, params: any): Promise<any> {
  // TODO: Implement iCount integration
  return {
    message: `💰 Steve (iCount) - ${tool} - Not yet implemented`,
    params,
  };
}

// ── KELLY: Origami CRM Tools (Placeholder) ─────────────────────────────
async function executeKellyOrigamiTool(tool: string, params: any): Promise<any> {
  // TODO: Implement Origami integration
  return {
    message: `👥 Kelly (Origami) - ${tool} - Not yet implemented`,
    params,
  };
}

// ── ANDREA: Contract Tools (Placeholder) ───────────────────────────────
async function executeAndreaContractTool(supabase: any, tool: string, params: any): Promise<any> {
  // TODO: Implement contract management tools
  return {
    message: `📄 Andrea (Contracts) - ${tool} - Not yet implemented`,
    params,
  };
}

// ── UTILITIES ───────────────────────────────────────────────────────────
function resp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}