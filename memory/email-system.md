# Email System — vBrain.io

## Architecture
- **Provider:** Resend (vbrain.io domain, verified)
- **Webhook:** Svix signature verification
- **Multi-tenant:** email_tenants table (vbrain.io = system tenant)
- **Templates:** React Email components (9 templates) + Unlayer drag-and-drop (future)
- **Tracking:** Full event pipeline — sent → delivered → opened → clicked → bounced → complained

## ENV Vars
| Key | Purpose |
|-----|---------|
| `RESEND_API_KEY` | Full-access key (sending + webhooks + domains) |
| `RESEND_WEBHOOK_SECRET` | Svix signing secret for webhook verification |

## Resend Config
- **Domain:** vbrain.io (verified 2026-03-14)
- **Webhook ID:** `45994911-6d8a-461c-9024-6238ae5e9544`
- **Webhook endpoint:** `https://vbrain.io/api/email/webhook/resend`
- **Events tracked:** email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
- **gam.co.il:** NOT needed — vbrain.io is the platform, GAM is a client

## Database Tables
| Table | Purpose |
|-------|---------|
| `email_tenants` | Multi-domain from/reply-to/logo/signature/brand |
| `email_templates` | React + Unlayer templates with variables |
| `email_sends` | Every sent email — full audit trail |
| `email_events` | Raw Resend webhook events |
| `email_unsubscribes` | GDPR/CAN-SPAM compliance |

## API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/email/send` | POST | Send email via Resend |
| `/api/email/sends` | GET | List sent emails with tracking |
| `/api/email/templates` | GET/POST/PUT/DELETE | Template CRUD |
| `/api/email/tenants` | GET/POST/PUT | Tenant CRUD |
| `/api/email/webhook/resend` | POST | Resend webhook receiver |
| `/api/email/unsubscribe` | POST | Public unsubscribe handler |

## React Email Templates (9)
BaseLayout, WelcomeEmail, OtpEmail, ResetPasswordEmail, CaseUpdateEmail,
DocumentReadyEmail, MeetingReminderEmail, InvoiceEmail, NewMessageEmail

## UI Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `SendEmailModal` | `src/components/email/` | Compose & send emails |
| `EmailDetailPanel` | `src/components/email/` | Email detail + tracking timeline |
| `EmailStatsWidget` | `src/components/email/` | TopBar widget — stats & rates |
| Comms Email Tab | `src/app/dashboard/comms/` | Email list in comms page |

## Commits
- `53e0ddb` — Layer 1: Resend integration, 9 React templates, 6 API routes, multi-tenant
- `deaf251` — Layer 2: Email UI — comms tab, send modal, detail panel, stats widget
- `d28a037` — Svix webhook signature verification

## Decisions
- vbrain.io is the platform domain for ALL email sending
- GAM is a tenant/client, not a separate domain
- Old restricted API key replaced with full-access key (2026-03-14)
