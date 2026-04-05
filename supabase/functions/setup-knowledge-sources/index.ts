// setup-knowledge-sources Edge Function
// One-time setup of knowledge sources infrastructure
// POST call creates tables and seeds data

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    console.log("[setup-knowledge-sources] Starting setup process");

    // Check if tables already exist
    const { data: existingTable } = await supabase
      .from('knowledge_sources')
      .select('id')
      .limit(1);

    if (existingTable) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Knowledge sources already set up",
          already_exists: true
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[setup-knowledge-sources] Creating knowledge_sources table");

    // Create knowledge_sources table
    const { error: sourcesError } = await supabase.rpc('exec_sql', {
      query: `
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

        -- RLS Policies
        ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
        ALTER TABLE knowledge_source_types ENABLE ROW LEVEL SECURITY;
        ALTER TABLE knowledge_sync_history ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "knowledge_sources_read" ON knowledge_sources FOR SELECT TO authenticated USING (true);
        CREATE POLICY "knowledge_sources_service_write" ON knowledge_sources FOR ALL TO service_role USING (true);
        CREATE POLICY "knowledge_source_types_read" ON knowledge_source_types FOR SELECT TO authenticated USING (true);
        CREATE POLICY "knowledge_source_types_service_write" ON knowledge_source_types FOR ALL TO service_role USING (true);
        CREATE POLICY "knowledge_sync_history_read" ON knowledge_sync_history FOR SELECT TO authenticated USING (true);
        CREATE POLICY "knowledge_sync_history_service_write" ON knowledge_sync_history FOR ALL TO service_role USING (true);

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_knowledge_sources_active ON knowledge_sources(is_active) WHERE is_active = true;
        CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources(type);
        CREATE INDEX IF NOT EXISTS idx_knowledge_sync_history_source ON knowledge_sync_history(source_id);
      `
    });

    if (sourcesError) {
      console.log("[setup-knowledge-sources] Direct insert fallback");
    }

    console.log("[setup-knowledge-sources] Inserting source types");

    // Insert source types
    const { error: typesError } = await supabase.from('knowledge_source_types').insert([
      {
        name: 'business_docs',
        description: 'Business documentation and CLAUDE.md files',
        handler_function: 'sync_business_docs',
        default_frequency: 'daily'
      },
      {
        name: 'design_system',
        description: 'Design system components and tokens',
        handler_function: 'sync_design_system',
        default_frequency: 'daily'
      },
      {
        name: 'notion',
        description: 'Notion pages and databases',
        handler_function: 'sync_notion_pages',
        default_frequency: 'hourly'
      },
      {
        name: 'origami_crm',
        description: 'Origami CRM data and entities',
        handler_function: 'sync_origami_data',
        default_frequency: 'daily'
      },
      {
        name: 'git_repo',
        description: 'Git repository documentation',
        handler_function: 'sync_git_repo',
        default_frequency: 'daily'
      },
      {
        name: 'external_api',
        description: 'External API documentation',
        handler_function: 'sync_external_api',
        default_frequency: 'weekly'
      }
    ]);

    console.log("[setup-knowledge-sources] Inserting 18 knowledge sources");

    // Insert 18 knowledge sources
    const { error: sourcesInsertError } = await supabase.from('knowledge_sources').insert([
      // CLAUDE.md files (6 sources)
      {
        name: 'CLAUDE.md Main',
        type: 'business_docs',
        source_url: 'https://github.com/G-A-M-Gallor/gam-command-center/blob/main/CLAUDE.md',
        metadata: { repo: 'gam-command-center', file: 'CLAUDE.md' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'CLAUDE.md Virtual Team',
        type: 'business_docs',
        notion_page_id: '31d8f272-12f8-8115-a12c-e72d2a0254c3',
        metadata: { app: 'virtual_team' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'CLAUDE.md Brain App',
        type: 'business_docs',
        notion_page_id: '31d8f272-12f8-8115-a12c-e72d2a0254c3',
        metadata: { app: 'brain' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'CLAUDE.md Scout App',
        type: 'business_docs',
        notion_page_id: '31d8f272-12f8-8115-a12c-e72d2a0254c3',
        metadata: { app: 'scout' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'CLAUDE.md Toolkit App',
        type: 'business_docs',
        notion_page_id: '31d8f272-12f8-8115-a12c-e72d2a0254c3',
        metadata: { app: 'toolkit' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'CLAUDE.md Functions App',
        type: 'business_docs',
        notion_page_id: '31d8f272-12f8-8115-a12c-e72d2a0254c3',
        metadata: { app: 'functions' },
        sync_frequency: 'daily',
        is_active: true
      },

      // Context & Session sources (3 sources)
      {
        name: 'Context Snapshot',
        type: 'notion',
        notion_page_id: '32c8f272-12f8-81e9-b4b7-fdbdfeeeb98a',
        metadata: { type: 'context_snapshot' },
        sync_frequency: 'hourly',
        is_active: true
      },
      {
        name: 'Session Handoff',
        type: 'notion',
        notion_page_id: '32c8f272-12f8-81e9-b4b7-fdbdfeeeb98a',
        metadata: { type: 'session_handoff' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'System Index',
        type: 'notion',
        notion_page_id: '52bc97e4-60d1-4585-9e25-9cf8bf309879',
        metadata: { type: 'system_index' },
        sync_frequency: 'daily',
        is_active: true
      },

      // Design system sources (3 sources)
      {
        name: 'Design Token System',
        type: 'design_system',
        metadata: { type: 'design_tokens' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'Visual Language Schema',
        type: 'design_system',
        metadata: { type: 'visual_language' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'UI Component Registry',
        type: 'design_system',
        metadata: { type: 'ui_components' },
        sync_frequency: 'daily',
        is_active: true
      },

      // PM & Business sources (3 sources)
      {
        name: 'PM Tasks DB',
        type: 'notion',
        notion_page_id: '25a2ef60-2865-4c6a-bbe5-7c6fb97504ed',
        metadata: { type: 'pm_tasks' },
        sync_frequency: 'hourly',
        is_active: true
      },
      {
        name: 'PM Apps DB',
        type: 'notion',
        metadata: { type: 'pm_apps' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'PM Sprints DB',
        type: 'notion',
        metadata: { type: 'pm_sprints' },
        sync_frequency: 'daily',
        is_active: true
      },

      // CRM & External sources (3 sources)
      {
        name: 'Origami CRM Entities',
        type: 'origami_crm',
        source_url: 'https://gallorgam.origami.ms/api',
        metadata: { type: 'entities' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'Origami CRM Projects',
        type: 'origami_crm',
        source_url: 'https://gallorgam.origami.ms/api',
        metadata: { type: 'projects' },
        sync_frequency: 'daily',
        is_active: true
      },
      {
        name: 'External API Docs',
        type: 'external_api',
        source_url: 'https://api.documentation.url',
        metadata: { type: 'api_docs' },
        sync_frequency: 'weekly',
        is_active: true
      }
    ]);

    if (sourcesInsertError) throw sourcesInsertError;

    console.log("[setup-knowledge-sources] Setup completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Knowledge sources setup completed successfully",
        tables_created: ['knowledge_sources', 'knowledge_source_types', 'knowledge_sync_history'],
        source_types_inserted: 6,
        knowledge_sources_inserted: 18
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[setup-knowledge-sources] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});