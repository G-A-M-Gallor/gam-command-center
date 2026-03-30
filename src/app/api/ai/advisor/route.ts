import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { streamChat } from "@/lib/ai/client";
import { getPersonaById, PERSONAS } from "@/lib/ai/personas";
import { z } from "zod";

const advisorChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.number().optional(),
  })),
  personaId: z.string().optional(),
  stream: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMITS.ai
    );

    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    // Parse request
    const body = await request.json();
    const { messages, personaId, stream } = advisorChatSchema.parse(body);

    // Get persona
    const persona = personaId ? getPersonaById(personaId) : PERSONAS[0];
    if (!persona) {
      return NextResponse.json(
        { error: "Invalid persona ID" },
        { status: 400 }
      );
    }

    // Prepare contexts with persona instructions
    const contexts = [
      persona.instructions,
      // Add advisor-specific context
      `אתה משרת כיועץ מקצועי במערכת GAM Command Center. התמקד במתן עצות מעשיות ומדויקות בתחום המומחיות שלך: ${persona.domainLabel.he}.`,
    ];

    // For streaming responses
    if (stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            await streamChat({
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              mode: "chat",
              contexts,
              onToken: (text: string) => {
                const data = JSON.stringify({ type: "token", content: text });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              },
              onDone: (usage: { input_tokens: number; output_tokens: number }) => {
                const data = JSON.stringify({
                  type: "done",
                  usage,
                  persona: {
                    id: persona.id,
                    name: persona.name.he,
                    domain: persona.domainLabel.he,
                  }
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                controller.close();
              },
              onError: (error: string) => {
                const data = JSON.stringify({ type: "error", error });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                controller.close();
              },
            });
          } catch (error) {
            const data = JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error"
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming fallback (for compatibility)
    return NextResponse.json(
      { error: "Non-streaming mode not implemented for advisor chat" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Advisor chat error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}