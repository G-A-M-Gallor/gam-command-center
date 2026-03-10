# Sentry Auto-Fix Pipeline — Full Spec

## Overview
Automated error detection → diagnosis → fix pipeline using Sentry + Claude API + Claude Code SDK.
Approved by Gal on 2026-03-07. Build incrementally: Level 1 → 2 → 3.

## Prerequisites (User Action Required)
1. **Sentry account** — sentry.io (free tier: 5K errors/month) → create Next.js project → copy DSN
2. **PAT workflow scope** — current GitHub PAT lacks `workflow` scope, needed for CI push
3. **Claude API key** — already exists in project (used by AI Hub)
4. **n8n instance** — already in architecture (used for Origami sync)

## Level 1 — Smart Alert (Sentry → Claude → GitHub Issue)

### Flow
```
Error in production
  → Sentry captures + groups
  → Sentry webhook fires (on new issue or threshold)
  → n8n receives webhook
  → n8n calls Claude API with:
      - error message + stack trace
      - affected file + line number
      - browser/OS info
      - user action that triggered it
      - occurrence count
  → Claude returns JSON:
      { diagnosis, rootCause, severity, affectedComponent, suggestedApproach }
  → n8n creates GitHub Issue via API with:
      - Title: [Sentry-{id}] {diagnosis summary}
      - Body: full analysis, stack trace, reproduction steps
      - Labels: bug, sentry, severity-{level}
```

### Implementation
- **API route:** `src/app/api/webhooks/sentry/route.ts`
  - Receives Sentry webhook (verify signature with SENTRY_CLIENT_SECRET)
  - Deduplicates (skip if GitHub issue already exists for this Sentry issue ID)
  - Calls Claude API for analysis
  - Creates GitHub issue via Octokit or gh API
- **n8n alternative:** Could use n8n webhook node instead of API route — depends on preference
- **Sentry config:** Webhook integration → point to our endpoint

## Level 2 — Fix Suggestion (+ Source Code Analysis)

### Additional Flow (extends Level 1)
```
After diagnosis...
  → n8n/route fetches affected source file from GitHub API
  → Sends to Claude with: "Here's the file, here's the error, write a fix"
  → Claude returns diff/code block
  → Appended to GitHub Issue body under "## Suggested Fix" section
```

### Key Details
- Use GitHub API `repos/{owner}/{repo}/contents/{path}` to fetch source
- Claude prompt includes: file content, error context, project conventions from CLAUDE.md
- Fix shown as ```diff block in issue body
- Developer reviews manually before applying

## Level 3 — Auto-Fix PR (Claude Code SDK)

### Additional Flow (extends Level 2)
```
If severity >= high AND Claude confidence >= 0.8...
  → Trigger Claude Code SDK agent
  → Agent: git checkout -b fix/sentry-{id}
  → Agent reads codebase, understands context
  → Agent writes fix + adds/updates tests
  → Agent runs: npx tsc --noEmit && npx vitest run
  → If tests pass: git push + gh pr create
  → PR body includes: Sentry link, diagnosis, what was changed and why
  → Assign to Gal for review
```

### Safety Guards
- **Only auto-PR for high confidence fixes** — low confidence stays as Issue (Level 2)
- **Must pass tsc + vitest** before PR creation
- **Human review required** — never auto-merge
- **Rate limit:** max 3 auto-PRs per hour
- **Exclude list:** never auto-fix auth, payment, or data migration code

### Claude Code SDK Usage
```bash
# Option A: CLI mode
claude-code --api-key $KEY --repo . --task "Fix Sentry error: {description}" --branch fix/sentry-{id}

# Option B: Agent SDK (programmatic)
import { Agent } from 'claude-agent-sdk';
const agent = new Agent({ apiKey, repo, task });
const result = await agent.run();
```

## Task Dependencies
```
#81 Sentry account + DSN         [user action]
  → #82 Install @sentry/nextjs
    → #83 Wire into error boundaries + useAutoSave
      → #85 Level 1: webhook → Claude → Issue
        → #86 Level 2: + source analysis + fix suggestion
          → #87 Level 3: Claude Code SDK → auto PR

#84 Push CI workflow             [user action — PAT scope]
```

## Changelog IDs for admin/data.ts
- `sentry-error-tracking` — existing entry (task #39/#81-83)
- Need new entries for: `sentry-auto-diagnosis` (L1), `sentry-fix-suggestions` (L2), `sentry-auto-fix-pr` (L3)
