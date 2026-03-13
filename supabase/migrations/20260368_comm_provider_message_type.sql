-- ============================================================
-- Migration: Add provider + message_type to comm_messages
-- Purpose: Support multiple SMS/email providers + OTP separation
-- Providers: slng, 019, wati, voicenter, manual
-- Message types: regular, otp, marketing, transactional
-- ============================================================

-- ─── Add sms to channel CHECK ─────────────────────────────────
ALTER TABLE comm_messages DROP CONSTRAINT IF EXISTS comm_messages_channel_check;
ALTER TABLE comm_messages ADD CONSTRAINT comm_messages_channel_check
  CHECK (channel IN ('whatsapp', 'phone', 'email', 'sms', 'note', 'reminder'));

-- ─── Add sms to templates too ─────────────────────────────────
ALTER TABLE comm_templates DROP CONSTRAINT IF EXISTS comm_templates_channel_check;
ALTER TABLE comm_templates ADD CONSTRAINT comm_templates_channel_check
  CHECK (channel IN ('whatsapp', 'phone', 'email', 'sms'));

-- ─── Provider field ───────────────────────────────────────────
ALTER TABLE comm_messages ADD COLUMN IF NOT EXISTS
  provider TEXT DEFAULT NULL;

COMMENT ON COLUMN comm_messages.provider IS 'Service that sent/received: slng, 019, wati, voicenter, manual';

CREATE INDEX idx_comm_messages_provider ON comm_messages(provider) WHERE provider IS NOT NULL;

-- ─── Message type field ───────────────────────────────────────
ALTER TABLE comm_messages ADD COLUMN IF NOT EXISTS
  message_type TEXT NOT NULL DEFAULT 'regular'
  CHECK (message_type IN ('regular', 'otp', 'marketing', 'transactional'));

COMMENT ON COLUMN comm_messages.message_type IS 'Message sub-type: regular, otp, marketing, transactional';

CREATE INDEX idx_comm_messages_type ON comm_messages(message_type);

-- ─── Composite index for common filter combo ──────────────────
CREATE INDEX idx_comm_messages_channel_provider
  ON comm_messages(channel, provider);

CREATE INDEX idx_comm_messages_channel_type
  ON comm_messages(channel, message_type);
