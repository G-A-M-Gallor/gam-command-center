-- ===================================================
-- Email System — Multi-tenant email platform
-- ===================================================
-- Tables: email_tenants, email_templates, email_sends,
--         email_events, email_unsubscribes
-- Provider: Resend (API + webhooks)
-- Tenant model: vbrain.io (system) + client domains

-- ─── Tenants ────────────────────────────────────────

CREATE TABLE email_tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL UNIQUE,
  from_name  TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to   TEXT,
  logo_url   TEXT,
  signature_html TEXT,
  brand_color TEXT DEFAULT '#7c3aed',
  resend_domain_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed system + GAM tenants
INSERT INTO email_tenants (name, domain, from_name, from_email, reply_to, brand_color)
VALUES
  ('vBrain.io', 'vbrain.io', 'vBrain', 'noreply@vbrain.io', NULL, '#7c3aed'),
  ('G.A.M שירותי בנייה', 'gam.co.il', 'G.A.M', 'info@gam.co.il', 'gal@gam.co.il', '#1e40af');

-- ─── Templates ──────────────────────────────────────

CREATE TABLE email_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES email_tenants(id),
  name            TEXT NOT NULL,
  subject         TEXT NOT NULL,
  category        TEXT CHECK (category IN ('system', 'transactional', 'marketing')),
  engine          TEXT CHECK (engine IN ('react', 'unlayer')) DEFAULT 'react',
  react_component TEXT,
  unlayer_json    JSONB,
  html_compiled   TEXT,
  variables       TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  version         INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);

CREATE TRIGGER email_templates_set_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Email Sends (full audit) ───────────────────────

CREATE TABLE email_sends (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES email_tenants(id),
  template_id      UUID REFERENCES email_templates(id),
  resend_id        TEXT,
  from_email       TEXT NOT NULL,
  to_email         TEXT NOT NULL,
  cc               TEXT[],
  bcc              TEXT[],
  subject          TEXT NOT NULL,
  html_body        TEXT,
  variables        JSONB DEFAULT '{}',
  entity_id        UUID,
  comm_message_id  UUID,
  status           TEXT DEFAULT 'queued' CHECK (status IN (
                     'queued','sent','delivered','opened','clicked','bounced','complained','failed'
                   )),
  opened_count     INT DEFAULT 0,
  clicked_count    INT DEFAULT 0,
  first_opened_at  TIMESTAMPTZ,
  last_opened_at   TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  clicked_links    JSONB DEFAULT '[]',
  bounce_reason    TEXT,
  error_message    TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_sends_tenant ON email_sends(tenant_id);
CREATE INDEX idx_email_sends_to ON email_sends(to_email);
CREATE INDEX idx_email_sends_entity ON email_sends(entity_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_resend ON email_sends(resend_id);
CREATE INDEX idx_email_sends_created ON email_sends(created_at DESC);

CREATE TRIGGER email_sends_set_updated_at
  BEFORE UPDATE ON email_sends
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Email Events (webhook log) ─────────────────────

CREATE TABLE email_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  resend_id     TEXT,
  event_type    TEXT NOT NULL,
  payload       JSONB DEFAULT '{}',
  link_url      TEXT,
  user_agent    TEXT,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_events_send ON email_events(email_send_id);
CREATE INDEX idx_email_events_resend ON email_events(resend_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- ─── Unsubscribe List ───────────────────────────────

CREATE TABLE email_unsubscribes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  tenant_id  UUID REFERENCES email_tenants(id),
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, tenant_id)
);

CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);

-- ─── RLS ────────────────────────────────────────────

ALTER TABLE email_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read tenants"
  ON email_tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage tenants"
  ON email_tenants FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated read templates"
  ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage templates"
  ON email_templates FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated manage sends"
  ON email_sends FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated read events"
  ON email_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert events"
  ON email_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated manage unsubscribes"
  ON email_unsubscribes FOR ALL TO authenticated USING (true);
