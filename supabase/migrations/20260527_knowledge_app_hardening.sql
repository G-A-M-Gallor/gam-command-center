-- ============================================================================
-- KNOWLEDGE APP — Hardening Patch (6 fixes from ChatGPT review)
-- Delta migration on top of 20260526_knowledge_app_schema_v1.sql
-- Date: 2026-04-01
--
-- FIX 1: Taxonomy formally locked at 13 types (documentation only)
-- FIX 2: Auto-promote aligned: classified only, not approved (already correct — no change)
-- FIX 3: Hash function: sha256() → digest() via pgcrypto
-- FIX 4: RLS: critical sensitivity items hidden from non-approver JWT roles
-- FIX 5: JSONB validation: UUID existence check against dictionary tables
-- FIX 6: Status/visibility transition enforcement trigger added
-- ============================================================================

-- [FIX 3] Enable pgcrypto for digest() function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- [FIX 3] Update content_hash functions to use digest() instead of sha256()
CREATE OR REPLACE FUNCTION update_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.content_hash = encode(digest(NEW.content::bytea, 'sha256'), 'hex');
        NEW.embedding_status = 'stale';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_knowledge_content_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content_hash IS NULL OR NEW.content_hash = '' THEN
        NEW.content_hash = encode(digest(NEW.content::bytea, 'sha256'), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [FIX 4] Drop and recreate ki_read_tenant with critical sensitivity guard
DROP POLICY IF EXISTS "ki_read_tenant" ON knowledge_items;

CREATE POLICY "ki_read_tenant" ON knowledge_items
    FOR SELECT TO authenticated
    USING (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
        AND (
            regulatory_sensitivity != 'critical'
            OR COALESCE(
                current_setting('request.jwt.claims', true)::jsonb->>'user_role', ''
            ) IN ('approver', 'owner', 'system_admin')
        )
    );

-- [FIX 5] Enhanced JSONB validation: not-empty + UUID existence check
CREATE OR REPLACE FUNCTION validate_knowledge_classifications()
RETURNS TRIGGER AS $$
DECLARE
    _missing_dept UUID[];
    _missing_stream UUID[];
    _missing_uc UUID[];
    _missing_lens UUID[];
BEGIN
    IF NEW.status NOT IN ('draft') THEN
        IF jsonb_array_length(NEW.department_ids) = 0 THEN
            RAISE EXCEPTION 'department_ids cannot be empty for status %', NEW.status;
        END IF;
        IF jsonb_array_length(NEW.stream_ids) = 0 THEN
            RAISE EXCEPTION 'stream_ids cannot be empty for status %', NEW.status;
        END IF;
        IF jsonb_array_length(NEW.use_case_ids) = 0 THEN
            RAISE EXCEPTION 'use_case_ids cannot be empty for status %', NEW.status;
        END IF;
        IF jsonb_array_length(NEW.lens_ids) = 0 THEN
            RAISE EXCEPTION 'lens_ids cannot be empty for status %', NEW.status;
        END IF;

        -- Validate UUIDs exist in reference tables
        SELECT array_agg(val::uuid) INTO _missing_dept
        FROM jsonb_array_elements_text(NEW.department_ids) AS val
        WHERE NOT EXISTS (
            SELECT 1 FROM knowledge_departments d
            WHERE d.id = val::uuid AND d.is_active = true
        );
        IF _missing_dept IS NOT NULL AND array_length(_missing_dept, 1) > 0 THEN
            RAISE EXCEPTION 'Invalid department_ids: % not found in knowledge_departments', _missing_dept;
        END IF;

        SELECT array_agg(val::uuid) INTO _missing_stream
        FROM jsonb_array_elements_text(NEW.stream_ids) AS val
        WHERE NOT EXISTS (
            SELECT 1 FROM knowledge_streams s
            WHERE s.id = val::uuid AND s.is_active = true
        );
        IF _missing_stream IS NOT NULL AND array_length(_missing_stream, 1) > 0 THEN
            RAISE EXCEPTION 'Invalid stream_ids: % not found in knowledge_streams', _missing_stream;
        END IF;

        SELECT array_agg(val::uuid) INTO _missing_uc
        FROM jsonb_array_elements_text(NEW.use_case_ids) AS val
        WHERE NOT EXISTS (
            SELECT 1 FROM knowledge_use_cases uc
            WHERE uc.id = val::uuid AND uc.is_active = true
        );
        IF _missing_uc IS NOT NULL AND array_length(_missing_uc, 1) > 0 THEN
            RAISE EXCEPTION 'Invalid use_case_ids: % not found in knowledge_use_cases', _missing_uc;
        END IF;

        SELECT array_agg(val::uuid) INTO _missing_lens
        FROM jsonb_array_elements_text(NEW.lens_ids) AS val
        WHERE NOT EXISTS (
            SELECT 1 FROM knowledge_lenses l
            WHERE l.id = val::uuid AND l.is_active = true
        );
        IF _missing_lens IS NOT NULL AND array_length(_missing_lens, 1) > 0 THEN
            RAISE EXCEPTION 'Invalid lens_ids: % not found in knowledge_lenses', _missing_lens;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [FIX 6] Status/visibility transition enforcement
CREATE OR REPLACE FUNCTION enforce_knowledge_transitions()
RETURNS TRIGGER AS $$
BEGIN
    -- Cannot publish non-approved items
    IF NEW.visibility IN ('ai_internal', 'ai_external', 'published')
       AND NEW.status NOT IN ('approved', 'locked_to_sot') THEN
        RAISE EXCEPTION 'Cannot set visibility=% on item with status=%. Must be approved or locked_to_sot first.',
            NEW.visibility, NEW.status;
    END IF;

    -- locked_to_sot requires item was previously approved
    IF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'locked_to_sot' AND OLD.status != 'approved' THEN
            RAISE EXCEPTION 'Cannot lock to SoT directly from status=%. Must be approved first.', OLD.status;
        END IF;

        -- Prevent backward status transitions from locked_to_sot
        IF OLD.status = 'locked_to_sot' AND NEW.status NOT IN ('locked_to_sot', 'deprecated', 'archived') THEN
            RAISE EXCEPTION 'Cannot move locked_to_sot item back to %. Only deprecated/archived allowed.', NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ki_enforce_transitions ON knowledge_items;
CREATE TRIGGER trg_ki_enforce_transitions
    BEFORE INSERT OR UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION enforce_knowledge_transitions();
