import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbedRequest {
  knowledge_item_id: string;
  force?: boolean; // Force re-embedding even if already synced
}

interface EmbedResponse {
  success: boolean;
  knowledge_item_id: string;
  chunk_id?: string;
  embedding_status: string;
  message: string;
  error?: string;
}

// Domain classification based on department IDs
function classifyDomain(departmentIds: string[]): string {
  if (!departmentIds || departmentIds.length === 0) {
    return 'unclassified';
  }

  // Department to domain mapping based on knowledge_departments
  const domainMapping: Record<string, string> = {
    'management': 'management',
    'marketing_sales': 'sales',
    'case_preparation': 'case_building',
    'recruitment': 'recruitment',
    'project_brokerage': 'project_services',
    'company_brokerage': 'project_services',
    'finance': 'finance',
    'systems': 'systems'
  };

  // For simplicity, we'll take the first department as the primary domain
  // In a real implementation, this could be more sophisticated
  const primaryDept = departmentIds[0];
  return domainMapping[primaryDept] || 'business_general';
}

// Map sot_level to trust_level
function mapTrustLevel(sotLevel: number): string {
  switch (sotLevel) {
    case 1: return 'regulatory'; // official regulation
    case 2: return 'verified';   // approved SOP
    case 3: return 'reviewed';   // reviewed internal knowledge
    case 4: return 'draft';      // draft/unreviewed
    case 5: return 'ai_generated'; // AI suggestion
    default: return 'auto';
  }
}

// Generate embedding using Gemini API
async function generateEmbedding(content: string): Promise<number[]> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Use the same model as existing embeddings in the system
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text: content }]
      },
      // Note: text-embedding-004 returns 768 dimensions
      // If system requires 3072, we'll need to adapt or use different model
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Return the embedding values
  if (!data.embedding || !data.embedding.values) {
    throw new Error('Invalid response from Gemini API - missing embedding values');
  }

  return data.embedding.values;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    if (req.method !== 'POST') {
      throw new Error('Only POST method allowed');
    }

    const body: EmbedRequest = await req.json();
    const { knowledge_item_id, force = false } = body;

    if (!knowledge_item_id) {
      throw new Error('knowledge_item_id is required');
    }

    console.log(`🧠 Embedding knowledge item: ${knowledge_item_id}, force=${force}`);

    // 1. Read the knowledge_item from knowledge_items table
    const { data: knowledgeItem, error: fetchError } = await supabase
      .from('knowledge_items')
      .select(`
        id, title, content, content_hash,
        department_ids, sot_level, source_chunk_ids,
        embedding_status, status, created_by
      `)
      .eq('id', knowledge_item_id)
      .single();

    if (fetchError || !knowledgeItem) {
      throw new Error(`Knowledge item not found: ${fetchError?.message || 'Unknown error'}`);
    }

    // 2. Check if already embedded and not forcing
    if (!force && knowledgeItem.embedding_status === 'synced') {
      return new Response(JSON.stringify({
        success: true,
        knowledge_item_id,
        embedding_status: 'already_synced',
        message: 'Knowledge item already embedded. Use force=true to re-embed.'
      } as EmbedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Classify domain from department_ids
    const departmentIds = Array.isArray(knowledgeItem.department_ids)
      ? knowledgeItem.department_ids
      : JSON.parse(knowledgeItem.department_ids || '[]');

    const domain = classifyDomain(departmentIds);
    const trustLevel = mapTrustLevel(knowledgeItem.sot_level || 3);

    console.log(`📊 Domain: ${domain}, Trust: ${trustLevel}, SOT Level: ${knowledgeItem.sot_level}`);

    // 4. Generate embedding via Gemini
    const embedding = await generateEmbedding(knowledgeItem.content);
    console.log(`🔢 Generated embedding with ${embedding.length} dimensions`);

    // 5. Create chunk in semantic_memory
    const { data: semanticChunk, error: insertError } = await supabase
      .from('semantic_memory')
      .insert({
        source_type: 'knowledge_item',
        source_id: knowledge_item_id,
        content: knowledgeItem.content,
        content_hash: knowledgeItem.content_hash,
        embedding: embedding,
        domain: domain,
        trust_level: trustLevel,
        memory_scope: 'knowledge',
        embedding_model: 'gemini-embedding-001',
        is_active: true,
        tenant_id: '00000000-0000-0000-0000-000000000000', // Default tenant
        embedded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to insert semantic chunk: ${insertError.message}`);
    }

    const chunkId = semanticChunk.id;
    console.log(`✅ Created semantic chunk: ${chunkId}`);

    // 6. Update knowledge_item: source_chunk_ids + embedding_status
    const updatedChunkIds = [...(knowledgeItem.source_chunk_ids || []), chunkId];

    const { error: updateError } = await supabase
      .from('knowledge_items')
      .update({
        source_chunk_ids: updatedChunkIds,
        embedding_status: 'synced',
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledge_item_id);

    if (updateError) {
      console.error('⚠️ Failed to update knowledge_item, but chunk was created');
      throw new Error(`Failed to update knowledge item: ${updateError.message}`);
    }

    // 7. Success response
    const response: EmbedResponse = {
      success: true,
      knowledge_item_id,
      chunk_id: chunkId,
      embedding_status: 'synced',
      message: `Successfully embedded knowledge item "${knowledgeItem.title}"`
    };

    console.log(`🎉 Embedding complete: ${knowledge_item_id} → ${chunkId}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('❌ Embed Knowledge Item Error:', error);

    const response: EmbedResponse = {
      success: false,
      knowledge_item_id: '',
      embedding_status: 'error',
      message: 'Embedding failed',
      error: error instanceof Error ? error.message : String(error)
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});