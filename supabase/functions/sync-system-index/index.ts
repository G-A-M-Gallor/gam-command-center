// sync-system-index Edge Function
// Sync System Index from Notion to pm_system_index table
// Source: Notion DB "🗺️ אינדקס מערכת — System Index"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SYNC_SECRET")!;

// System Index Notion DB ID: da78b14e-c196-4145-914c-8d19851c39eb
const SYSTEM_INDEX_DB_ID = "da78b14e-c196-4145-914c-8d19851c39eb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Helper functions (from notion-sync)
const text = (p: any) => p?.rich_text?.map((r: any) => r.plain_text).join("") ?? null;
const title = (p: any) => p?.title?.map((r: any) => r.plain_text).join("") ?? null;
const sel = (p: any) => p?.select?.name ?? null;
const msel = (p: any) => p?.multi_select?.map((s: any) => s.name) ?? [];
const url = (p: any) => p?.url ?? null;

interface NotionSystemIndexItem {
  id: string;
  properties: {
    'שם': { title: Array<{ plain_text: string }> };
    'סוג': { select: { name: string } | null };
    'קישור Command Center': { url: string | null };
    'סטטוס': { select: { name: string } | null };
    'בריאות': { select: { name: string } | null };
    'מחובר ל': { rich_text: Array<{ plain_text: string }> };
    'תיאור': { rich_text: Array<{ plain_text: string }> };
    'תגיות': { multi_select: Array<{ name: string }> };
  };
}

interface SystemIndexRecord {
  component_name: string;
  component_type: string;
  status: string;
  health_status: string;
  path: string;
  dependencies: string[];
  dependent_on: string[];
  metadata: any;
  notes: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for scheduled executions
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');

    if (cronSecret && cronSecret !== CRON_SECRET && !authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("[sync-system-index] Starting System Index sync from Notion");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch data from Notion System Index DB
    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${SYSTEM_INDEX_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          page_size: 100,
          sorts: [
            {
              property: 'שם',
              direction: 'ascending'
            }
          ]
        })
      }
    );

    if (!notionResponse.ok) {
      throw new Error(`Notion API error: ${notionResponse.status} ${notionResponse.statusText}`);
    }

    const notionData = await notionResponse.json();
    const notionItems: NotionSystemIndexItem[] = notionData.results;

    console.log(`[sync-system-index] Retrieved ${notionItems.length} items from Notion`);

    // Transform Notion data to Supabase format (matching notion-sync function exactly)
    const systemIndexRecords: SystemIndexRecord[] = notionItems.map(item => {
      const p = item.properties;
      const connectedTo = text(p['מחובר ל']) || '';
      const dependencies = connectedTo ? connectedTo.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

      return {
        component_name: title(p['שם']),
        component_type: sel(p['סוג']),
        status: sel(p['סטטוס']),
        health_status: 'active', // Default value as in notion-sync
        path: url(p['קישור Command Center']) || text(p['מיקום ב-Notion']) || '',
        dependencies,
        dependent_on: text(p['שייך ל-App']) ? [text(p['שייך ל-App'])] : [],
        metadata: {
          notion_id: item.id,
          notion_url: `https://www.notion.so/${item.id.replace(/-/g, '')}`,
          tags: msel(p['תגיות']),
          description: text(p['תיאור'])
        },
        notes: text(p['תיאור']) || '',
        updated_at: new Date().toISOString()
      };
    });

    // Upsert records (insert or update based on component_name)
    console.log(`[sync-system-index] Upserting ${systemIndexRecords.length} records`);
    const { data: upsertData, error: upsertError } = await supabase
      .from('pm_system_index')
      .upsert(systemIndexRecords, { onConflict: 'component_name' })
      .select();

    if (upsertError) {
      throw new Error(`Failed to upsert records: ${upsertError.message}`);
    }

    console.log(`[sync-system-index] Successfully synced ${upsertData?.length || 0} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `System Index sync completed`,
        records_synced: upsertData?.length || 0,
        source_records: notionItems.length,
        database_id: SYSTEM_INDEX_DB_ID
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[sync-system-index] Error:", error);
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