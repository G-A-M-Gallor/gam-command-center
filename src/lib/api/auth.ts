import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
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
 * Checks user.app_metadata.role === 'admin'.
 * Falls back to allowing all authenticated users when no roles are configured.
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

  const user = result.user!;
  const role = user.app_metadata?.role;

  if (role !== 'admin') {
    return { user: null, error: "Admin access required" };
  }

  return result;
}

/**
 * Verify authentication and check for a specific role.
 * Accepts a list of allowed roles.
 */
export async function requireRole(
  request: Request,
  allowedRoles: string[],
): Promise<AuthResult> {
  const result = await requireAuth(request);

  if (result.error) {
    return result;
  }

  const u = result.user!;
  const role = u.app_metadata?.role || 'member';

  // Admin always passes
  if (role === 'admin') return result;

  if (!allowedRoles.includes(role)) {
    return { user: null, error: `Required role: ${allowedRoles.join(' or ')}` };
  }

  return result;
}

/**
 * Get authenticated user using server-side Supabase client (cookies).
 * Falls back to demo user for development.
 *
 * Usage in API routes:
 *   const userId = await getUserId();
 */
export async function getUserId(): Promise<string> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('Auth warning:', authError?.message || 'No user');
    return 'demo-user-123'; // Demo user for development
  }

  return user.id;
}
