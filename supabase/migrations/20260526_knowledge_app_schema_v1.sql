-- ============================================================================
-- KNOWLEDGE APP — Schema v1 Phase 1
-- Migration for GAM Command Center (Supabase)
-- Project: qdnreijwcptghwoaqlny
-- Date: 2026-04-01
--
-- Based on:
--   - ChatGPT business structure draft (departments, streams, use cases)
--   - Advisory Board 5-round review (13 advisors)
--   - ChatGPT final review + gap analysis
--
-- Decisions locked:
--   - 13 Knowledge Types (10 advisory board + 3 field validation: checklist, template, precedent)
--   - JSONB classifications with GIN indexes (not junction tables)
--   - Free-form tags field (JSONB) for flexible labeling
--   - valid_until date field (hard expiry, separate from review_due_date)
--   - semantic_memory overlay (not replacement)
--   - tenant_id from day 1
--   - Supabase = master, Notion = workspace
--   - Auto-promote by regulatory_sensitivity
--   - AI = read-only + propose, never approve
-- ============================================================================

-- ============================================================================
-- PART 1: DICTIONARY / REFERENCE TABLES
-- These are the source-of-truth for all JSONB validation.
-- Synced from Notion via notion-pm-sync v14 (every 3 min) OR managed in Supabase directly.
-- ============================================================================

-- 1.1 Departments
CREATE TABLE IF NOT EXISTS knowledge_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name TEXT NOT NULL,
    name_he TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- 1.2 Streams (with Origami mapping — nullable)
CREATE TABLE IF NOT EXISTS knowledge_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name TEXT NOT NULL,
    name_he TEXT,
    description TEXT,
    origami_stream_name TEXT,          -- nullable: not all streams map to Origami
    origami_object_type INTEGER,       -- nullable: Origami Object Type ID
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- 1.3 Use Cases (with hierarchy support via parent_id)
CREATE TABLE IF NOT EXISTS knowledge_use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    code TEXT NOT NULL,                -- e.g. '1.2', '1.2.3'
    name TEXT NOT NULL,
    name_he TEXT,
    description TEXT,
    parent_use_case_id UUID REFERENCES knowledge_use_cases(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- 1.4 Lenses
CREATE TABLE IF NOT EXISTS knowledge_lenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name TEXT NOT NULL,
    name_he TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- 1.5 Knowledge Types (flat enum — 13 locked types)
CREATE TABLE IF NOT EXISTS knowledge_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name TEXT NOT NULL,
    name_he TEXT,
    description TEXT,
    example TEXT,                       -- concrete GAM example for each type
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- 1.6 Source Types (ChatGPT review gap #12.1 — ingestion model)
CREATE TABLE IF NOT EXISTS knowledge_source_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name TEXT NOT NULL,                -- e.g. 'pdf', 'notion_page', 'manual', 'conversation', 'legal_doc', 'notebooklm', 'recording'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);


-- ============================================================================
-- PART 2: CORE TABLE — knowledge_items
-- This is the heart of the system.
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,

    -- === Content ===
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,         -- SHA-256 of content, for change detection (aligns with AD-2026-001)
    language TEXT NOT NULL DEFAULT 'he' CHECK (language IN ('he', 'en')),

    -- === Type (exactly 1, from dictionary) ===
    knowledge_type_id UUID NOT NULL REFERENCES knowledge_types(id),

    -- === Classifications (JSONB — many-to-many without junction tables) ===
    -- Values are arrays of UUID strings referencing dictionary tables.
    -- Validated at application layer + helper functions below.
    department_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    stream_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    use_case_ids JSONB NOT NULL DEFAULT '[]'::jsonb,    -- first = primary
    lens_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- === Free Tags (field validation gap — flexible labeling) ===
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,  -- free-form string tags, e.g. ["שינוי חקיקה 2026", "בעיית רשם"]

    -- === Lifecycle ===
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'classified', 'reviewed', 'approved',
        'locked_to_sot', 'deprecated', 'archived', 'rejected'
    )),
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high', 'verified')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    regulatory_sensitivity TEXT NOT NULL DEFAULT 'none' CHECK (regulatory_sensitivity IN ('none', 'low', 'high', 'critical')),

    -- === Visibility (ChatGPT review gap #12.3 — published vs internal) ===
    visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN (
        'internal',        -- team only
        'ai_internal',     -- AI can use for internal responses
        'ai_external',     -- AI can use for client-facing responses
        'published'        -- can appear in portal / external docs
    )),

    -- === Review & Expiry ===
    review_due_date DATE,              -- when this item needs re-review
    valid_until DATE,                  -- hard expiry: when this knowledge becomes invalid (e.g. regulation changes Jan 1)
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    needs_resolution BOOLEAN DEFAULT false,  -- minimal conflict flag (Phase 1)
    resolution_note TEXT,

    -- === Owner Domain (ChatGPT review gap #12.2) ===
    -- Who is the domain owner that approves this item's content?
    owner_domain TEXT CHECK (owner_domain IN (
        'case_preparation',   -- חן / סיוון / גל
        'sales',              -- גל / חני
        'recruitment',        -- אנסטסיה / גל
        'finance',            -- גל / חני
        'systems',            -- גל
        'management'          -- גל / חני
    )),

    -- === Source (ChatGPT review gap #12.1) ===
    source_type_id UUID REFERENCES knowledge_source_types(id),
    source_reference TEXT,             -- URL, file path, page ID, etc.
    notion_page_id TEXT,               -- if item has a linked Notion page

    -- === Source of Truth Hierarchy (ChatGPT review gap #12.4) ===
    sot_level INTEGER DEFAULT 3 CHECK (sot_level BETWEEN 1 AND 5),
    -- 1 = official regulation / legal document (highest authority)
    -- 2 = approved SOP / locked_to_sot item
    -- 3 = reviewed internal knowledge (default)
    -- 4 = draft / unreviewed note
    -- 5 = AI-generated suggestion (lowest authority)

    -- === Semantic Memory Link ===
    source_chunk_ids UUID[] DEFAULT '{}',    -- links to semantic_memory.id
    embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'synced', 'stale')),
    search_weight FLOAT DEFAULT 1.0,

    -- === Versioning (minimal for Phase 1) ===
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES knowledge_items(id),
    change_reason TEXT,

    -- === Audit ===
    created_by UUID NOT NULL,
    created_by_type TEXT NOT NULL DEFAULT 'human' CHECK (created_by_type IN ('human', 'ai', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- === COMMENTS on knowledge_items ===
COMMENT ON COLUMN knowledge_items.department_ids IS 'JSONB array of UUIDs from knowledge_departments. Min 1 required.';
COMMENT ON COLUMN knowledge_items.stream_ids IS 'JSONB array of UUIDs from knowledge_streams. Min 1 required.';
COMMENT ON COLUMN knowledge_items.use_case_ids IS 'JSONB array of UUIDs from knowledge_use_cases. First = primary. Min 1 required.';
COMMENT ON COLUMN knowledge_items.lens_ids IS 'JSONB array of UUIDs from knowledge_lenses. Min 1 required.';
COMMENT ON COLUMN knowledge_items.tags IS 'Free-form string tags for flexible labeling. No dictionary constraint.';
COMMENT ON COLUMN knowledge_items.sot_level IS '1=regulation, 2=approved_sop, 3=reviewed, 4=draft, 5=ai_suggestion';
COMMENT ON COLUMN knowledge_items.visibility IS 'Controls who/what can see: internal→ai_internal→ai_external→published';
COMMENT ON COLUMN knowledge_items.needs_resolution IS 'Phase 1 minimal conflict flag. Full conflict table in Phase 2.';
COMMENT ON COLUMN knowledge_items.valid_until IS 'Hard expiry date. Different from review_due_date: valid_until = knowledge becomes invalid. review_due_date = should re-check.';
COMMENT ON COLUMN knowledge_items.review_due_date IS 'Soft review date. Item should be re-checked but may still be valid.';


-- ============================================================================
-- PART 3: RELATIONS TABLE
-- Connects knowledge items to each other.
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    source_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN (
        'parent',         -- source is parent of target
        'related',        -- loosely connected
        'contradicts',    -- conflict — triggers needs_resolution on both items
        'supports',       -- evidence / backing
        'replaces'        -- target replaces source (versioning aid)
    )),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source_id, target_id, relation_type),
    CHECK (source_id != target_id)
);

COMMENT ON TABLE knowledge_relations IS '5 relation types. contradicts triggers needs_resolution flag on items.';


-- ============================================================================
-- PART 4: INDEXES
-- GIN for JSONB, B-tree for common filters, composite for RLS performance.
-- ============================================================================

-- GIN indexes for JSONB classification queries
CREATE INDEX IF NOT EXISTS idx_ki_department_ids ON knowledge_items USING GIN (department_ids);
CREATE INDEX IF NOT EXISTS idx_ki_stream_ids ON knowledge_items USING GIN (stream_ids);
CREATE INDEX IF NOT EXISTS idx_ki_use_case_ids ON knowledge_items USING GIN (use_case_ids);
CREATE INDEX IF NOT EXISTS idx_ki_lens_ids ON knowledge_items USING GIN (lens_ids);
CREATE INDEX IF NOT EXISTS idx_ki_tags ON knowledge_items USING GIN (tags);

-- B-tree indexes for common filters
CREATE INDEX IF NOT EXISTS idx_ki_tenant_status ON knowledge_items (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ki_tenant_type ON knowledge_items (tenant_id, knowledge_type_id);
CREATE INDEX IF NOT EXISTS idx_ki_tenant_confidence ON knowledge_items (tenant_id, confidence);
CREATE INDEX IF NOT EXISTS idx_ki_tenant_visibility ON knowledge_items (tenant_id, visibility);
CREATE INDEX IF NOT EXISTS idx_ki_tenant_sensitivity ON knowledge_items (tenant_id, regulatory_sensitivity);
CREATE INDEX IF NOT EXISTS idx_ki_tenant_sot ON knowledge_items (tenant_id, sot_level);
CREATE INDEX IF NOT EXISTS idx_ki_content_hash ON knowledge_items (content_hash);
CREATE INDEX IF NOT EXISTS idx_ki_embedding_status ON knowledge_items (embedding_status) WHERE embedding_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_ki_review_due ON knowledge_items (review_due_date) WHERE review_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ki_valid_until ON knowledge_items (valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ki_needs_resolution ON knowledge_items (tenant_id) WHERE needs_resolution = true;
CREATE INDEX IF NOT EXISTS idx_ki_owner_domain ON knowledge_items (owner_domain);

-- Relations indexes
CREATE INDEX IF NOT EXISTS idx_kr_source ON knowledge_relations (source_id);
CREATE INDEX IF NOT EXISTS idx_kr_target ON knowledge_relations (target_id);
CREATE INDEX IF NOT EXISTS idx_kr_type ON knowledge_relations (relation_type);

-- Source chunk array index (for semantic_memory joins)
CREATE INDEX IF NOT EXISTS idx_ki_source_chunks ON knowledge_items USING GIN (source_chunk_ids);


-- ============================================================================
-- PART 5: RLS POLICIES
-- JWT-based, tenant-aware. Permissive for single tenant (GAM) now.
-- Tightens when multi-tenant is needed — no migration required.
-- ============================================================================

ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_lenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_source_types ENABLE ROW LEVEL SECURITY;

-- === Dictionary tables: readable by all authenticated, writable by service_role ===

CREATE POLICY "dict_read_all" ON knowledge_departments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "dict_write_service" ON knowledge_departments
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "dict_read_all" ON knowledge_streams
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "dict_write_service" ON knowledge_streams
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "dict_read_all" ON knowledge_use_cases
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "dict_write_service" ON knowledge_use_cases
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "dict_read_all" ON knowledge_lenses
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "dict_write_service" ON knowledge_lenses
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "dict_read_all" ON knowledge_types
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "dict_write_service" ON knowledge_types
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "dict_read_all" ON knowledge_source_types
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "dict_write_service" ON knowledge_source_types
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- === knowledge_items: tenant-scoped + visibility/sensitivity rules ===

CREATE POLICY "ki_read_tenant" ON knowledge_items
    FOR SELECT TO authenticated
    USING (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    );

CREATE POLICY "ki_insert_tenant" ON knowledge_items
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    );

CREATE POLICY "ki_update_tenant" ON knowledge_items
    FOR UPDATE TO authenticated
    USING (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    );

CREATE POLICY "ki_service_all" ON knowledge_items
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- === knowledge_relations: same tenant scope ===
CREATE POLICY "kr_read_tenant" ON knowledge_relations
    FOR SELECT TO authenticated
    USING (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    );

CREATE POLICY "kr_write_tenant" ON knowledge_relations
    FOR ALL TO authenticated
    USING (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid
        )
    );

CREATE POLICY "kr_service_all" ON knowledge_relations
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- JSONB validation, auto-promote, updated_at trigger, conflict flag propagation.
-- ============================================================================

-- 6.1 Auto-update updated_at
CREATE OR REPLACE FUNCTION update_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- If content changed, mark embedding as stale
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.content_hash = encode(sha256(NEW.content::bytea), 'hex');
        NEW.embedding_status = 'stale';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ki_updated_at
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_updated_at();

-- 6.2 Auto-set content_hash on insert
CREATE OR REPLACE FUNCTION set_knowledge_content_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content_hash IS NULL OR NEW.content_hash = '' THEN
        NEW.content_hash = encode(sha256(NEW.content::bytea), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ki_content_hash
    BEFORE INSERT ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION set_knowledge_content_hash();

-- 6.3 Auto-promote logic
-- Owner-created items with low sensitivity skip draft → go to classified
CREATE OR REPLACE FUNCTION auto_promote_knowledge_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Only on INSERT
    -- If created by human (not AI) and sensitivity is none/low → auto classified
    IF NEW.created_by_type = 'human' AND NEW.regulatory_sensitivity IN ('none', 'low') THEN
        NEW.status = 'classified';
    END IF;
    -- AI-created items always stay draft
    IF NEW.created_by_type = 'ai' THEN
        NEW.status = 'draft';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ki_auto_promote
    BEFORE INSERT ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_promote_knowledge_item();

-- 6.4 Conflict flag propagation
-- When a 'contradicts' relation is created, set needs_resolution on both items
CREATE OR REPLACE FUNCTION propagate_conflict_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.relation_type = 'contradicts' THEN
        UPDATE knowledge_items
        SET needs_resolution = true, updated_at = now()
        WHERE id IN (NEW.source_id, NEW.target_id)
          AND needs_resolution = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kr_conflict_propagate
    AFTER INSERT ON knowledge_relations
    FOR EACH ROW
    EXECUTE FUNCTION propagate_conflict_flag();

-- 6.5 Validate JSONB classification arrays are not empty
-- (Application-level validation is primary, this is a safety net)
CREATE OR REPLACE FUNCTION validate_knowledge_classifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Status must be beyond draft to require classifications
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ki_validate_classifications
    BEFORE INSERT OR UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_knowledge_classifications();


-- ============================================================================
-- PART 7: SEED DATA — DICTIONARIES
-- Pre-populate with locked values from advisory board session.
-- ============================================================================

-- 7.1 Departments (8)
INSERT INTO knowledge_departments (name, name_he, sort_order) VALUES
    ('management', 'הנהלה / אסטרטגיה / פיתוח עסקי', 1),
    ('marketing_sales', 'שיווק ומכירות', 2),
    ('case_preparation', 'הכנת תיקים / רגולציה / רשם הקבלנים', 3),
    ('recruitment', 'גיוס / בעלי כישורים', 4),
    ('project_brokerage', 'תיווך פרויקטים', 5),
    ('company_brokerage', 'תיווך חברות למכירה', 6),
    ('finance', 'כספים / הוצאות / גבייה / חשבוניות', 7),
    ('systems', 'מערכות / דיגיטל / אוטומציה / AI / ידע', 8)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 7.2 Streams (9)
INSERT INTO knowledge_streams (name, name_he, origami_stream_name, sort_order) VALUES
    ('contractor_registration', 'רישום קבלנים', 'רישום קבלנים', 1),
    ('classification_upgrade', 'הגדלת סיווג', 'הגדלת סיווג', 2),
    ('approved_contractor', 'קבלן מוכר', 'קבלן מוכר', 3),
    ('employer_symbol', 'סמל מעסיק', 'סמל מעסיק', 4),
    ('recruitment', 'גיוס / בעלי כישורים', 'השמת בעלי כישורים', 5),
    ('project_brokerage', 'תיווך פרויקטים', 'תיווך פרויקטים', 6),
    ('company_brokerage', 'תיווך חברות למכירה', 'תיווך חברות', 7),
    ('partnerships', 'שותפויות / JV / הפניות', NULL, 8),
    ('workforce_corps', 'תאגידי כוח אדם לבניין', NULL, 9)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 7.3 Use Cases (10 primary — sub-stages in Phase 2)
INSERT INTO knowledge_use_cases (code, name, name_he, sort_order) VALUES
    ('1.1', 'Lead classification and routing', 'סיווג ליד והכוונה למוצר', 1),
    ('1.2', 'Sales call handling', 'שיחת מכירה וטיפול בהתנגדויות', 2),
    ('1.3', 'Initial eligibility check', 'בדיקת התאמה ראשונית לתיק', 3),
    ('1.4', 'Case building', 'בניית תיק רישום / הגדלה / קבלן מוכר / סמל מעסיק', 4),
    ('1.5', 'Missing docs and rejection prevention', 'בדיקת חוסרים והשלמות ומניעת דחייה', 5),
    ('1.6', 'Candidate screening and placement', 'סינון מועמד והשמה', 6),
    ('1.7', 'Project brokerage matching', 'התאמת צדדים בתיווך פרויקטים', 7),
    ('1.8', 'Company sale brokerage', 'תיווך חברות למכירה', 8),
    ('1.9', 'Financial control', 'בקרה פיננסית על עסקה / מוצר / חודש', 9),
    ('1.10', 'AI and employee briefing', 'תדרוך AI / Agent / עובד חדש', 10)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 7.4 Lenses (8)
INSERT INTO knowledge_lenses (name, name_he, sort_order) VALUES
    ('content', 'תוכן', 1),
    ('operational', 'תפעולי', 2),
    ('departmental', 'מחלקתי', 3),
    ('product_stream', 'מוצר / זרם שירות', 4),
    ('legal_regulatory', 'משפטי / רגולטורי', 5),
    ('risk', 'סיכונים', 6),
    ('financial', 'כספי', 7),
    ('ai_sot_governance', 'AI / מקור אמת / ממשל', 8)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 7.5 Knowledge Types (13 — 10 from advisory board + 3 from field validation)
INSERT INTO knowledge_types (name, name_he, description, example, sort_order) VALUES
    ('principle', 'עיקרון',
     'כלל יסוד שלא משתנה מהר',
     'קבלן חייב להוכיח 5 שנות ניסיון לסיווג 3', 1),
    ('concept', 'מושג',
     'הגדרה או מושג מקצועי',
     'סיווג קבלני = רמת ההיתר של הקבלן לבצע עבודות', 2),
    ('claim', 'טענה',
     'טענה שדורשת evidence — כולל thesis ברמה גבוהה',
     '80% מהדחיות הן בגלל מסמכים חסרים', 3),
    ('sop', 'נוהל עבודה',
     'שלבי עבודה מפורטים — step by step',
     'שלב 1: פתח תיק. שלב 2: בדוק מסמכים. שלב 3: הגש לרשם.', 4),
    ('protocol', 'פרוטוקול',
     'כלל התנהגות ברמת-על — מה עושים ומה לא',
     'מול רשם הקבלנים — תמיד בכתב, אף פעם בטלפון', 5),
    ('script', 'תסריט',
     'נוסח מדויק לשימוש — מילים שאומרים',
     'שלום, אני מ-GAM, אתם רשומים כסיווג 2, מעוניינים בהגדלה?', 6),
    ('trigger', 'טריגר',
     'תנאי שמפעיל פעולה או מעבר',
     'אם הלקוח אמר יקר → עבור ל-Script ערך מול מחיר', 7),
    ('anti_pattern', 'אנטי-פטרן',
     'מה אסור לעשות — שגיאה נפוצה',
     'אסור להבטיח ללקוח רישיון — זה לא בידינו', 8),
    ('metric', 'מדד',
     'מדד + ערך יעד או threshold',
     'שיעור דחייה מותר: מתחת ל-15%', 9),
    ('evidence', 'ראיה',
     'ראיה, מסמך תומך, או דוגמה קונקרטית',
     'אישור רואה חשבון על מחזור של 2M₪', 10),
    ('checklist', 'צ׳קליסט',
     'רשימת סימון לפני/אחרי פעולה — פריט = כן/לא',
     'לפני הגשת תיק רישום: ✓ אישור רו"ח ✓ תעודת ניסיון ✓ ביטוח ✓ טופס חתום', 11),
    ('template', 'תבנית מסמך',
     'מסמך/טופס למילוי חוזר — השלד קבוע, התוכן משתנה',
     'תבנית מכתב ללקוח שהתיק נדחה: [שם לקוח], תיק מס׳ [X] נדחה בשל [סיבה]...', 12),
    ('precedent', 'תקדים',
     'החלטה, פסיקה או אירוע שמשנה פרקטיקה — מה קרה ומה למדנו',
     'תיק X נדחה בגלל אישור ניסיון ישן מ-2020, ערערנו והרשם קיבל — מאז מגישים רק אישורים מ-3 שנים אחרונות', 13)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 7.6 Source Types
INSERT INTO knowledge_source_types (name, description) VALUES
    ('manual', 'כתיבה ידנית'),
    ('notion_page', 'דף Notion קיים'),
    ('pdf', 'מסמך PDF'),
    ('legal_document', 'מסמך משפטי / רגולטורי'),
    ('conversation', 'שיחה מוקלטת / תמלול'),
    ('recording', 'הקלטה (אודיו/וידאו)'),
    ('notebooklm', 'פלט NotebookLM'),
    ('ai_extraction', 'חילוץ אוטומטי ע״י AI'),
    ('email', 'מייל'),
    ('crm_note', 'הערה מ-Origami CRM')
ON CONFLICT (tenant_id, name) DO NOTHING;


-- ============================================================================
-- PART 8: USEFUL VIEWS
-- Pre-built queries for common access patterns.
-- ============================================================================

-- 8.1 Active approved knowledge (what AI and operators see)
CREATE OR REPLACE VIEW v_knowledge_active AS
SELECT
    ki.*,
    kt.name AS type_name,
    kt.name_he AS type_name_he
FROM knowledge_items ki
JOIN knowledge_types kt ON ki.knowledge_type_id = kt.id
WHERE ki.status IN ('approved', 'locked_to_sot')
  AND ki.confidence IN ('medium', 'high', 'verified');

-- 8.2 Items needing resolution
CREATE OR REPLACE VIEW v_knowledge_conflicts AS
SELECT
    ki.id, ki.title, ki.status, ki.confidence, ki.owner_domain,
    ki.needs_resolution, ki.resolution_note,
    kt.name AS type_name
FROM knowledge_items ki
JOIN knowledge_types kt ON ki.knowledge_type_id = kt.id
WHERE ki.needs_resolution = true;

-- 8.3 Items needing attention (expired review date OR expired validity)
CREATE OR REPLACE VIEW v_knowledge_review_due AS
SELECT
    ki.id, ki.title, ki.status, ki.review_due_date, ki.valid_until,
    ki.regulatory_sensitivity, ki.owner_domain,
    kt.name AS type_name,
    CASE
        WHEN ki.valid_until IS NOT NULL AND ki.valid_until <= CURRENT_DATE THEN 'expired'
        WHEN ki.review_due_date IS NOT NULL AND ki.review_due_date <= CURRENT_DATE THEN 'review_overdue'
        ELSE 'upcoming'
    END AS urgency_type
FROM knowledge_items ki
JOIN knowledge_types kt ON ki.knowledge_type_id = kt.id
WHERE ki.status NOT IN ('deprecated', 'archived', 'rejected')
  AND (
    (ki.review_due_date IS NOT NULL AND ki.review_due_date <= CURRENT_DATE)
    OR (ki.valid_until IS NOT NULL AND ki.valid_until <= CURRENT_DATE)
  );

-- 8.4 Items pending embedding (for cron job)
CREATE OR REPLACE VIEW v_knowledge_pending_embed AS
SELECT id, title, content, content_hash, embedding_status
FROM knowledge_items
WHERE embedding_status IN ('pending', 'stale')
  AND status NOT IN ('rejected', 'archived');

-- 8.5 AI-safe knowledge (for search_brain_smart boost)
-- Respects visibility + confidence + status + sensitivity
CREATE OR REPLACE VIEW v_knowledge_ai_safe AS
SELECT
    ki.id,
    ki.title,
    ki.content,
    ki.knowledge_type_id,
    ki.department_ids,
    ki.stream_ids,
    ki.use_case_ids,
    ki.lens_ids,
    ki.confidence,
    ki.sot_level,
    ki.search_weight,
    ki.source_chunk_ids,
    kt.name AS type_name
FROM knowledge_items ki
JOIN knowledge_types kt ON ki.knowledge_type_id = kt.id
WHERE ki.status IN ('approved', 'locked_to_sot')
  AND ki.visibility IN ('ai_internal', 'ai_external', 'published')
  AND ki.confidence IN ('medium', 'high', 'verified')
  AND ki.regulatory_sensitivity != 'critical';
