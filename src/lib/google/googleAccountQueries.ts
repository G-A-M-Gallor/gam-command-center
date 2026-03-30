import { _createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "./crypto";

interface EncryptedBlob {
  iv: string;
  ciphertext: string;
  tag: string;
}

export interface GoogleAccountRow {
  id: string;
  user_id: string;
  google_email: string;
  google_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  access_token_enc: EncryptedBlob;
  refresh_token_enc: EncryptedBlob;
  token_expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Safe metadata returned to the client (no tokens) */
export interface GoogleAccountSafe {
  id: string;
  google_email: string;
  display_name: string | null;
  avatar_url: string | null;
  scopes: string[];
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}

function toSafe(row: GoogleAccountRow): GoogleAccountSafe {
  return {
    id: row.id,
    google_email: row.google_email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    scopes: row.scopes,
    is_active: row.is_active,
    last_synced_at: row.last_synced_at,
    created_at: row.created_at,
  };
}

// ─── List ──────────────────────────────────────────────────

export async function listGoogleAccounts(userId: string): Promise<GoogleAccountSafe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as GoogleAccountRow[]).map(toSafe);
}

// ─── Upsert (connect / re-connect) ────────────────────────

export async function upsertGoogleAccount(params: {
  userId: string;
  googleUserId: string;
  googleEmail: string;
  displayName: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
}): Promise<GoogleAccountSafe> {
  const supabase = await createClient();

  const accessEnc = encrypt(params.accessToken);
  const refreshEnc = encrypt(params.refreshToken);
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString();

  const { data, error } = await supabase
    .from("google_accounts")
    .upsert(
      {
        user_id: params.userId,
        google_user_id: params.googleUserId,
        google_email: params.googleEmail,
        display_name: params.displayName,
        avatar_url: params.avatarUrl,
        access_token_enc: accessEnc,
        refresh_token_enc: refreshEnc,
        token_expires_at: expiresAt,
        scopes: params.scopes,
        is_active: true,
      },
      { onConflict: "user_id,google_user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return toSafe(data as GoogleAccountRow);
}

// ─── Toggle active ─────────────────────────────────────────

export async function toggleGoogleAccount(accountId: string, userId: string, isActive: boolean): Promise<GoogleAccountSafe> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_accounts")
    .update({ is_active: isActive })
    .eq("id", accountId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return toSafe(data as GoogleAccountRow);
}

// ─── Disconnect (delete) ──────────────────────────────────

export async function deleteGoogleAccount(accountId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("google_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ─── Get decrypted tokens (server-only) ───────────────────

export async function getDecryptedTokens(accountId: string, userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_accounts")
    .select("access_token_enc, refresh_token_enc, token_expires_at")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const row = data as Pick<GoogleAccountRow, "access_token_enc" | "refresh_token_enc" | "token_expires_at">;
  return {
    accessToken: decrypt(row.access_token_enc),
    refreshToken: decrypt(row.refresh_token_enc),
    expiresAt: row.token_expires_at,
  };
}
