"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer' | 'external';

export interface UserPermissions {
  role: UserRole;
  visiblePages: string[] | null; // null = all pages visible
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  role: 'member',
  visiblePages: null,
  canEdit: true,
  canDelete: false,
  canManageUsers: false,
};

function resolvePermissions(user: User | null): UserPermissions {
  if (!user) return { ...DEFAULT_PERMISSIONS, role: 'viewer', canEdit: false };

  const role = (user.app_metadata?.role as UserRole) ?? 'member';

  switch (role) {
    case 'admin':
      return { role, visiblePages: null, canEdit: true, canDelete: true, canManageUsers: true };
    case 'manager':
      return { role, visiblePages: null, canEdit: true, canDelete: true, canManageUsers: false };
    case 'member':
      return { role, visiblePages: null, canEdit: true, canDelete: false, canManageUsers: false };
    case 'viewer':
      return { role, visiblePages: null, canEdit: false, canDelete: false, canManageUsers: false };
    case 'external': {
      const pages = (user.app_metadata?.visible_pages as string[]) ?? null;
      return { role, visiblePages: pages, canEdit: false, canDelete: false, canManageUsers: false };
    }
    default:
      return DEFAULT_PERMISSIONS;
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  permissions: UserPermissions;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  permissions: DEFAULT_PERMISSIONS,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Initial user load
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  const permissions = useMemo(() => resolvePermissions(user), [user]);
  const isAdmin = permissions.role === 'admin';

  const value = useMemo(
    () => ({ user, loading, permissions, isAdmin, signOut }),
    [user, loading, permissions, isAdmin, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
