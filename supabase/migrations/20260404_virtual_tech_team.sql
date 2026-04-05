-- Migration: 20260404_virtual_tech_team.sql
-- GAM Command Center — Virtual Tech Team (Football Squad)
-- Technical team structure with Barcelona-inspired names

-- ── TECH TEAM STRUCTURE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vb_tech_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Player Identity
  name TEXT NOT NULL UNIQUE, -- scott, messi, xavi, ter_stegen, puyol
  display_name TEXT NOT NULL, -- Scott (CTO), Messi (Frontend Lead)
  position TEXT NOT NULL, -- cto, frontend_lead, backend_lead, devops_lead, ai_ml_lead
  jersey_number INTEGER UNIQUE, -- 1-99

  -- Team Hierarchy
  reports_to UUID REFERENCES vb_tech_team(id),
  team_level INTEGER DEFAULT 0, -- 0=CTO, 1=Lead, 2=Developer
  department TEXT, -- frontend, backend, devops, ai_ml

  -- Technical Skills & Capabilities
  primary_skills TEXT[] DEFAULT '{}', -- ["react", "typescript", "ui_ux"]
  secondary_skills TEXT[] DEFAULT '{}', -- ["python", "design_systems"]
  certifications TEXT[] DEFAULT '{}', -- ["aws_certified", "react_expert"]
  experience_years INTEGER DEFAULT 0,

  -- Personality & Work Style (Football-inspired)
  personality_traits JSONB DEFAULT '{}', -- {"leadership": "captain", "style": "creative", "strength": "vision"}
  work_preferences JSONB DEFAULT '{}', -- {"prefers_morning": true, "collaboration_style": "mentoring"}
  football_position TEXT, -- midfielder, goalkeeper, defender, forward

  -- Current Status & Availability
  status TEXT CHECK (status IN ('active', 'busy', 'offline', 'vacation')) DEFAULT 'active',
  current_projects TEXT[] DEFAULT '{}',
  workload_percentage INTEGER DEFAULT 0 CHECK (workload_percentage >= 0 AND workload_percentage <= 100),

  -- Performance Metrics
  tasks_completed INTEGER DEFAULT 0,
  code_reviews_done INTEGER DEFAULT 0,
  bugs_fixed INTEGER DEFAULT 0,
  features_shipped INTEGER DEFAULT 0,
  team_rating DECIMAL(3,1) DEFAULT 0.0, -- 0.0-10.0 (football rating style)

  -- Timestamps
  joined_team_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM ASSIGNMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vb_tech_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Assignment Details
  team_member_id UUID REFERENCES vb_tech_team(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,

  -- Assignment Type & Priority
  assignment_type TEXT CHECK (assignment_type IN ('development', 'code_review', 'architecture', 'mentoring', 'research')) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

  -- Status & Timeline
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'code_review', 'testing', 'completed', 'blocked')) DEFAULT 'assigned',
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,

  -- Dates
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ── INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vb_tech_team_position ON vb_tech_team(position);
CREATE INDEX IF NOT EXISTS idx_vb_tech_team_status ON vb_tech_team(status);
CREATE INDEX IF NOT EXISTS idx_vb_tech_team_reports_to ON vb_tech_team(reports_to);
CREATE INDEX IF NOT EXISTS idx_vb_tech_assignments_member ON vb_tech_assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_vb_tech_assignments_status ON vb_tech_assignments(status);

-- ── RLS POLICIES ────────────────────────────────────────────────────────
ALTER TABLE vb_tech_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE vb_tech_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vb_tech_team_read" ON vb_tech_team FOR SELECT TO authenticated USING (true);
CREATE POLICY "vb_tech_team_service_write" ON vb_tech_team FOR ALL TO service_role USING (true);
CREATE POLICY "vb_tech_assignments_read" ON vb_tech_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "vb_tech_assignments_service_write" ON vb_tech_assignments FOR ALL TO service_role USING (true);

-- ── SEED DATA: TECH TEAM ───────────────────────────────────────────────

-- CTO: Scott
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position
) VALUES (
  'scott', 'Scott (CTO)', 'cto', 1, 0, 'leadership',
  ARRAY['technical_leadership', 'architecture', 'strategy', 'team_management'],
  ARRAY['full_stack', 'cloud_architecture', 'product_management'],
  '{"leadership": "captain", "style": "strategic", "strength": "vision", "decision_making": "excellent"}'::jsonb,
  '{"prefers_morning": true, "collaboration_style": "directive", "meeting_style": "efficient"}'::jsonb,
  'midfielder'
);

-- Frontend Lead: Messi
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position,
  reports_to
) VALUES (
  'messi', 'Messi (Frontend Lead)', 'frontend_lead', 10, 1, 'frontend',
  ARRAY['react', 'typescript', 'ui_ux', 'team_leadership'],
  ARRAY['nextjs', 'tailwind', 'design_systems', 'performance_optimization'],
  '{"leadership": "by_example", "style": "creative", "strength": "technical_excellence", "perfectionist": true}'::jsonb,
  '{"prefers_afternoon": true, "collaboration_style": "mentoring", "focus_time": "morning"}'::jsonb,
  'forward',
  (SELECT id FROM vb_tech_team WHERE name = 'scott')
);

-- Backend Lead: Xavi
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position,
  reports_to
) VALUES (
  'xavi', 'Xavi (Backend Lead)', 'backend_lead', 6, 1, 'backend',
  ARRAY['nodejs', 'python', 'database_design', 'api_architecture'],
  ARRAY['supabase', 'postgresql', 'redis', 'microservices'],
  '{"leadership": "collaborative", "style": "methodical", "strength": "system_design", "patience": "high"}'::jsonb,
  '{"prefers_morning": true, "collaboration_style": "consensus", "planning": "detailed"}'::jsonb,
  'midfielder',
  (SELECT id FROM vb_tech_team WHERE name = 'scott')
);

-- DevOps Lead: Ter Stegen
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position,
  reports_to
) VALUES (
  'ter_stegen', 'Ter Stegen (DevOps Lead)', 'devops_lead', 1, 1, 'devops',
  ARRAY['aws', 'docker', 'kubernetes', 'ci_cd'],
  ARRAY['terraform', 'monitoring', 'security', 'automation'],
  '{"leadership": "protective", "style": "reliable", "strength": "crisis_management", "calm_under_pressure": true}'::jsonb,
  '{"prefers_evening": true, "collaboration_style": "supportive", "availability": "24_7"}'::jsonb,
  'goalkeeper',
  (SELECT id FROM vb_tech_team WHERE name = 'scott')
);

-- AI/ML Lead: Puyol
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position,
  reports_to
) VALUES (
  'puyol', 'Puyol (AI/ML Lead)', 'ai_ml_lead', 5, 1, 'ai_ml',
  ARRAY['machine_learning', 'python', 'data_science', 'ai_strategy'],
  ARRAY['tensorflow', 'pytorch', 'nlp', 'computer_vision'],
  '{"leadership": "determined", "style": "disciplined", "strength": "problem_solving", "intensity": "high"}'::jsonb,
  '{"prefers_morning": true, "collaboration_style": "direct", "focus": "results_oriented"}'::jsonb,
  'defender',
  (SELECT id FROM vb_tech_team WHERE name = 'scott')
);

-- Frontend Team under Messi
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position,
  reports_to
) VALUES
(
  'pedri', 'Pedri (Frontend Developer)', 'frontend_developer', 16, 2, 'frontend',
  ARRAY['react', 'typescript', 'css'],
  ARRAY['animation', 'responsive_design'],
  '{"style": "elegant", "strength": "adaptability", "learning": "fast"}'::jsonb,
  '{"prefers_afternoon": true, "collaboration_style": "eager"}'::jsonb,
  'midfielder',
  (SELECT id FROM vb_tech_team WHERE name = 'messi')
),
(
  'gavi', 'Gavi (Frontend Developer)', 'frontend_developer', 30, 2, 'frontend',
  ARRAY['react', 'javascript', 'ui_components'],
  ARRAY['testing', 'accessibility'],
  '{"style": "energetic", "strength": "innovation", "courage": "high"}'::jsonb,
  '{"prefers_morning": true, "collaboration_style": "enthusiastic"}'::jsonb,
  'midfielder',
  (SELECT id FROM vb_tech_team WHERE name = 'messi')
),
(
  'pique', 'Piqué (Senior Frontend)', 'senior_frontend', 3, 2, 'frontend',
  ARRAY['react', 'architecture', 'mentoring'],
  ARRAY['performance', 'security'],
  '{"style": "experienced", "strength": "leadership", "communication": "excellent"}'::jsonb,
  '{"prefers_flexible": true, "collaboration_style": "mentoring"}'::jsonb,
  'defender',
  (SELECT id FROM vb_tech_team WHERE name = 'messi')
);

-- Backend Team under Xavi
INSERT INTO vb_tech_team (
  name, display_name, position, jersey_number, team_level, department,
  primary_skills, secondary_skills, personality_traits, work_preferences, football_position,
  reports_to
) VALUES
(
  'iniesta', 'Iniesta (Senior Backend)', 'senior_backend', 8, 2, 'backend',
  ARRAY['nodejs', 'database_design', 'api_development'],
  ARRAY['optimization', 'scalability'],
  '{"style": "masterful", "strength": "precision", "creativity": "high"}'::jsonb,
  '{"prefers_morning": true, "collaboration_style": "inspiring"}'::jsonb,
  'midfielder',
  (SELECT id FROM vb_tech_team WHERE name = 'xavi')
),
(
  'busquets', 'Busquets (Backend Developer)', 'backend_developer', 5, 2, 'backend',
  ARRAY['python', 'apis', 'data_processing'],
  ARRAY['caching', 'monitoring'],
  '{"style": "intelligent", "strength": "anticipation", "consistency": "high"}'::jsonb,
  '{"prefers_consistent": true, "collaboration_style": "supportive"}'::jsonb,
  'midfielder',
  (SELECT id FROM vb_tech_team WHERE name = 'xavi')
),
(
  'neymar', 'Neymar (Fullstack Developer)', 'fullstack_developer', 11, 2, 'backend',
  ARRAY['javascript', 'python', 'creative_solutions'],
  ARRAY['frontend', 'integration'],
  '{"style": "flair", "strength": "versatility", "innovation": "high"}'::jsonb,
  '{"prefers_flexible": true, "collaboration_style": "dynamic"}'::jsonb,
  'forward',
  (SELECT id FROM vb_tech_team WHERE name = 'xavi')
);

-- ── FUNCTIONS ───────────────────────────────────────────────────────────

-- Get team hierarchy
CREATE OR REPLACE FUNCTION get_team_hierarchy()
RETURNS TABLE (
  level_0_name TEXT,
  level_1_name TEXT,
  level_2_name TEXT,
  full_path TEXT
) AS $$
  WITH RECURSIVE team_tree AS (
    -- Start with CTO (level 0)
    SELECT
      id, name, display_name, position, team_level, reports_to,
      name as path,
      ARRAY[name] as name_array
    FROM vb_tech_team
    WHERE reports_to IS NULL

    UNION ALL

    -- Add subordinates
    SELECT
      t.id, t.name, t.display_name, t.position, t.team_level, t.reports_to,
      tt.path || ' → ' || t.name,
      tt.name_array || t.name
    FROM vb_tech_team t
    JOIN team_tree tt ON t.reports_to = tt.id
  )
  SELECT
    name_array[1] as level_0_name,
    name_array[2] as level_1_name,
    name_array[3] as level_2_name,
    path as full_path
  FROM team_tree
  ORDER BY team_level, name;
$$ LANGUAGE SQL;

-- Get team member with their direct reports
CREATE OR REPLACE FUNCTION get_team_structure(member_name TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'member', jsonb_build_object(
      'name', t.name,
      'display_name', t.display_name,
      'position', t.position,
      'jersey_number', t.jersey_number,
      'status', t.status,
      'workload_percentage', t.workload_percentage
    ),
    'direct_reports', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', dr.name,
          'display_name', dr.display_name,
          'position', dr.position,
          'status', dr.status
        )
      )
      FROM vb_tech_team dr
      WHERE dr.reports_to = t.id
    )
  ) INTO result
  FROM vb_tech_team t
  WHERE t.name = member_name;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;