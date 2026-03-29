import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContextRequest {
  mode?: 'full' | 'sprint' | 'health';
  tenant_id?: string;
}

interface ContextResponse {
  mode: string;
  timestamp: string;
  system_status: 'healthy' | 'degraded' | 'critical';
  active_claude_md: Array<{
    app_name: string;
    content: string;
    last_updated: string;
  }>;
  current_sprint_tasks: Array<{
    title: string;
    status: string;
    priority: string;
    owner: string;
  }>;
  recent_decisions: Array<{
    decision: string;
    date: string;
    impact: string;
  }>;
  system_health: {
    pm_sync_status: string;
    semantic_chunks: number;
    last_health_check: string;
    failed_functions: string[];
  };
  architecture_rules?: string[];
  system_index?: Array<{
    component: string;
    status: string;
    dependencies: string[];
  }>;
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
    const body: ContextRequest = req.method === 'POST'
      ? await req.json()
      : { mode: 'full' };

    const { mode = 'full', tenant_id } = body;

    console.log(`🧠 Context Loader: mode=${mode}, tenant=${tenant_id || 'default'}`);

    // 1. Get Active CLAUDE.md Files
    const { data: claudeMdData } = await supabase
      .from('pm_apps')
      .select('title, claude_md_content, claude_md_synced_at')
      .neq('claude_md_content', null)
      .is('deleted_at', null);

    const active_claude_md = (claudeMdData || []).map(app => ({
      app_name: app.title,
      content: app.claude_md_content || '',
      last_updated: app.claude_md_synced_at || 'unknown'
    }));

    // 2. Get Current Sprint Tasks (if not health mode)
    let current_sprint_tasks: any[] = [];
    if (mode !== 'health') {
      const { data: tasksData } = await supabase
        .from('pm_tasks')
        .select('title, status, priority, owner_team')
        .in('status', ['In Progress', 'Ready', 'טרם התחיל'])
        .order('priority')
        .limit(mode === 'sprint' ? 10 : 20);

      current_sprint_tasks = (tasksData || []).map(task => ({
        title: task.title,
        status: task.status,
        priority: task.priority || 'medium',
        owner: task.owner_team || 'unknown'
      }));
    }

    // 3. Get Recent Decisions (semantic memory)
    let recent_decisions: any[] = [];
    if (mode === 'full') {
      const { data: decisionsData } = await supabase
        .from('semantic_memory')
        .select('content, created_at')
        .eq('source_type', 'decision')
        .order('created_at', { ascending: false })
        .limit(5);

      recent_decisions = (decisionsData || []).map(decision => ({
        decision: decision.content,
        date: decision.created_at,
        impact: 'medium' // TODO: extract from content
      }));
    }

    // 4. Get System Health
    const { data: healthData } = await supabase
      .from('vb_function_runs')
      .select('function_name, status, ran_at')
      .order('ran_at', { ascending: false })
      .limit(20);

    const failed_functions = (healthData || [])
      .filter(run => run.status === 'error')
      .map(run => run.function_name)
      .filter((name, index, array) => array.indexOf(name) === index) // unique
      .slice(0, 5);

    const { data: semanticCount } = await supabase
      .from('semantic_memory')
      .select('id', { count: 'exact' });

    const system_health = {
      pm_sync_status: failed_functions.includes('notion-pm-sync') ? 'error' : 'healthy',
      semantic_chunks: semanticCount?.length || 0,
      last_health_check: healthData?.[0]?.ran_at || 'unknown',
      failed_functions
    };

    // 5. Architecture Rules (full mode only)
    let architecture_rules: string[] = [];
    if (mode === 'full') {
      architecture_rules = [
        'Multi-tenant: All tables must have tenant_id',
        'PM System: All apps must be registered in pm_apps with CLAUDE.md',
        'Health Monitoring: All functions must be registered in vb_functions',
        'Semantic Brain: All content must flow to semantic_memory for search',
        'RLS: All tables must have policies for authenticated + anon roles'
      ];
    }

    // 6. Determine Overall System Status
    let system_status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (failed_functions.length > 3) {
      system_status = 'critical';
    } else if (failed_functions.length > 0) {
      system_status = 'degraded';
    }

    // Build response
    const response: ContextResponse = {
      mode,
      timestamp: new Date().toISOString(),
      system_status,
      active_claude_md,
      current_sprint_tasks,
      recent_decisions,
      system_health,
      ...(mode === 'full' && { architecture_rules })
    };

    console.log(`✅ Context generated: ${active_claude_md.length} CLAUDE.md, ${current_sprint_tasks.length} tasks, status=${system_status}`);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    });

  } catch (error: any) {
    console.error('❌ Context Loader Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Context generation failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});