-- System Health Checks for Sync Coverage
-- Date: 2026-04-03 | Spec B Task 1
-- Purpose: Prevent silent DB sync failures by adding health checks

-- Check 1: Sync Coverage - All entity types must have active handlers
INSERT INTO vb_functions (
  name,
  description,
  type,
  owner,
  severity,
  check_sql,
  pass_condition,
  tags,
  category
) VALUES (
  'check_sync_coverage',
  'כל entity type ב-DBS של notion-pm-sync חייב שורות ב-pm_sync_schema',
  'check',
  'system',
  'critical',
  'SELECT COUNT(*) as cnt FROM (
    SELECT unnest(ARRAY[''goal'',''app'',''portfolio'',''project'',
    ''sprint'',''task'',''idea'',''team'']) as entity_type
  ) e WHERE NOT EXISTS (
    SELECT 1 FROM pm_sync_schema s
    WHERE s.entity_type = e.entity_type AND s.is_active = true
  )',
  'zero_rows',
  ARRAY['sync','notion','coverage'],
  'system_check'
);

-- Check 2: CLAUDE.md Coverage - All active Apps must have CLAUDE.md page
INSERT INTO vb_functions (
  name,
  description,
  type,
  owner,
  severity,
  check_sql,
  pass_condition,
  tags,
  category
) VALUES (
  'check_claude_md_coverage',
  'כל App פעיל חייב claude_md_page_id מוגדר',
  'check',
  'system',
  'warning',
  'SELECT COUNT(*) as cnt FROM pm_apps
   WHERE deleted_at IS NULL
   AND (claude_md_page_id IS NULL OR claude_md_page_id = '''')',
  'zero_rows',
  ARRAY['claude_md','rule17','apps'],
  'system_check'
);

-- Check 3: App-Goal Coverage - All active Apps must be linked to Goals
INSERT INTO vb_functions (
  name,
  description,
  type,
  owner,
  severity,
  check_sql,
  pass_condition,
  tags,
  category
) VALUES (
  'check_apps_have_goal',
  'כל App פעיל חייב goal_notion_id מוגדר',
  'check',
  'system',
  'warning',
  'SELECT COUNT(*) as cnt FROM pm_apps
   WHERE deleted_at IS NULL
   AND goal_notion_id IS NULL',
  'zero_rows',
  ARRAY['apps','goals','pm'],
  'system_check'
);

-- Verify insertion
DO $$
BEGIN
  -- Check that all 3 checks were added
  IF (SELECT COUNT(*) FROM vb_functions WHERE name IN ('check_sync_coverage','check_claude_md_coverage','check_apps_have_goal')) = 3 THEN
    RAISE NOTICE 'SUCCESS: All 3 system checks added to vb_functions';
  ELSE
    RAISE EXCEPTION 'FAILED: System checks insertion incomplete';
  END IF;
END $$;

-- Migration info
COMMENT ON TABLE vb_functions IS 'System functions registry - now includes sync health checks for preventing silent failures';

-- Rollback instructions (for documentation)
/*
ROLLBACK SQL:
DELETE FROM vb_functions WHERE name IN ('check_sync_coverage','check_claude_md_coverage','check_apps_have_goal');
*/