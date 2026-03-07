-- =============================================
-- Storage Bucket for Document Attachments
-- =============================================

-- Create bucket (idempotent via INSERT ... ON CONFLICT)
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-attachments', 'document-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket (idempotent via DROP IF EXISTS + CREATE)

-- Upload: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'document-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Read: authenticated users can read all files
DROP POLICY IF EXISTS "Authenticated users can read" ON storage.objects;
CREATE POLICY "Authenticated users can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'document-attachments');

-- Delete: only file owner (by folder path)
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'document-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
