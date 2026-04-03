-- Migration: 20260404_virtual_office_system.sql
-- GAM Command Center — Virtual Office Agent System
-- vb_personas + agent capabilities + execution engine

-- ── PERSONAS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vb_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Identity
  name TEXT NOT NULL UNIQUE, -- מילי, ברנדון, סטיב, קלי, אנדריאה
  display_name TEXT NOT NULL, -- Millie Calendar Manager
  avatar_url TEXT,

  -- Personality & Behavior
  personality TEXT NOT NULL, -- תיאור אישיות
  system_prompt TEXT NOT NULL, -- הוראות AI
  tone TEXT DEFAULT 'professional', -- professional, casual, friendly
  language_preference TEXT DEFAULT 'he', -- he, en, mixed

  -- Business Functions (TEXT ARRAY)
  business_functions TEXT[] DEFAULT '{}', -- ["calendar_management", "scheduling", "reminders"]

  -- Capabilities & Permissions (JSONB for flexibility)
  capabilities JSONB NOT NULL DEFAULT '{}', -- { "tools": ["google_calendar"], "permissions": [...] }

  -- Execution Settings
  max_daily_executions INTEGER DEFAULT 100,
  allowed_hours TEXT DEFAULT '{"start": "06:00", "end": "23:00"}', -- שעות פעילות
  timezone TEXT DEFAULT 'Asia/Jerusalem',

  -- Status & Metadata
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  last_execution_at TIMESTAMPTZ,
  total_executions INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- אחוזי הצלחה

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERSONA TOOLS (רשימת כלים לכל פרסונה) ───────────────────────────
CREATE TABLE IF NOT EXISTS vb_persona_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES vb_personas(id) ON DELETE CASCADE,

  -- Tool Definition
  tool_name TEXT NOT NULL, -- "google_calendar_create_event"
  display_name TEXT NOT NULL, -- "יצירת אירוע ביומן"
  tool_category TEXT, -- "calendar", "crm", "accounting"

  -- Permissions & Validation
  allowed_params JSONB, -- אילו פרמטרים מותרים
  required_permissions TEXT[], -- רשימת הרשאות נדרשות
  validation_rules JSONB, -- כללי ולידציה

  -- Execution Settings
  enabled BOOLEAN DEFAULT true,
  max_executions_per_day INTEGER DEFAULT 50,
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(persona_id, tool_name)
);

-- ── EXECUTION LOG (לוג ביצועים) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS vb_persona_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Execution Context
  persona_id UUID REFERENCES vb_personas(id),
  tool_name TEXT NOT NULL,

  -- Request Details
  input_params JSONB, -- הפרמטרים שנשלחו
  user_query TEXT, -- השאלה המקורית של גל
  context JSONB, -- קונטקסט נוסף

  -- Execution Results
  status TEXT CHECK (status IN ('pending', 'running', 'success', 'failed', 'timeout')) DEFAULT 'pending',
  result JSONB, -- התוצאה
  error_message TEXT,
  execution_time_ms INTEGER,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Tracking
  request_id TEXT, -- לקישור עם Scout
  session_id TEXT
);

-- ── INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vb_personas_name ON vb_personas(name);
CREATE INDEX IF NOT EXISTS idx_vb_personas_status ON vb_personas(status);
CREATE INDEX IF NOT EXISTS idx_vb_persona_tools_persona_tool ON vb_persona_tools(persona_id, tool_name);
CREATE INDEX IF NOT EXISTS idx_vb_persona_executions_persona ON vb_persona_executions(persona_id);
CREATE INDEX IF NOT EXISTS idx_vb_persona_executions_status ON vb_persona_executions(status);
CREATE INDEX IF NOT EXISTS idx_vb_persona_executions_started_at ON vb_persona_executions(started_at DESC);

-- ── RLS POLICIES ────────────────────────────────────────────────────
ALTER TABLE vb_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vb_persona_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE vb_persona_executions ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "vb_personas_read" ON vb_personas FOR SELECT TO authenticated USING (true);
CREATE POLICY "vb_persona_tools_read" ON vb_persona_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "vb_persona_executions_read" ON vb_persona_executions FOR SELECT TO authenticated USING (true);

-- Write access for service role (APIs)
CREATE POLICY "vb_personas_service_write" ON vb_personas FOR ALL TO service_role USING (true);
CREATE POLICY "vb_persona_tools_service_write" ON vb_persona_tools FOR ALL TO service_role USING (true);
CREATE POLICY "vb_persona_executions_service_write" ON vb_persona_executions FOR ALL TO service_role USING (true);

-- ── SEED DATA: MILLIE (Google Calendar Persona) ───────────────────────
INSERT INTO vb_personas (
  name,
  display_name,
  personality,
  system_prompt,
  business_functions,
  capabilities
) VALUES (
  'millie',
  'Millie Calendar Manager',
  'Millie היא מנהלת יומנים מקצועית ויעילה. היא מסודרת, מדויקת, ותמיד מוודאת שהפרטים נכונים. היא מבינה את חשיבות הזמן ועוזרת לתכנן את היום בצורה אופטימלית.',
  'You are Millie, a professional calendar manager for GAM Command Center. Your role is to help with calendar management, scheduling, and time organization. Always be precise with dates and times, ask for clarification when needed, and ensure appointments don''t conflict. Respond in Hebrew unless specifically asked otherwise. Always confirm important details before creating or modifying calendar events.',
  ARRAY['calendar_management', 'scheduling', 'appointment_coordination', 'reminder_management', 'time_optimization'],
  '{
    "tools": ["google_calendar_create", "google_calendar_update", "google_calendar_delete", "google_calendar_list"],
    "permissions": ["calendar.events", "calendar.readonly"],
    "max_event_duration": "8h",
    "default_reminder": "15min",
    "working_hours": {"start": "08:00", "end": "18:00"},
    "timezone": "Asia/Jerusalem"
  }'::jsonb
);

-- Add Millie's tools
INSERT INTO vb_persona_tools (persona_id, tool_name, display_name, tool_category, allowed_params, required_permissions)
SELECT
  id,
  'google_calendar_create_event',
  'יצירת אירוע ביומן',
  'calendar',
  '{
    "summary": {"type": "string", "required": true, "max_length": 100},
    "description": {"type": "string", "max_length": 1000},
    "start_date": {"type": "datetime", "required": true},
    "end_date": {"type": "datetime", "required": true},
    "location": {"type": "string", "max_length": 200},
    "attendees": {"type": "array", "max_items": 20},
    "reminder_minutes": {"type": "integer", "min": 0, "max": 10080}
  }'::jsonb,
  ARRAY['calendar.events.create']
FROM vb_personas WHERE name = 'millie';

INSERT INTO vb_persona_tools (persona_id, tool_name, display_name, tool_category, allowed_params, required_permissions)
SELECT
  id,
  'google_calendar_list_events',
  'הצגת אירועים ביומן',
  'calendar',
  '{
    "start_date": {"type": "datetime"},
    "end_date": {"type": "datetime"},
    "max_results": {"type": "integer", "min": 1, "max": 100, "default": 20}
  }'::jsonb,
  ARRAY['calendar.readonly']
FROM vb_personas WHERE name = 'millie';

-- ── FUNCTIONS ───────────────────────────────────────────────────────

-- Function to get persona by name
CREATE OR REPLACE FUNCTION get_persona_by_name(persona_name TEXT)
RETURNS vb_personas AS $$
  SELECT * FROM vb_personas WHERE name = persona_name AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to validate persona tool execution
CREATE OR REPLACE FUNCTION validate_persona_execution(
  persona_name TEXT,
  tool_name TEXT,
  params JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  persona_record vb_personas;
  tool_record vb_persona_tools;
  result JSONB := '{"valid": false}'::jsonb;
BEGIN
  -- Get persona
  SELECT * INTO persona_record FROM vb_personas
  WHERE name = persona_name AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Persona not found or inactive');
  END IF;

  -- Get tool
  SELECT * INTO tool_record FROM vb_persona_tools
  WHERE persona_id = persona_record.id AND tool_name = tool_name AND enabled = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Tool not found or disabled for this persona');
  END IF;

  -- Check daily execution limit
  IF tool_record.max_executions_per_day > 0 THEN
    IF (
      SELECT COUNT(*) FROM vb_persona_executions
      WHERE persona_id = persona_record.id
        AND tool_name = tool_name
        AND started_at >= CURRENT_DATE
    ) >= tool_record.max_executions_per_day THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Daily execution limit reached');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'persona_id', persona_record.id,
    'tool_config', tool_record
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;