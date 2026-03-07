-- =============================================
-- Project Dashboard — single-roundtrip RPC
-- Returns project + story cards as JSONB
-- NOTE: vb_records don't have a FK to projects, so documents are not included
-- =============================================

CREATE OR REPLACE FUNCTION get_project_dashboard(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'project', (
      SELECT to_jsonb(p.*)
      FROM projects p
      WHERE p.id = p_project_id
    ),
    'story_cards', COALESCE((
      SELECT jsonb_agg(to_jsonb(sc.*) ORDER BY sc.col, sc.sort_order)
      FROM story_cards sc
      WHERE sc.project_id = p_project_id
    ), '[]'::JSONB)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
