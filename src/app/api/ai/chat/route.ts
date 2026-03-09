import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPTS,
  MODE_MODELS,
  MODE_MAX_TOKENS,
  SLIDING_WINDOW_SIZE,
  type AIMode,
} from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/api/auth";
import { aiChatSchema } from "@/lib/api/schemas";
import { getTasksSummaryForPrompt } from "@/lib/notion/client";

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
    // Atomic budget check via RPC — prevents race conditions
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

  // Fallback: direct query (non-atomic)
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

export async function POST(request: Request) {
  // Authenticate the request
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

  const parsed = aiChatSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, mode, contexts } = parsed.data;

  // Server-side token budget check (DECISION-004)
  const budget = await checkAndUpdateBudget(userId, { input: 0, output: 0 });
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({ error: "Daily token budget exceeded", remaining: 0 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load dynamic session context from Supabase
  const supabaseCtx = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  let sessionBlock = "";
  try {
    const { data: ctxRows } = await supabaseCtx
      .from("session_context")
      .select("context_key, context_value")
      .eq("user_id", userId)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
    if (ctxRows && ctxRows.length > 0) {
      const lines = ctxRows.map(
        (r: { context_key: string; context_value: unknown }) =>
          `[${r.context_key}]: ${JSON.stringify(r.context_value)}`
      );
      sessionBlock = `\n\n--- Session Context ---\n${lines.join("\n").slice(0, 2000)}`;
    }
  } catch {
    // session_context table may not exist yet — graceful fallback
  }

  // Build system prompt with contexts (rich data from pages)
  let systemPrompt = SYSTEM_PROMPTS[mode];
  if (contexts.length > 0) {
    const contextBlock = contexts.join("\n\n").slice(0, 1500);
    systemPrompt += `\n\n--- Dashboard Data ---\n${contextBlock}`;
  }
  systemPrompt += sessionBlock;

  // Load Notion tasks context (graceful if not configured)
  try {
    const notionSummary = await getTasksSummaryForPrompt();
    if (notionSummary) {
      systemPrompt += `\n\n--- Notion Tasks ---\n${notionSummary.slice(0, 1500)}`;
    }
  } catch {
    // Notion not configured — skip silently
  }

  // Sliding window: keep first user message + last N exchanges
  const firstMsg = messages[0];
  const recentMessages = messages.length > SLIDING_WINDOW_SIZE * 2 + 1
    ? messages.slice(-(SLIDING_WINDOW_SIZE * 2))
    : messages.slice(1);

  const trimmedMessages =
    messages.length > SLIDING_WINDOW_SIZE * 2 + 1
      ? [firstMsg, ...recentMessages]
      : messages;

  // Ensure messages alternate user/assistant correctly
  const apiMessages = trimmedMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: MODE_MODELS[mode],
      max_tokens: MODE_MAX_TOKENS[mode],
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

          // Get final message for usage stats
          const finalMessage = await stream.finalMessage();
          const usageData = {
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
          };

          // Record server-side usage (DECISION-004)
          if (userId) {
            await checkAndUpdateBudget(userId, {
              input: usageData.input_tokens,
              output: usageData.output_tokens,
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                usage: usageData,
              })}\n\n`
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
