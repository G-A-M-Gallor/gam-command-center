-- =============================================
-- Realtime Expansion
-- story_cards already in publication (20260311)
-- Adding: vb_records, projects
-- =============================================

-- Add vb_records to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE vb_records;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already added
END $$;

-- Add projects to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE projects;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already added
END $$;
