-- ============================================================================
-- KNOWLEDGE APP — KA-4: Add source_type='knowledge_item' to AD-2026-001 enum
-- Migration for GAM Command Center (Supabase) - FIXED VERSION
-- Project: qdnreijwcptghwoaqlny
-- Date: 2026-04-02
--
-- Tasks:
-- 1. Create source_type ENUM with existing 15 values + 'knowledge_item'
-- 2. Convert semantic_memory.source_type from TEXT to ENUM (FIXED)
-- ============================================================================

-- Step 1: Create the source_type ENUM with all existing values + 'knowledge_item'
DO $$
BEGIN
    -- Create the enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
        CREATE TYPE source_type AS ENUM (
            'task',
            'sprint',
            'claude_md',
            'notion_page',
            'wiki_glossary',
            'ai_memory',
            'app',
            'project',
            'function',
            'goal',
            'decision',
            'course',
            'portfolio',
            'wiki_article',
            'team',
            'knowledge_item'  -- NEW VALUE for KA-4
        );
        RAISE NOTICE 'Created source_type enum with 16 values including knowledge_item';
    ELSE
        RAISE NOTICE 'source_type enum already exists, checking for knowledge_item...';
        -- If enum exists, just add the new value
        BEGIN
            ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'knowledge_item';
            RAISE NOTICE 'Added knowledge_item to existing source_type enum';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'knowledge_item already exists in source_type enum';
        END;
    END IF;
END $$;

-- Step 2: Convert semantic_memory.source_type from TEXT to source_type ENUM
-- Using a step-by-step approach to avoid casting issues

DO $$
BEGIN
    -- Check if column is already an enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'semantic_memory'
        AND column_name = 'source_type'
        AND data_type = 'USER-DEFINED'
        AND udt_name = 'source_type'
    ) THEN
        RAISE NOTICE 'semantic_memory.source_type is already using source_type enum';
    ELSE
        RAISE NOTICE 'Converting semantic_memory.source_type from TEXT to enum...';

        -- Validate that all existing values are in the enum
        IF EXISTS (
            SELECT 1 FROM semantic_memory
            WHERE source_type NOT IN (
                'task', 'sprint', 'claude_md', 'notion_page', 'wiki_glossary',
                'ai_memory', 'app', 'project', 'function', 'goal', 'decision',
                'course', 'portfolio', 'wiki_article', 'team', 'knowledge_item'
            )
        ) THEN
            RAISE EXCEPTION 'Found source_type values not in enum. Check data before migration.';
        END IF;

        -- Add a temporary column with the enum type
        ALTER TABLE semantic_memory ADD COLUMN source_type_new source_type;

        -- Populate the new column by casting text values to enum
        UPDATE semantic_memory
        SET source_type_new = source_type::source_type;

        -- Drop the old TEXT column
        ALTER TABLE semantic_memory DROP COLUMN source_type;

        -- Rename the new column to the original name
        ALTER TABLE semantic_memory RENAME COLUMN source_type_new TO source_type;

        -- Set NOT NULL constraint
        ALTER TABLE semantic_memory ALTER COLUMN source_type SET NOT NULL;

        RAISE NOTICE 'Successfully converted semantic_memory.source_type to enum';
    END IF;
END $$;

-- Step 3: Verify the conversion worked
DO $$
DECLARE
    enum_count INTEGER;
    table_column_type TEXT;
    knowledge_item_exists BOOLEAN;
BEGIN
    -- Check enum values
    SELECT COUNT(*) INTO enum_count
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'source_type';

    -- Check table column type
    SELECT data_type INTO table_column_type
    FROM information_schema.columns
    WHERE table_name = 'semantic_memory' AND column_name = 'source_type';

    -- Verify 'knowledge_item' is in the enum
    SELECT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'source_type' AND e.enumlabel = 'knowledge_item'
    ) INTO knowledge_item_exists;

    RAISE NOTICE 'source_type enum has % values', enum_count;
    RAISE NOTICE 'semantic_memory.source_type column type: %', table_column_type;

    IF knowledge_item_exists THEN
        RAISE NOTICE '✅ SUCCESS: knowledge_item value added to source_type enum';
    ELSE
        RAISE EXCEPTION '❌ FAILED: knowledge_item not found in source_type enum';
    END IF;

    IF table_column_type = 'USER-DEFINED' THEN
        RAISE NOTICE '✅ SUCCESS: semantic_memory.source_type converted to enum';
    ELSE
        RAISE EXCEPTION '❌ FAILED: semantic_memory.source_type still using % instead of enum', table_column_type;
    END IF;
END $$;

-- Step 4: Update functions that might be affected
-- Recreate search_semantic_memory function to handle the new enum
CREATE OR REPLACE FUNCTION search_semantic_memory(
  query_embedding vector(3072),
  match_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10,
  filter_source_type source_type DEFAULT NULL,  -- Now uses enum type
  filter_domain TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type source_type,  -- Return enum type
  source_id TEXT,
  content TEXT,
  domain TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.source_type,
      s.source_id,
      s.content,
      s.domain,
      (1 - (s.embedding <=> query_embedding))::FLOAT AS similarity
    FROM semantic_memory s
    WHERE
      s.embedding IS NOT NULL
      AND (filter_source_type IS NULL OR s.source_type = filter_source_type)
      AND (filter_domain IS NULL OR s.domain = filter_domain)
      AND (1 - (s.embedding <=> query_embedding)) >= match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TYPE source_type IS 'AD-2026-001: Source types for semantic memory chunks. Updated to include knowledge_item for Knowledge App v1.';
COMMENT ON COLUMN semantic_memory.source_type IS 'Source type enum - now includes knowledge_item for Knowledge App integration';

-- Final verification: Show current enum values
SELECT 'KA-4 Migration completed successfully. Current source_type enum values:' as status;
SELECT enum_range(NULL::source_type) as available_values;