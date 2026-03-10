import { readFileSync } from "fs";
import { join } from "path";

// ─── GAM Knowledge Base ─────────────────────────────────────
// Reads key sections from CLAUDE.md at startup and caches them.
// Injected into AI system prompts so the assistant knows about GAM.

const MAX_CHARS = 3000;

const SECTIONS_TO_EXTRACT = [
  "Project Overview",
  "Architecture — Who Does What",
  "Design Conventions",
  "Coding Conventions",
  "Important Context",
  "Known Issues",
];

let cachedKnowledge: string | null = null;

function extractSections(markdown: string): string {
  const lines = markdown.split("\n");
  const chunks: string[] = [];
  let capturing = false;
  let currentChunk: string[] = [];

  for (const line of lines) {
    // Detect ## headings
    const headingMatch = line.match(/^##\s+(?:🎯|🏗️|🎨|🔧|🔑|🐛)?\s*(.+)/);
    if (headingMatch) {
      // Save previous chunk if we were capturing
      if (capturing && currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n"));
      }
      // Check if this heading matches one we want
      const title = headingMatch[1].trim();
      capturing = SECTIONS_TO_EXTRACT.some((s) => title.includes(s));
      currentChunk = capturing ? [line] : [];
      continue;
    }

    // Stop at next ## heading if not matching
    if (line.startsWith("## ") && capturing) {
      chunks.push(currentChunk.join("\n"));
      capturing = false;
      currentChunk = [];
      continue;
    }

    if (capturing) {
      // Skip verbose sub-tables (widget list, API route table, folder tree)
      if (line.includes("| `") && (line.includes("Widget") || line.includes(".tsx"))) continue;
      currentChunk.push(line);
    }
  }

  // Don't forget last chunk
  if (capturing && currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n"));
  }

  return chunks.join("\n\n").slice(0, MAX_CHARS);
}

export function getKnowledgeContext(): string {
  if (cachedKnowledge !== null) return cachedKnowledge;

  try {
    const filePath = join(process.cwd(), "CLAUDE.md");
    const content = readFileSync(filePath, "utf-8");
    cachedKnowledge = extractSections(content);
  } catch {
    // File not found or read error — graceful fallback
    cachedKnowledge = "";
  }

  return cachedKnowledge;
}
