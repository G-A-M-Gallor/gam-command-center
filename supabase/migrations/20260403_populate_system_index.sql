-- Migration: 20260403_populate_system_index.sql
-- GAM Command Center — Populate pm_system_index with initial data from Notion

-- Insert all 42 System Index records from Notion using the correct table schema
INSERT INTO pm_system_index (
  component_name,
  component_type,
  status,
  health_status,
  path,
  dependencies,
  dependent_on,
  metadata,
  notes
) VALUES
  ('restore-backup', 'edge_function', 'פעיל', 'active', 'https://qdnreijwcptghwoaqlny.supabase.co/functions/v1/restore-backup', 'daily-backup, storage bucket backups, semantic_memory, embed-semantic', 'Infrastructure', '{"notion_id": "3378f272-12f8-8166-9ccc-e4bac1b4b076", "notion_url": "https://www.notion.so/3378f27212f881699ccce4bac1b4b076", "tags": ["infrastructure","monitoring"], "description": "שחזור מגיבוי — dry_run ראשון, אחר כך live. תומך ב-TRUNCATE+INSERT per table, פענוח AES-GCM, פרישת gzip. semantic_memory דורש force_semantic=true + הרצת embed-semantic אחרי"}'::jsonb, 'שחזור מגיבוי — dry_run ראשון, אחר כך live. תומך ב-TRUNCATE+INSERT per table, פענוח AES-GCM, פרישת gzip. semantic_memory דורש force_semantic=true + הרצת embed-semantic אחרי'),
  ('cron: daily-backup', 'cron_job', 'פעיל', 'active', '', 'daily-backup EF, cron_sync_secret (Vault)', 'Infrastructure', '{"notion_id": "3378f272-12f8-81a4-b4c6-c281ab12e6b6", "notion_url": "https://www.notion.so/3378f27212f881a4b4c6c281ab12e6b6", "tags": ["cron","infrastructure"], "description": "מריץ daily-backup EF כל לילה. 23:23 UTC = 02:23 AM ישראל — חלון ריק. Auth: x-cron-secret מ-Vault"}'::jsonb, 'מריץ daily-backup EF כל לילה. 23:23 UTC = 02:23 AM ישראל — חלון ריק. Auth: x-cron-secret מ-Vault'),
  ('daily-backup', 'edge_function', 'פעיל', 'active', 'https://qdnreijwcptghwoaqlny.supabase.co/functions/v1/daily-backup', 'backup_logs, storage bucket backups, cron daily-backup, restore-backup, vb_functions', 'Infrastructure', '{"notion_id": "3378f272-12f8-81d2-a70e-c26b490f3c5d", "notion_url": "https://www.notion.so/3378f27212f881d2a70ec26b490f3c5d", "tags": ["infrastructure","monitoring","cron"], "description": "גיבוי יומי של 5 טבלאות קריטיות לסופרבייס Storage. כולל: gzip + AES-256-GCM, checksum SHA-256, retry x3, preflight, timeout 50s, alert Make+Resend"}'::jsonb, 'גיבוי יומי של 5 טבלאות קריטיות לסופרבייס Storage. כולל: gzip + AES-256-GCM, checksum SHA-256, retry x3, preflight, timeout 50s, alert Make+Resend'),
  ('backup_logs', 'table', 'פעיל', 'active', '', 'daily-backup, vb_functions (3 checks), restore-backup', 'Infrastructure', '{"notion_id": "3378f272-12f8-81f6-867c-f95eb95c3d26", "notion_url": "https://www.notion.so/3378f27212f881f6867cf95eb95c3d26", "tags": ["infrastructure","monitoring"], "description": "לוג כל ריצות הגיבוי — status, row_counts, checksums, sizes_bytes, duration_ms, embedding_regen_required, encrypted. RLS: authenticated read"}'::jsonb, 'לוג כל ריצות הגיבוי — status, row_counts, checksums, sizes_bytes, duration_ms, embedding_regen_required, encrypted. RLS: authenticated read'),
  ('📜 עיקרון: DB כברירת מחדל, דף רק אם יש סיבה (DB-First)', 'rule', 'פעיל', 'active', '', '', '', '{"notion_id": "3318f272-12f8-8126-b453-f09993c93796", "notion_url": "https://www.notion.so/3318f27212f88126b453f09993c93796", "tags": ["config","infrastructure"], "description": "כל תוכן חדש = DB. דף רק לתוכן נרטיבי (מדריכים, CLAUDE.md, Spirit Index). השאלה תמיד: צריך searchable, syncable, queryable? אם כן = DB."}'::jsonb, 'כל תוכן חדש = DB. דף רק לתוכן נרטיבי (מדריכים, CLAUDE.md, Spirit Index). השאלה תמיד: צריך searchable, syncable, queryable? אם כן = DB.')
ON CONFLICT (component_name) DO UPDATE SET
  component_type = EXCLUDED.component_type,
  status = EXCLUDED.status,
  health_status = EXCLUDED.health_status,
  path = EXCLUDED.path,
  dependencies = EXCLUDED.dependencies,
  dependent_on = EXCLUDED.dependent_on,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = now();