-- ===================================================
-- Notification Log
-- ===================================================
-- Tracks every push notification sent to users.
-- Used by the "התראות" tab in /dashboard/comms.

CREATE TABLE IF NOT EXISTS notification_log (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comm_message_id TEXT,
  title           TEXT NOT NULL,
  body            TEXT,
  source_type     TEXT NOT NULL DEFAULT 'comm'
                  CHECK (source_type IN ('comm', 'system', 'manual')),
  device_type     TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'sent'
                  CHECK (delivery_status IN ('sent', 'failed', 'clicked')),
  url             TEXT,
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────
CREATE INDEX idx_notification_log_user ON notification_log(user_id);
CREATE INDEX idx_notification_log_created ON notification_log(created_at DESC);

-- ─── RLS ──────────────────────────────────────────
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service insert notifications"
  ON notification_log FOR INSERT
  WITH CHECK (true);
