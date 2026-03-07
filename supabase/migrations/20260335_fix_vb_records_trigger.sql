-- Fix broken trigger on vb_records
-- The table has last_edited_at but NOT updated_at.
-- The trigger set_updated_at_and_last_edited() tries to set NEW.updated_at which doesn't exist,
-- causing ALL updates to fail with: record "new" has no field "updated_at"
--
-- Fix: switch to set_last_edited_at() which only sets NEW.last_edited_at

DROP TRIGGER IF EXISTS trg_vb_records_updated_at ON vb_records;

CREATE TRIGGER trg_vb_records_updated_at
  BEFORE UPDATE ON vb_records
  FOR EACH ROW EXECUTE FUNCTION set_last_edited_at();
