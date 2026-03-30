import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPTS,
  MODE_MODELS,
  MODE_MAX_TOKENS,
  SLIDING_WINDOW_SIZE,
  } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/api/auth";
import { aiChatSchema } from "@/lib/api/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getTasksSummaryForPrompt } from "@/lib/notion/client";
import { getKnowledgeContext } from "@/lib/ai/knowledgeBase";

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
  // Rate limit — AI routes are expensive (Claude API tokens)
  const rl = checkRateLimit(request, RATE_LIMITS.ai);
  if (rl.limited) return rl.response;

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

  // ─── Entity Verification (pre-flight Supabase lookup) ───
  let entityVerificationBlock = "";
  try {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Extract potential entity names from the message:
      // 1. Quoted strings (Hebrew or English)
      // 2. Names passed in contexts array that look like entity references
      const quotedNames: string[] = [];
      const quoteRegex = /["״""«»]([^"״""«»]{2,60})["״""«»]/g;
      let match: RegExpExecArray | null;
      while ((match = quoteRegex.exec(lastUserMsg.content)) !== null) {
        quotedNames.push(match[1].trim());
      }

      // Also check contexts for entity-like references (lines starting with "- " or containing entity type hints)
      for (const ctx of contexts) {
        const entityRefMatch = /(?:project|entity|client|contact|deal|עסקה|לקוח|פרויקט|איש קשר)[:\s]+["״]?([^"\n,]{2,60})["״]?/gi;
        while ((match = entityRefMatch.exec(ctx)) !== null) {
          quotedNames.push(match[1].trim());
        }
      }

      // Deduplicate
      const uniqueNames = [...new Set(quotedNames)].slice(0, 5);

      if (uniqueNames.length > 0) {
        // Query vb_records for each name using ILIKE
        const { data: foundEntities } = await supabaseCtx
          .from("vb_records")
          .select("id, title, entity_type, status, meta")
          .eq("is_deleted", false)
          .or(uniqueNames.map((n) => `title.ilike.%${n}%`).join(","))
          .limit(10);

        const foundLines: string[] = [];
        const notFoundNames: string[] = [];

        if (foundEntities && foundEntities.length > 0) {
          for (const entity of foundEntities) {
            const meta = (entity.meta as Record<string, unknown>) ?? {};
            const stage = meta.stage || meta.status || entity.status || "—";
            const assignee = meta.assignee || meta.owner || "—";
            foundLines.push(
              `  - "${entity.title}" | type: ${entity.entity_type ?? "note"} | stage: ${stage} | assignee: ${assignee}`
            );
          }

          // Check which searched names were NOT found
          for (const name of uniqueNames) {
            const nameLower = name.toLowerCase();
            const wasFound = foundEntities.some((e) =>
              e.title.toLowerCase().includes(nameLower)
            );
            if (!wasFound) {
              notFoundNames.push(name);
            }
          }
        } else {
          notFoundNames.push(...uniqueNames);
        }

        const parts: string[] = [];
        if (foundLines.length > 0) {
          parts.push(`Found entities:\n${foundLines.join("\n")}`);
        }
        if (notFoundNames.length > 0) {
          parts.push(
            `NOT FOUND in system: ${notFoundNames.map((n) => `"${n}"`).join(", ")}`
          );
        }
        if (parts.length > 0) {
          entityVerificationBlock = `\n\n--- Entity Verification ---\n${parts.join("\n")}`;
        }
      }
    }
  } catch {
    // Entity verification is best-effort — don't block the chat
  }
  systemPrompt += entityVerificationBlock;

  // Inject GAM knowledge base from CLAUDE.md
  const knowledgeBlock = getKnowledgeContext();
  if (knowledgeBlock) {
    systemPrompt += `\n\n--- GAM Knowledge Base ---\n${knowledgeBlock}`;
  }

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

  // Build API messages — support multimodal content for the last user message
  const apiMessages = trimmedMessages.map((m, idx) => {
    const isLastUser = idx === trimmedMessages.length - 1 && m.role === "user";
    const hasImages = isLastUser && m.images && m.images.length > 0;

    if (hasImages) {
      // Multimodal message with images
      const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
      for (const img of m.images!) {
        contentBlocks.push({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: img.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
            data: img.base64,
          },
        });
      }
      contentBlocks.push({ type: "text" as const, text: m.content });
      return { role: m.role as "user" | "assistant", content: contentBlocks };
    }

    return { role: m.role as "user" | "assistant", content: m.content };
  });

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
