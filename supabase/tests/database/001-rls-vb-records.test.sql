-- ============================================================
-- pgTAP Test: vb_records RLS policies
-- Verifies: anon blocked, authenticated can CRUD
-- ============================================================
BEGIN;

SELECT plan(8);

-- ──────────────────────────────────────────────────────────────
-- 1. Table exists
-- ──────────────────────────────────────────────────────────────
SELECT has_table('public', 'vb_records', 'vb_records table exists');

-- ──────────────────────────────────────────────────────────────
-- 2. RLS is enabled
-- ──────────────────────────────────────────────────────────────
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'vb_records'),
  'RLS is enabled on vb_records'
);

-- ──────────────────────────────────────────────────────────────
-- 3. Anon role cannot SELECT
-- ──────────────────────────────────────────────────────────────
SET LOCAL ROLE anon;
SELECT is_empty(
  $$SELECT id FROM vb_records LIMIT 1$$,
  'anon role cannot read vb_records'
);

-- ──────────────────────────────────────────────────────────────
-- 4. Anon role cannot INSERT
-- ──────────────────────────────────────────────────────────────
SELECT throws_ok(
  $$INSERT INTO vb_records (title, content, workspace_id, entity_id, created_by)
    VALUES ('anon-test', '{}', gen_random_uuid(), gen_random_uuid(), gen_random_uuid())$$,
  42501,
  NULL,
  'anon role cannot insert into vb_records'
);

-- ──────────────────────────────────────────────────────────────
-- 5. Authenticated role can SELECT (even if table is empty)
-- ──────────────────────────────────────────────────────────────
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "a1111111-1111-1111-1111-111111111111", "role": "authenticated"}';

SELECT lives_ok(
  $$SELECT id FROM vb_records LIMIT 1$$,
  'authenticated role can select from vb_records'
);

-- ──────────────────────────────────────────────────────────────
-- 6. Authenticated role can INSERT
-- ──────────────────────────────────────────────────────────────
SELECT lives_ok(
  $$INSERT INTO vb_records (title, content, workspace_id, entity_id, created_by)
    VALUES ('rls-test-record', '{"type":"doc"}', gen_random_uuid(), gen_random_uuid(),
            'a1111111-1111-1111-1111-111111111111')$$,
  'authenticated role can insert into vb_records'
);

-- ──────────────────────────────────────────────────────────────
-- 7. Authenticated role can UPDATE
-- ──────────────────────────────────────────────────────────────
SELECT lives_ok(
  $$UPDATE vb_records SET title = 'rls-test-updated' WHERE title = 'rls-test-record'$$,
  'authenticated role can update vb_records'
);

-- ──────────────────────────────────────────────────────────────
-- 8. Authenticated role can DELETE
-- ──────────────────────────────────────────────────────────────
SELECT lives_ok(
  $$DELETE FROM vb_records WHERE title = 'rls-test-updated'$$,
  'authenticated role can delete from vb_records'
);

SELECT * FROM finish();
ROLLBACK;
