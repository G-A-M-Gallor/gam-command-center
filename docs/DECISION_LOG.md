# DECISION LOG — vBrain.io / GAM Command Center

> Architectural decisions, external review findings, and governance records.
> Each entry is immutable — append only. Never delete or modify past entries.

---

## Format

```
### DECISION-{NNN} — {Title}
- **Date:** YYYY-MM-DD
- **Source:** {who raised it — internal / external review / ChatGPT / Claude / Gal}
- **Status:** accepted / partial / rejected / deferred
- **Context:** {why this came up}
- **Decision:** {what was decided}
- **Consequences:** {what this means going forward}
```

---

## Entries

### DECISION-001 — RLS policies must be user-scoped before portal work
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** accepted
- **Context:** All RLS policies are currently `USING(true)` — open to any authenticated user. This is acceptable for internal-only use (email allowlist enforces team boundary) but is not real row-level security.
- **Decision:** Real RLS with `user_id` / `workspace_id` filtering is required before any client portal, talent portal, or multi-tenant work begins. Current permissive policies remain for the internal-only MVP phase.
- **Consequences:** No portal features until RLS is hardened. Milestone: "RLS hardening" must precede "client portal" on the roadmap.

### DECISION-002 — Add role enum to user profiles table
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** accepted
- **Context:** No role system exists. The system is single-persona (authenticated = full access).
- **Decision:** Add a `user_role` enum (`internal`, `client`, `talent`, `admin`) to a `user_profiles` table. Schema-first — enforcement comes in a later phase.
- **Consequences:** Enables future role-based routing, RLS per-role, and portal differentiation. Estimated effort: S (1-2 hours).

### DECISION-003 — MCP credentials are local-only, not a repo leak
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** partial (lower severity than flagged)
- **Context:** `.mcp.json` contains API keys (GitHub PAT, Notion token, Gemini key). Review flagged this as urgent.
- **Decision:** File is in `.gitignore`, never committed to repo. Risk is local machine compromise, not public exposure. Still — rotation is recommended as a hygiene practice. Gal to rotate tokens within the week.
- **Consequences:** No emergency action needed. Added to routine security hygiene checklist.

### DECISION-004 — Move token budget enforcement to server-side
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** accepted
- **Context:** AI token budget (100K/day) is tracked in `localStorage` only — trivially bypassable.
- **Decision:** Add a Supabase-backed counter in the `/api/ai/chat` route handler. Check budget before calling Anthropic API. Client-side tracker remains as UX indicator.
- **Consequences:** Estimated effort: M (3-4 hours). Requires a new `ai_usage` table or column in `user_profiles`.

### DECISION-005 — Create docs/DECISION_LOG.md
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** accepted — done immediately
- **Context:** No governance documentation existed. Decisions were scattered across CLAUDE.md, memory files, and chat sessions.
- **Decision:** Created `docs/DECISION_LOG.md` as the canonical decision record. Append-only format.
- **Consequences:** All future architectural decisions logged here.

### DECISION-006 — Add "demo data" banner to Layers page
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** accepted
- **Context:** Layers page falls back to hardcoded demo data when the `projects` table is empty. Team could be misled into thinking data is real.
- **Decision:** Add a visible warning banner when displaying fallback data. Also document n8n sync effort estimate.
- **Consequences:** UI change: S effort (30 min). n8n Origami sync: L effort (1-2 weeks, depends on Origami API access — external dependency).

### DECISION-007 — Next.js version is 16.1.6, not 15.5.1
- **Date:** 2026-03-06
- **Source:** Internal discovery (Claude Code session)
- **Status:** accepted
- **Context:** CLAUDE.md and Notion page stated Next.js 15.5.1. Actual runtime is Next.js 16.1.6 (Turbopack). The `proxy.ts` convention (not `middleware.ts`) is correct for v16.
- **Decision:** Update all documentation to reflect Next.js 16.1.6. `src/proxy.ts` with `export function proxy()` is the correct pattern.
- **Consequences:** CLAUDE.md needs update. Notion page already updated.

### DECISION-008 — External Review Governance Protocol established
- **Date:** 2026-03-06
- **Source:** External review (ChatGPT via Gal)
- **Status:** accepted
- **Context:** First external review received. No protocol existed for handling external feedback.
- **Decision:** All external reviews are logged in DECISION_LOG.md with point-by-point response (accepted/partial/rejected + reason). Immediate actions executed same-session. Deferred items get effort estimates and roadmap placement.
- **Consequences:** This entry establishes the protocol for all future reviews.
