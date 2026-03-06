-- Phase J: Editor — doc_shares table
CREATE TABLE IF NOT EXISTS doc_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES vb_records(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_doc_shares_token
  ON doc_shares (share_token) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_doc_shares_document
  ON doc_shares (document_id) WHERE is_active = true;
