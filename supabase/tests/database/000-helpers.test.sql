-- ============================================================
-- pgTAP Test: Setup & verify test helpers
-- ============================================================
BEGIN;

SELECT plan(1);

-- Verify pgTAP is available
SELECT ok(true, 'pgTAP is available');

SELECT * FROM finish();
ROLLBACK;
