-- ===================================================
-- PLT2: Push Notification Subscriptions
-- ===================================================
-- Table for storing Web Push API subscription data.
-- Used by /api/push/subscribe (POST upsert, DELETE remove).
-- Columns match the existing route.ts: user_id, endpoint,
-- p256dh, auth, email, created_at, updated_at.

-- ─── Table ──────────────────────────────────────────
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

-- ─── Index for user lookups ─────────────────────────
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ─── RLS ────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users read own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Insert/update via service role (server-side subscribe endpoint)
-- The API route uses createClient() which runs as the authenticated user
-- with service-level insert permissions.
CREATE POLICY "Authenticated users insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
