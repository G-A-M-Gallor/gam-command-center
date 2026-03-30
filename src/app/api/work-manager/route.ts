import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { workManagerSchema } from "@/lib/api/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { detectAgent } from "@/lib/work-manager/detectAgent";
import { AGENT_PROMPTS, AGENT_CONFIGS, type AgentType } from "@/lib/work-manager/agentPrompts";
import { getTasksSummaryForPrompt } from "@/lib/notion/client";
import { getKnowledgeContext } from "@/lib/ai/knowledgeBase";

// ─── Supabase Helper ────────────────────────────────────────

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Budget ─────────────────────────────────────────────────

const DAILY_TOKEN_LIMIT = 100_000;

async function checkAndUpdateBudget(
  supabase: SupabaseClient,
  userId: string,
  tokensUsed: { input: number; output: number }
): Promise<{ allowed: boolean; remaining: number }> {
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

const EMPTY_CONTEXT: SessionContext = {
  open_projects: [],
  open_tasks: [],
  last_decisions: [],
};

async function loadSessionContext(supabase: SupabaseClient): Promise<SessionContext> {
  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("name, status, health_score, layer")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(10);

    const { data: stories } = await supabase
      .from("story_cards")
      .select("text, type")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: conversations } = await supabase
      .from("ai_conversations")
      .select("title, messages")
      .order("updated_at", { ascending: false })
      .limit(5);

    if ((!projects || projects.length === 0) && (!stories || stories.length === 0)) {
      return EMPTY_CONTEXT;
    }

    const open_projects = (projects || []).map((p) => ({
      name: p.name,
      status: p.status || "active",
      ...(p.layer ? { sprint: p.layer } : {}),
    }));

    const open_tasks = (stories || []).map((s) => ({
      title: s.text,
      assignee: "Claude",
      priority: s.type === "epic" ? "P0" : "P1",
    }));

    const last_decisions: string[] = [];
    for (const conv of conversations || []) {
      if (conv.title) {
        last_decisions.push(conv.title);
      }
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

    return { open_projects, open_tasks, last_decisions };
  } catch {
    return EMPTY_CONTEXT;
  }
}

// ─── Session Context Persistence ─────────────────────────────

async function persistSessionContext(supabase: SupabaseClient, userId: string, ctx: SessionContext): Promise<void> {
  try {
    await supabase.from("session_context").upsert(
      [
        { user_id: userId, context_key: "open_projects", context_value: ctx.open_projects },
        { user_id: userId, context_key: "open_tasks", context_value: ctx.open_tasks },
        { user_id: userId, context_key: "last_decisions", context_value: ctx.last_decisions },
      ],
      { onConflict: "user_id,context_key" }
    );
  } catch {
    // Non-critical — don't fail the request
  }
}

// ─── System Prompt Builder ──────────────────────────────────

function buildAgentSystemPrompt(
  agent: AgentType,
  sessionContext: SessionContext,
  notionSummary: string,
  currentView?: { page: string; open_tasks?: string[]; time_in_view?: string }
): string {
  const agentPrompt = AGENT_PROMPTS[agent];

  const viewBlock = currentView
    ? `\n\n--- Current View ---\nPage: ${currentView.page}${
        currentView.open_tasks?.length ? `\nOpen tasks: ${currentView.open_tasks.join(", ")}` : ""
      }${currentView.time_in_view ? `\nTime in view: ${currentView.time_in_view}` : ""}`
    : "";

  const notionBlock = notionSummary
    ? `\n\n--- Notion Tasks ---\n${notionSummary}`
    : "";

  const contextBlock = `\n\n## הקשר נוכחי
### פרויקטים פתוחים
${sessionContext.open_projects.length > 0
  ? sessionContext.open_projects.map((p) => `- **${p.name}**: ${p.status}${p.sprint ? ` (${p.sprint})` : ""}`).join("\n")
  : "- אין פרויקטים פתוחים כרגע"}

### משימות פתוחות
${sessionContext.open_tasks.length > 0
  ? sessionContext.open_tasks.map((t) => `- [${t.priority}] ${t.title} — ${t.assignee}`).join("\n")
  : "- אין משימות פתוחות כרגע"}

### החלטות אחרונות
${sessionContext.last_decisions.length > 0
  ? sessionContext.last_decisions.map((d) => `- ${d}`).join("\n")
  : "- אין החלטות מתועדות"}`;

  const knowledgeBlock = getKnowledgeContext();
  const gamBlock = knowledgeBlock
    ? `\n\n--- GAM Knowledge Base ---\n${knowledgeBlock}`
    : "";

  return `${agentPrompt}${contextBlock}${notionBlock}${viewBlock}${gamBlock}`;
}

// ─── Route Handler ──────────────────────────────────────────

export async function POST(request: Request) {
  // Rate limit — Work Manager runs multi-agent chains
  const rl = checkRateLimit(request, RATE_LIMITS.workManager);
  if (rl.limited) return rl.response;

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

  const { messages, session_id, current_view } = parsed.data;

  const supabase = getSupabase();

  // Budget check
  const budget = await checkAndUpdateBudget(supabase, userId, { input: 0, output: 0 });
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({ error: "Daily token budget exceeded", remaining: 0 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Detect which agent to route to
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const agent = detectAgent(lastUserMsg);
  const agentConfig = AGENT_CONFIGS[agent];

  // Load session context + Notion tasks in parallel
  const [sessionContext, notionSummary] = await Promise.all([
    loadSessionContext(supabase),
    getTasksSummaryForPrompt().catch(() => ""),
  ]);

  // Persist session context for /api/ai/chat to read (non-blocking)
  persistSessionContext(supabase, userId, sessionContext);

  const systemPrompt = buildAgentSystemPrompt(agent, sessionContext, notionSummary, current_view);

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
      model: agentConfig.model,
      max_tokens: agentConfig.maxTokens,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          // Emit agent type as first SSE event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "agent", agent })}\n\n`
            )
          );

          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const delta = event.delta;
              if ("text" in delta) {
                fullResponse += delta.text;
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

          await checkAndUpdateBudget(supabase, userId, {
            input: usageData.input_tokens,
            output: usageData.output_tokens,
          });

          // Save conversation log with full response (non-blocking)
          const fullMessages = [
            ...apiMessages,
            { role: "assistant" as const, content: fullResponse },
          ];
          supabase.from("ai_conversations").upsert(
            {
              id: session_id,
              mode: "work",
              model: agentConfig.model,
              messages: fullMessages,
              total_tokens_input: usageData.input_tokens,
              total_tokens_output: usageData.output_tokens,
            },
            { onConflict: "id" }
          ).then(() => { /* no-op */ }, () => { /* no-op */ });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", usage: usageData, agent })}\n\n`
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
