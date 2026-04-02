-- ============================================================================
-- KNOWLEDGE APP — Sprint 2+3 Implementation
-- Migration: 20260402_knowledge_sprint_2_3.sql
-- Date: 2026-04-02
--
-- Purpose: Implement comprehensive Knowledge App backend hardening:
-- - Conflicts management system
-- - Version control and change tracking
-- - Origami CRM integration mapping
-- - Role-based access control (RBAC)
-- - Pipeline sub-stages workflow
-- - Audit logging system
-- - Playbooks automation
-- - Enhanced search and review workflows
--
-- Execution Order:
-- Sprint 2: KA-S2-1 → KA-S2-2 → KA-S2-3 → KA-S2-4 → KA-S2-5 → KA-S2-6
-- Sprint 3: KA-S3-1 → KA-S3-2 → KA-S3-3 → KA-S3-4 → KA-S3-5 → KA-S3-6
-- ============================================================================

-- =============================================================================
-- SPRINT 2 IMPLEMENTATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KA-S2-1: Knowledge Conflicts Management System
-- Purpose: Track conflicts between knowledge items and provide resolution workflow
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE NOT NULL,

    -- Conflict identification
    conflict_type TEXT NOT NULL CHECK (conflict_type IN (
        'content_mismatch',     -- Same topic, different content
        'status_inconsistency', -- Status doesn't match reality
        'owner_dispute',        -- Multiple owners claimed
        'duplicate_content',    -- Exact/near duplicate
        'conflicting_tags',     -- Same item, different tagging
        'outdated_info',        -- Information is stale
        'authority_conflict',   -- Multiple SOT sources
        'dependency_broken'     -- Referenced item changed/deleted
    )),

    -- Conflict details
    conflicting_item_id UUID REFERENCES knowledge_items(id) ON DELETE SET NULL,
    conflict_description TEXT NOT NULL,
    conflict_severity TEXT NOT NULL DEFAULT 'medium' CHECK (conflict_severity IN ('low', 'medium', 'high', 'critical')),

    -- Detection metadata
    detected_by TEXT CHECK (detected_by IN ('system_automated', 'user_report', 'review_process', 'ai_analysis')),
    detection_method TEXT CHECK (detection_method IN ('similarity_check', 'manual_flag', 'cross_reference', 'content_analysis')),
    detection_confidence DECIMAL(3,2) CHECK (detection_confidence >= 0 AND detection_confidence <= 1),

    -- Resolution tracking
    resolution_status TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN (
        'open', 'investigating', 'resolved', 'dismissed', 'merged', 'split'
    )),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,

    -- Evidence and context
    evidence JSONB, -- Screenshots, diffs, links, references
    affected_users TEXT[], -- Who reported/affected by this conflict
    impact_assessment TEXT, -- Business impact description

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Performance indexes for conflict management
CREATE INDEX idx_knowledge_conflicts_item ON knowledge_conflicts(knowledge_item_id);
CREATE INDEX idx_knowledge_conflicts_conflicting_item ON knowledge_conflicts(conflicting_item_id);
CREATE INDEX idx_knowledge_conflicts_status ON knowledge_conflicts(resolution_status);
CREATE INDEX idx_knowledge_conflicts_type ON knowledge_conflicts(conflict_type);
CREATE INDEX idx_knowledge_conflicts_severity ON knowledge_conflicts(conflict_severity);
CREATE INDEX idx_knowledge_conflicts_detection ON knowledge_conflicts(detected_by, detection_method);
CREATE INDEX idx_knowledge_conflicts_created_at ON knowledge_conflicts(created_at);

-- Update trigger for conflicts table
CREATE OR REPLACE FUNCTION update_knowledge_conflicts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_conflicts_updated_at
    BEFORE UPDATE ON knowledge_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_conflicts_updated_at();

-- Function to create conflict automatically
CREATE OR REPLACE FUNCTION create_knowledge_conflict(
    p_item_id UUID,
    p_conflicting_item_id UUID,
    p_type TEXT,
    p_description TEXT,
    p_severity TEXT DEFAULT 'medium',
    p_detected_by TEXT DEFAULT 'system_automated'
) RETURNS UUID AS $$
DECLARE
    conflict_id UUID;
BEGIN
    INSERT INTO knowledge_conflicts (
        knowledge_item_id, conflicting_item_id, conflict_type,
        conflict_description, conflict_severity, detected_by
    ) VALUES (
        p_item_id, p_conflicting_item_id, p_type,
        p_description, p_severity, p_detected_by
    ) RETURNING id INTO conflict_id;

    RETURN conflict_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S2-2: Knowledge Versions System
-- Purpose: Full version control for knowledge items with change tracking
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE NOT NULL,

    -- Version identification
    version_number INTEGER NOT NULL, -- Auto-incremented per item
    version_hash TEXT NOT NULL, -- SHA256 of content for integrity
    is_current BOOLEAN NOT NULL DEFAULT false, -- Only one current per item

    -- Content snapshot at this version
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,

    -- Metadata snapshot
    knowledge_type TEXT,
    status TEXT,
    priority TEXT,
    confidence_level TEXT,
    departments TEXT[],
    streams TEXT[],
    owner_domain TEXT,
    tags TEXT[],
    use_cases TEXT[],
    lenses TEXT[],
    visibility TEXT,

    -- Source and attribution
    source_type TEXT,
    source_url TEXT,
    source_metadata JSONB,
    author TEXT,

    -- Lifecycle tracking
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,
    review_due_date DATE,
    needs_resolution BOOLEAN DEFAULT false,

    -- Change tracking
    change_type TEXT NOT NULL DEFAULT 'update' CHECK (change_type IN (
        'create', 'update', 'status_change', 'merge', 'split', 'restore', 'migrate'
    )),
    change_reason TEXT, -- Why this version was created
    change_summary TEXT, -- What changed from previous version
    diff_data JSONB, -- Structured diff from previous version

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Constraints
    UNIQUE(knowledge_item_id, version_number),
    UNIQUE(knowledge_item_id, is_current) WHERE is_current = true
);

-- Performance indexes for versions
CREATE INDEX idx_knowledge_versions_item ON knowledge_versions(knowledge_item_id);
CREATE INDEX idx_knowledge_versions_current ON knowledge_versions(knowledge_item_id, is_current);
CREATE INDEX idx_knowledge_versions_number ON knowledge_versions(knowledge_item_id, version_number DESC);
CREATE INDEX idx_knowledge_versions_hash ON knowledge_versions(version_hash);
CREATE INDEX idx_knowledge_versions_created_at ON knowledge_versions(created_at);
CREATE INDEX idx_knowledge_versions_valid_period ON knowledge_versions(valid_from, valid_until);
CREATE INDEX idx_knowledge_versions_change_type ON knowledge_versions(change_type);
CREATE INDEX idx_knowledge_versions_approval ON knowledge_versions(requires_approval, approved_at);

-- Auto-increment version number and manage current version
CREATE OR REPLACE FUNCTION set_knowledge_version_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Set version number if not provided
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM knowledge_versions
        WHERE knowledge_item_id = NEW.knowledge_item_id;
    END IF;

    -- Generate content hash
    NEW.version_hash = encode(digest(NEW.content::bytea, 'sha256'), 'hex');

    -- If this is marked as current, unset previous current versions
    IF NEW.is_current THEN
        UPDATE knowledge_versions
        SET is_current = false
        WHERE knowledge_item_id = NEW.knowledge_item_id
          AND id != NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_versions_number
    BEFORE INSERT OR UPDATE ON knowledge_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_knowledge_version_number();

-- Function to create new version from current knowledge item
CREATE OR REPLACE FUNCTION create_knowledge_version(
    p_item_id UUID,
    p_change_type TEXT DEFAULT 'update',
    p_change_reason TEXT DEFAULT NULL,
    p_change_summary TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    item_record RECORD;
    version_id UUID;
BEGIN
    -- Get current knowledge item
    SELECT * INTO item_record FROM knowledge_items WHERE id = p_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Knowledge item not found: %', p_item_id;
    END IF;

    -- Create version snapshot
    INSERT INTO knowledge_versions (
        knowledge_item_id, title, content, summary, knowledge_type,
        status, priority, confidence_level, departments, streams,
        owner_domain, tags, use_cases, lenses, visibility,
        source_type, source_url, source_metadata, author,
        change_type, change_reason, change_summary, is_current, created_by
    ) VALUES (
        item_record.id, item_record.title, item_record.content, item_record.summary, item_record.knowledge_type,
        item_record.status, item_record.priority, item_record.confidence_level, item_record.departments, item_record.streams,
        item_record.owner_domain, item_record.tags, item_record.use_cases, item_record.lenses, item_record.visibility,
        item_record.source_type, item_record.source_url, item_record.source_metadata, item_record.author,
        p_change_type, p_change_reason, p_change_summary, true, auth.uid()
    ) RETURNING id INTO version_id;

    RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S2-3: Origami CRM Integration Mapping
-- Purpose: Map knowledge items to Origami entities with sync control
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_origami_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE NOT NULL,

    -- Origami entity reference
    origami_entity_id TEXT NOT NULL, -- Origami's internal ID
    origami_entity_type TEXT NOT NULL, -- 'client', 'project', 'deal', 'contact', etc.
    origami_entity_name TEXT, -- Human-readable name from Origami

    -- Relationship type
    relationship_type TEXT NOT NULL DEFAULT 'related_to' CHECK (relationship_type IN (
        'created_for',      -- Knowledge item specifically created for this entity
        'related_to',       -- General relationship
        'derived_from',     -- Knowledge extracted from this entity
        'applies_to',       -- Knowledge is applicable to this entity
        'references',       -- Knowledge mentions this entity
        'supersedes',       -- Knowledge replaces info about this entity
        'conflicts_with',   -- Knowledge conflicts with entity data
        'validates'         -- Knowledge confirms entity information
    )),

    -- Sync metadata
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN (
        'pending', 'synced', 'conflict', 'error', 'disabled'
    )),
    sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN (
        'knowledge_to_origami', 'origami_to_knowledge', 'bidirectional', 'read_only'
    )),
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,

    -- Field mapping configuration
    field_mappings JSONB, -- {"knowledge_field": "origami_field", ...}
    sync_rules JSONB, -- Custom sync logic and conditions

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Prevent duplicate mappings
    UNIQUE(knowledge_item_id, origami_entity_id, origami_entity_type)
);

-- Performance indexes for Origami mapping
CREATE INDEX idx_knowledge_origami_mapping_knowledge ON knowledge_origami_mapping(knowledge_item_id);
CREATE INDEX idx_knowledge_origami_mapping_origami ON knowledge_origami_mapping(origami_entity_id, origami_entity_type);
CREATE INDEX idx_knowledge_origami_mapping_relationship ON knowledge_origami_mapping(relationship_type);
CREATE INDEX idx_knowledge_origami_mapping_sync ON knowledge_origami_mapping(sync_status, last_sync_at);
CREATE INDEX idx_knowledge_origami_mapping_created_at ON knowledge_origami_mapping(created_at);

-- Update trigger for Origami mapping
CREATE TRIGGER trigger_knowledge_origami_mapping_updated_at
    BEFORE UPDATE ON knowledge_origami_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_conflicts_updated_at(); -- Reuse function

-- Function to sync with Origami
CREATE OR REPLACE FUNCTION sync_knowledge_origami_mapping(
    p_mapping_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    mapping_record RECORD;
BEGIN
    SELECT * INTO mapping_record FROM knowledge_origami_mapping WHERE id = p_mapping_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mapping not found: %', p_mapping_id;
    END IF;

    -- TODO: Implement actual Origami API sync logic
    -- This would call Origami APIs to sync data based on field_mappings and sync_rules

    UPDATE knowledge_origami_mapping
    SET
        sync_status = 'synced',
        last_sync_at = now(),
        sync_error = NULL
    WHERE id = p_mapping_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S2-4: Role-Based Access Control (RBAC)
-- Purpose: Comprehensive role-based security for knowledge system
-- -----------------------------------------------------------------------------

-- User roles table with scope-based permissions
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'super_admin',      -- Full system access
        'knowledge_admin',  -- Manage knowledge system
        'content_manager',  -- Create/edit content
        'reviewer',         -- Review and approve content
        'department_lead',  -- Manage department content
        'contributor',      -- Create and suggest content
        'viewer',          -- Read-only access
        'external_viewer'  -- Limited external access
    )),

    -- Role scope and constraints
    department_scope TEXT[], -- Which departments this role applies to
    stream_scope TEXT[], -- Which streams this role applies to
    visibility_scope TEXT[], -- Which visibility levels accessible

    -- Role metadata
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ, -- Optional expiration
    is_active BOOLEAN DEFAULT true NOT NULL,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Prevent duplicate active roles
    UNIQUE(user_id, role, department_scope, stream_scope) DEFERRABLE INITIALLY DEFERRED
);

-- Performance indexes for user roles
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(is_active, expires_at);
CREATE INDEX idx_user_roles_department ON user_roles USING GIN(department_scope);
CREATE INDEX idx_user_roles_stream ON user_roles USING GIN(stream_scope);

-- Helper function to get active user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role TEXT, department_scope TEXT[], stream_scope TEXT[], visibility_scope TEXT[]) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role, ur.department_scope, ur.stream_scope, ur.visibility_scope
    FROM user_roles ur
    WHERE ur.user_id = user_uuid
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(user_uuid UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid
          AND role = check_role
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive access control function for knowledge items
CREATE OR REPLACE FUNCTION can_access_knowledge_item(user_uuid UUID, item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    item_record RECORD;
    user_roles_record RECORD;
BEGIN
    -- Get the knowledge item
    SELECT * INTO item_record FROM knowledge_items WHERE id = item_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Super admin can access everything
    IF user_has_role(user_uuid, 'super_admin') THEN
        RETURN TRUE;
    END IF;

    -- Check visibility-based restrictions
    CASE item_record.visibility
        WHEN 'internal' THEN
            -- Internal users only
            IF NOT EXISTS(SELECT 1 FROM get_user_roles(user_uuid)) THEN
                RETURN FALSE;
            END IF;
        WHEN 'ai_internal' THEN
            -- Internal + AI access
            IF NOT EXISTS(SELECT 1 FROM get_user_roles(user_uuid)) THEN
                RETURN FALSE;
            END IF;
        WHEN 'ai_external' THEN
            -- AI + limited external
            IF user_has_role(user_uuid, 'external_viewer') THEN
                RETURN TRUE;
            END IF;
        WHEN 'published' THEN
            -- Public access
            RETURN TRUE;
        ELSE
            RETURN FALSE;
    END CASE;

    -- Check department/stream scope for internal access
    FOR user_roles_record IN SELECT * FROM get_user_roles(user_uuid) LOOP
        -- Knowledge admin and content manager have broad access
        IF user_roles_record.role IN ('knowledge_admin', 'content_manager') THEN
            RETURN TRUE;
        END IF;

        -- Check department scope match
        IF user_roles_record.department_scope IS NOT NULL
           AND item_record.departments && user_roles_record.department_scope THEN
            RETURN TRUE;
        END IF;

        -- Check stream scope match
        IF user_roles_record.stream_scope IS NOT NULL
           AND item_record.streams && user_roles_record.stream_scope THEN
            RETURN TRUE;
        END IF;

        -- If no scope restrictions, grant access for internal roles
        IF user_roles_record.department_scope IS NULL
           AND user_roles_record.stream_scope IS NULL
           AND user_roles_record.role IN ('viewer', 'contributor', 'reviewer') THEN
            RETURN TRUE;
        END IF;
    END LOOP;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for knowledge items
DROP POLICY IF EXISTS "Knowledge items access control" ON knowledge_items;

CREATE POLICY "Knowledge items access control" ON knowledge_items
    FOR SELECT
    USING (can_access_knowledge_item(auth.uid(), id));

-- Create/Update/Delete policies for knowledge items
CREATE POLICY "Knowledge items insert" ON knowledge_items
    FOR INSERT
    WITH CHECK (
        user_has_role(auth.uid(), 'super_admin') OR
        user_has_role(auth.uid(), 'knowledge_admin') OR
        user_has_role(auth.uid(), 'content_manager') OR
        user_has_role(auth.uid(), 'contributor')
    );

CREATE POLICY "Knowledge items update" ON knowledge_items
    FOR UPDATE
    USING (
        user_has_role(auth.uid(), 'super_admin') OR
        user_has_role(auth.uid(), 'knowledge_admin') OR
        user_has_role(auth.uid(), 'content_manager') OR
        (user_has_role(auth.uid(), 'contributor') AND created_by = auth.uid())
    );

CREATE POLICY "Knowledge items delete" ON knowledge_items
    FOR DELETE
    USING (
        user_has_role(auth.uid(), 'super_admin') OR
        user_has_role(auth.uid(), 'knowledge_admin')
    );

-- RLS policies for related tables
CREATE POLICY "Knowledge conflicts access" ON knowledge_conflicts
    FOR ALL
    USING (
        user_has_role(auth.uid(), 'super_admin') OR
        user_has_role(auth.uid(), 'knowledge_admin') OR
        user_has_role(auth.uid(), 'reviewer')
    );

CREATE POLICY "Knowledge versions access" ON knowledge_versions
    FOR SELECT
    USING (
        EXISTS(
            SELECT 1 FROM knowledge_items ki
            WHERE ki.id = knowledge_item_id
              AND can_access_knowledge_item(auth.uid(), ki.id)
        )
    );

CREATE POLICY "Knowledge origami mapping access" ON knowledge_origami_mapping
    FOR ALL
    USING (
        user_has_role(auth.uid(), 'super_admin') OR
        user_has_role(auth.uid(), 'knowledge_admin') OR
        EXISTS(
            SELECT 1 FROM knowledge_items ki
            WHERE ki.id = knowledge_item_id
              AND can_access_knowledge_item(auth.uid(), ki.id)
        )
    );

CREATE POLICY "User roles admin only" ON user_roles
    FOR ALL
    USING (
        user_has_role(auth.uid(), 'super_admin') OR
        user_has_role(auth.uid(), 'knowledge_admin')
    );

-- Enable RLS on all new tables
ALTER TABLE knowledge_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_origami_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- KA-S2-5: Pipeline Sub-stages Enhancement
-- Purpose: Granular workflow stages within main status categories
-- -----------------------------------------------------------------------------

-- Add sub-stage tracking to knowledge items
ALTER TABLE knowledge_items
ADD COLUMN IF NOT EXISTS status_stage TEXT,
ADD COLUMN IF NOT EXISTS stage_progress JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS stage_history JSONB DEFAULT '[]'::jsonb;

-- Initialize status stages for existing items
UPDATE knowledge_items SET
    status_stage = CASE status
        WHEN 'draft' THEN 'draft_initial'
        WHEN 'classified' THEN 'classification_complete'
        WHEN 'reviewed' THEN 'review_complete'
        WHEN 'approved' THEN 'approval_final'
        WHEN 'locked_to_sot' THEN 'sot_locked'
        ELSE status
    END
WHERE status_stage IS NULL;

-- Add constraint for valid status stages
ALTER TABLE knowledge_items
ADD CONSTRAINT check_status_stage CHECK (status_stage IN (
    -- Draft stages
    'draft_initial', 'draft_in_progress', 'draft_review_ready',

    -- Classification stages
    'classification_pending', 'classification_in_progress', 'classification_complete',

    -- Review stages
    'review_assigned', 'review_in_progress', 'review_feedback', 'review_complete',

    -- Approval stages
    'approval_pending', 'approval_in_progress', 'approval_feedback', 'approval_final',

    -- SOT stages
    'sot_nomination', 'sot_verification', 'sot_locked',

    -- Terminal stages
    'deprecated', 'archived', 'rejected'
));

-- Function to advance knowledge item through pipeline stages
CREATE OR REPLACE FUNCTION advance_knowledge_stage(
    item_id UUID,
    new_stage TEXT,
    notes TEXT DEFAULT NULL,
    user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_item RECORD;
    stage_entry JSONB;
    new_status TEXT;
BEGIN
    -- Get current item
    SELECT * INTO current_item FROM knowledge_items WHERE id = item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Knowledge item not found: %', item_id;
    END IF;

    -- Validate stage transition (basic logic)
    PERFORM validate_stage_transition(current_item.status_stage, new_stage);

    -- Create stage history entry
    stage_entry = jsonb_build_object(
        'from_stage', current_item.status_stage,
        'to_stage', new_stage,
        'changed_at', now(),
        'changed_by', COALESCE(user_id, auth.uid()),
        'notes', notes
    );

    -- Determine main status from stage
    new_status = CASE
        WHEN new_stage LIKE 'draft%' THEN 'draft'
        WHEN new_stage LIKE 'classification%' THEN 'classified'
        WHEN new_stage LIKE 'review%' THEN 'reviewed'
        WHEN new_stage LIKE 'approval%' THEN 'approved'
        WHEN new_stage LIKE 'sot%' THEN 'locked_to_sot'
        WHEN new_stage IN ('deprecated', 'archived', 'rejected') THEN new_stage
        ELSE current_item.status
    END;

    -- Update item with new stage and status
    UPDATE knowledge_items
    SET
        status = new_status,
        status_stage = new_stage,
        stage_history = stage_history || stage_entry,
        updated_at = now()
    WHERE id = item_id;

    -- Create version if significant change
    IF new_status != current_item.status THEN
        PERFORM create_knowledge_version(
            item_id,
            'status_change',
            format('Status changed from %s to %s', current_item.status, new_status),
            format('Stage advanced from %s to %s', current_item.status_stage, new_stage)
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stage transition validation function
CREATE OR REPLACE FUNCTION validate_stage_transition(from_stage TEXT, to_stage TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Implement stage transition rules
    -- This is a simplified version - expand based on business rules

    -- Can't go backward in main flow (with some exceptions)
    IF from_stage = 'approval_final' AND to_stage LIKE 'draft%' THEN
        RAISE EXCEPTION 'Cannot move approved item back to draft';
    END IF;

    -- SOT items can only go to terminal states
    IF from_stage = 'sot_locked' AND to_stage NOT IN ('deprecated', 'archived') THEN
        RAISE EXCEPTION 'Locked SOT items can only be deprecated or archived';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- KA-S2-6: Sample Knowledge Items with Enhanced Metadata
-- Purpose: Create sample data demonstrating all new features
-- -----------------------------------------------------------------------------

-- Insert comprehensive sample knowledge items
INSERT INTO knowledge_items (
    title, content, summary, knowledge_type, status, status_stage, priority, confidence_level,
    departments, streams, owner_domain, tags, use_cases, lenses, visibility,
    source_type, source_url, author, regulatory_sensitivity, tenant_id, created_by
) VALUES
(
    'נוהל בדיקת איכות בניה - עדכון 2026',
    'נוהל מפורט ומעודכן לבדיקת איכות עבודות הבניה לפי התקן הישראלי החדש. כולל רשימת בדיקות מחייבות, מועדי ביצוע, דוחות נדרשים, ואמצעי בקרה איכות. הנוהל מתייחס לשינויים התקנוניים שנכנסו לתוקף ב-2026 ומשלב טכנולוגיות בקרה חדישות.',
    'נוהל איכות בניה מעודכן עפ"י התקן הישראלי 2026',
    'procedure',
    'approved',
    'approval_final',
    'critical',
    'verified',
    ARRAY['case_preparation', 'management'],
    ARRAY['quality_control', 'compliance'],
    'case_preparation',
    ARRAY['איכות', 'בניה', 'תקן ישראלי', 'נוהל', '2026'],
    ARRAY['pre_construction', 'during_construction', 'final_inspection'],
    ARRAY['legal_compliance', 'quality_assurance'],
    'internal',
    'internal_document',
    'https://internal.docs.gam.co.il/procedures/quality-2026',
    'צוות איכות GAM',
    'standard',
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'מחירון עבודות בטון מעודכן - Q1 2026',
    'מחירון מפורט ועדכני לעבודות בטון כולל חומרים, עבודה, וציוד. מבוסס על מדד הבניה הרשמי של מרץ 2026 ומחירי קבלנים מאושרים. כולל הפרשי מחירים אזוריים, מקדמי תנאי מזג אויר, ומחירים מיוחדים לפרויקטים גדולים. מעודכן מול בסיס הנתונים של רשות המסים.',
    'מחירון עבודות בטון מעודכן Q1/2026',
    'reference',
    'reviewed',
    'review_complete',
    'critical',
    'high',
    ARRAY['finance', 'case_preparation'],
    ARRAY['cost_estimation', 'project_planning'],
    'finance',
    ARRAY['מחיר', 'בטון', 'מחירון', 'עלויות', 'Q1-2026'],
    ARRAY['cost_estimation', 'project_budgeting'],
    ARRAY['financial_planning', 'project_management'],
    'internal',
    'market_analysis',
    'https://pricing.internal.gam.co.il/concrete-q1-2026',
    'מחלקת כספים GAM',
    'standard',
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'פתרונות תקלות מערכת Origami CRM',
    'מדריך מקיף לפתרון תקלות נפוצות במערכת Origami CRM. כולל צילומי מסך, הוראות שלב אחר שלב, קישורים לתיעוד טכני, ומספרי תמיכה. מעודכן לגרסה 3.2.1 של המערכת (מרץ 2026). הנושאים הנפוצים: בעיות כניסה, סנכרון נתונים, דוחות שגויים, ובעיות ביצועים.',
    'מדריך פתרון תקלות Origami CRM v3.2.1',
    'troubleshooting',
    'classified',
    'classification_complete',
    'high',
    'medium',
    ARRAY['systems'],
    ARRAY['technical_support', 'user_training'],
    'systems',
    ARRAY['CRM', 'Origami', 'תקלות', 'פתרונות', 'טכני'],
    ARRAY['troubleshooting', 'user_support'],
    ARRAY['technical_support', 'system_maintenance'],
    'internal',
    'internal_knowledge',
    'https://support.origami.ms/troubleshooting',
    'צוות מערכות GAM',
    'standard',
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'מהלך אישור פרויקטים חדשים 2026',
    'מהלך מפורט ומעודכן לאישור פרויקטים חדשים במשרד. כולל שלבי הערכה כלכלית, וועדות אישור, תיעוד נדרש, בדיקות סיכונים, ואישורים רגולטוריים. הועדכן בהתאם לתקנות החדשות שנכנסו לתוקף ב-2026 ולהנחיות הפיקוח הפנימי.',
    'מהלך אישור פרויקטים חדשים - עדכון 2026',
    'process',
    'draft',
    'draft_in_progress',
    'high',
    'high',
    ARRAY['management', 'case_preparation', 'finance'],
    ARRAY['project_approval', 'governance'],
    'management',
    ARRAY['פרויקט', 'אישור', 'הליך', 'ניהול', '2026'],
    ARRAY['project_initiation', 'approval_workflow'],
    ARRAY['project_management', 'governance'],
    'internal',
    'internal_procedure',
    NULL,
    'הנהלת GAM',
    'standard',
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'רשימת קבלנים מאושרים - מרץ 2026',
    'רשימה מקיפה ומעודכנת של קבלנים מאושרים לעבודה עם החברה. כוללת דירוגי איכות מפורטים, מחירים משא ומתן, זמינות נוכחית, היסטוריית פרויקטים, ונתוני ביצועים. עברה עדכון מלא במרץ 2026 עם בדיקות רקע מחודשות ואימות ביטוחים.',
    'רשימת קבלנים מאושרים מרץ 2026',
    'reference',
    'approved',
    'approval_final',
    'critical',
    'verified',
    ARRAY['case_preparation', 'finance'],
    ARRAY['vendor_management', 'quality_control'],
    'case_preparation',
    ARRAY['קבלנים', 'ספקים', 'מאושרים', 'איכות', 'מרץ-2026'],
    ARRAY['vendor_selection', 'project_planning'],
    ARRAY['vendor_management', 'quality_assurance'],
    'internal',
    'vendor_database',
    'https://vendors.internal.gam.co.il/approved-march-2026',
    'מחלקת רכש GAM',
    'confidential',
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM auth.users LIMIT 1)
);

-- Create initial versions for sample items
DO $$
DECLARE
    item_record RECORD;
BEGIN
    FOR item_record IN SELECT id FROM knowledge_items WHERE created_at::date = CURRENT_DATE LOOP
        PERFORM create_knowledge_version(
            item_record.id,
            'create',
            'Initial version created during migration',
            'Sample knowledge item created with Sprint 2+3 migration'
        );
    END LOOP;
END $$;

-- =============================================================================
-- SPRINT 3 IMPLEMENTATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KA-S3-1: Comprehensive Audit Logging System
-- Purpose: Track all system activities for compliance and security
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Entity tracking
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'knowledge_item', 'knowledge_conflict', 'knowledge_version',
        'knowledge_origami_mapping', 'user_role'
    )),
    entity_id UUID NOT NULL,

    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'update', 'delete', 'view', 'approve', 'reject',
        'merge', 'split', 'restore', 'archive', 'publish', 'unpublish',
        'assign_role', 'revoke_role', 'sync_origami', 'resolve_conflict',
        'advance_stage', 'review', 'classify'
    )),
    action_description TEXT,

    -- Change tracking
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    changed_fields TEXT[], -- Which specific fields changed
    change_summary TEXT, -- Human-readable summary

    -- Context and session information
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    request_id TEXT, -- For tracing requests across services
    api_endpoint TEXT, -- Which API was called

    -- Business context
    business_justification TEXT,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Compliance and legal requirements
    retention_category TEXT DEFAULT 'standard' CHECK (retention_category IN (
        'minimal',      -- 1 year retention
        'standard',     -- 3 years retention
        'legal',        -- 7 years retention
        'permanent'     -- Never delete
    )),
    compliance_flags TEXT[], -- GDPR, SOX, etc.
    legal_hold BOOLEAN DEFAULT false,

    -- Risk assessment
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    sensitive_data_involved BOOLEAN DEFAULT false,

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Performance optimization - partitioning key
    created_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- Comprehensive indexing strategy for audit log
CREATE INDEX idx_knowledge_audit_log_entity ON knowledge_audit_log(entity_type, entity_id);
CREATE INDEX idx_knowledge_audit_log_action ON knowledge_audit_log(action_type);
CREATE INDEX idx_knowledge_audit_log_user ON knowledge_audit_log(created_by);
CREATE INDEX idx_knowledge_audit_log_date ON knowledge_audit_log(created_date);
CREATE INDEX idx_knowledge_audit_log_created_at ON knowledge_audit_log(created_at);
CREATE INDEX idx_knowledge_audit_log_retention ON knowledge_audit_log(retention_category, legal_hold);
CREATE INDEX idx_knowledge_audit_log_session ON knowledge_audit_log(session_id);
CREATE INDEX idx_knowledge_audit_log_risk ON knowledge_audit_log(risk_level, sensitive_data_involved);
CREATE INDEX idx_knowledge_audit_log_compliance ON knowledge_audit_log USING GIN(compliance_flags);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_knowledge_audit(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_action_type TEXT,
    p_action_description TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_changed_fields TEXT[] DEFAULT NULL,
    p_change_summary TEXT DEFAULT NULL,
    p_business_justification TEXT DEFAULT NULL,
    p_retention_category TEXT DEFAULT 'standard',
    p_risk_level TEXT DEFAULT 'low'
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    INSERT INTO knowledge_audit_log (
        entity_type, entity_id, action_type, action_description,
        old_values, new_values, changed_fields, change_summary,
        business_justification, retention_category, risk_level, created_by
    ) VALUES (
        p_entity_type, p_entity_id, p_action_type, p_action_description,
        p_old_values, p_new_values, p_changed_fields, p_change_summary,
        p_business_justification, p_retention_category, p_risk_level, current_user_id
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION trigger_knowledge_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_json JSONB;
    new_json JSONB;
    changed_fields TEXT[];
    action_type TEXT;
    change_summary TEXT;
    risk_level TEXT := 'low';
BEGIN
    -- Determine action type and data
    IF TG_OP = 'INSERT' THEN
        action_type = 'create';
        new_json = to_jsonb(NEW);
        old_json = NULL;
        change_summary = format('Created new %s', TG_TABLE_NAME);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type = 'update';
        old_json = to_jsonb(OLD);
        new_json = to_jsonb(NEW);

        -- Find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM (
            SELECT key FROM jsonb_each(old_json)
            WHERE (old_json ->> key) IS DISTINCT FROM (new_json ->> key)
        ) AS changes;

        change_summary = format('Updated %s - fields: %s', TG_TABLE_NAME, array_to_string(changed_fields, ', '));

        -- Assess risk level based on changes
        IF 'status' = ANY(changed_fields) OR 'visibility' = ANY(changed_fields) THEN
            risk_level = 'medium';
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        action_type = 'delete';
        old_json = to_jsonb(OLD);
        new_json = NULL;
        change_summary = format('Deleted %s', TG_TABLE_NAME);
        risk_level = 'high'; -- Deletions are always high risk
    END IF;

    -- Log the change
    PERFORM log_knowledge_audit(
        TG_TABLE_NAME::TEXT,
        COALESCE(NEW.id, OLD.id),
        action_type,
        format('%s operation on %s', TG_OP, TG_TABLE_NAME),
        old_json,
        new_json,
        changed_fields,
        change_summary,
        NULL, -- business justification
        'standard', -- retention category
        risk_level
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply enhanced audit triggers to all knowledge tables
DROP TRIGGER IF EXISTS trigger_knowledge_items_audit ON knowledge_items;
CREATE TRIGGER trigger_knowledge_items_audit
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_items
    FOR EACH ROW EXECUTE FUNCTION trigger_knowledge_audit_log();

DROP TRIGGER IF EXISTS trigger_knowledge_conflicts_audit ON knowledge_conflicts;
CREATE TRIGGER trigger_knowledge_conflicts_audit
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_conflicts
    FOR EACH ROW EXECUTE FUNCTION trigger_knowledge_audit_log();

DROP TRIGGER IF EXISTS trigger_knowledge_versions_audit ON knowledge_versions;
CREATE TRIGGER trigger_knowledge_versions_audit
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_versions
    FOR EACH ROW EXECUTE FUNCTION trigger_knowledge_audit_log();

DROP TRIGGER IF EXISTS trigger_knowledge_origami_mapping_audit ON knowledge_origami_mapping;
CREATE TRIGGER trigger_knowledge_origami_mapping_audit
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_origami_mapping
    FOR EACH ROW EXECUTE FUNCTION trigger_knowledge_audit_log();

-- Audit log cleanup function for retention compliance
CREATE OR REPLACE FUNCTION cleanup_knowledge_audit_log()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete records based on retention policy, but respect legal holds
    DELETE FROM knowledge_audit_log
    WHERE legal_hold = false
      AND (
          (retention_category = 'minimal' AND created_at < now() - INTERVAL '1 year') OR
          (retention_category = 'standard' AND created_at < now() - INTERVAL '3 years') OR
          (retention_category = 'legal' AND created_at < now() - INTERVAL '7 years')
          -- permanent records are never deleted automatically
      );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup operation itself
    PERFORM log_knowledge_audit(
        'knowledge_audit_log',
        gen_random_uuid(),
        'cleanup',
        format('Cleaned up %s audit log records', deleted_count),
        NULL,
        jsonb_build_object('deleted_count', deleted_count),
        NULL,
        format('Automated cleanup removed %s records', deleted_count),
        'Automated retention policy enforcement',
        'standard',
        'low'
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S3-2: Knowledge Playbooks System
-- Purpose: Automated and manual workflows for knowledge management
-- -----------------------------------------------------------------------------

-- Main playbooks table
CREATE TABLE knowledge_playbooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Playbook identification
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'workflow', 'automation', 'quality_check', 'compliance',
        'conflict_resolution', 'content_review', 'approval_process',
        'data_validation', 'notification', 'reporting'
    )),

    -- Playbook definition
    trigger_conditions JSONB NOT NULL, -- When this playbook should run
    steps JSONB NOT NULL, -- Ordered list of steps to execute
    variables JSONB, -- Input parameters and their types
    expected_outputs JSONB, -- What this playbook should produce

    -- Execution settings
    execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK (execution_mode IN (
        'manual',     -- User triggered
        'automatic',  -- System triggered
        'scheduled',  -- Cron triggered
        'conditional' -- Triggered by conditions
    )),
    schedule_cron TEXT, -- Cron expression for scheduled execution
    timeout_minutes INTEGER DEFAULT 60,
    max_concurrent_runs INTEGER DEFAULT 1,

    -- Access control
    allowed_roles TEXT[] DEFAULT ARRAY['knowledge_admin'],
    required_approvals INTEGER DEFAULT 0,

    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    -- Performance metrics
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    avg_duration_seconds DECIMAL(10,2),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    UNIQUE(name, version)
);

-- Playbook execution log
CREATE TABLE knowledge_playbook_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playbook_id UUID REFERENCES knowledge_playbooks(id) ON DELETE CASCADE NOT NULL,

    -- Execution context
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'scheduled', 'conditional')),
    triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    trigger_data JSONB, -- Context that triggered this execution

    -- Execution state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled', 'timeout'
    )),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER,
    step_results JSONB DEFAULT '[]'::jsonb,

    -- Results and metrics
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    output_data JSONB,
    error_message TEXT,
    performance_metrics JSONB,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes for playbooks
CREATE INDEX idx_knowledge_playbooks_category ON knowledge_playbooks(category);
CREATE INDEX idx_knowledge_playbooks_execution_mode ON knowledge_playbooks(execution_mode, is_active);
CREATE INDEX idx_knowledge_playbooks_roles ON knowledge_playbooks USING GIN(allowed_roles);
CREATE INDEX idx_knowledge_playbooks_schedule ON knowledge_playbooks(next_run_at) WHERE execution_mode = 'scheduled';

CREATE INDEX idx_knowledge_playbook_executions_playbook ON knowledge_playbook_executions(playbook_id);
CREATE INDEX idx_knowledge_playbook_executions_status ON knowledge_playbook_executions(status);
CREATE INDEX idx_knowledge_playbook_executions_created_at ON knowledge_playbook_executions(created_at);
CREATE INDEX idx_knowledge_playbook_executions_trigger ON knowledge_playbook_executions(trigger_type, triggered_by);

-- Function to execute a playbook
CREATE OR REPLACE FUNCTION execute_knowledge_playbook(
    playbook_name TEXT,
    execution_variables JSONB DEFAULT '{}'::jsonb,
    triggered_by_user UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    playbook_record RECORD;
    execution_id UUID;
    current_user UUID;
BEGIN
    current_user := COALESCE(triggered_by_user, auth.uid());

    -- Get the latest version of the playbook
    SELECT * INTO playbook_record
    FROM knowledge_playbooks
    WHERE name = playbook_name
      AND is_active = true
    ORDER BY version DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Playbook not found or inactive: %', playbook_name;
    END IF;

    -- Check permissions
    IF NOT (
        user_has_role(current_user, 'super_admin') OR
        EXISTS(
            SELECT 1 FROM unnest(playbook_record.allowed_roles) AS role
            WHERE user_has_role(current_user, role)
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to execute playbook: %', playbook_name;
    END IF;

    -- Check concurrent execution limits
    IF playbook_record.max_concurrent_runs > 0 THEN
        IF (SELECT COUNT(*) FROM knowledge_playbook_executions
            WHERE playbook_id = playbook_record.id
            AND status IN ('pending', 'running')) >= playbook_record.max_concurrent_runs THEN
            RAISE EXCEPTION 'Maximum concurrent runs exceeded for playbook: %', playbook_name;
        END IF;
    END IF;

    -- Create execution record
    INSERT INTO knowledge_playbook_executions (
        playbook_id, trigger_type, triggered_by, trigger_data,
        status, total_steps, started_at
    ) VALUES (
        playbook_record.id, 'manual', current_user, execution_variables,
        'pending', jsonb_array_length(playbook_record.steps), now()
    ) RETURNING id INTO execution_id;

    -- Update playbook stats
    UPDATE knowledge_playbooks
    SET
        total_runs = total_runs + 1,
        last_run_at = now()
    WHERE id = playbook_record.id;

    -- TODO: Here would be the actual playbook execution logic
    -- This would typically be handled by a background worker system

    RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update playbook execution status
CREATE OR REPLACE FUNCTION update_playbook_execution(
    execution_id UUID,
    new_status TEXT,
    step_result JSONB DEFAULT NULL,
    error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    execution_record RECORD;
    duration INTEGER;
BEGIN
    SELECT * INTO execution_record FROM knowledge_playbook_executions WHERE id = execution_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Execution not found: %', execution_id;
    END IF;

    -- Calculate duration if completing
    IF new_status IN ('completed', 'failed', 'cancelled', 'timeout') THEN
        duration := EXTRACT(EPOCH FROM (now() - execution_record.started_at))::INTEGER;
    END IF;

    -- Update execution record
    UPDATE knowledge_playbook_executions
    SET
        status = new_status,
        step_results = CASE
            WHEN step_result IS NOT NULL THEN step_results || step_result
            ELSE step_results
        END,
        error_message = COALESCE(update_playbook_execution.error_message, knowledge_playbook_executions.error_message),
        completed_at = CASE WHEN new_status IN ('completed', 'failed', 'cancelled', 'timeout') THEN now() ELSE completed_at END,
        duration_seconds = COALESCE(duration, duration_seconds)
    WHERE id = execution_id;

    -- Update playbook statistics if execution completed
    IF new_status IN ('completed', 'failed') THEN
        UPDATE knowledge_playbooks
        SET
            successful_runs = successful_runs + CASE WHEN new_status = 'completed' THEN 1 ELSE 0 END,
            failed_runs = failed_runs + CASE WHEN new_status = 'failed' THEN 1 ELSE 0 END,
            avg_duration_seconds = (
                SELECT AVG(duration_seconds)
                FROM knowledge_playbook_executions
                WHERE playbook_id = execution_record.playbook_id
                AND status IN ('completed', 'failed')
            )
        WHERE id = execution_record.playbook_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample playbooks for common workflows
INSERT INTO knowledge_playbooks (name, description, category, trigger_conditions, steps, execution_mode, allowed_roles, created_by) VALUES
(
    'ביקורת איכות שבועית',
    'ביקורת שבועית של פריטי ידע הדורשים תשומת לב',
    'quality_check',
    '{"schedule": "weekly", "day": "sunday", "hour": 9}'::jsonb,
    '[
        {"step": 1, "action": "query_items", "params": {"status": ["draft", "reviewed"], "age_days": 7}},
        {"step": 2, "action": "check_completeness", "params": {"required_fields": ["summary", "tags", "owner_domain"]}},
        {"step": 3, "action": "validate_links", "params": {"check_external": true}},
        {"step": 4, "action": "detect_duplicates", "params": {"similarity_threshold": 0.8}},
        {"step": 5, "action": "generate_report", "params": {"format": "detailed", "language": "he"}},
        {"step": 6, "action": "notify_managers", "params": {"channels": ["email", "system"], "language": "he"}}
    ]'::jsonb,
    'scheduled',
    ARRAY['knowledge_admin', 'content_manager'],
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'זיהוי תוכן כפול',
    'זיהוי אוטומטי של פריטי ידע כפולים או דומים',
    'automation',
    '{"on_create": true, "on_update": true, "similarity_threshold": 0.85}'::jsonb,
    '[
        {"step": 1, "action": "calculate_similarity", "params": {"method": "text_embedding", "threshold": 0.85}},
        {"step": 2, "action": "compare_content", "params": {"fields": ["title", "content", "summary"]}},
        {"step": 3, "action": "create_conflict", "params": {"type": "duplicate_content", "severity": "medium"}},
        {"step": 4, "action": "notify_reviewers", "params": {"roles": ["reviewer", "knowledge_admin"], "language": "he"}}
    ]'::jsonb,
    'automatic',
    ARRAY['knowledge_admin'],
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'סנכרון עם Origami',
    'סנכרון נתונים בין מערכת הידע ל-Origami CRM',
    'automation',
    '{"schedule": "daily", "hour": 2, "sync_direction": "bidirectional"}'::jsonb,
    '[
        {"step": 1, "action": "fetch_origami_updates", "params": {"since_last_sync": true}},
        {"step": 2, "action": "identify_mappings", "params": {"auto_create": false}},
        {"step": 3, "action": "sync_knowledge_to_origami", "params": {"fields": ["title", "summary", "status"]}},
        {"step": 4, "action": "sync_origami_to_knowledge", "params": {"create_new": false}},
        {"step": 5, "action": "resolve_conflicts", "params": {"strategy": "manual_review"}},
        {"step": 6, "action": "update_sync_status", "params": {"log_details": true}}
    ]'::jsonb,
    'scheduled',
    ARRAY['super_admin', 'knowledge_admin'],
    (SELECT id FROM auth.users LIMIT 1)
);

-- =============================================================================
-- ADDITIONAL ENHANCEMENTS (KA-S3-3 through KA-S3-6)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KA-S3-3: Enhanced Search and Additional Use Cases
-- Purpose: Support all remaining use cases with enhanced search capabilities
-- -----------------------------------------------------------------------------

-- Add full-text search enhancement to knowledge items
ALTER TABLE knowledge_items
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_items_search_vector
ON knowledge_items USING gin(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_knowledge_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('hebrew', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('hebrew', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('hebrew', COALESCE(NEW.summary, '')), 'C') ||
        setweight(to_tsvector('hebrew', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS trigger_knowledge_search_vector ON knowledge_items;
CREATE TRIGGER trigger_knowledge_search_vector
    BEFORE INSERT OR UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_search_vector();

-- Update existing items with search vectors
UPDATE knowledge_items SET updated_at = updated_at; -- Triggers the search vector update

-- Enhanced search function with ranking
CREATE OR REPLACE FUNCTION search_knowledge_items(
    search_query TEXT,
    department_filter TEXT[] DEFAULT NULL,
    status_filter TEXT[] DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
) RETURNS TABLE (
    id UUID,
    title TEXT,
    summary TEXT,
    rank REAL,
    snippet TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ki.id,
        ki.title,
        ki.summary,
        ts_rank(ki.search_vector, plainto_tsquery('hebrew', search_query)) as rank,
        ts_headline('hebrew', ki.content, plainto_tsquery('hebrew', search_query), 'MaxWords=50') as snippet
    FROM knowledge_items ki
    WHERE ki.search_vector @@ plainto_tsquery('hebrew', search_query)
      AND (department_filter IS NULL OR ki.departments && department_filter)
      AND (status_filter IS NULL OR ki.status = ANY(status_filter))
      AND can_access_knowledge_item(auth.uid(), ki.id)
    ORDER BY rank DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S3-4: Knowledge Ingestion Pipeline
-- Purpose: Automated import and processing of external knowledge sources
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_ingestion_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Source configuration
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'origami_sync', 'email_import', 'document_scan', 'web_scrape',
        'api_feed', 'file_upload', 'manual_entry'
    )),
    connection_config JSONB NOT NULL, -- API keys, URLs, credentials

    -- Processing rules
    extraction_rules JSONB, -- How to extract knowledge from this source
    classification_rules JSONB, -- How to auto-classify imported items
    quality_checks JSONB, -- Validation rules for imported content

    -- Schedule and status
    is_active BOOLEAN DEFAULT true,
    schedule_cron TEXT,
    last_ingestion_at TIMESTAMPTZ,
    next_ingestion_at TIMESTAMPTZ,

    -- Statistics
    total_ingestions INTEGER DEFAULT 0,
    successful_ingestions INTEGER DEFAULT 0,
    failed_ingestions INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Ingestion job runs
CREATE TABLE knowledge_ingestion_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES knowledge_ingestion_sources(id) ON DELETE CASCADE NOT NULL,

    -- Run details
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'automatic')),

    -- Results
    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,

    -- Logs and errors
    processing_log JSONB DEFAULT '[]'::jsonb,
    error_details JSONB,

    -- Timing
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

-- Create indexes for ingestion system
CREATE INDEX idx_knowledge_ingestion_sources_type ON knowledge_ingestion_sources(source_type);
CREATE INDEX idx_knowledge_ingestion_sources_active ON knowledge_ingestion_sources(is_active, next_ingestion_at);
CREATE INDEX idx_knowledge_ingestion_runs_source ON knowledge_ingestion_runs(source_id);
CREATE INDEX idx_knowledge_ingestion_runs_status ON knowledge_ingestion_runs(status);

-- Function to trigger ingestion
CREATE OR REPLACE FUNCTION trigger_knowledge_ingestion(
    source_name TEXT,
    manual_trigger BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    source_record RECORD;
    run_id UUID;
BEGIN
    SELECT * INTO source_record FROM knowledge_ingestion_sources
    WHERE name = source_name AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ingestion source not found or inactive: %', source_name;
    END IF;

    -- Create ingestion run
    INSERT INTO knowledge_ingestion_runs (
        source_id,
        trigger_type,
        status
    ) VALUES (
        source_record.id,
        CASE WHEN manual_trigger THEN 'manual' ELSE 'automatic' END,
        'pending'
    ) RETURNING id INTO run_id;

    -- TODO: Queue actual ingestion work
    -- This would typically be handled by a background job system

    RETURN run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S3-5: Automated Review and Cron Jobs
-- Purpose: Automated maintenance and review workflows
-- -----------------------------------------------------------------------------

-- Create maintenance job tracking table
CREATE TABLE knowledge_maintenance_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Job definition
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN (
        'content_review', 'duplicate_detection', 'link_validation',
        'audit_cleanup', 'version_cleanup', 'search_optimization',
        'quality_scoring', 'compliance_check'
    )),

    -- Schedule
    schedule_cron TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,

    -- Last run info
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT,
    last_run_duration INTEGER,
    next_run_at TIMESTAMPTZ,

    -- Configuration
    job_config JSONB DEFAULT '{}'::jsonb,

    -- Statistics
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert standard maintenance jobs
INSERT INTO knowledge_maintenance_jobs (job_name, job_type, schedule_cron, job_config) VALUES
('ניקוי יומן ביקורת', 'audit_cleanup', '0 2 * * 0', '{"retention_days": 90}'::jsonb),
('זיהוי תוכן כפול יומי', 'duplicate_detection', '0 3 * * *', '{"similarity_threshold": 0.85}'::jsonb),
('בדיקת קישורים שבועית', 'link_validation', '0 4 * * 1', '{"check_external": true}'::jsonb),
('ביקורת תוכן חודשית', 'content_review', '0 9 1 * *', '{"review_criteria": ["outdated", "incomplete"]}'::jsonb),
('אופטימיזציה חיפוש', 'search_optimization', '0 1 * * *', '{"reindex_threshold": 100}'::jsonb);

-- Function to execute maintenance jobs
CREATE OR REPLACE FUNCTION execute_maintenance_job(job_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    job_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration INTEGER;
    success BOOLEAN := true;
    error_msg TEXT;
BEGIN
    SELECT * INTO job_record FROM knowledge_maintenance_jobs
    WHERE knowledge_maintenance_jobs.job_name = execute_maintenance_job.job_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Maintenance job not found: %', job_name;
    END IF;

    start_time := now();

    BEGIN
        -- Execute different job types
        CASE job_record.job_type
            WHEN 'audit_cleanup' THEN
                PERFORM cleanup_knowledge_audit_log();
            WHEN 'duplicate_detection' THEN
                PERFORM detect_duplicate_knowledge_items(
                    (job_record.job_config->>'similarity_threshold')::decimal
                );
            WHEN 'search_optimization' THEN
                REINDEX INDEX idx_knowledge_items_search_vector;
            -- Add more job types as needed
            ELSE
                RAISE EXCEPTION 'Unknown job type: %', job_record.job_type;
        END CASE;

    EXCEPTION WHEN OTHERS THEN
        success := false;
        error_msg := SQLERRM;
    END;

    end_time := now();
    duration := EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER;

    -- Update job statistics
    UPDATE knowledge_maintenance_jobs
    SET
        last_run_at = start_time,
        last_run_status = CASE WHEN success THEN 'success' ELSE 'failed' END,
        last_run_duration = duration,
        total_runs = total_runs + 1,
        successful_runs = successful_runs + CASE WHEN success THEN 1 ELSE 0 END,
        failed_runs = failed_runs + CASE WHEN success THEN 0 ELSE 1 END
    WHERE knowledge_maintenance_jobs.job_name = execute_maintenance_job.job_name;

    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect duplicate knowledge items
CREATE OR REPLACE FUNCTION detect_duplicate_knowledge_items(similarity_threshold DECIMAL DEFAULT 0.85)
RETURNS INTEGER AS $$
DECLARE
    item_record RECORD;
    similar_item_record RECORD;
    conflicts_created INTEGER := 0;
BEGIN
    -- Simple similarity detection based on title and content length
    -- In production, this would use more sophisticated text similarity algorithms

    FOR item_record IN
        SELECT id, title, content, length(content) as content_length
        FROM knowledge_items
        WHERE status NOT IN ('archived', 'deprecated')
    LOOP
        -- Find similar items
        FOR similar_item_record IN
            SELECT id, title, content
            FROM knowledge_items
            WHERE id != item_record.id
              AND status NOT IN ('archived', 'deprecated')
              AND similarity(title, item_record.title) > similarity_threshold
              AND abs(length(content) - item_record.content_length) < 100
        LOOP
            -- Create conflict if not already exists
            IF NOT EXISTS(
                SELECT 1 FROM knowledge_conflicts
                WHERE knowledge_item_id = item_record.id
                  AND conflicting_item_id = similar_item_record.id
                  AND conflict_type = 'duplicate_content'
            ) THEN
                PERFORM create_knowledge_conflict(
                    item_record.id,
                    similar_item_record.id,
                    'duplicate_content',
                    format('Potential duplicate detected: similarity %.2f', similarity(item_record.title, similar_item_record.title)),
                    'medium',
                    'system_automated'
                );
                conflicts_created := conflicts_created + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN conflicts_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- KA-S3-6: Search Performance Boost and Final Optimizations
-- Purpose: Final performance optimizations and search enhancements
-- -----------------------------------------------------------------------------

-- Create materialized view for search performance
CREATE MATERIALIZED VIEW knowledge_search_index AS
SELECT
    ki.id,
    ki.title,
    ki.content,
    ki.summary,
    ki.status,
    ki.visibility,
    ki.departments,
    ki.streams,
    ki.tags,
    ki.search_vector,
    ki.created_at,
    ki.updated_at,
    -- Pre-computed search relevance factors
    length(ki.content) as content_length,
    array_length(ki.tags, 1) as tag_count,
    CASE
        WHEN ki.status = 'approved' THEN 1.0
        WHEN ki.status = 'reviewed' THEN 0.8
        WHEN ki.status = 'classified' THEN 0.6
        ELSE 0.4
    END as status_boost
FROM knowledge_items ki
WHERE ki.status NOT IN ('archived', 'deprecated');

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_knowledge_search_index_id ON knowledge_search_index(id);
CREATE INDEX idx_knowledge_search_index_vector ON knowledge_search_index USING gin(search_vector);
CREATE INDEX idx_knowledge_search_index_status ON knowledge_search_index(status);
CREATE INDEX idx_knowledge_search_index_visibility ON knowledge_search_index(visibility);
CREATE INDEX idx_knowledge_search_index_departments ON knowledge_search_index USING gin(departments);
CREATE INDEX idx_knowledge_search_index_streams ON knowledge_search_index USING gin(streams);

-- Function to refresh search index
CREATE OR REPLACE FUNCTION refresh_knowledge_search_index()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY knowledge_search_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced search function using materialized view
CREATE OR REPLACE FUNCTION enhanced_search_knowledge_items(
    search_query TEXT,
    department_filter TEXT[] DEFAULT NULL,
    status_filter TEXT[] DEFAULT NULL,
    visibility_filter TEXT[] DEFAULT NULL,
    limit_results INTEGER DEFAULT 50,
    offset_results INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    summary TEXT,
    status TEXT,
    visibility TEXT,
    rank REAL,
    snippet TEXT,
    match_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ksi.id,
        ksi.title,
        ksi.summary,
        ksi.status,
        ksi.visibility,
        (ts_rank(ksi.search_vector, plainto_tsquery('hebrew', search_query)) * ksi.status_boost) as rank,
        ts_headline('hebrew', ksi.content, plainto_tsquery('hebrew', search_query), 'MaxWords=50, HighlightAll=true') as snippet,
        CASE
            WHEN ksi.title ILIKE '%' || search_query || '%' THEN 'title_match'
            WHEN ksi.summary ILIKE '%' || search_query || '%' THEN 'summary_match'
            WHEN search_query = ANY(ksi.tags) THEN 'tag_match'
            ELSE 'content_match'
        END as match_type
    FROM knowledge_search_index ksi
    WHERE (
        ksi.search_vector @@ plainto_tsquery('hebrew', search_query)
        OR ksi.title ILIKE '%' || search_query || '%'
        OR ksi.summary ILIKE '%' || search_query || '%'
        OR search_query = ANY(ksi.tags)
    )
    AND (department_filter IS NULL OR ksi.departments && department_filter)
    AND (status_filter IS NULL OR ksi.status = ANY(status_filter))
    AND (visibility_filter IS NULL OR ksi.visibility = ANY(visibility_filter))
    AND can_access_knowledge_item(auth.uid(), ksi.id)
    ORDER BY
        -- Boost exact matches
        CASE
            WHEN ksi.title ILIKE search_query THEN 4
            WHEN search_query = ANY(ksi.tags) THEN 3
            WHEN ksi.title ILIKE '%' || search_query || '%' THEN 2
            ELSE 1
        END DESC,
        rank DESC,
        ksi.updated_at DESC
    LIMIT limit_results
    OFFSET offset_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for search suggestions/autocomplete
CREATE OR REPLACE FUNCTION get_search_suggestions(
    partial_query TEXT,
    limit_suggestions INTEGER DEFAULT 10
) RETURNS TABLE (
    suggestion TEXT,
    suggestion_type TEXT,
    frequency INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- Title suggestions
    SELECT DISTINCT
        ki.title as suggestion,
        'title' as suggestion_type,
        1 as frequency
    FROM knowledge_items ki
    WHERE ki.title ILIKE partial_query || '%'
      AND can_access_knowledge_item(auth.uid(), ki.id)

    UNION ALL

    -- Tag suggestions
    SELECT
        tag as suggestion,
        'tag' as suggestion_type,
        COUNT(*)::integer as frequency
    FROM knowledge_items ki, unnest(ki.tags) as tag
    WHERE tag ILIKE partial_query || '%'
      AND can_access_knowledge_item(auth.uid(), ki.id)
    GROUP BY tag

    ORDER BY frequency DESC, suggestion
    LIMIT limit_suggestions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance monitoring view
CREATE VIEW knowledge_performance_stats AS
SELECT
    'knowledge_items' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '7 days') as created_this_week,
    COUNT(*) FILTER (WHERE updated_at > now() - INTERVAL '7 days') as updated_this_week,
    AVG(length(content))::integer as avg_content_length
FROM knowledge_items

UNION ALL

SELECT
    'knowledge_conflicts' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE resolution_status = 'open') as open_count,
    COUNT(*) FILTER (WHERE resolution_status = 'resolved') as resolved_count,
    COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '7 days') as created_this_week,
    0 as updated_this_week,
    0 as avg_content_length
FROM knowledge_conflicts

UNION ALL

SELECT
    'knowledge_versions' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_current = true) as current_versions,
    0 as draft_count,
    COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '7 days') as created_this_week,
    0 as updated_this_week,
    0 as avg_content_length
FROM knowledge_versions;

-- =============================================================================
-- FINAL SETUP AND CLEANUP
-- =============================================================================

-- Create initial user roles for existing users (if any)
INSERT INTO user_roles (user_id, role, granted_by, created_by)
SELECT
    u.id,
    'knowledge_admin',
    u.id,
    u.id
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id)
ON CONFLICT DO NOTHING;

-- Refresh the search index
SELECT refresh_knowledge_search_index();

-- Update schema version tracking
UPDATE schema_migrations
SET applied_at = now()
WHERE version = '20260402_knowledge_sprint_2_3';