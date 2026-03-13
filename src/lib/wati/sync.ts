// ===================================================
// WATI → comm_messages Sync
// ===================================================
// Converts WATI messages to comm_messages rows and
// matches phone numbers to entities in vb_records.

import type { WATIMessage, CommMessage } from './types';
import { normalizePhone } from './client';

/** Convert a WATI message to a comm_messages insert row */
export function watiMessageToCommRow(
  msg: WATIMessage,
  entityId: string | null,
  phone: string,
): CommMessage {
  return {
    entity_id: entityId,
    entity_phone: normalizePhone(phone),
    channel: 'whatsapp',
    direction: msg.owner ? 'outbound' : 'inbound',
    sender_name: msg.owner ? (msg.operatorName ?? 'System') : null,
    body: msg.text || msg.data || '',
    channel_meta: {
      wati_id: msg.id,
      type: msg.type,
      status: msg.statusString,
      template_name: msg.templateName,
      media_url: msg.data,
    },
    session_id: null,
    external_id: msg.id,
    is_read: msg.owner || msg.statusString === 'READ',
    provider: 'wati',
    message_type: 'regular',
    created_at: /^\d+$/.test(msg.timestamp)
      ? new Date(Number(msg.timestamp) * 1000).toISOString()
      : msg.timestamp,
  };
}

/** Find entity_id by phone number in vb_records meta */
export async function findEntityByPhone(
  supabase: { from: (table: string) => any },
  phone: string,
): Promise<string | null> {
  const normalized = normalizePhone(phone);

  // Search across all phone-like meta fields
  const phonePatterns = [normalized];

  // Also search for local format (05x...)
  if (normalized.startsWith('972') && normalized.length === 12) {
    phonePatterns.push('0' + normalized.slice(3));
  }

  for (const pattern of phonePatterns) {
    const { data } = await supabase
      .from('vb_records')
      .select('id')
      .eq('is_deleted', false)
      .or(`meta->>phone.ilike.%${pattern}%,meta->>mobile.ilike.%${pattern}%,meta->>telephone.ilike.%${pattern}%`)
      .limit(1)
      .maybeSingle();

    if (data) return data.id;
  }

  return null;
}

/** Batch convert WATI messages, resolving entity IDs */
export async function syncWatiMessages(
  supabase: { from: (table: string) => any },
  messages: WATIMessage[],
  phone: string,
): Promise<CommMessage[]> {
  const entityId = await findEntityByPhone(supabase, phone);
  return messages.map(msg => watiMessageToCommRow(msg, entityId, phone));
}
