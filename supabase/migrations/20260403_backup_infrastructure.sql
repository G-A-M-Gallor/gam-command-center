-- Migration: 20260403_backup_infrastructure.sql
-- GAM Command Center — Backup infrastructure v2
-- Cron: 23:23 UTC = 02:23 AM Israel — חלון ריק
-- Auth: x-cron-secret מ-Vault (אותו פטרן כמו notion-pm-sync)

CREATE TABLE IF NOT EXISTS backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  tables_backed_up text[] DEFAULT '{}',
  tables_failed text[] DEFAULT '{}',
  storage_paths text[] DEFAULT '{}',
  row_counts jsonb DEFAULT '{}',
  checksums jsonb DEFAULT '{}',
  sizes_bytes jsonb DEFAULT '{}',
  error_message text,
  duration_ms integer,
  triggered_by text DEFAULT 'cron',
  encrypted boolean DEFAULT false,
  embedding_regen_required boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS backup_logs_run_at_idx ON backup_logs (run_at DESC);
CREATE INDEX IF NOT EXISTS backup_logs_status_idx ON backup_logs (status);

ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backup_logs_read" ON backup_logs FOR SELECT TO authenticated USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 104857600, ARRAY['application/octet-stream', 'application/json'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "backups_service_write" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'backups');
CREATE POLICY "backups_service_delete" ON storage.objects FOR DELETE TO service_role USING (bucket_id = 'backups');
CREATE POLICY "backups_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'backups');

SELECT cron.schedule(
  'daily-backup', '23 23 * * *',
  $$ SELECT net.http_post(
    url := 'https://qdnreijwcptghwoaqlny.supabase.co/functions/v1/daily-backup',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cron_sync_secret' LIMIT 1)),
    body := '{"triggered_by":"cron"}'::jsonb
  ); $$
);