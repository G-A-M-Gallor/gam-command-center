# Claw-Code Architecture Briefing — for Claude.ai Session
## מסמך העברה: מה למדנו מ-claw-code ומה ליישם ב-GAM Command Center

---

## רקע

ניתחנו את https://github.com/ultraworkers/claw-code — cleanroom rewrite של Claude Code (~20K שורות Rust + Python, 162K stars). מתוך ~100 features שמצאנו, ~40 הם stubs/fakes. זיהינו **5 design patterns אמיתיים** שרלוונטיים למערכת שלנו.

**חשוב:** לא מעתיקים קוד — לומדים patterns ומיישמים בStack שלנו.

---

## Stack שלנו (לא לשנות)

- **Framework:** Next.js App Router + TypeScript
- **DB:** Supabase (PostgreSQL + Edge Functions + Auth + Realtime)
- **Deploy:** Vercel
- **Auth:** OTP SMS + Resend magic link
- **Source of Truth:** Notion → Supabase sync (כל 3 דקות)
- **AI:** Claude API + Gemini Embeddings (768d, gemini-embedding-001)
- **Repo:** G-A-M-Gallor/gam-command-center

### 5 חוקים שלא לשבור
1. **Config over Code** — feature חדש = שורה ב-DB, לא קוד
2. **Tenant-First** — כל טבלה = `tenant_id`
3. **DB-First** — תוכן = DB. דף = נרטיב בלבד
4. **Change-Friendly** — שינוי = עדכון config, לא שכתוב
5. **Rendering Separation** — Data / Logic / UI / Design = שכבות נפרדות

---

## 5 Design Patterns שלמדנו (REAL, לא stubs)

### Pattern 1: Agentic Loop (ConversationRuntime)

**מה זה:** הלולאה המרכזית שמפעילה agent — stream תשובה → זהה tool calls → בדוק הרשאות → הרץ → חזור ל-API עם התוצאות → חזור שוב עד שאין יותר tool calls.

**איך זה עובד ב-claw-code:**
```
User input
  → Build system prompt (CLAUDE.md + git status + OS info + project context)
  → Stream to API (SSE)
  → Parse tool calls from response
  → For each tool:
      → Permission check (5 levels)
      → Pre-hook (can block/modify)
      → Execute tool
      → Post-hook (can log/alert)
  → Append tool results to conversation
  → If tools were called → LOOP BACK to API with results
  → If no tools → return final text to user
  → If tokens exceed threshold → COMPACT (summarize old, keep recent N)
```

**Key struct (Rust):**
```rust
ConversationRuntime<C: ApiClient, T: ToolExecutor> {
    // Generic over client and executor — enables testing with mocks
    fn run_turn() -> TurnSummary {
        // iterations, assistant_messages, tool_results, token_usage
    }
}
```

**ליישם אצלנו:** Scout (AI interface) + Virtual Office agents. כל agent צריך את הלולאה הזו.

---

### Pattern 2: Hook/Event System (Pre/Post Tool Execution)

**מה זה:** לפני ואחרי כל פעולה, hooks חיצוניים יכולים לחסום, לשנות input, או לlog.

**איך זה עובד ב-claw-code:**
```
PreToolUse Hook:
  Input:  JSON on stdin → {tool_name, tool_input, environment}
  Output: JSON → {continue: true/false, decision: "allow"/"block", updatedInput: {...}}
  Exit codes: 0 = allow, 2 = deny, other = warning

PostToolUse Hook:
  Input:  JSON → {tool_name, tool_input, tool_output}
  Purpose: logging, alerting, triggering next action

PostToolUseFailure Hook:
  Input:  JSON → {tool_name, error}
  Purpose: error recovery, alerting
```

**Chain behavior:** Multiple hooks run sequentially. First denial stops the chain.

**ליישם אצלנו:** Workflow OS. Schema מוצע:
```sql
CREATE TABLE event_hooks (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'task.created', 'status.changed', 'document.signed'
  hook_phase TEXT NOT NULL, -- 'pre', 'post', 'on_failure'
  handler_type TEXT NOT NULL, -- 'edge_function', 'make_webhook', 'internal'
  handler_config JSONB NOT NULL, -- {url, headers, timeout, retry_count}
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL
);
```

---

### Pattern 3: Permission Model (5 Levels + Per-Feature Rules)

**מה זה:** מודל הרשאות עם 5 רמות + חוקים per-tool עם pattern matching.

**5 Levels ב-claw-code:**
```
ReadOnly         → קריאה בלבד (Read, Glob, Grep)
WorkspaceWrite   → כתיבה בתוך הפרויקט בלבד
DangerFullAccess → הכל כולל destructive operations
Prompt           → תמיד שואל לפני כל פעולה
Allow            → הכל בלי שאלות
```

**Per-tool rules (pattern matching):**
```
allow: bash(git:*)       → git commands OK
deny:  bash(rm -rf:*)    → destructive commands blocked
ask:   bash(deploy:*)    → always prompt user
```

**Rule types:** `allow`, `deny`, `ask` — evaluated per tool call with subject extraction from input JSON (checks `command`, `path`, `file_path`, `url` fields).

**ליישם אצלנו:** Multi-tenant permissions:
```
viewer  → צפייה בלבד (dashboard, reports)
editor  → עריכת תוכן (tasks, documents)
manager → ניהול צוות (assignments, settings)
admin   → הכל חוץ מ-billing
owner   → הכל כולל billing ו-tenant settings
```

---

### Pattern 4: Context Compaction (Session Summarization)

**מה זה:** כשהשיחה ארוכה מדי (tokens exceed threshold), המערכת מסכמת הודעות ישנות ושומרת רק N אחרונות.

**איך זה עובד ב-claw-code:**
```
1. should_compact() checks:
   - message_count > preserve_recent_messages
   - AND estimated_tokens > max_estimated_tokens

2. compact_session():
   - Keep last N messages AS-IS
   - Summarize the rest into structured summary:
     {
       scope: {user_messages: 12, assistant_messages: 14, tool_calls: 8},
       tools_mentioned: ["Read", "Edit", "Bash"],
       recent_user_requests: ["Fix the login bug", "Add tests"],
       pending_work: ["Deploy to staging", "Update docs"],  // detected by keywords: todo, next, pending, follow up, remaining
       key_files: ["src/auth.ts", "src/api/login.ts"],
       current_work: "Fixing authentication flow",
       timeline: "Started with login bug, moved to tests, now deploying"
     }

3. Multi-round compaction:
   - If already compacted before → merge_compact_summaries()
   - "Previously compacted context" + "Newly compacted context"

4. Summary becomes System message at position 0
```

**ליישם אצלנו:** Scout + vBrain SaaS — כשמשתמש מדבר הרבה, compact את ההיסטוריה:
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  messages JSONB[] DEFAULT '{}',
  compaction_summary JSONB, -- structured summary
  compaction_count INTEGER DEFAULT 0,
  total_tokens_estimate INTEGER DEFAULT 0,
  tenant_id UUID NOT NULL
);
```

---

### Pattern 5: Registry Pattern (Tools, Functions, Agents)

**מה זה:** כל entity ב-system רשום ב-registry מרכזי עם metadata אחיד.

**איך זה עובד ב-claw-code:**
```
ToolSpec {
  name: String,
  description: String,
  input_schema: JSON Schema,
  required_permission: PermissionMode
}

GlobalToolRegistry:
  → merges built-in tools + plugin tools + MCP tools
  → normalizes names
  → filters by permission context
  → generates ToolDefinition structs for API calls
```

**כבר קיים אצלנו:** `WidgetRegistry.ts` — זה בדיוק הpattern.

**ליישם עבור:** Function Registry שמאגד את כל:
- Edge Functions (25+)
- Cron jobs (11)
- Make.com scenarios
- Webhooks
- Notion syncs

```sql
CREATE TABLE function_registry (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'edge_function', 'cron_job', 'make_scenario', 'webhook'
  description TEXT,
  schedule TEXT, -- cron expression if applicable
  config JSONB DEFAULT '{}',
  health_status TEXT DEFAULT 'unknown', -- 'healthy', 'degraded', 'failing', 'unknown'
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  permissions_required TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL
);
```

---

## צוות וירטואלי קיים (vb_tech_team)

### 11 שחקנים פעילים (Barcelona Style):

| # | שם | תפקיד | מחלקה | Level |
|---|-----|--------|--------|-------|
| 1 | Scott | CTO | leadership | 0 |
| 10 | Messi | Frontend Lead | frontend | 1 |
| 6 | Xavi | Backend Lead | backend | 1 |
| 1 | Ter Stegen | DevOps Lead | devops | 1 |
| 5 | Puyol | AI/ML Lead | ai_ml | 1 |
| 16 | Pedri | Frontend Dev | frontend | 2 |
| 30 | Gavi | Frontend Dev | frontend | 2 |
| 3 | Pique | Senior Frontend | frontend | 2 |
| 8 | Iniesta | Senior Backend | backend | 2 |
| 5 | Busquets | Backend Dev | backend | 2 |
| 11 | Neymar | Fullstack Dev | backend | 2 |

### 7 תפקידים חסרים להוסיף:

| שם מוצע | תפקיד | # | מחלקה | למה צריך |
|----------|--------|---|--------|-----------|
| Valdes | Security Lead | 13 | security | RLS, auth, WAF, permissions |
| Dani Alves | Integration Specialist | 22 | integrations | Make.com, Origami, WATI, webhooks |
| Etoo | Product/UX Lead | 9 | product | Design system, UX, Hebrew UI |
| Ronaldinho | Automation Engineer | 21 | automation | Workflow OS, cron, hooks |
| Abidal | Database Specialist | 20 | backend | Migrations, optimization, backup |
| Mascherano | QA Lead | 14 | qa | Testing strategy, automation |
| Fabregas | Data & Analytics Lead | 4 | data | Analytics, dashboards, reporting |

### 6 יועצים (consultants — טבלה נפרדת):

| תפקיד | מתי נקרא | מומחיות |
|--------|----------|---------|
| Architecture Consultant | לפני feature גדול | System design, scalability |
| Security Auditor | כל sprint | Pen testing, RLS review |
| Performance Consultant | כל release | Core Web Vitals, DB optimization |
| Business Analyst | תחילת project | Requirements → specs |
| Code Reviewer | כל PR | Quality gate, best practices |
| DevOps Consultant | Setup + incidents | CI/CD, monitoring, alerting |

---

## מיפוי: מי בונה מה

| Pattern | Builder (existing team) | Consultant | Effort |
|---------|----------------------|------------|--------|
| Function Registry | Xavi + Iniesta | Architecture | S |
| Hook/Event System | Xavi + Busquets + Ronaldinho | Architecture | M |
| Permission Model | Ter Stegen + Valdes | Security Auditor | L |
| Session Compaction | Puyol + Neymar | — | M |
| Config Dashboard | Messi + Pedri | — | S |
| Usage/Cost Tracker | Ter Stegen + Gavi | DevOps | S |
| Agent Runtime Loop | Puyol + Scott | Architecture | L |
| Agent Registry v2 | Scott + Fabregas | — | M |
| Integration Hub | Dani Alves | — | M |
| QA Automation | Mascherano | Code Reviewer | M |

---

## 15-25 Features לאפיון

### Core Patterns (5):
1. Function/Tool Registry — כל הפונקציות במקום אחד עם health
2. Hook/Event System — pre/post actions, Workflow OS foundation
3. Permission Model — 5 levels + per-feature rules
4. Session Compaction — for Scout/vBrain conversations
5. Config Dashboard — unified view of all config sources

### Agent System (5):
6. Agent Registry v2 — vb_tech_team + consultants + capabilities
7. Agent Runtime Loop — agentic execution for each virtual employee
8. Agent Health + Auto-restart — monitoring, failure recovery
9. Task Assignment + Routing — route tasks to right agent by skills
10. Agent Communication — agent-to-agent messaging

### Infrastructure (5):
11. Usage/Cost Tracking — embeddings, compute, API calls
12. Bootstrap Sequence — ordered dashboard loading for perf
13. Error Recovery Recipes — structured recovery patterns
14. Audit Log — who did what, when, on which entity
15. Streaming UI — real-time agent responses in dashboard

### Nice-to-have (5-10):
16. Integration Hub — webhooks, Make, Origami unified
17. Session Forking — branching conversations for exploration
18. Worker Observability — dashboard showing agent activity
19. Automated QA Pipeline — testing per feature
20. Notification System — alerts from hooks/events

---

## DB Tables Reference (existing)

**קיימות:**
- `vb_tech_team` — virtual team members (11 rows)
- `vb_tech_assignments` — task assignments to team members
- `semantic_memory` — 450+ chunks, search via `search_brain_smart()`
- `pm_*` tables — PM hierarchy (App→Goal→Portfolio→Project→Sprint→Task)
- `vb_functions` — function registry (partial)
- `backup_logs`, `project_memory` — operational tables

**להוסיף:**
- `vb_consultants` — external consultant definitions
- `event_hooks` — Workflow OS hook definitions
- `function_registry` — unified function/cron/webhook registry
- `chat_sessions` — Scout conversation persistence
- `permission_rules` — per-feature permission thresholds
- `audit_log` — who did what, when
- `usage_tracking` — cost/usage metrics

---

## Important: What NOT to copy from claw-code

| Don't Copy | Why |
|-----------|-----|
| Python tool stubs | They're shims that return descriptive strings, not real execution |
| Token counting by word split | Use proper token counting or API usage data |
| Plugin dynamic loading | We use Config over Code — no plugin system needed |
| Vim mode / REPL | Not relevant to web dashboard |
| Sandbox/namespace isolation | Supabase RLS handles our isolation |
| SSE parser | Supabase Realtime handles streaming |
| Multi-provider API client | We use Claude API + Gemini only |
| MCP transport implementation | Claude Code already handles MCP for us |

---

## Action Plan

**Phase 1 (Quick Wins — S effort):**
- Function Registry table + dashboard widget
- Config Dashboard (read-only unified view)
- Usage/Cost Tracker

**Phase 2 (Core — M effort):**
- Hook/Event System (Workflow OS foundation)
- Agent Registry v2 (7 new team members + consultants)
- Session Compaction for Scout

**Phase 3 (Major — L effort):**
- Permission Model (5 levels)
- Agent Runtime Loop
- Full Integration Hub

---

*Generated from claw-code analysis session — 2026-04-04*
*GAM Command Center — vBrain.io*
