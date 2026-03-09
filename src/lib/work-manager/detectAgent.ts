// ===================================================
// Work Manager — Agent Router
// ===================================================
// Analyzes the user's last message and routes to the
// best-fit agent. Priority: explicit @mention → keyword
// scoring → orchestrator fallback.

import type { AgentType } from "./agentPrompts";

// ─── Explicit mention patterns ───────────────────────

const EXPLICIT_PATTERNS: { pattern: RegExp; agent: AgentType }[] = [
  { pattern: /@pm\b/i, agent: "pm" },
  { pattern: /@dev\b/i, agent: "dev" },
  { pattern: /@design\b/i, agent: "design" },
  { pattern: /@qa\b/i, agent: "qa" },
  { pattern: /@strategy\b/i, agent: "strategy" },
  { pattern: /@orchestrator\b/i, agent: "orchestrator" },
  // Hebrew explicit
  { pattern: /שאל את (ה)?מנהל (ה)?פרויקט/i, agent: "pm" },
  { pattern: /שאל את (ה)?מפתח/i, agent: "dev" },
  { pattern: /שאל את (ה)?מעצב/i, agent: "design" },
  { pattern: /שאל את (ה)?בודק/i, agent: "qa" },
  { pattern: /שאל את (ה)?אסטרטג/i, agent: "strategy" },
];

// ─── Keyword clusters ────────────────────────────────

const KEYWORD_CLUSTERS: { agent: AgentType; keywords: string[] }[] = [
  {
    agent: "pm",
    keywords: [
      "sprint", "deadline", "timeline", "milestone", "backlog", "priority",
      "task", "status", "progress", "velocity", "burndown", "kanban",
      "epic", "story", "standup", "retro", "scope",
      "משימה", "לוח זמנים", "דדליין", "ספרינט", "עדיפות", "סטטוס",
      "התקדמות", "אבן דרך", "בקלוג",
    ],
  },
  {
    agent: "dev",
    keywords: [
      "code", "api", "bug", "deploy", "database", "schema", "route",
      "component", "function", "architecture", "typescript", "supabase",
      "next.js", "nextjs", "tailwind", "migration", "endpoint", "refactor",
      "performance", "cache", "query", "hook", "context", "middleware",
      "קוד", "באג", "דיפלוי", "ארכיטקטורה", "קומפוננטה", "מיגרציה",
      "שגיאה", "תיקון",
    ],
  },
  {
    agent: "design",
    keywords: [
      "ui", "ux", "design", "color", "layout", "responsive", "mobile",
      "font", "component spec", "figma", "mockup", "wireframe", "icon",
      "spacing", "animation", "dark mode", "accessibility", "a11y", "rtl",
      "עיצוב", "ממשק", "צבע", "פונט", "רספונסיבי", "נגישות",
    ],
  },
  {
    agent: "qa",
    keywords: [
      "test", "bug report", "regression", "coverage", "quality",
      "validation", "e2e", "unit test", "playwright", "vitest",
      "checklist", "severity", "reproduce",
      "בדיקות", "בדיקה", "באג", "כיסוי", "איכות",
    ],
  },
  {
    agent: "strategy",
    keywords: [
      "revenue", "market", "roadmap", "competition", "pricing", "business",
      "growth", "roi", "unit economics", "swot", "go-to-market", "expansion",
      "customer", "sales", "marketing", "profit", "cost", "budget",
      "אסטרטגיה", "שוק", "הכנסות", "תחרות", "מחיר", "צמיחה",
      "לקוחות", "שיווק", "מכירות", "תקציב",
    ],
  },
];

// ─── detectAgent ─────────────────────────────────────

export function detectAgent(lastMessage: string): AgentType {
  const msg = lastMessage.toLowerCase();

  // 1. Explicit @mention or Hebrew phrase
  for (const { pattern, agent } of EXPLICIT_PATTERNS) {
    if (pattern.test(lastMessage)) return agent;
  }

  // 2. Keyword scoring
  const scores: Partial<Record<AgentType, number>> = {};

  for (const { agent, keywords } of KEYWORD_CLUSTERS) {
    let score = 0;
    for (const kw of keywords) {
      if (msg.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > 0) {
      scores[agent] = score;
    }
  }

  const entries = Object.entries(scores) as [AgentType, number][];

  if (entries.length === 0) {
    // No keyword matches → orchestrator
    return "orchestrator";
  }

  // Sort by score descending
  entries.sort((a, b) => b[1] - a[1]);

  // Exact tie between top two → orchestrator (ambiguous)
  if (entries.length >= 2 && entries[0][1] === entries[1][1]) {
    return "orchestrator";
  }

  return entries[0][0];
}
