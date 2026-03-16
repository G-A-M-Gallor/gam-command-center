-- Migration: Revert Records Architecture Rename (2026-03-16)
--
-- Reverts migration 20260377: restore original table names
-- record_templates → entity_types
-- record_relations → note_relations

-- ═══════════════════════════════════════════════════════
-- 1. Drop compatibility views first (they reference the renamed tables)
-- ═══════════════════════════════════════════════════════

DROP VIEW IF EXISTS entity_types;
DROP VIEW IF EXISTS note_relations;

-- ═══════════════════════════════════════════════════════
-- 2. Rename record_templates → entity_types
-- ═══════════════════════════════════════════════════════

ALTER TABLE IF EXISTS record_templates RENAME TO entity_types;

ALTER INDEX IF EXISTS idx_record_templates_slug RENAME TO idx_entity_types_slug;

DROP POLICY IF EXISTS "record_templates_all_access" ON entity_types;
CREATE POLICY "entity_types_all_access" ON entity_types FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE entity_types IS 'Entity type definitions (templates). Restored original name (2026-03-16).';

-- ═══════════════════════════════════════════════════════
-- 3. Rename record_relations → note_relations
-- ═══════════════════════════════════════════════════════

ALTER TABLE IF EXISTS record_relations RENAME TO note_relations;

ALTER INDEX IF EXISTS idx_record_relations_source RENAME TO idx_note_relations_source;
ALTER INDEX IF EXISTS idx_record_relations_target RENAME TO idx_note_relations_target;

DROP POLICY IF EXISTS "record_relations_all_access" ON note_relations;
CREATE POLICY "note_relations_all_access" ON note_relations FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE note_relations IS 'Many-to-many links between records. Restored original name (2026-03-16).';
