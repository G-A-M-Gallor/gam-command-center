-- =============================================
-- Auto updated_at / last_edited_at Triggers
-- Replaces ~17 manual JS timestamp assignments
-- =============================================

-- Generic trigger function: sets updated_at = now()
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Variant for vb_records: also sets last_edited_at
CREATE OR REPLACE FUNCTION set_updated_at_and_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_edited_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Variant for tables with last_edited_at instead of updated_at
CREATE OR REPLACE FUNCTION set_last_edited_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Apply to all tables with updated_at ──────────────

-- projects
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- vb_records (documents) — also updates last_edited_at
DROP TRIGGER IF EXISTS trg_vb_records_updated_at ON vb_records;
CREATE TRIGGER trg_vb_records_updated_at
  BEFORE UPDATE ON vb_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_last_edited();

-- field_definitions (has last_edited_at, not updated_at)
DROP TRIGGER IF EXISTS trg_field_definitions_last_edited ON field_definitions;
CREATE TRIGGER trg_field_definitions_last_edited
  BEFORE UPDATE ON field_definitions
  FOR EACH ROW EXECUTE FUNCTION set_last_edited_at();

-- field_placements
DROP TRIGGER IF EXISTS trg_field_placements_updated_at ON field_placements;
CREATE TRIGGER trg_field_placements_updated_at
  BEFORE UPDATE ON field_placements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- canvas_layouts
DROP TRIGGER IF EXISTS trg_canvas_layouts_updated_at ON canvas_layouts;
CREATE TRIGGER trg_canvas_layouts_updated_at
  BEFORE UPDATE ON canvas_layouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- user_profiles
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- functional_map_cells (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'functional_map_cells') THEN
    DROP TRIGGER IF EXISTS trg_functional_map_cells_updated_at ON functional_map_cells;
    CREATE TRIGGER trg_functional_map_cells_updated_at
      BEFORE UPDATE ON functional_map_cells
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ai_usage
DROP TRIGGER IF EXISTS trg_ai_usage_updated_at ON ai_usage;
CREATE TRIGGER trg_ai_usage_updated_at
  BEFORE UPDATE ON ai_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ai_conversations
DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- story_cards (no updated_at column, but add one for consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'story_cards' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE story_cards ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_story_cards_updated_at ON story_cards;
CREATE TRIGGER trg_story_cards_updated_at
  BEFORE UPDATE ON story_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- plan_phases (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_phases') THEN
    DROP TRIGGER IF EXISTS trg_plan_phases_updated_at ON plan_phases;
    CREATE TRIGGER trg_plan_phases_updated_at
      BEFORE UPDATE ON plan_phases
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
