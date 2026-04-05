-- =============================================
-- SECURITY FIX: Talent Pool Data Protection
-- Issue: All authenticated users could see all talent profiles
-- Fix: Role-based access control for user_profiles
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;

-- Create secure, role-based read policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin and internal can read all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'internal')
    )
  );

CREATE POLICY "Talent profiles are private"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    role != 'talent' OR
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'internal')
    )
  );

-- Secure workspace-based access for same workspace users
CREATE POLICY "Same workspace profile visibility"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    workspace_id IS NOT NULL AND
    workspace_id = (
      SELECT workspace_id FROM user_profiles
      WHERE id = auth.uid()
    )
    AND role != 'talent' -- Talent still protected even within workspace
  );

-- Update policies are already secure (only own profile)
-- Insert policies are already secure (only own profile)

-- Add audit logging for profile access
CREATE OR REPLACE FUNCTION log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when sensitive talent profiles are accessed
  IF NEW.role = 'talent' AND auth.uid() != NEW.id THEN
    INSERT INTO audit_log (
      table_name,
      record_id,
      action,
      performed_by,
      performed_at,
      details
    ) VALUES (
      'user_profiles',
      NEW.id,
      'talent_profile_accessed',
      auth.uid(),
      NOW(),
      jsonb_build_object('accessed_profile_id', NEW.id, 'accessor_id', auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Audit trigger will be added if audit_log table exists
-- For now, we're focusing on the core security fix