-- Add functional_map_cells + plan_phases to Supabase Realtime publication
-- Both tables use UPDATE-only pattern (fixed grids, no INSERT/DELETE)

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE functional_map_cells;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE plan_phases REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE plan_phases;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
