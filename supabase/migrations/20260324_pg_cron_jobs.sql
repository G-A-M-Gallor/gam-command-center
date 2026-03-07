-- =============================================
-- pg_cron Scheduled Jobs
-- NOTE: Requires Supabase Pro plan.
-- If on Free plan, this migration is safely skipped.
-- =============================================

DO $outer$
BEGIN
  -- Enable pg_cron extension (Pro plan only)
  CREATE EXTENSION IF NOT EXISTS pg_cron;

  GRANT USAGE ON SCHEMA cron TO postgres;

  -- Daily health score recalculation at 06:00 IST (03:00 UTC)
  PERFORM cron.schedule(
    'daily-health-recalc',
    '0 3 * * *',
    'SELECT recalculate_health_scores()'
  );

  -- Weekly soft-delete cleanup — Sunday 05:00 IST (02:00 UTC)
  PERFORM cron.schedule(
    'weekly-soft-delete-cleanup',
    '0 2 * * 0',
    'SELECT cleanup_soft_deletes(30)'
  );

  -- Monthly audit log cleanup — 1st of month, 04:00 IST (01:00 UTC)
  PERFORM cron.schedule(
    'monthly-audit-cleanup',
    '0 1 1 * *',
    $$DELETE FROM audit_log WHERE changed_at < now() - INTERVAL '90 days'$$
  );

  RAISE NOTICE 'pg_cron jobs scheduled successfully';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available (requires Pro plan). Skipping scheduled jobs. Use n8n/external cron instead.';
END $outer$;
