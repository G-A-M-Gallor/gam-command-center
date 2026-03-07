-- Plan phases — 5 fixed phases for the roadmap view
CREATE TABLE IF NOT EXISTS plan_phases (
  phase INT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('complete', 'in-progress', 'planned')),
  notes TEXT NOT NULL DEFAULT '',
  notes_he TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE plan_phases ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user
CREATE POLICY "plan_phases_select" ON plan_phases
  FOR SELECT TO authenticated USING (true);

-- Update: any authenticated user
CREATE POLICY "plan_phases_update" ON plan_phases
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- auto updated_at trigger (reuse existing function if available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE TRIGGER set_plan_phases_updated_at
      BEFORE UPDATE ON plan_phases
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Seed the 5 phases
INSERT INTO plan_phases (phase, status, notes, notes_he) VALUES
  (1, 'complete',    'Core dashboard, sidebar, routing, auth',           'דשבורד בסיסי, סיידבר, ניתוב, אימות'),
  (2, 'complete',    'Editor, templates, export/import, versioning',     'עורך, תבניות, ייצוא/ייבוא, גרסאות'),
  (3, 'in-progress', 'Story Map, drag & drop, realtime, notes+diagrams','מפת סיפור, גרור ושחרר, זמן אמת, הערות+דיאגרמות'),
  (4, 'planned',     'AI Hub, Claude integration, streaming',           'מרכז AI, אינטגרציית Claude, סטרימינג'),
  (5, 'planned',     'Functional Map, Architecture, Plan, Formily',     'מפה פונקציונלית, ארכיטקטורה, תוכנית, טפסים')
ON CONFLICT (phase) DO NOTHING;
