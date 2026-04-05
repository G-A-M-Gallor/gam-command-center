-- GAM Command Center — Knowledge Sources Setup
-- Run this SQL in Supabase SQL Editor

-- ── CREATE TABLES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('business_docs', 'design_system', 'notion', 'origami_crm', 'git_repo', 'external_api')),
  source_url TEXT,
  notion_page_id TEXT,
  metadata JSONB DEFAULT '{}',
  sync_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_source_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  handler_function TEXT,
  default_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  items_processed INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ── RLS POLICIES ───────────────────────────────────────────────────────
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_source_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_sources_read" ON knowledge_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "knowledge_sources_service_write" ON knowledge_sources FOR ALL TO service_role USING (true);
CREATE POLICY "knowledge_source_types_read" ON knowledge_source_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "knowledge_source_types_service_write" ON knowledge_source_types FOR ALL TO service_role USING (true);
CREATE POLICY "knowledge_sync_history_read" ON knowledge_sync_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "knowledge_sync_history_service_write" ON knowledge_sync_history FOR ALL TO service_role USING (true);

-- ── INDEXES ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_active ON knowledge_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sync_history_source ON knowledge_sync_history(source_id);

-- ── SEED DATA ──────────────────────────────────────────────────────────

-- Insert source types
INSERT INTO knowledge_source_types (name, description, handler_function, default_frequency) VALUES
('business_docs', 'Business documentation and CLAUDE.md files', 'sync_business_docs', 'daily'),
('design_system', 'Design system components and tokens', 'sync_design_system', 'daily'),
('notion', 'Notion pages and databases', 'sync_notion_pages', 'hourly'),
('origami_crm', 'Origami CRM data and entities', 'sync_origami_data', 'daily'),
('git_repo', 'Git repository documentation', 'sync_git_repo', 'daily'),
('external_api', 'External API documentation', 'sync_external_api', 'weekly');

-- Insert 18 knowledge sources
INSERT INTO knowledge_sources (name, type, source_url, notion_page_id, metadata, sync_frequency, is_active) VALUES

-- CLAUDE.md files (6 sources)
('CLAUDE.md Main', 'business_docs', 'https://github.com/G-A-M-Gallor/gam-command-center/blob/main/CLAUDE.md', NULL, '{"repo": "gam-command-center", "file": "CLAUDE.md"}', 'daily', true),
('CLAUDE.md Virtual Team', 'business_docs', NULL, '31d8f272-12f8-8115-a12c-e72d2a0254c3', '{"app": "virtual_team"}', 'daily', true),
('CLAUDE.md Brain App', 'business_docs', NULL, '31d8f272-12f8-8115-a12c-e72d2a0254c3', '{"app": "brain"}', 'daily', true),
('CLAUDE.md Scout App', 'business_docs', NULL, '31d8f272-12f8-8115-a12c-e72d2a0254c3', '{"app": "scout"}', 'daily', true),
('CLAUDE.md Toolkit App', 'business_docs', NULL, '31d8f272-12f8-8115-a12c-e72d2a0254c3', '{"app": "toolkit"}', 'daily', true),
('CLAUDE.md Functions App', 'business_docs', NULL, '31d8f272-12f8-8115-a12c-e72d2a0254c3', '{"app": "functions"}', 'daily', true),

-- Context & Session sources (3 sources)
('Context Snapshot', 'notion', NULL, '32c8f272-12f8-81e9-b4b7-fdbdfeeeb98a', '{"type": "context_snapshot"}', 'hourly', true),
('Session Handoff', 'notion', NULL, '32c8f272-12f8-81e9-b4b7-fdbdfeeeb98a', '{"type": "session_handoff"}', 'daily', true),
('System Index', 'notion', NULL, '52bc97e4-60d1-4585-9e25-9cf8bf309879', '{"type": "system_index"}', 'daily', true),

-- Design system sources (3 sources)
('Design Token System', 'design_system', NULL, NULL, '{"type": "design_tokens"}', 'daily', true),
('Visual Language Schema', 'design_system', NULL, NULL, '{"type": "visual_language"}', 'daily', true),
('UI Component Registry', 'design_system', NULL, NULL, '{"type": "ui_components"}', 'daily', true),

-- PM & Business sources (3 sources)
('PM Tasks DB', 'notion', NULL, '25a2ef60-2865-4c6a-bbe5-7c6fb97504ed', '{"type": "pm_tasks"}', 'hourly', true),
('PM Apps DB', 'notion', NULL, 'pm-apps-db-id', '{"type": "pm_apps"}', 'daily', true),
('PM Sprints DB', 'notion', NULL, 'pm-sprints-db-id', '{"type": "pm_sprints"}', 'daily', true),

-- CRM & External sources (3 sources)
('Origami CRM Entities', 'origami_crm', 'https://gallorgam.origami.ms/api', NULL, '{"type": "entities"}', 'daily', true),
('Origami CRM Projects', 'origami_crm', 'https://gallorgam.origami.ms/api', NULL, '{"type": "projects"}', 'daily', true),
('External API Docs', 'external_api', 'https://api.documentation.url', NULL, '{"type": "api_docs"}', 'weekly', true);
