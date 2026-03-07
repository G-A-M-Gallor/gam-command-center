import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

interface AuthSuccess {
  user: User;
  error: null;
}

interface AuthError {
  user: null;
  error: string;
}

type AuthResult = AuthSuccess | AuthError;

/**
 * Verify the Bearer token from the Authorization header using Supabase Auth.
 * Returns the authenticated user or an error message.
 *
 * Usage in API routes:
 *   const { user, error } = await requireAuth(request);
 *   if (error) return Response.json({ error }, { status: 401 });
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  if (!token) {
    return { user: null, error: "Empty bearer token" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { user: null, error: "Server authentication not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user, error: null };
}

/**
 * Verify authentication and check for admin role.
 * Currently checks that the user exists (admin role check is a placeholder for future use).
 *
 * Usage in API routes:
 *   const { user, error } = await requireAdmin(request);
 *   if (error) return Response.json({ error }, { status: 403 });
 */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const result = await requireAuth(request);

  if (result.error) {
    return result;
  }

  // Future: check user.app_metadata.role === 'admin' or similar
  // For now, any authenticated user passes the admin check
  return result;
}
