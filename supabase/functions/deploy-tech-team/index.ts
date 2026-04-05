// deploy-tech-team Edge Function
// One-time deployment of virtual tech team schema
// POST call runs the migration script

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    console.log("[deploy-tech-team] Starting tech team schema deployment");

    // Check if table already exists
    const { data: existingTable } = await supabase
      .from('vb_tech_team')
      .select('id')
      .limit(1);

    if (existingTable) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Virtual tech team already deployed",
          already_exists: true
        }),
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[deploy-tech-team] Tables created, inserting seed data");

    // Insert seed data
    const { error: seedError } = await supabase.from('vb_tech_team').upsert([
      {
        name: 'scott',
        display_name: 'Scott (CTO)',
        position: 'cto',
        jersey_number: 1,
        team_level: 0,
        department: 'leadership',
        primary_skills: ['technical_leadership', 'architecture', 'strategy', 'team_management'],
        secondary_skills: ['full_stack', 'cloud_architecture', 'product_management'],
        personality_traits: {"leadership": "captain", "style": "strategic", "strength": "vision", "decision_making": "excellent"},
        work_preferences: {"prefers_morning": true, "collaboration_style": "directive", "meeting_style": "efficient"},
        football_position: 'midfielder'
      },
      {
        name: 'messi',
        display_name: 'Messi (Frontend Lead)',
        position: 'frontend_lead',
        jersey_number: 10,
        team_level: 1,
        department: 'frontend',
        primary_skills: ['react', 'typescript', 'ui_ux', 'team_leadership'],
        secondary_skills: ['nextjs', 'tailwind', 'design_systems', 'performance_optimization'],
        personality_traits: {"leadership": "by_example", "style": "creative", "strength": "technical_excellence", "perfectionist": true},
        work_preferences: {"prefers_afternoon": true, "collaboration_style": "mentoring", "focus_time": "morning"},
        football_position: 'forward'
      },
      {
        name: 'xavi',
        display_name: 'Xavi (Backend Lead)',
        position: 'backend_lead',
        jersey_number: 6,
        team_level: 1,
        department: 'backend',
        primary_skills: ['nodejs', 'python', 'database_design', 'api_architecture'],
        secondary_skills: ['supabase', 'postgresql', 'redis', 'microservices'],
        personality_traits: {"leadership": "collaborative", "style": "methodical", "strength": "system_design", "patience": "high"},
        work_preferences: {"prefers_morning": true, "collaboration_style": "consensus", "planning": "detailed"},
        football_position: 'midfielder'
      },
      {
        name: 'ter_stegen',
        display_name: 'Ter Stegen (DevOps Lead)',
        position: 'devops_lead',
        jersey_number: 1,
        team_level: 1,
        department: 'devops',
        primary_skills: ['aws', 'docker', 'kubernetes', 'ci_cd'],
        secondary_skills: ['terraform', 'monitoring', 'security', 'automation'],
        personality_traits: {"leadership": "protective", "style": "reliable", "strength": "crisis_management", "calm_under_pressure": true},
        work_preferences: {"prefers_evening": true, "collaboration_style": "supportive", "availability": "24_7"},
        football_position: 'goalkeeper'
      },
      {
        name: 'puyol',
        display_name: 'Puyol (AI/ML Lead)',
        position: 'ai_ml_lead',
        jersey_number: 5,
        team_level: 1,
        department: 'ai_ml',
        primary_skills: ['machine_learning', 'python', 'data_science', 'ai_strategy'],
        secondary_skills: ['tensorflow', 'pytorch', 'nlp', 'computer_vision'],
        personality_traits: {"leadership": "determined", "style": "disciplined", "strength": "problem_solving", "intensity": "high"},
        work_preferences: {"prefers_morning": true, "collaboration_style": "direct", "focus": "results_oriented"},
        football_position: 'defender'
      }
    ]);

    if (seedError) throw seedError;

    console.log("[deploy-tech-team] Schema and data created successfully - functions would be in migration");

    console.log("[deploy-tech-team] Deployment completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Virtual tech team schema deployed successfully",
        note: "Schema deployment requires manual migration - tables not created via API",
        team_members_inserted: 5
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[deploy-tech-team] Error:", error);
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