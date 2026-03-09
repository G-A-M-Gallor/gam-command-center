// ===================================================
// Resolve Actions — Filter & sort visible actions
// ===================================================

import type { ActionButton, NoteRecord, TemplateConfig } from './types';

interface ResolveContext {
  scope: 'single' | 'bulk' | 'global';
  note?: NoteRecord;
  hasSelection?: boolean;
  canPerformAction?: (actionId: string) => boolean;
}

/**
 * Resolves which action buttons are visible given template config and context.
 * Used by both EntityActionBar (page toolbar) and NoteActions (note sidebar).
 */
export function resolveActions(
  templateConfig: TemplateConfig | null | undefined,
  context: ResolveContext,
): ActionButton[] {
  const buttons = templateConfig?.action_buttons;
  if (!buttons || buttons.length === 0) return [];

  return buttons
    .filter(btn => {
      // Permission check
      if (context.canPerformAction && !context.canPerformAction(btn.id)) return false;

      // Scope matching
      if (context.scope === 'single' && btn.scope !== 'single') return false;
      if (context.scope === 'bulk' && btn.scope === 'single') return false;
      if (context.scope === 'global' && btn.scope === 'single') return false;

      // show_when conditions
      if (btn.show_when) {
        const { status_in, status_not_in, field_exists, is_active } = btn.show_when;

        if (context.note) {
          if (status_in && !status_in.includes(context.note.status)) return false;
          if (status_not_in && status_not_in.includes(context.note.status)) return false;
          if (field_exists && !context.note.meta[field_exists]) return false;
          if (is_active === true && context.note.status === 'inactive') return false;
          if (is_active === false && context.note.status !== 'inactive') return false;
        }
      }

      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}
