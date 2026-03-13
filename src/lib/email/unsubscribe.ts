import * as jose from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret";

/**
 * Generate unsubscribe token for email links.
 */
export async function generateUnsubscribeToken(email: string, tenantId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT({ email, tenant_id: tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}
