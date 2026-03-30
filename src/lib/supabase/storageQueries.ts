import { createClient } from "./client";

const BUCKET = "document-attachments";

/**
 * Upload a file to the document-attachments bucket.
 * Files are stored under {userId}/{filename} for RLS compliance.
 */
export async function uploadFile(
  userId: string,
  file: File
): Promise<{ path: string; url: string } | null> {
  const supabase = createClient();
  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  // Bucket is private — use signed URL (1 hour expiry)
  const { data: urlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  return { path, url: urlData?.signedUrl ?? "" };
}

/**
 * Get a signed URL for a private file (expires in 1 hour).
 */
export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  return !error;
}

/**
 * List files in a user's folder.
 */
export async function listUserFiles(
  userId: string
): Promise<{ name: string; created_at: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(userId, { sortBy: { column: "created_at", order: "desc" } });

  if (error || !data) return [];
  return data.map((f) => ({ name: f.name, created_at: f.created_at ?? '' }));
}
