import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api/auth";
import { boardRoomSchema } from "@/lib/api/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { PERSONAS, TIMEOS_CONTEXT } from "@/lib/ai/boardroom";

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
    // Fallback if RPC not deployed
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

export async function POST(request: Request) {
  const rl = checkRateLimit(request, RATE_LIMITS.ai);
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

  const parsed = boardRoomSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { question, personaId } = parsed.data;

  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) {
    return new Response(
      JSON.stringify({ error: "Unknown persona" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Budget check
  const budget = await checkAndUpdateBudget(userId, { input: 0, output: 0 });
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({ error: "Daily token budget exceeded", remaining: 0 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const systemPrompt = persona.systemPrompt + "\n\n" + TIMEOS_CONTEXT;

  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
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

          await checkAndUpdateBudget(userId, {
            input: usageData.input_tokens,
            output: usageData.output_tokens,
          });

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
