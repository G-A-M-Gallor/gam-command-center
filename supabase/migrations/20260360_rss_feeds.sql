-- ─── RSS Feeds + Articles ────────────────────────────────────
-- Two tables for the RSS reader feature:
-- rss_feeds: feed sources (built-in Israeli construction + custom)
-- rss_articles: parsed articles with keyword matching

-- ─── rss_feeds ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rss_feeds (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url        TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  keywords   TEXT[] NOT NULL DEFAULT '{}',
  last_synced   TIMESTAMPTZ,
  last_error    TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── rss_articles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rss_articles (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feed_id          BIGINT NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
  guid             TEXT NOT NULL,
  title            TEXT NOT NULL DEFAULT '',
  link             TEXT,
  description      TEXT,
  pub_date         TIMESTAMPTZ,
  categories       TEXT[] NOT NULL DEFAULT '{}',
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  is_read          BOOLEAN NOT NULL DEFAULT false,
  is_starred       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feed_id, guid)
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rss_articles_feed_id ON rss_articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_articles_pub_date ON rss_articles(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_rss_articles_is_read ON rss_articles(is_read) WHERE NOT is_read;

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_articles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all feeds
CREATE POLICY "rss_feeds_select" ON rss_feeds
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert custom feeds
CREATE POLICY "rss_feeds_insert" ON rss_feeds
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update feeds
CREATE POLICY "rss_feeds_update" ON rss_feeds
  FOR UPDATE TO authenticated USING (true);

-- Authenticated users can delete non-default feeds
CREATE POLICY "rss_feeds_delete" ON rss_feeds
  FOR DELETE TO authenticated USING (NOT is_default);

-- Authenticated users can read all articles
CREATE POLICY "rss_articles_select" ON rss_articles
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can update articles (read/starred)
CREATE POLICY "rss_articles_update" ON rss_articles
  FOR UPDATE TO authenticated USING (true);

-- ─── Realtime ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE rss_articles;

-- ─── Default Israeli Construction Feeds ──────────────────────
INSERT INTO rss_feeds (url, title, is_default, keywords) VALUES
  ('https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=2585', 'גלובס נדל"ן', true, ARRAY['נדל"ן','בנייה','קבלן','תשתיות','דירות','מכרז','היתר','תמ"א','משכנתא']),
  ('https://www.themarker.com/srv/rss-nadlan', 'TheMarker נדל"ן', true, ARRAY['נדל"ן','בנייה','קבלן','תשתיות','דירות','מכרז','היתר','תמ"א','משכנתא']),
  ('https://www.calcalist.co.il/GeneralRSS/0,16335,L-8,00.xml', 'כלכליסט נדל"ן', true, ARRAY['נדל"ן','בנייה','קבלן','תשתיות','דירות','מכרז','היתר','תמ"א','משכנתא']),
  ('https://www.ynet.co.il/Integration/StoryRss1854.xml', 'ynet כלכלה', true, ARRAY['נדל"ן','בנייה','קבלן','תשתיות','דירות','מכרז','היתר','תמ"א','משכנתא']),
  ('https://www.gov.il/he/api/feed/news?OfficeId=housing', 'משרד הבינוי והשיכון', true, ARRAY['נדל"ן','בנייה','קבלן','תשתיות','דירות','מכרז','היתר','תמ"א','משכנתא'])
ON CONFLICT (url) DO NOTHING;
