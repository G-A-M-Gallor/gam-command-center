-- ===================================================
-- SUP1: Core Schema — Workspaces
-- ===================================================
-- The `workspaces` table is the root organizational unit.
-- workspace_id is referenced by vb_records, field_definitions, user_profiles
-- but the table itself was never created. This migration adds it
-- and wires up the FK constraints.

-- 1. Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  plan TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users can read workspaces they belong to
CREATE POLICY "workspace_read" ON workspaces
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
    OR owner_id = (SELECT auth.uid())
  );

-- Only owner can update workspace
CREATE POLICY "workspace_update" ON workspaces
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- Any authenticated user can create a workspace
CREATE POLICY "workspace_insert" ON workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- 2. Workspace members — links users to workspaces with roles
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',  -- owner, admin, member, viewer
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read" ON workspace_members
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members wm
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "members_manage" ON workspace_members
  FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members wm
      WHERE wm.user_id = (SELECT auth.uid()) AND wm.role IN ('owner', 'admin')
    )
  );

-- 3. Add FK constraints to existing tables (safe — IF NOT EXISTS pattern)
-- vb_records.workspace_id → workspaces.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_vb_records_workspace'
  ) THEN
    ALTER TABLE vb_records
      ADD CONSTRAINT fk_vb_records_workspace
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
  END IF;
END $$;

-- field_definitions.workspace_id → workspaces.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_field_definitions_workspace'
  ) THEN
    ALTER TABLE field_definitions
      ADD CONSTRAINT fk_field_definitions_workspace
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
  END IF;
END $$;

-- user_profiles.workspace_id → workspaces.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_profiles_workspace'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT fk_user_profiles_workspace
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
  END IF;
END $$;

-- 4. Seed a default workspace for existing data
-- Only runs if no workspaces exist yet
INSERT INTO workspaces (id, name, slug, settings)
SELECT
  gen_random_uuid(),
  'GAM Workspace',
  'gam',
  '{"language": "he", "timezone": "Asia/Jerusalem"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM workspaces LIMIT 1);
