-- ============================================================
-- Migration: DOC-02 — Atomic signing RPC
-- Called by document-sign Edge Function
-- Both document_submitters UPDATE and document_audit_log INSERT
-- happen in a single transaction — all or nothing.
-- ============================================================

CREATE OR REPLACE FUNCTION public.document_sign_atomic(
  p_submitter_id    UUID,
  p_submission_id   UUID,
  p_workspace_id    UUID,
  p_full_name       TEXT,
  p_business_name   TEXT DEFAULT NULL,
  p_id_number       TEXT DEFAULT NULL,
  p_email           TEXT DEFAULT NULL,
  p_phone           TEXT DEFAULT NULL,
  p_signature_type  TEXT DEFAULT NULL,
  p_signature_path  TEXT DEFAULT NULL,
  p_ip_address      TEXT DEFAULT NULL,
  p_user_agent      TEXT DEFAULT NULL,
  p_consent_text    TEXT DEFAULT NULL,
  p_signed_at       TIMESTAMPTZ DEFAULT now(),
  p_pdf_hash        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- ── 1. Update submitter with signing data ──────────────────
  UPDATE public.document_submitters SET
    full_name       = p_full_name,
    business_name   = p_business_name,
    id_number       = p_id_number,
    email           = p_email,
    phone           = p_phone,
    signature_type  = p_signature_type,
    signature_path  = p_signature_path,
    ip_address      = p_ip_address::inet,
    user_agent      = p_user_agent,
    consent_given   = true,
    consent_text    = p_consent_text,
    signed_at       = p_signed_at,
    status          = 'signed',
    updated_at      = now()
  WHERE id = p_submitter_id
    AND submission_id = p_submission_id
    AND status != 'signed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submitter % not found, already signed, or does not belong to submission %',
      p_submitter_id, p_submission_id;
  END IF;

  -- ── 2. Write audit log entry (same transaction) ────────────
  INSERT INTO public.document_audit_log (
    workspace_id, submission_id, actor_type, actor_id, action, details, ip_address, user_agent
  ) VALUES (
    p_workspace_id,
    p_submission_id,
    'submitter',
    p_submitter_id::text,
    'submitter.signed',
    jsonb_build_object(
      'full_name',      p_full_name,
      'id_number_last4', right(p_id_number, 4),
      'signature_type', p_signature_type,
      'consent_given',  true,
      'pdf_hash',       p_pdf_hash,
      'signed_at',      p_signed_at
    ),
    p_ip_address::inet,
    p_user_agent
  );

  -- ── 3. Return confirmation ─────────────────────────────────
  v_result := jsonb_build_object(
    'submitter_id', p_submitter_id,
    'submission_id', p_submission_id,
    'signed_at', p_signed_at,
    'pdf_hash', p_pdf_hash
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.document_sign_atomic IS
  'Atomic signing transaction — updates submitter + writes audit log in one go. If either fails, both roll back.';

-- Grant execute to service_role only (Edge Function uses service_role key)
REVOKE ALL ON FUNCTION public.document_sign_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.document_sign_atomic TO service_role;
