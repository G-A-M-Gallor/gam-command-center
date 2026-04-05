// test-tech-team Edge Function
// Check if virtual tech team tables exist and provide deployment status

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    console.log("[test-tech-team] Checking tech team deployment status");

    // Test if tables exist by trying to query them
    let tablesExist = false;
    let teamMembers = [];

    try {
      const { data, error } = await supabase
        .from('vb_tech_team')
        .select('name, display_name, position, jersey_number')
        .order('team_level')
        .order('name');

      if (!error) {
        tablesExist = true;
        teamMembers = data || [];
      }
    } catch (e) {
      // Table doesn't exist
      tablesExist = false;
    }

    // Test functions
    let functionsExist = false;
    try {
      const { data, error } = await supabase.rpc('get_team_hierarchy');
      if (!error) {
        functionsExist = true;
      }
    } catch (e) {
      functionsExist = false;
    }

    console.log(`[test-tech-team] Tables exist: ${tablesExist}, Functions exist: ${functionsExist}`);

    return new Response(
      JSON.stringify({
        success: true,
        deployment_status: {
          tables_exist: tablesExist,
          functions_exist: functionsExist,
          team_members_count: teamMembers.length,
          team_members: teamMembers
        },
        message: tablesExist
          ? "Virtual tech team is deployed and ready"
          : "Virtual tech team needs to be deployed - run migration manually",
        migration_file: "supabase/migrations/20260403212659_virtual_tech_team_deployment.sql"
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[test-tech-team] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  }
});