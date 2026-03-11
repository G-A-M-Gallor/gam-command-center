-- ===================================================
-- SUP2: Auth Hardening — Enum, Trigger, RLS Fix, Invites
-- ===================================================
-- Fixes:
--   1a. Extend user_role enum to match AuthContext.UserRole
--   1b. Fix handle_new_user() trigger (default 'member', ON CONFLICT DO UPDATE)
--   1c. Fix workspace_read RLS policy (user_id → id)
--   1d. Add user_invites table for future invite flow

-- ─── 1a. Extend user_role enum ───────────────────────
-- Add missing runtime roles. Old values (internal, client, talent, contractor) stay.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'external';

-- ─── 1b. Fix handle_new_user() trigger ───────────────
-- - Read role from raw_user_meta_data if provided
-- - Default to 'member' (not 'internal')
-- - ON CONFLICT DO UPDATE (keeps email/display_name fresh)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')::user_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
        updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 1c. Fix workspace_read RLS policy ───────────────
-- Column in user_profiles is 'id', not 'user_id'
DROP POLICY IF EXISTS "workspace_read" ON workspaces;
CREATE POLICY "workspace_read" ON workspaces
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM user_profiles
      WHERE id = (SELECT auth.uid())
    )
    OR owner_id = (SELECT auth.uid())
  );

-- ─── 1d. Add user_invites table ──────────────────────
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);

ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invites
CREATE POLICY "invites_admin" ON user_invites FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Invited user can read their own invite
CREATE POLICY "invites_self_read" ON user_invites FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
