-- ============================================================
-- pgTAP Test: projects RLS policies
-- Verifies: RLS enabled, expected columns exist
-- ============================================================
BEGIN;

SELECT plan(4);

-- 1. RLS is enabled on projects
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'projects'),
  'RLS is enabled on projects'
);

-- 2. Table has expected columns
SELECT has_column('public', 'projects', 'id', 'projects has id column');
SELECT has_column('public', 'projects', 'health_score', 'projects has health_score column');
SELECT has_column('public', 'projects', 'origami_id', 'projects has origami_id column');

SELECT * FROM finish();
ROLLBACK;
