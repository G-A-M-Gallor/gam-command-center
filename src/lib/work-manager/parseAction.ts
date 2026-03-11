export interface WorkAction {
  type: "create_task" | "update_status" | "add_note" | "invoke_persona" | "create_notion_task" | "create_entity";
  title: string;
  details: Record<string, string>;
}

/**
 * Extract balanced JSON object starting at ACTION: marker.
 * Counts braces to handle nested objects like { details: { key: "val" } }.
 */
function extractJsonBlock(content: string): { raw: string; json: string } | null {
  const marker = content.indexOf("ACTION:");
  if (marker === -1) return null;

  const start = content.indexOf("{", marker);
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") depth--;
    if (depth === 0) {
      return {
        raw: content.slice(marker, i + 1),
        json: content.slice(start, i + 1),
      };
    }
  }
  return null;
}

/**
 * Parse an ACTION:{...} block from assistant message content.
 * Returns the clean text (without the ACTION block) and the parsed action, or null.
 */
export function parseAction(content: string): {
  text: string;
  action: WorkAction | null;
} {
  const block = extractJsonBlock(content);
  if (!block) {
    return { text: content, action: null };
  }

  const text = content.replace(block.raw, "").trim();

  try {
    const parsed = JSON.parse(block.json);

    if (
      typeof parsed.type === "string" &&
      typeof parsed.title === "string" &&
      typeof parsed.details === "object" &&
      parsed.details !== null
    ) {
      return {
        text,
        action: {
          type: parsed.type,
          title: parsed.title,
          details: parsed.details,
        },
      };
    }
  } catch {
    // Malformed JSON — ignore
  }

  return { text: content, action: null };
}

// ─── Confidence Badge Parser ────────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low" | null;

export function parseConfidence(content: string): { text: string; confidence: ConfidenceLevel } {
  // Match trailing confidence emoji (possibly with text after it on the same line)
  const match = content.match(/\n?[🟢🟡🔴]\s*(\(.+?\))?\s*$/u);
  if (!match) return { text: content, confidence: null };

  const emoji = match[0].includes('🟢') ? 'high' : match[0].includes('🟡') ? 'medium' : 'low';
  return { text: content.slice(0, match.index).trimEnd(), confidence: emoji };
}
