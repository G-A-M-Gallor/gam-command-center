-- Extend global_fields with aliases, read_only, visibility_rules, color_rules
-- These were added to the TypeScript types but missing from the DB schema

ALTER TABLE global_fields ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
ALTER TABLE global_fields ADD COLUMN IF NOT EXISTS read_only BOOLEAN DEFAULT false;
ALTER TABLE global_fields ADD COLUMN IF NOT EXISTS visibility_rules JSONB DEFAULT '[]';
ALTER TABLE global_fields ADD COLUMN IF NOT EXISTS color_rules JSONB DEFAULT '[]';
