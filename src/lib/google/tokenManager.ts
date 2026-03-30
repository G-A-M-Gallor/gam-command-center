import { getDecryptedTokens } from "./googleAccountQueries";
import { refreshAccessToken } from "./oauth";
import { encrypt } from "./crypto";
import { _createClient } from "@/lib/supabase/server";

/**
 * Returns a valid access token for a Google account.
 * Auto-refreshes if the token is expired or expiring within 5 minutes.
 */
export async function getValidAccessToken(
  accountId: string,
  userId: string
): Promise<string> {
  const tokens = await getDecryptedTokens(accountId, userId);
  if (!tokens) {
    throw new Error("Google account not found or not authorized");
  }

  const { accessToken, refreshToken, expiresAt } = tokens;

  // Check if token is still valid (with 5-minute buffer)
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime();
    const bufferMs = 5 * 60 * 1000;
    if (expiresMs > Date.now() + bufferMs) {
      return accessToken;
    }
  }

  // Token expired or expiring soon — refresh it
  const refreshed = await refreshAccessToken(refreshToken);
  const newAccessEnc = encrypt(refreshed.access_token);
  const newExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000
  ).toISOString();

  // Persist new token
  const supabase = await createClient();
  await supabase
    .from("google_accounts")
    .update({
      access_token_enc: newAccessEnc,
      token_expires_at: newExpiresAt,
    })
    .eq("id", accountId)
    .eq("user_id", userId);

  return refreshed.access_token;
}
