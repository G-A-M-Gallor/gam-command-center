// ===================================================
// GAM Command Center — AI Chat Integration
// System prompt builder + Anthropic API call
// ===================================================

import type { PMContext } from "@/lib/pm-types";

// ─── System Prompt ──────────────────────────────────

export function buildSystemPrompt(_context: PMContext): string {
  return `אתה Claude — עוזר AI של GAM Command Center.
אתה מכיר את כל הנתונים ומדבר עברית תמיד.

== מצב נוכחי ==
Sprints פעילים: ${context.activeSprints.map((s) => s.title).join(", ") || "אין"}
משימות פתוחות: ${context.openTasks.length}
משימות חסומות: ${context.blockedTasks.length}

== משימות דחופות ==
${
  context.urgentTasks
    .slice(0, 5)
    .map(
      (_t) =>
        `- ${t.title} | ${t.status} | ${t.worker || "לא משויך"} | ${t.due_date || "ללא תאריך"}`,
    )
    .join("\n") || "אין משימות דחופות"
}

== סיכונים ==
${
  context.risks
    .map((r) => `[${r.level.toUpperCase()}] ${r.title}: ${r.description}`)
    .join("\n") || "אין סיכונים פעילים"
}

ענה בקצרה ובבהירות. אם אתה לא בטוח — אמור.`;
}

// ─── Chat API Call ───────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAI(
  userMessage: string,
  _context: PMContext,
): Promise<string> {
  const res = await fetch("/api/ai-chat", {
    method: "POST",
    _headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: buildSystemPrompt(_context),
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`AI Chat error: ${res.status}`);
  }

  const data = await res.json();
  // Handle Anthropic API response format
  if (data.content?.[0]?.text) return data.content[0].text;
  if (data.message) return data.message;
  if (typeof data === "string") return data;
  return "לא הצלחתי לעבד את התשובה";
}
