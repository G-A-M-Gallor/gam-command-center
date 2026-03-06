import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPTS,
  MODE_MODELS,
  MODE_MAX_TOKENS,
  SLIDING_WINDOW_SIZE,
  type AIMode,
} from "@/lib/ai/prompts";

const VALID_MODES: AIMode[] = ["chat", "analyze", "write", "decompose"];

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

  // Build system prompt with contexts
  let systemPrompt = SYSTEM_PROMPTS[mode];
  if (contexts.length > 0) {
    systemPrompt += `\n\nCurrent dashboard context: ${contexts.join(", ")}`;
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
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                usage: {
                  input_tokens: finalMessage.usage.input_tokens,
                  output_tokens: finalMessage.usage.output_tokens,
                },
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
