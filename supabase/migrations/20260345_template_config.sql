-- ===================================================
-- Phase 2: Add template_config to entity_types
-- ===================================================
-- Template configs transform entity types into specific experiences.
-- Same note, different layout/views/tracking.

ALTER TABLE entity_types
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT NULL;

COMMENT ON COLUMN entity_types.template_config IS 'Template configuration: layout, views, board/gantt/timeline config, activity & KPI tracking';
