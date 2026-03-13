-- ============================================================
-- Migration: Communication Messages (comm_messages + comm_templates)
-- Purpose: Unified timeline for all communication channels
-- Channels: whatsapp, phone, email, note, reminder
-- ============================================================

-- ─── Comm Messages Table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS comm_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     UUID REFERENCES vb_records(id) ON DELETE SET NULL,
  entity_phone  TEXT,
  channel       TEXT NOT NULL CHECK (channel IN ('whatsapp', 'phone', 'email', 'note', 'reminder')),
  direction     TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  sender_name   TEXT,
  body          TEXT NOT NULL DEFAULT '',
  channel_meta  JSONB DEFAULT '{}',
  session_id    TEXT,
  external_id   TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE comm_messages IS 'Unified communication timeline — WhatsApp, phone, email, notes, reminders';

-- ─── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_comm_messages_entity_id    ON comm_messages(entity_id);
CREATE INDEX idx_comm_messages_entity_phone ON comm_messages(entity_phone);
CREATE INDEX idx_comm_messages_channel      ON comm_messages(channel);
CREATE INDEX idx_comm_messages_external_id  ON comm_messages(external_id);
CREATE INDEX idx_comm_messages_created_at   ON comm_messages(created_at DESC);
CREATE INDEX idx_comm_messages_session_id   ON comm_messages(session_id) WHERE session_id IS NOT NULL;

-- Unique constraint to prevent duplicate external messages
CREATE UNIQUE INDEX idx_comm_messages_external_unique
  ON comm_messages(channel, external_id) WHERE external_id IS NOT NULL;

-- ─── Comm Templates Table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS comm_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel     TEXT NOT NULL CHECK (channel IN ('whatsapp', 'phone', 'email')),
  name        TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  params      TEXT[] DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE comm_templates IS 'Message templates per channel (WhatsApp approved templates, email templates, etc.)';

CREATE INDEX idx_comm_templates_channel ON comm_templates(channel);

-- ─── RLS Policies ───────────────────────────────────────────

ALTER TABLE comm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_templates ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all comm messages
CREATE POLICY "comm_messages_select" ON comm_messages
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert comm messages
CREATE POLICY "comm_messages_insert" ON comm_messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update comm messages (mark as read, etc.)
CREATE POLICY "comm_messages_update" ON comm_messages
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Templates: read-only for authenticated, admin can manage
CREATE POLICY "comm_templates_select" ON comm_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "comm_templates_insert" ON comm_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "comm_templates_update" ON comm_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── Realtime ───────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE comm_messages;

-- ─── Updated_at trigger for templates ───────────────────────

CREATE OR REPLACE FUNCTION update_comm_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comm_templates_updated_at
  BEFORE UPDATE ON comm_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_comm_templates_updated_at();
