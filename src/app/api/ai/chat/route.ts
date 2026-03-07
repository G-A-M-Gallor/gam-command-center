import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  SYSTEM_PROMPTS,
  MODE_MODELS,
  MODE_MAX_TOKENS,
  SLIDING_WINDOW_SIZE,
  type AIMode,
} from "@/lib/ai/prompts";

const VALID_MODES: AIMode[] = ["chat", "analyze", "write", "decompose"];
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

interface RequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: AIMode;
  contexts?: string[];
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, mode, contexts = [] } = body;

  if (!VALID_MODES.includes(mode)) {
    return new Response(
      JSON.stringify({ error: `Invalid mode: ${mode}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Server-side token budget check (DECISION-004)
  const authHeader = request.headers.get("authorization");
  const userId = authHeader?.replace("Bearer ", "") || "";
  if (userId) {
    const budget = await checkAndUpdateBudget(userId, { input: 0, output: 0 });
    if (!budget.allowed) {
      return new Response(
        JSON.stringify({ error: "Daily token budget exceeded", remaining: 0 }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Build system prompt with contexts (rich data from pages)
  let systemPrompt = SYSTEM_PROMPTS[mode];
  if (contexts.length > 0) {
    const contextBlock = contexts.join("\n\n").slice(0, 1500);
    systemPrompt += `\n\n--- Dashboard Data ---\n${contextBlock}`;
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
