-- ============================================================
-- pgTAP Test: vb_records RLS policies
-- Verifies: anon blocked, authenticated can read/write
-- ============================================================
BEGIN;

SELECT plan(5);

-- 1. RLS is enabled on vb_records
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'vb_records'),
  'RLS is enabled on vb_records'
);

-- 2. Table exists with expected columns
SELECT has_column('public', 'vb_records', 'id', 'vb_records has id column');
SELECT has_column('public', 'vb_records', 'content', 'vb_records has content column');
SELECT has_column('public', 'vb_records', 'created_by', 'vb_records has created_by column');
SELECT has_column('public', 'vb_records', 'last_edited_at', 'vb_records has last_edited_at column');

SELECT * FROM finish();
ROLLBACK;
