// ===================================================
// WATI API — TypeScript Types
// ===================================================

/** WATI contact from API */
export interface WATIContact {
  id: string;
  wAid: string;          // WhatsApp ID (phone in E.164)
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone: string;
  isBlocked: boolean;
  lastMessageTime?: string;
}

/** WATI message from API */
export interface WATIMessage {
  id: string;
  waId: string;
  text: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'interactive';
  statusString?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: string;
  owner: boolean;          // true = sent by us, false = received
  operatorName?: string;
  templateName?: string;
  data?: string;           // media URL for non-text messages
}

/** WATI message template */
export interface WATITemplate {
  id: string;
  elementName: string;
  category: string;
  body: string;
  header?: string;
  footer?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  params: string[];
}

/** Normalized comm_messages row for DB insert */
export interface CommMessage {
  id?: string;
  entity_id: string | null;
  entity_phone: string | null;
  channel: 'whatsapp' | 'phone' | 'email' | 'note' | 'reminder';
  direction: 'inbound' | 'outbound' | 'internal';
  sender_name: string | null;
  body: string;
  channel_meta: Record<string, unknown>;
  session_id: string | null;
  external_id: string | null;
  is_read: boolean;
  created_at?: string;
}

/** comm_templates row */
export interface CommTemplate {
  id: string;
  channel: 'whatsapp' | 'phone' | 'email';
  name: string;
  body: string;
  params: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** WATI API response wrapper */
export interface WATIApiResponse<T> {
  result: T;
  info?: string;
}

/** WATI send message response */
export interface WATISendResponse {
  result: boolean;
  info?: string;
  id?: string;
}

/** Channel filter type for UI */
export type ChannelFilter = 'all' | 'whatsapp' | 'phone' | 'email' | 'note' | 'reminder';
