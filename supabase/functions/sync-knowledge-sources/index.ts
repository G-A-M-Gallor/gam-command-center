import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KnowledgeSource {
  id: string
  name: string
  type: 'business_docs' | 'design_system' | 'notion' | 'origami_crm' | 'git_repo' | 'external_api'
  source_url?: string
  last_sync?: string
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  is_active: boolean
  metadata?: Record<string, any>
}

interface SyncResult {
  source_id: string
  status: 'success' | 'error' | 'partial'
  synced_at: string
  items_processed: number
  items_added: number
  items_updated: number
  items_failed: number
  error_message?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { method } = req
    const url = new URL(req.url)
    const sourceId = url.searchParams.get('source_id')
    const forceSync = url.searchParams.get('force') === 'true'

    switch (method) {
      case 'GET':
        // Get knowledge sources or sync status
        if (url.pathname.includes('/status')) {
          const { data: syncHistory } = await supabase
            .from('knowledge_sync_history')
            .select('*')
            .order('synced_at', { ascending: false })
            .limit(50)

          return new Response(
            JSON.stringify({ sync_history: syncHistory }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get all knowledge sources
        const { data: sources, error: sourcesError } = await supabase
          .from('knowledge_sources')
          .select('*')
          .eq('is_active', true)

        if (sourcesError) throw sourcesError

        return new Response(
          JSON.stringify({ sources }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'POST':
        // Trigger sync for specific source or all sources
        const body = await req.json()
        const { source_ids } = body

        let sourcesToSync: KnowledgeSource[] = []

        if (sourceId) {
          // Sync specific source
          const { data: source } = await supabase
            .from('knowledge_sources')
            .select('*')
            .eq('id', sourceId)
            .eq('is_active', true)
            .single()

          if (source) sourcesToSync = [source]
        } else if (source_ids && Array.isArray(source_ids)) {
          // Sync multiple specific sources
          const { data: sources } = await supabase
            .from('knowledge_sources')
            .select('*')
            .in('id', source_ids)
            .eq('is_active', true)

          sourcesToSync = sources || []
        } else {
          // Sync all active sources that are due for sync
          const { data: sources } = await supabase
            .from('knowledge_sources')
            .select('*')
            .eq('is_active', true)

          if (sources) {
            const now = new Date()
            sourcesToSync = sources.filter(source => {
              if (forceSync) return true

              const lastSync = source.last_sync ? new Date(source.last_sync) : new Date(0)
              const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)

              switch (source.sync_frequency) {
                case 'hourly': return hoursSinceSync >= 1
                case 'daily': return hoursSinceSync >= 24
                case 'weekly': return hoursSinceSync >= 168
                case 'manual': return false
                default: return false
              }
            })
          }
        }

        if (sourcesToSync.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No sources need syncing', synced_sources: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Execute sync for each source
        const syncResults: SyncResult[] = []

        for (const source of sourcesToSync) {
          const result = await syncKnowledgeSource(supabase, source)
          syncResults.push(result)

          // Update last_sync timestamp
          await supabase
            .from('knowledge_sources')
            .update({ last_sync: result.synced_at })
            .eq('id', source.id)

          // Record sync history
          await supabase
            .from('knowledge_sync_history')
            .insert({
              source_id: source.id,
              status: result.status,
              synced_at: result.synced_at,
              items_processed: result.items_processed,
              items_added: result.items_added,
              items_updated: result.items_updated,
              items_failed: result.items_failed,
              error_message: result.error_message,
              metadata: {
                source_type: source.type,
                sync_trigger: sourceId ? 'manual' : 'scheduled'
              }
            })
        }

        return new Response(
          JSON.stringify({
            message: `Synced ${syncResults.length} sources`,
            results: syncResults
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncKnowledgeSource(
  supabase: any,
  source: KnowledgeSource
): Promise<SyncResult> {
  const startTime = new Date().toISOString()
  const result: SyncResult = {
    source_id: source.id,
    status: 'success',
    synced_at: startTime,
    items_processed: 0,
    items_added: 0,
    items_updated: 0,
    items_failed: 0
  }

  try {
    switch (source.type) {
      case 'business_docs':
        await syncBusinessDocs(supabase, source, result)
        break

      case 'design_system':
        await syncDesignSystem(supabase, source, result)
        break

      case 'notion':
        await syncNotionContent(supabase, source, result)
        break

      case 'origami_crm':
        await syncOrigamiCRM(supabase, source, result)
        break

      case 'git_repo':
        await syncGitRepository(supabase, source, result)
        break

      case 'external_api':
        await syncExternalAPI(supabase, source, result)
        break

      default:
        throw new Error(`Unsupported source type: ${source.type}`)
    }

    if (result.items_failed > 0 && result.items_added === 0 && result.items_updated === 0) {
      result.status = 'error'
    } else if (result.items_failed > 0) {
      result.status = 'partial'
    }

  } catch (error) {
    result.status = 'error'
    result.error_message = error.message
    console.error(`Sync failed for source ${source.id}:`, error)
  }

  return result
}

async function syncBusinessDocs(supabase: any, source: KnowledgeSource, result: SyncResult) {
  // Sync business language documents, process documentation, etc.
  console.log(`Syncing business docs for source: ${source.id}`)

  // This would integrate with file storage, document management systems
  // For now, just placeholder implementation
  result.items_processed = 0
}

async function syncDesignSystem(supabase: any, source: KnowledgeSource, result: SyncResult) {
  // Sync design tokens, component documentation, pattern libraries
  console.log(`Syncing design system for source: ${source.id}`)

  try {
    // Read design system files from the repository
    const designSystemPath = source.metadata?.path || '/src/lib/design-tokens/'

    // This would read design token files, component docs, etc.
    // For now, just placeholder implementation
    result.items_processed = 1
    result.items_updated = 1

  } catch (error) {
    result.items_failed += 1
    console.error('Design system sync error:', error)
  }
}

async function syncNotionContent(supabase: any, source: KnowledgeSource, result: SyncResult) {
  // Sync from Notion databases and pages
  console.log(`Syncing Notion content for source: ${source.id}`)

  try {
    const notionToken = Deno.env.get('NOTION_API_KEY')
    if (!notionToken) {
      throw new Error('NOTION_API_KEY not configured')
    }

    // This would use Notion API to fetch content
    // Implementation depends on specific Notion databases
    result.items_processed = 0

  } catch (error) {
    result.items_failed += 1
    result.error_message = error.message
  }
}

async function syncOrigamiCRM(supabase: any, source: KnowledgeSource, result: SyncResult) {
  // Sync from Origami CRM system
  console.log(`Syncing Origami CRM for source: ${source.id}`)

  try {
    const origamiApiKey = Deno.env.get('ORIGAMI_API_KEY')
    const origamiBaseUrl = Deno.env.get('ORIGAMI_BASE_URL')

    if (!origamiApiKey || !origamiBaseUrl) {
      throw new Error('Origami credentials not configured')
    }

    // This would sync entities, business processes, etc. from Origami
    result.items_processed = 0

  } catch (error) {
    result.items_failed += 1
    result.error_message = error.message
  }
}

async function syncGitRepository(supabase: any, source: KnowledgeSource, result: SyncResult) {
  // Sync code documentation, README files, etc. from Git repository
  console.log(`Syncing Git repository for source: ${source.id}`)

  try {
    // This would clone/pull from git repo and extract documentation
    result.items_processed = 0

  } catch (error) {
    result.items_failed += 1
    result.error_message = error.message
  }
}

async function syncExternalAPI(supabase: any, source: KnowledgeSource, result: SyncResult) {
  // Sync from external APIs
  console.log(`Syncing external API for source: ${source.id}`)

  try {
    const apiUrl = source.source_url
    const apiKey = source.metadata?.api_key

    if (!apiUrl) {
      throw new Error('API URL not configured')
    }

    // This would fetch data from external API
    result.items_processed = 0

  } catch (error) {
    result.items_failed += 1
    result.error_message = error.message
  }
}

/* Deno.serve(serve) */