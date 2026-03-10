-- ═══════════════════════════════════════════════════════════
-- Migration: contractor-submissions storage bucket
-- Public upload for contractor registration documents.
-- Max 5MB, PDF/JPEG/PNG only.
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor-submissions',
  'contractor-submissions',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Anon users can upload to submissions/ folder (public registration form)
CREATE POLICY "Anon upload submissions"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'contractor-submissions'
    AND (storage.foldername(name))[1] = 'submissions'
  );

-- Authenticated users can read all files
CREATE POLICY "Authenticated read submissions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contractor-submissions');

-- Authenticated users can delete files
CREATE POLICY "Authenticated delete submissions"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contractor-submissions');
