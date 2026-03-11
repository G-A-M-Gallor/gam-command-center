-- Add client_display_name column to global_fields
-- Used for web forms and client personal area — shows a different label to clients
-- Defaults to NULL; when NULL, the UI falls back to the field's label

ALTER TABLE global_fields
  ADD COLUMN IF NOT EXISTS client_display_name JSONB DEFAULT NULL;

COMMENT ON COLUMN global_fields.client_display_name IS 'I18nLabel ({he,en,ru}) — the name clients see in forms and personal area. Falls back to label when NULL.';
