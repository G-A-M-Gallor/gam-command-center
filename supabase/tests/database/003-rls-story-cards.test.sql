-- ============================================================
-- pgTAP Test: story_cards RLS policies
-- Verifies: anon blocked, authenticated can CRUD
-- ============================================================
BEGIN;

SELECT plan(8);

-- ──────────────────────────────────────────────────────────────
-- 1. Table exists
-- ──────────────────────────────────────────────────────────────
SELECT has_table('public', 'story_cards', 'story_cards table exists');

-- ──────────────────────────────────────────────────────────────
-- 2. RLS is enabled
-- ──────────────────────────────────────────────────────────────
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'story_cards'),
  'RLS is enabled on story_cards'
);

-- ──────────────────────────────────────────────────────────────
-- 3. Anon role cannot SELECT
-- ──────────────────────────────────────────────────────────────
SET LOCAL ROLE anon;
SELECT is_empty(
  $$SELECT id FROM story_cards LIMIT 1$$,
  'anon role cannot read story_cards'
);

-- ──────────────────────────────────────────────────────────────
-- 4. Anon role cannot INSERT
-- ──────────────────────────────────────────────────────────────
SELECT throws_ok(
  $$INSERT INTO story_cards (col, row, text, type, color, sort_order)
    VALUES (0, 0, 'anon-card', 'story', '#ff0000', 0)$$,
  42501,
  NULL,
  'anon role cannot insert into story_cards'
);

-- ──────────────────────────────────────────────────────────────
-- 5. Authenticated role can SELECT
-- ──────────────────────────────────────────────────────────────
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "a1111111-1111-1111-1111-111111111111", "role": "authenticated"}';

SELECT lives_ok(
  $$SELECT id FROM story_cards LIMIT 1$$,
  'authenticated role can select from story_cards'
);

-- ──────────────────────────────────────────────────────────────
-- 6. Authenticated role can INSERT
-- ──────────────────────────────────────────────────────────────
SELECT lives_ok(
  $$INSERT INTO story_cards (col, row, text, type, color, sort_order)
    VALUES (1, 1, 'rls-test-card', 'story', '#00ff00', 0)$$,
  'authenticated role can insert into story_cards'
);

-- ──────────────────────────────────────────────────────────────
-- 7. Authenticated role can UPDATE
-- ──────────────────────────────────────────────────────────────
SELECT lives_ok(
  $$UPDATE story_cards SET text = 'rls-test-card-updated' WHERE text = 'rls-test-card'$$,
  'authenticated role can update story_cards'
);

-- ──────────────────────────────────────────────────────────────
-- 8. Authenticated role can DELETE
-- ──────────────────────────────────────────────────────────────
SELECT lives_ok(
  $$DELETE FROM story_cards WHERE text = 'rls-test-card-updated'$$,
  'authenticated role can delete from story_cards'
);

SELECT * FROM finish();
ROLLBACK;
