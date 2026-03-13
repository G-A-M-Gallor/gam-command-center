-- Add preferences JSONB column to push_subscriptions
-- Default '{}' means all channels enabled (backward compatible)

-- Ensure the table exists (idempotent — matches 20260362 schema)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

COMMENT ON COLUMN push_subscriptions.preferences IS
  'Per-channel notification preferences. Keys: whatsapp, phone, sms, email, note, reminder, sync_summary. true/undefined = on, false = off.';
