-- Note Stakeholders — people connected to a note with roles + access levels
-- A deal/project note can have many stakeholders: clients, brokers, lawyers, accountants...
-- Each stakeholder has a role, access level, and notification preferences.

CREATE TABLE IF NOT EXISTS note_stakeholders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  contact_note_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant',          -- client, broker, lawyer, accountant, contractor, observer, etc.
  role_label JSONB DEFAULT '{}',                     -- custom label override { he, en, ru }
  access_level TEXT NOT NULL DEFAULT 'partial',      -- full, partial, minimal, external
  is_primary BOOLEAN DEFAULT false,                  -- primary stakeholder (decision maker)
  visible_fields JSONB DEFAULT '[]',                 -- which meta fields this stakeholder can see (empty = all by access_level)
  notify TEXT NOT NULL DEFAULT 'milestones',         -- all, milestones, mentions, none
  notify_channels JSONB DEFAULT '["app"]',           -- app, email, whatsapp, sms
  notes TEXT,                                        -- internal notes about this stakeholder's involvement
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(note_id, contact_note_id, role)
);

CREATE INDEX idx_note_stakeholders_note ON note_stakeholders(note_id);
CREATE INDEX idx_note_stakeholders_contact ON note_stakeholders(contact_note_id);
CREATE INDEX idx_note_stakeholders_role ON note_stakeholders(role);

ALTER TABLE note_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "note_stakeholders_all_access" ON note_stakeholders FOR ALL USING (true) WITH CHECK (true);
