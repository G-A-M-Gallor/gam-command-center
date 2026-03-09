import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { workManagerSchema } from "@/lib/api/schemas";

// ─── Budget ─────────────────────────────────────────────────

const DAILY_TOKEN_LIMIT = 100_000;

async function checkAndUpdateBudget(
  userId: string,
  tokensUsed: { input: number; output: number }
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase.rpc("check_ai_budget", {
      p_user_id: userId,
      p_tokens_in: tokensUsed.input,
      p_tokens_out: tokensUsed.output,
    });

    if (!error && data && data.length > 0) {
      return { allowed: data[0].allowed, remaining: data[0].remaining };
    }
  } catch {
    // Fallback if RPC not deployed yet
  }

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("ai_usage")
    .select("tokens_input, tokens_output, request_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const currentInput = data?.tokens_input || 0;
  const currentOutput = data?.tokens_output || 0;
  const currentCount = data?.request_count || 0;
  const totalUsed = currentInput + currentOutput;

  if (tokensUsed.input === 0 && tokensUsed.output === 0) {
    return { allowed: totalUsed < DAILY_TOKEN_LIMIT, remaining: Math.max(DAILY_TOKEN_LIMIT - totalUsed, 0) };
  }

  await supabase.from("ai_usage").upsert(
    {
      user_id: userId,
      date: today,
      tokens_input: currentInput + tokensUsed.input,
      tokens_output: currentOutput + tokensUsed.output,
      request_count: currentCount + 1,
    },
    { onConflict: "user_id,date" }
  );

  const newTotal = totalUsed + tokensUsed.input + tokensUsed.output;
  return { allowed: true, remaining: Math.max(DAILY_TOKEN_LIMIT - newTotal, 0) };
}

// ─── Session Context ────────────────────────────────────────

interface SessionContext {
  open_projects: { name: string; status: string; sprint?: string }[];
  open_tasks: { title: string; assignee: string; priority: string }[];
  last_decisions: string[];
}

const MOCK_CONTEXT: SessionContext = {
  open_projects: [
    { name: "GAM Command Center", status: "בתהליך", sprint: "Sprint Work Manager" },
    { name: "Professional Board", status: "תכנון" },
    { name: "Origami Placement", status: "בתהליך" },
  ],
  open_tasks: [
    { title: "Work Manager API Route", assignee: "Claude", priority: "P0" },
    { title: "Notion MCP חיבור", assignee: "Claude", priority: "P1" },
    { title: "Action Preview Layer", assignee: "Claude", priority: "P1" },
  ],
  last_decisions: [
    "MCP-First architecture — כל חיבור דרך MCP",
    "Read-only בשלב ראשון",
    "Confidence level על כל תשובה",
  ],
};

async function loadSessionContext(_userId: string): Promise<SessionContext> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Fetch active projects
    const { data: projects } = await supabase
      .from("projects")
      .select("name, status, health_score, layer")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(10);

    // Fetch recent story cards as tasks
    const { data: stories } = await supabase
      .from("story_cards")
      .select("text, type")
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch recent AI conversations for decisions (work-mode only)
    const { data: conversations } = await supabase
      .from("ai_conversations")
      .select("title, messages")
      .order("updated_at", { ascending: false })
      .limit(5);

    // If no data at all, fall back to mock
    if ((!projects || projects.length === 0) && (!stories || stories.length === 0)) {
      return MOCK_CONTEXT;
    }

    // Transform projects
    const open_projects = (projects || []).map((p) => ({
      name: p.name,
      status: p.status || "active",
      ...(p.layer ? { sprint: p.layer } : {}),
    }));

    // Transform story cards into tasks
    const open_tasks = (stories || []).map((s) => ({
      title: s.text,
      assignee: "Claude",
      priority: s.type === "epic" ? "P0" : "P1",
    }));

    // Extract decisions from recent conversations
    const last_decisions: string[] = [];
    for (const conv of conversations || []) {
      if (conv.title) {
        last_decisions.push(conv.title);
      }
      // Pull last assistant message as a decision summary
      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      const lastAssistant = [...msgs].reverse().find(
        (m: { role?: string }) => m.role === "assistant"
      );
      if (lastAssistant && typeof lastAssistant.content === "string") {
        const snippet = lastAssistant.content.slice(0, 120);
        if (snippet && !last_decisions.includes(snippet)) {
          last_decisions.push(snippet);
        }
      }
      if (last_decisions.length >= 5) break;
    }

    return {
      open_projects: open_projects.length > 0 ? open_projects : MOCK_CONTEXT.open_projects,
      open_tasks: open_tasks.length > 0 ? open_tasks : MOCK_CONTEXT.open_tasks,
      last_decisions: last_decisions.length > 0 ? last_decisions : MOCK_CONTEXT.last_decisions,
    };
  } catch {
    // Any Supabase failure — fall back to mock
    return MOCK_CONTEXT;
  }
}

// ─── System Prompt ──────────────────────────────────────────

function buildSystemPrompt(
  sessionContext: SessionContext,
  currentView?: { page: string; open_tasks?: string[]; time_in_view?: string }
): string {
  const viewBlock = currentView
    ? `\n\n--- Current View ---\nPage: ${currentView.page}${
        currentView.open_tasks?.length ? `\nOpen tasks: ${currentView.open_tasks.join(", ")}` : ""
      }${currentView.time_in_view ? `\nTime in view: ${currentView.time_in_view}` : ""}`
    : "";

  return `אתה מנהל העבודה של חברת G.A.M — חברת שירותי עסקים בענף הבנייה בישראל.
אתה מכיר את הקונטקסט, הפרויקטים הפתוחים, המשימות והצוות.

## צוות GAM
- **גל** — מנכ"ל, ארכיטקט מערכות, מנהל מוצר. מקבל החלטות אחרונות.
- **Claude** — AI architect. כותב קוד, מתכנן, מפרק פיצ'רים.
- **n8n** — אוטומציות ותיזמור. לא כותב קוד — מחבר מערכות.

## כללים
1. **עברית כברירת מחדל** — אם המשתמש כותב באנגלית, ענה באנגלית
2. **תמציתי ופרקטי** — תשובות קצרות ואקשנביליות
3. **Confidence level** — בסוף כל תשובה הוסף: 🟢 (בטוח), 🟡 (סביר), 🔴 (לא בטוח — צריך לבדוק)
4. **Read-only בשלב ראשון** — אל תבצע פעולות כתיבה ללא אישור מפורש
5. **Action Preview** — כשמוצע לבצע פעולה, ציין אותה בפורמט: ACTION:{"type":"<type>","title":"<title>","details":{...}}
6. **אל תמציא מידע** — אם אתה לא יודע, תגיד שאתה לא יודע ותציע לבדוק

## כלים זמינים (לעתיד)
- create_task — יצירת משימה חדשה
- update_status — עדכון סטטוס של פריט
- add_note — הוספת הערה לפרויקט/משימה
- invoke_persona — הפעלת פרסונה (Claude/n8n) למשימה

## פורמט תשובה
- Markdown עם כותרות, רשימות, bold
- עברית RTL
- Confidence level בסוף כל תשובה

## הקשר נוכחי
### פרויקטים פתוחים
${sessionContext.open_projects.map((p) => `- **${p.name}**: ${p.status}${"sprint" in p ? ` (${p.sprint})` : ""}`).join("\n")}

### משימות פתוחות
${sessionContext.open_tasks.map((t) => `- [${t.priority}] ${t.title} — ${t.assignee}`).join("\n")}

### החלטות אחרונות
${sessionContext.last_decisions.map((d) => `- ${d}`).join("\n")}${viewBlock}`;
}

// ─── Route Handler ──────────────────────────────────────────

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult.error !== null) {
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = authResult.user.id;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = workManagerSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, current_view } = parsed.data;

  // Budget check
  const budget = await checkAndUpdateBudget(userId, { input: 0, output: 0 });
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({ error: "Daily token budget exceeded", remaining: 0 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load real session context from Supabase (falls back to MOCK_CONTEXT)
  const sessionContext = await loadSessionContext(userId);

  const systemPrompt = buildSystemPrompt(sessionContext, current_view);

  // Sliding window: keep last 6 exchanges
  const SLIDING_WINDOW = 6;
  const firstMsg = messages[0];
  const recentMessages = messages.length > SLIDING_WINDOW * 2 + 1
    ? messages.slice(-(SLIDING_WINDOW * 2))
    : messages.slice(1);

  const trimmedMessages =
    messages.length > SLIDING_WINDOW * 2 + 1
      ? [firstMsg, ...recentMessages]
      : messages;

  const apiMessages = trimmedMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const delta = event.delta;
              if ("text" in delta) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", text: delta.text })}\n\n`
                  )
                );
              }
            }
          }

          const finalMessage = await stream.finalMessage();
          const usageData = {
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
          };

          if (userId) {
            await checkAndUpdateBudget(userId, {
              input: usageData.input_tokens,
              output: usageData.output_tokens,
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", usage: usageData })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "API error";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
