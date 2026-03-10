CREATE TABLE wiki_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  qa_pairs JSONB DEFAULT '[]'::jsonb,
  category TEXT CHECK (category IN ('sales','ops','tech','people','products')),
  ai_priority TEXT DEFAULT 'P1' CHECK (ai_priority IN ('P0','P1','P2')),
  plugin_bindings JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('ai','visual','calculation','behavior','connector')),
  description TEXT,
  prompt_template TEXT,
  allowed_variables JSONB DEFAULT '[]'::jsonb,
  default_settings JSONB DEFAULT '{}'::jsonb,
  supported_modes TEXT[] DEFAULT ARRAY['standalone'],
  supported_field_types TEXT[],
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','deprecated')),
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO plugins (name,slug,type,description,prompt_template,allowed_variables,default_settings,supported_modes,status)
VALUES ('חנית','hanit_v1','ai','פלאגין AI שמנתח שדה ומציג המלצה ממוקדת','אתה יועץ עסקי של GAM. בהינתן הנתון הבא: {field_value} בהקשר של {entity_name}. {question}','["field_value","entity_name","question"]','{"tone":"analytical","max_tokens":300,"output_format":"bullets"}',ARRAY['standalone','field_attached'],'active');

ALTER TABLE wiki_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY wiki_auth ON wiki_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY plugins_auth ON plugins FOR ALL USING (auth.role() = 'authenticated');
