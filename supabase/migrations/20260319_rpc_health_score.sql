-- =============================================
-- Health Score Recalculation in Postgres
-- Replaces: lib/utils/health.ts client-side calc
-- Formula: 100 - min(days_stale*5, 40) - (30 if inactive) + (5 if cards)
-- NOTE: vb_records.entity_id != projects.id, so doc bonus uses card presence only
-- =============================================

CREATE OR REPLACE FUNCTION recalculate_health_scores()
RETURNS void AS $$
BEGIN
  UPDATE projects SET health_score = LEAST(100, GREATEST(0,
    100
    -- Staleness penalty: -5 per day since last update, max -40
    - LEAST(EXTRACT(EPOCH FROM (now() - updated_at)) / 86400 * 5, 40)::INT
    -- Status penalty
    - CASE WHEN status = 'inactive' THEN 30 ELSE 0 END
    -- Activity bonus: has story cards
    + CASE WHEN EXISTS (
        SELECT 1 FROM story_cards sc
        WHERE sc.project_id = projects.id
      ) THEN 10 ELSE 0 END
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
