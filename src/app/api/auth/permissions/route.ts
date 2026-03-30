import { NextResponse } from 'next/server';
import { _createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api/auth';

type UserRole = 'admin' | 'manager' | 'member' | 'viewer' | 'external';

interface ActionPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canAccessAdmin: boolean;
  canAccessAI: boolean;
  canExportCsv: boolean;
  canBulkUpdate: boolean;
  canBulkStatus: boolean;
  canBulkAssign: boolean;
}

function roleDefaults(role: UserRole): ActionPermissions {
  switch (role) {
    case 'admin':
      return {
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
        canAccessAdmin: true,
        canAccessAI: true,
        canExportCsv: true,
        canBulkUpdate: true,
        canBulkStatus: true,
        canBulkAssign: true,
      };
    case 'manager':
      return {
        canEdit: true,
        canDelete: true,
        canManageUsers: false,
        canAccessAdmin: false,
        canAccessAI: true,
        canExportCsv: true,
        canBulkUpdate: true,
        canBulkStatus: true,
        canBulkAssign: true,
      };
    case 'member':
      return {
        canEdit: true,
        canDelete: false,
        canManageUsers: false,
        canAccessAdmin: false,
        canAccessAI: true,
        canExportCsv: true,
        canBulkUpdate: true,
        canBulkStatus: true,
        canBulkAssign: false,
      };
    case 'viewer':
      return {
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canAccessAdmin: false,
        canAccessAI: false,
        canExportCsv: false,
        canBulkUpdate: false,
        canBulkStatus: false,
        canBulkAssign: false,
      };
    case 'external':
      return {
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canAccessAdmin: false,
        canAccessAI: false,
        canExportCsv: false,
        canBulkUpdate: false,
        canBulkStatus: false,
        canBulkAssign: false,
      };
    default:
      return roleDefaults('member');
  }
}

export async function GET(_request: Request) {
  const { _user, error } = await requireAuth(_request);
  if (error || !_user) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 });
  }

  const role = (_user.app_metadata?.role as UserRole) ?? 'member';
  const defaults = roleDefaults(role);

  // Admin always gets full permissions, skip DB lookup
  if (role === 'admin') {
    return NextResponse.json({ role, permissions: defaults });
  }

  // Check for per-user overrides in user_action_permissions table
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from('user_action_permissions')
    .select('*')
    .eq('user_id', _user.id)
    .single();

  if (!data) {
    return NextResponse.json({ role, permissions: defaults });
  }

  // Merge DB overrides on top of role defaults
  const permissions: ActionPermissions = {
    canEdit: data.can_edit ?? defaults.canEdit,
    canDelete: data.can_delete ?? defaults.canDelete,
    canManageUsers: data.can_manage_users ?? defaults.canManageUsers,
    canAccessAdmin: data.can_access_admin ?? defaults.canAccessAdmin,
    canAccessAI: data.can_access_ai ?? defaults.canAccessAI,
    canExportCsv: data.can_export_csv ?? defaults.canExportCsv,
    canBulkUpdate: data.can_bulk_update ?? defaults.canBulkUpdate,
    canBulkStatus: data.can_bulk_status ?? defaults.canBulkStatus,
    canBulkAssign: data.can_bulk_assign ?? defaults.canBulkAssign,
  };

  return NextResponse.json({ role, permissions });
}
