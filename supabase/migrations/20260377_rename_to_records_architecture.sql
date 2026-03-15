-- Migration: Records Architecture Rename (Reality Check 2026-03-15)
--
-- Locked decisions:
-- 1. note_relations → record_relations
-- 2. entity_types → record_templates
-- 3. Compatibility views for transition period
--
-- Strategy: View/Adapter Hybrid — rename tables, create views with old names

-- ═══════════════════════════════════════════════════════
-- 1. Rename note_relations → record_relations
-- ═══════════════════════════════════════════════════════

ALTER TABLE IF EXISTS note_relations RENAME TO record_relations;

-- Rename indexes
ALTER INDEX IF EXISTS idx_note_relations_source RENAME TO idx_record_relations_source;
ALTER INDEX IF EXISTS idx_note_relations_target RENAME TO idx_record_relations_target;

-- Drop old RLS policy, create new one with correct name
DROP POLICY IF EXISTS "note_relations_all_access" ON record_relations;
CREATE POLICY "record_relations_all_access" ON record_relations FOR ALL USING (true) WITH CHECK (true);

-- Compatibility view (old name → new table)
CREATE OR REPLACE VIEW note_relations AS SELECT * FROM record_relations;

-- ═══════════════════════════════════════════════════════
-- 2. Rename entity_types → record_templates
-- ═══════════════════════════════════════════════════════

ALTER TABLE IF EXISTS entity_types RENAME TO record_templates;

-- Rename indexes
ALTER INDEX IF EXISTS idx_entity_types_slug RENAME TO idx_record_templates_slug;

-- Drop old RLS policy, create new one with correct name
DROP POLICY IF EXISTS "entity_types_all_access" ON record_templates;
CREATE POLICY "record_templates_all_access" ON record_templates FOR ALL USING (true) WITH CHECK (true);

-- Update foreign keys on entity_connections to reference new table name
-- (PostgreSQL automatically tracks renamed tables in FK constraints, no action needed)

-- Compatibility view (old name → new table)
CREATE OR REPLACE VIEW entity_types AS SELECT * FROM record_templates;

-- ═══════════════════════════════════════════════════════
-- 3. Add comments for documentation
-- ═══════════════════════════════════════════════════════

COMMENT ON TABLE record_relations IS 'Many-to-many links between records. Renamed from note_relations (2026-03-15).';
COMMENT ON TABLE record_templates IS 'Templates defining which fields/views a record gets. Renamed from entity_types (2026-03-15).';
COMMENT ON VIEW note_relations IS 'Compatibility view → record_relations. Will be removed in Phase 2.';
COMMENT ON VIEW entity_types IS 'Compatibility view → record_templates. Will be removed in Phase 2.';
