-- ===================================================
-- ENT11: Notification Enhancement
-- ===================================================
-- Adds user_id, action_url, channel to dashboard_notifications
-- for per-user notifications, click-to-navigate, and multi-channel support.

ALTER TABLE dashboard_notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'in-app';

-- Index for fast unread-per-user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON dashboard_notifications(user_id, is_read)
  WHERE is_read = false;

-- Enable Realtime for live push
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_notifications;
