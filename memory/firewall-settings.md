---
name: Firewall & Rate Limit Settings
description: All security limits and how to temporarily adjust them for bulk operations (import, sync, etc.)
type: reference
---

# Firewall & Rate Limit Settings — vBrain.io

> Last updated: 2026-03-14

## Quick Reference — Current Limits

### Vercel Dashboard (Edge — before server)

**Dashboard URL:** https://vercel.com/supabase-vercel/gam-command-center/firewall/rules

**Active rules (free tier):**

| Rule | Path | Action | Status |
|------|------|--------|--------|
| API General Rate Limit | `/api/` starts with | Rate Limit 100/min per IP | ✅ Active |

**Pending rules (requires Pro plan — $20/mo):**

| Rule | Path | Action | Status |
|------|------|--------|--------|
| AI Routes Rate Limit | `/api/ai/` starts with | Rate Limit 30/min per IP | ⏳ Needs Pro |
| Work Manager Rate Limit | `/api/work-manager` starts with | Rate Limit 15/min per IP | ⏳ Needs Pro |
| Admin Geo Lock | `/dashboard/admin` starts with | Deny if country ≠ IL | ⏳ Needs Pro (Deny is free but Geo condition needs Pro) |

**Note:** Rate Limit action requires Vercel Pro. Deny/Challenge/Log are free but limited conditions.
When upgrading to Pro, add the 3 pending rules above.

### Code-Level Rate Limiting (`src/lib/api/rate-limit.ts`)

| Name | Routes | Limit | Window |
|------|--------|-------|--------|
| `ai` | `/api/ai/chat`, `/api/ai/boardroom`, `/api/matching/*` | 30 req | 60s |
| `auth` | `/api/auth/complete-registration` | 10 req | 60s |
| `workManager` | `/api/work-manager`, `/api/work-manager/execute` | 10 req | 60s |
| `general` | (available for other routes) | 60 req | 60s |
| `webhook` | (available for webhook routes) | 100 req | 60s |

### AI Token Budget (per user, in DB)

| Limit | Value | Location |
|-------|-------|----------|
| Daily token budget | 100,000 tokens/day | Supabase RPC `check_ai_budget` |

### Security Headers (`next.config.ts`)

| Header | Value |
|--------|-------|
| HSTS | max-age=63072000; includeSubDomains; preload |
| CSP | Restrictive — self + Supabase + Anthropic + Sentry + Vercel |
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |

### WAF Deny Rules (`vercel.json`)

Blocked paths at edge: `/.env`, `/.git`, `/wp-admin`, `/phpMyAdmin`, `/cgi-bin`, `/xmlrpc.php`, etc.

### Honeypot Blocking (`src/proxy.ts`)

20+ attack paths return 404 in middleware.

---

## How to Temporarily Raise Limits

### Scenario: Bulk Import / Sync / Migration

When you need to run a heavy operation (import, Origami sync, batch matching), limits may block you.

#### Step 1 — Raise Code Limits (instant)

Edit `src/lib/api/rate-limit.ts`, change the relevant preset:

```ts
// BEFORE (normal)
ai: { name: "ai", limit: 30, windowSeconds: 60 },
general: { name: "general", limit: 60, windowSeconds: 60 },

// DURING BULK OP (temporary)
ai: { name: "ai", limit: 500, windowSeconds: 60 },
general: { name: "general", limit: 500, windowSeconds: 60 },
```

#### Step 2 — Raise Vercel Dashboard Limits (if on Pro plan)

1. Go to: https://vercel.com/supabase-vercel/gam-command-center/firewall/rules
2. Edit "API General Rate Limit" → change 100 to **500**
3. Edit relevant route rule if needed
4. Save

#### Step 3 — Run Your Operation

Do the import / sync / migration.

#### Step 4 — Restore Limits (MANDATORY)

1. Revert `rate-limit.ts` to original values
2. Revert Vercel Dashboard rules to original values
3. Commit + push

**Never leave raised limits in production overnight.**

---

## Architecture — 4 Layers of Protection

```
Request from browser
  │
  ├─ Layer 1: Vercel Edge WAF (vercel.json deny rules)
  │   └─ Blocks attack paths before reaching server
  │
  ├─ Layer 2: Vercel Firewall Dashboard (rate limiting)
  │   └─ Per-IP rate limits at edge level
  │
  ├─ Layer 3: Middleware (src/proxy.ts)
  │   └─ Honeypot path blocking + auth redirect
  │
  ├─ Layer 4: API Route (src/lib/api/rate-limit.ts)
  │   └─ Per-IP sliding window rate limit in code
  │
  └─ Layer 5: Business Logic
      └─ Auth (JWT/cookie) + Zod validation + AI token budget
```

---

## Vercel Project Info

- **Team:** vBrain (`team_D6JOkt9VT6PGgt9MZrr5Mu8Z`)
- **Project:** gam-command-center (`prj_dq9jTVWiLElX8YVgCvhWEvbYvwYD`)
- **Domains:** vbrain.io, www.vbrain.io, gam-command-center.vercel.app
