// ===================================================
// Action Handlers — Execute action logic per button ID
// ===================================================

import { deactivateNote, reactivateNote, updateNoteMeta } from '@/lib/supabase/entityQueries';
import type {
  NoteRecord, GlobalField, ActionButton,
  NavigateConfig, SetFieldConfig, CustomEventConfig, WebhookConfig,
} from './types';

export interface ActionContext {
  language: string;
  fields: GlobalField[];
  notes: NoteRecord[];
  onRefresh: () => void;
}

export interface ActionResult {
  success: boolean;
  message?: string;
}

export type ActionHandler = (
  noteIds: string[],
  entityType: string,
  context: ActionContext,
) => Promise<ActionResult>;

// ─── Handler implementations ──────────────────────────

async function handleDeactivate(noteIds: string[]): Promise<ActionResult> {
  let success = true;
  for (const id of noteIds) {
    const ok = await deactivateNote(id);
    if (!ok) success = false;
  }
  return { success };
}

async function handleReactivate(noteIds: string[]): Promise<ActionResult> {
  let success = true;
  for (const id of noteIds) {
    const ok = await reactivateNote(id);
    if (!ok) success = false;
  }
  return { success };
}

async function handleExportCsv(
  noteIds: string[],
  _entityType: string,
  context: ActionContext,
): Promise<ActionResult> {
  const { fields, notes } = context;
  const targetNotes = noteIds.length > 0
    ? notes.filter(n => noteIds.includes(n.id))
    : notes;

  if (targetNotes.length === 0) return { success: false, message: 'No notes to export' };

  // Build CSV
  const headers = ['title', ...fields.map(f => f.meta_key)];
  const rows = targetNotes.map(note => {
    const cells = [
      `"${note.title.replace(/"/g, '""')}"`,
      ...fields.map(f => {
        const val = note.meta[f.meta_key];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }),
    ];
    return cells.join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return { success: true };
}

async function handleOpenInAi(noteIds: string[], _entityType: string, context: ActionContext): Promise<ActionResult> {
  const note = context.notes.find(n => n.id === noteIds[0]);
  if (!note) return { success: false };

  // Use existing custom events
  window.dispatchEvent(new CustomEvent('cc-open-ai'));
  setTimeout(() => {
    const prefill = `Analyze this ${_entityType}: "${note.title}"\n\nMeta: ${JSON.stringify(note.meta, null, 2)}`;
    window.dispatchEvent(new CustomEvent('cc-ai-prefill', { detail: { text: prefill } }));
  }, 300);

  return { success: true };
}

async function handleSendNotification(noteIds: string[]): Promise<ActionResult> {
  window.dispatchEvent(new CustomEvent('cc-notify', {
    detail: {
      title: `Notification sent for ${noteIds.length} note(s)`,
      type: 'success',
    },
  }));
  return { success: true };
}

async function handleSendWhatsapp(noteIds: string[], _entityType: string, context: ActionContext): Promise<ActionResult> {
  const note = context.notes.find(n => n.id === noteIds[0]);
  if (!note) return { success: false };

  const phone = note.meta.phone as string | undefined;
  if (!phone) return { success: false, message: 'No phone number' };

  // Clean phone number and open WATI / WhatsApp
  const clean = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${clean}`, '_blank');
  return { success: true };
}

// ─── Handler map ───────────────────────────────────

export const ACTION_HANDLERS: Record<string, ActionHandler> = {
  deactivate: handleDeactivate,
  reactivate: handleReactivate,
  change_status: async () => ({ success: true, message: 'status_picker' }), // handled by UI
  export_csv: handleExportCsv,
  open_in_ai: handleOpenInAi,
  send_notification: handleSendNotification,
  call_log: async () => ({ success: true, message: 'call_log_form' }), // handled by UI
  send_whatsapp: handleSendWhatsapp,
  bulk_field_update: async () => ({ success: true, message: 'bulk_field_update_modal' }), // handled by UI
  bulk_status_change: async () => ({ success: true, message: 'bulk_status_change_modal' }), // handled by UI
  bulk_assign: async () => ({ success: true, message: 'bulk_assign_modal' }), // handled by UI
};

// ─── Template resolver ────────────────────────────────

/**
 * Replaces `{field_key}` placeholders in a template string
 * with values from the note's meta + top-level fields.
 */
export function resolveTemplate(
  template: string,
  meta: Record<string, unknown>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = meta[key];
    if (val === null || val === undefined) return '';
    return String(val);
  });
}

// ─── Universal action dispatcher ──────────────────────

/**
 * Executes an action button based on its handler_type.
 * - builtin → delegates to ACTION_HANDLERS map
 * - navigate → opens resolved URL
 * - set_field → updates note meta field
 * - custom_event → dispatches a DOM CustomEvent
 * - webhook → POSTs to configured URL
 */
export async function executeAction(
  action: ActionButton,
  noteIds: string[],
  entityType: string,
  context: ActionContext,
): Promise<ActionResult> {
  const handlerType = action.handler_type ?? 'builtin';

  // Builtin — use existing handler map
  if (handlerType === 'builtin') {
    const handler = ACTION_HANDLERS[action.id];
    if (!handler) return { success: false, message: `No handler for ${action.id}` };
    return handler(noteIds, entityType, context);
  }

  const note = context.notes.find(n => n.id === noteIds[0]);
  const meta = note?.meta ?? {};

  // Navigate — open URL with resolved placeholders
  if (handlerType === 'navigate' && action.handler_config) {
    const cfg = action.handler_config as NavigateConfig;
    const url = resolveTemplate(cfg.url_template, meta);
    if (!url) return { success: false, message: 'Empty URL' };
    window.open(url, cfg.target ?? '_blank');
    return { success: true };
  }

  // Set field — update a meta field value
  if (handlerType === 'set_field' && action.handler_config) {
    const cfg = action.handler_config as SetFieldConfig;
    const value = resolveTemplate(cfg.value, meta);
    let allOk = true;
    for (const id of noteIds) {
      const ok = await updateNoteMeta(id, { [cfg.field_key]: value }, { trackActivity: true });
      if (!ok) allOk = false;
    }
    if (allOk) context.onRefresh();
    return { success: allOk };
  }

  // Custom event — dispatch DOM event
  if (handlerType === 'custom_event' && action.handler_config) {
    const cfg = action.handler_config as CustomEventConfig;
    const detailStr = resolveTemplate(cfg.detail_template, meta);
    let detail: unknown;
    try { detail = JSON.parse(detailStr); } catch { detail = detailStr; }
    window.dispatchEvent(new CustomEvent(cfg.event_name, { detail }));
    return { success: true };
  }

  // Webhook — POST to external URL
  if (handlerType === 'webhook' && action.handler_config) {
    const cfg = action.handler_config as WebhookConfig;
    const body: Record<string, unknown> = {
      action_id: action.id,
      entity_type: entityType,
      note_ids: noteIds,
    };
    if (cfg.include_meta && note) {
      body.meta = note.meta;
      body.title = note.title;
    }
    try {
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { success: res.ok, message: res.ok ? undefined : `Webhook failed: ${res.status}` };
    } catch (err) {
      return { success: false, message: `Webhook error: ${err instanceof Error ? err.message : 'unknown'}` };
    }
  }

  return { success: false, message: `Unknown handler type: ${handlerType}` };
}
