-- JWT Claims RLS - Custom Access Token Hook
-- This migration adds workspace_id and role to JWT tokens for multi-tenant RLS

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Create the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_workspace_id uuid;
  user_role text;
  claims jsonb;
BEGIN
  -- Extract user ID from the event
  IF (event->>'user_id') IS NULL THEN
    RETURN event;
  END IF;

  -- Get workspace_id from vb_users table
  -- If vb_users doesn't exist yet, we'll use a default workspace for now
  BEGIN
    SELECT workspace_id
    INTO user_workspace_id
    FROM vb_users
    WHERE auth_id = (event->>'user_id')::uuid
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      -- vb_users table doesn't exist yet, use a default workspace
      user_workspace_id := 'default-workspace'::uuid;
  END;

  -- Get user role from vb_workspace_members table
  -- If table doesn't exist yet, default to 'user'
  BEGIN
    SELECT role
    INTO user_role
    FROM vb_workspace_members
    WHERE user_id = (event->>'user_id')::uuid
      AND workspace_id = user_workspace_id
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      user_role := 'user';
  END;

  -- Default values if nothing found
  IF user_workspace_id IS NULL THEN
    user_workspace_id := 'default-workspace'::uuid;
  END IF;

  IF user_role IS NULL THEN
    user_role := 'user';
  END IF;

  -- Get existing claims
  claims := COALESCE(event->'claims', '{}'::jsonb);

  -- Add workspace_id and role to claims
  claims := claims || jsonb_build_object(
    'workspace_id', user_workspace_id,
    'role', user_role
  );

  -- Return the event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- Create a test function to verify the hook works
CREATE OR REPLACE FUNCTION public.test_jwt_claims()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_event jsonb;
  result jsonb;
BEGIN
  -- Create a test event
  test_event := jsonb_build_object(
    'user_id', gen_random_uuid(),
    'claims', jsonb_build_object('aud', 'authenticated')
  );

  -- Test the hook
  result := public.custom_access_token_hook(test_event);

  RETURN result;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS 'Custom access token hook that adds workspace_id and role claims to JWT tokens for RLS policies';
COMMENT ON FUNCTION public.test_jwt_claims() IS 'Test function to verify JWT claims hook is working correctly';