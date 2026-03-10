-- ═══════════════════════════════════════════════════════════
-- Migration: user_action_permissions
-- Per-user permission overrides for entity action buttons.
-- Columns match permissionQueries.ts fetchActionPermissions().
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_action_permissions (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  can_export_csv   BOOLEAN,
  can_delete       BOOLEAN,
  can_bulk_update  BOOLEAN,
  can_bulk_status  BOOLEAN,
  can_bulk_assign  BOOLEAN,
  can_manage_users BOOLEAN,
  can_edit         BOOLEAN,
  granted_by       UUID REFERENCES auth.users(id),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_user_action_permissions
  BEFORE UPDATE ON user_action_permissions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE user_action_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own permissions
CREATE POLICY "Users read own permissions"
  ON user_action_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read/write all permissions
CREATE POLICY "Admins manage all permissions"
  ON user_action_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );
