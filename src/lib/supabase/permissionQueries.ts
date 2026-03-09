// ===================================================
// Action Permissions — Per-user permission overrides
// ===================================================
// DB table `user_action_permissions` stores per-user flags.
// If no row exists, fallback to role-based defaults.

import { supabase } from '@/lib/supabaseClient';
import type { UserRole } from '@/contexts/AuthContext';

export interface ActionPermissions {
  canExportCsv: boolean;
  canDelete: boolean;
  canBulkUpdate: boolean;
  canBulkStatus: boolean;
  canBulkAssign: boolean;
  canManageUsers: boolean;
  canEdit: boolean;
}

/** Map from action button ID → ActionPermissions key */
export const ACTION_PERMISSION_MAP: Record<string, keyof ActionPermissions> = {
  export_csv: 'canExportCsv',
  deactivate: 'canDelete',
  bulk_field_update: 'canBulkUpdate',
  bulk_status_change: 'canBulkStatus',
  bulk_assign: 'canBulkAssign',
  // Single-action permissions (always allowed unless explicitly restricted)
  change_status: 'canEdit',
  open_in_ai: 'canEdit',
  send_notification: 'canEdit',
  call_log: 'canEdit',
  send_whatsapp: 'canEdit',
  reactivate: 'canEdit',
};

/** Role-based defaults when no DB row exists */
export function roleDefaults(role: UserRole): ActionPermissions {
  switch (role) {
    case 'admin':
      return {
        canExportCsv: true, canDelete: true, canBulkUpdate: true,
        canBulkStatus: true, canBulkAssign: true, canManageUsers: true, canEdit: true,
      };
    case 'manager':
      return {
        canExportCsv: true, canDelete: true, canBulkUpdate: true,
        canBulkStatus: true, canBulkAssign: true, canManageUsers: false, canEdit: true,
      };
    case 'member':
      return {
        canExportCsv: true, canDelete: false, canBulkUpdate: true,
        canBulkStatus: true, canBulkAssign: false, canManageUsers: false, canEdit: true,
      };
    case 'viewer':
    case 'external':
      return {
        canExportCsv: false, canDelete: false, canBulkUpdate: false,
        canBulkStatus: false, canBulkAssign: false, canManageUsers: false, canEdit: false,
      };
    default:
      return roleDefaults('member');
  }
}

/** Fetch permissions for a user — merges DB overrides on top of role defaults */
export async function fetchActionPermissions(
  userId: string,
  role: UserRole,
): Promise<ActionPermissions> {
  const defaults = roleDefaults(role);

  // Admin always gets everything
  if (role === 'admin') return defaults;

  const { data, error } = await supabase
    .from('user_action_permissions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return defaults;

  // Merge: DB values override defaults
  return {
    canExportCsv: data.can_export_csv ?? defaults.canExportCsv,
    canDelete: data.can_delete ?? defaults.canDelete,
    canBulkUpdate: data.can_bulk_update ?? defaults.canBulkUpdate,
    canBulkStatus: data.can_bulk_status ?? defaults.canBulkStatus,
    canBulkAssign: data.can_bulk_assign ?? defaults.canBulkAssign,
    canManageUsers: data.can_manage_users ?? defaults.canManageUsers,
    canEdit: data.can_edit ?? defaults.canEdit,
  };
}

/** Admin: update a user's permission overrides */
export async function updateActionPermissions(
  userId: string,
  patch: Partial<Record<string, boolean>>,
  grantedBy: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_action_permissions')
    .upsert({
      user_id: userId,
      ...patch,
      granted_by: grantedBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) { console.error('updateActionPermissions:', error.message); return false; }
  return true;
}
