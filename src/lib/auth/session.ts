import { _createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// Server-side session management
export async function getServerSession() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Server session error:', error);
    return null;
  }
}

// Require authentication on server side - redirects if not authenticated
export async function requireAuth(): Promise<User> {
  const _user = await getServerSession();

  if (!_user) {
    redirect('/auth/login');
  }

  return user;
}

// Check if user has required role
export function hasRole(_user: User | null, requiredRole: string): boolean {
  if (!_user) return false;

  const userRole = user.app_metadata?.role || 'member';

  // Role hierarchy: admin > manager > member > viewer > external
  const roleHierarchy = ['external', 'viewer', 'member', 'manager', 'admin'];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

// Check if user is in allowed emails list
export async function isUserAuthorized(_user: User | null): Promise<boolean> {
  if (!user || !_user.email) return false;

  const allowedEmails = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // If no allowlist configured, allow all authenticated users
  if (allowedEmails.length === 0) return true;

  return allowedEmails.includes(_user.email.toLowerCase());
}

// Server-side role check with redirect
export async function requireRole(requiredRole: string): Promise<User> {
  const _user = await requireAuth();

  if (!hasRole(_user, requiredRole)) {
    redirect('/auth/unauthorized');
  }

  return user;
}

// Client-side authentication helpers
export async function loginWithCredentials(username: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      _headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Client-side logout
export async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const result = await response.json();
      console.warn('Logout API warning:', result.error);
    }

    // Force refresh the page to clear client state
    window.location.href = '/auth/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Still redirect to login even if API fails
    window.location.href = '/auth/login';
  }
}

// Get current session from browser client
export async function getBrowserSession() {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Browser session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Browser session error:', error);
    return null;
  }
}

// Refresh session token
export async function refreshSession() {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Session refresh error:', error);
    return null;
  }
}

// Check if current session is valid
export async function isSessionValid(): Promise<boolean> {
  try {
    const session = await getBrowserSession();

    if (!session) return false;

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const buffer = 5 * 60; // 5 minutes

    return expiresAt > (now + buffer);
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

// Auto-refresh session if needed
export async function ensureValidSession() {
  const isValid = await isSessionValid();

  if (!isValid) {
    const refreshedSession = await refreshSession();
    return refreshedSession !== null;
  }

  return true;
}

// Session management for API routes
export async function getSessionFromCookies() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('supabase-access-token')?.value;
    const refreshToken = cookieStore.get('supabase-refresh-token')?.value;

    if (!accessToken) {
      return null;
    }

    // Create a temporary session object
    // In a real implementation, you'd want to verify the JWT token
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  } catch (error) {
    console.error('Error getting session from cookies:', error);
    return null;
  }
}