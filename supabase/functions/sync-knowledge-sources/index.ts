import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

interface KnowledgeSource {
  id: string
  name: string
  type: 'business_docs' | 'design_system' | 'notion' | 'origami_crm' | 'git_repo' | 'external_api'
  source_url?: string
  last_sync?: string
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  is_active: boolean
  metadata?: Record<string, unknown>
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

interface ContentChunk {
  content: string
  title?: string
  url?: string
  metadata?: Record<string, unknown>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify cron secret for scheduled executions
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedSecret = Deno.env.get('CRON_SECRET')

    if (cronSecret && expectedSecret && cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized cron request' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { method } = req
    const url = new URL(req.url)
    const sourceId = url.searchParams.get('source_id')
    const forceSync = url.searchParams.get('force') === 'true'

    switch (method) {
      case 'GET': {
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
      }

      case 'POST': {
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
          const result = await syncSource(supabase, source)
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
      }

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

async function syncSource(
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
    console.log(`Starting sync for source: ${source.id} (${source.type})`)

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

    console.log(`Sync completed for source ${source.id}: ${result.status}`)

  } catch (error) {
    result.status = 'error'
    result.error_message = error.message
    console.error(`Sync failed for source ${source.id}:`, error)
  }

  return result
}

async function syncBusinessDocs(
  supabase: any,
  source: KnowledgeSource,
  result: SyncResult
) {
  console.log(`Syncing business docs for source: ${source.id}`)

  try {
    // Fetch business documents from configured source
    const chunks = await fetchContent(source)

    if (chunks.length === 0) {
      console.log('No business documents found to sync')
      return
    }

    // Process each chunk and store with embeddings
    const processedChunks = await batchEmbedContents(chunks)

    for (const chunk of processedChunks) {
      try {
        await storeKnowledgeChunk(supabase, source.id, chunk)
        result.items_processed++
        result.items_added++
      } catch (error) {
        console.error('Failed to store business doc chunk:', error)
        result.items_failed++
      }
    }

  } catch (error) {
    result.items_failed++
    result.error_message = error.message
    console.error('Business docs sync error:', error)
  }
}

async function syncDesignSystem(
  supabase: any,
  source: KnowledgeSource,
  result: SyncResult
) {
  console.log(`Syncing design system for source: ${source.id}`)

  try {
    // Read design system files from the repository
    const designSystemPath = source.metadata?.path || '/src/lib/design-tokens/'

    // For the design system, we'll sync token definitions, component docs, etc.
    const chunks = await fetchContent(source)

    if (chunks.length === 0) {
      console.log('No design system content found to sync')
      return
    }

    const processedChunks = await batchEmbedContents(chunks)

    for (const chunk of processedChunks) {
      try {
        await storeKnowledgeChunk(supabase, source.id, chunk)
        result.items_processed++
        result.items_updated++
      } catch (error) {
        console.error('Failed to store design system chunk:', error)
        result.items_failed++
      }
    }

  } catch (error) {
    result.items_failed++
    result.error_message = error.message
    console.error('Design system sync error:', error)
  }
}

async function syncNotionContent(
  supabase: any,
  source: KnowledgeSource,
  result: SyncResult
) {
  console.log(`Syncing Notion content for source: ${source.id}`)

  try {
    const notionToken = Deno.env.get('NOTION_API_KEY')
    if (!notionToken) {
      throw new Error('NOTION_API_KEY not configured')
    }

    // Fetch content from Notion
    const chunks = await fetchNotionContent(source, notionToken)

    if (chunks.length === 0) {
      console.log('No Notion content found to sync')
      return
    }

    const processedChunks = await batchEmbedContents(chunks)

    for (const chunk of processedChunks) {
      try {
        await storeKnowledgeChunk(supabase, source.id, chunk)
        result.items_processed++
        result.items_added++
      } catch (error) {
        console.error('Failed to store Notion chunk:', error)
        result.items_failed++
      }
    }

  } catch (error) {
    result.items_failed++
    result.error_message = error.message
    console.error('Notion sync error:', error)
  }
}

async function syncOrigamiCRM(
  supabase: any,
  source: KnowledgeSource,
  result: SyncResult
) {
  console.log(`Syncing Origami CRM for source: ${source.id}`)

  try {
    const origamiApiKey = Deno.env.get('ORIGAMI_API_KEY')
    const origamiBaseUrl = Deno.env.get('ORIGAMI_BASE_URL')

    if (!origamiApiKey || !origamiBaseUrl) {
      throw new Error('Origami credentials not configured')
    }

    // Fetch content from Origami CRM
    const chunks = await fetchOrigamiContent(source, origamiApiKey, origamiBaseUrl)

    if (chunks.length === 0) {
      console.log('No Origami content found to sync')
      return
    }

    const processedChunks = await batchEmbedContents(chunks)

    for (const chunk of processedChunks) {
      try {
        await storeKnowledgeChunk(supabase, source.id, chunk)
        result.items_processed++
        result.items_added++
      } catch (error) {
        console.error('Failed to store Origami chunk:', error)
        result.items_failed++
      }
    }

  } catch (error) {
    result.items_failed++
    result.error_message = error.message
    console.error('Origami sync error:', error)
  }
}

async function syncGitRepository(
  supabase: any,
  source: KnowledgeSource,
  result: SyncResult
) {
  console.log(`Syncing Git repository for source: ${source.id}`)

  try {
    const githubToken = Deno.env.get('GITHUB_TOKEN')
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured')
    }

    // Fetch content from GitHub repository
    const chunks = await fetchGitContent(source, githubToken)

    if (chunks.length === 0) {
      console.log('No Git content found to sync')
      return
    }

    const processedChunks = await batchEmbedContents(chunks)

    for (const chunk of processedChunks) {
      try {
        await storeKnowledgeChunk(supabase, source.id, chunk)
        result.items_processed++
        result.items_added++
      } catch (error) {
        console.error('Failed to store Git chunk:', error)
        result.items_failed++
      }
    }

  } catch (error) {
    result.items_failed++
    result.error_message = error.message
    console.error('Git repository sync error:', error)
  }
}

async function syncExternalAPI(
  supabase: any,
  source: KnowledgeSource,
  result: SyncResult
) {
  console.log(`Syncing external API for source: ${source.id}`)

  try {
    const apiUrl = source.source_url
    const apiKey = source.metadata?.api_key as string

    if (!apiUrl) {
      throw new Error('API URL not configured')
    }

    // Fetch content from external API
    const chunks = await fetchExternalAPIContent(source, apiUrl, apiKey)

    if (chunks.length === 0) {
      console.log('No external API content found to sync')
      return
    }

    const processedChunks = await batchEmbedContents(chunks)

    for (const chunk of processedChunks) {
      try {
        await storeKnowledgeChunk(supabase, source.id, chunk)
        result.items_processed++
        result.items_added++
      } catch (error) {
        console.error('Failed to store external API chunk:', error)
        result.items_failed++
      }
    }

  } catch (error) {
    result.items_failed++
    result.error_message = error.message
    console.error('External API sync error:', error)
  }
}

async function fetchContent(source: KnowledgeSource): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = []

  switch (source.type) {
    case 'git_repo':
      const githubToken = Deno.env.get('GITHUB_TOKEN')
      if (githubToken) {
        return await fetchGitContent(source, githubToken)
      }
      break

    case 'notion':
      const notionToken = Deno.env.get('NOTION_API_KEY')
      if (notionToken) {
        return await fetchNotionContent(source, notionToken)
      }
      break

    case 'external_api':
      if (source.source_url) {
        return await fetchExternalAPIContent(
          source,
          source.source_url,
          source.metadata?.api_key as string
        )
      }
      break
  }

  return chunks
}

async function fetchGitContent(source: KnowledgeSource, token: string): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = []

  if (!source.source_url) return chunks

  try {
    // Parse GitHub URL to extract owner and repo
    const url = new URL(source.source_url)
    const [, owner, repo] = url.pathname.split('/')

    // Fetch repository content from GitHub API
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }

    // Get README and documentation files
    const docFiles = ['README.md', 'CLAUDE.md', 'docs/', 'src/lib/design-tokens/']

    for (const file of docFiles) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file}`,
          { headers }
        )

        if (response.ok) {
          const data = await response.json()

          if (Array.isArray(data)) {
            // Directory listing
            for (const item of data) {
              if (item.type === 'file' && item.name.match(/\.(md|txt|json)$/i)) {
                const fileResponse = await fetch(item.download_url)
                if (fileResponse.ok) {
                  const content = await fileResponse.text()
                  chunks.push({
                    content: content,
                    title: item.name,
                    url: item.html_url,
                    metadata: {
                      file_path: item.path,
                      size: item.size,
                      sha: item.sha
                    }
                  })
                }
              }
            }
          } else if (data.type === 'file') {
            // Single file
            const fileResponse = await fetch(data.download_url)
            if (fileResponse.ok) {
              const content = await fileResponse.text()
              chunks.push({
                content: content,
                title: data.name,
                url: data.html_url,
                metadata: {
                  file_path: data.path,
                  size: data.size,
                  sha: data.sha
                }
              })
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${file}: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('Git content fetch error:', error)
  }

  return chunks
}

async function fetchNotionContent(source: KnowledgeSource, token: string): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = []

  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    }

    // Search for pages in the workspace
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { property: 'object', value: 'page' },
        page_size: 100
      })
    })

    if (!searchResponse.ok) {
      throw new Error(`Notion API error: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()

    // Process each page
    for (const page of searchData.results) {
      try {
        // Get page content
        const blocksResponse = await fetch(
          `https://api.notion.com/v1/blocks/${page.id}/children`,
          { headers }
        )

        if (blocksResponse.ok) {
          const blocksData = await blocksResponse.json()
          let content = ''

          // Extract text from blocks
          for (const block of blocksData.results) {
            if (block.type === 'paragraph' && block.paragraph?.rich_text) {
              content += block.paragraph.rich_text.map((text: any) => text.plain_text).join('')
            } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
              content += '\n# ' + block.heading_1.rich_text.map((text: any) => text.plain_text).join('')
            } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
              content += '\n## ' + block.heading_2.rich_text.map((text: any) => text.plain_text).join('')
            } else if (block.type === 'heading_3' && block.heading_3?.rich_text) {
              content += '\n### ' + block.heading_3.rich_text.map((text: any) => text.plain_text).join('')
            }
          }

          if (content.trim()) {
            chunks.push({
              content: content.trim(),
              title: getPageTitle(page),
              url: page.url,
              metadata: {
                page_id: page.id,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time
              }
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to process Notion page ${page.id}: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('Notion content fetch error:', error)
  }

  return chunks
}

function getPageTitle(page: any): string {
  if (page.properties?.title?.title?.[0]?.plain_text) {
    return page.properties.title.title[0].plain_text
  }
  if (page.properties?.Name?.title?.[0]?.plain_text) {
    return page.properties.Name.title[0].plain_text
  }
  return 'Untitled'
}

async function fetchOrigamiContent(
  source: KnowledgeSource,
  apiKey: string,
  baseUrl: string
): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = []

  try {
    // Fetch entities and documentation from Origami
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }

    // This would depend on Origami's specific API structure
    // For now, return empty chunks
    console.log('Origami content fetching not fully implemented')

  } catch (error) {
    console.error('Origami content fetch error:', error)
  }

  return chunks
}

async function fetchExternalAPIContent(
  source: KnowledgeSource,
  apiUrl: string,
  apiKey?: string
): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = []

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(apiUrl, { headers })

    if (response.ok) {
      const data = await response.json()

      // Process the API response into chunks
      // This would depend on the specific API structure
      if (typeof data === 'object' && data !== null) {
        chunks.push({
          content: JSON.stringify(data, null, 2),
          title: `External API Data from ${apiUrl}`,
          url: apiUrl,
          metadata: {
            fetched_at: new Date().toISOString(),
            content_type: 'json'
          }
        })
      }
    }

  } catch (error) {
    console.error('External API content fetch error:', error)
  }

  return chunks
}

async function batchEmbedContents(chunks: ContentChunk[]): Promise<Array<ContentChunk & { embedding: number[] }>> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not configured, skipping embeddings')
    return chunks.map(chunk => ({ ...chunk, embedding: [] }))
  }

  const embeddedChunks: Array<ContentChunk & { embedding: number[] }> = []

  // Process chunks in batches to respect API limits
  const batchSize = 10
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)

    try {
      // Prepare batch request for Gemini Embedding API
      const requests = batch.map(chunk => ({
        model: 'models/embedding-001',
        content: {
          parts: [{
            text: `${chunk.title || ''}\n\n${chunk.content}`.substring(0, 8000) // Limit content size
          }]
        }
      }))

      // Make batch embedding request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:batchEmbedContents?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: requests
          })
        }
      )

      if (!response.ok) {
        console.error('Gemini API error:', await response.text())
        // Add chunks without embeddings if API fails
        for (const chunk of batch) {
          embeddedChunks.push({ ...chunk, embedding: [] })
        }
        continue
      }

      const data = await response.json()

      // Process embeddings
      if (data.embeddings && Array.isArray(data.embeddings)) {
        for (let j = 0; j < batch.length && j < data.embeddings.length; j++) {
          const embedding = data.embeddings[j].values || []
          embeddedChunks.push({
            ...batch[j],
            embedding: embedding
          })
        }
      }

      // Rate limiting: wait between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error('Batch embedding error:', error)
      // Add chunks without embeddings if batch fails
      for (const chunk of batch) {
        embeddedChunks.push({ ...chunk, embedding: [] })
      }
    }
  }

  return embeddedChunks
}

async function storeKnowledgeChunk(
  supabase: any,
  sourceId: string,
  chunk: ContentChunk & { embedding: number[] }
) {
  try {
    // Store in semantic_memory table with embedding
    const { error } = await supabase
      .from('semantic_memory')
      .insert({
        source_id: sourceId,
        content: chunk.content,
        title: chunk.title,
        url: chunk.url,
        embedding: chunk.embedding,
        metadata: {
          ...chunk.metadata,
          chunk_size: chunk.content.length,
          stored_at: new Date().toISOString()
        }
      })

    if (error) {
      throw error
    }

    console.log(`Stored knowledge chunk: ${chunk.title || 'Untitled'}`)

  } catch (error) {
    console.error('Failed to store knowledge chunk:', error)
    throw error
  }
}