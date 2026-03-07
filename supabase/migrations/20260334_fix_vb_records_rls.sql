-- ============================================================
-- Migration: Fix vb_records RLS — allow any authenticated user to update
-- The owner-only policy was too restrictive for a team dashboard.
-- Records created with fallback UUID couldn't be edited by anyone.
-- ============================================================

-- Drop the restrictive owner-only update policy
DROP POLICY IF EXISTS "vb_records_update" ON vb_records;

-- Allow any authenticated user to update any record
CREATE POLICY "vb_records_update"
  ON vb_records FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Also fix delete to allow any authenticated user
DROP POLICY IF EXISTS "vb_records_delete" ON vb_records;

CREATE POLICY "vb_records_delete"
  ON vb_records FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Backfill orphaned records: set created_by to a real user if available
UPDATE vb_records
SET created_by = (
  SELECT id FROM auth.users LIMIT 1
)
WHERE created_by = 'a0000000-0000-0000-0000-000000000001'
  AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);
