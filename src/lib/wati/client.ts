// ===================================================
// WATI API Client
// ===================================================
// Server-side client for WATI WhatsApp Business API.
// Requires: WATI_API_URL + WATI_API_TOKEN env vars.

import type { WATIContact, WATIMessage, WATITemplate, WATISendResponse } from './types';
import { resilientWatiRequest } from './resilience';

export function getConfig() {
  const baseUrl = process.env.WATI_API_URL;
  const token = process.env.WATI_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('WATI_API_URL and WATI_API_TOKEN must be configured');
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

async function watiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const { baseUrl, token } = getConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`WATI API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch contacts list */
export async function getContacts(pageSize = 50, pageNumber = 1): Promise<WATIContact[]> {
  return resilientWatiRequest(
    async () => {
      const data = await watiRequest<{ result?: string; contact_list?: WATIContact[] }>(
        `/api/v1/getContacts?pageSize=${pageSize}&pageNumber=${pageNumber}`
      );
      return data.contact_list ?? [];
    },
    'getContacts'
  );
}

/** Fetch messages for a phone number */
export async function getMessages(phone: string, pageSize = 50, pageNumber = 1): Promise<WATIMessage[]> {
  const normalized = normalizePhone(phone);
  return resilientWatiRequest(
    async () => {
      const data = await watiRequest<{ result?: string; messages?: { items?: WATIMessage[] } }>(
        `/api/v1/getMessages/${normalized}?pageSize=${pageSize}&pageNumber=${pageNumber}`
      );
      return data.messages?.items ?? [];
    },
    'getMessages'
  );
}

/** Send a free-text WhatsApp message */
export async function sendTextMessage(phone: string, text: string): Promise<WATISendResponse> {
  const normalized = normalizePhone(phone);
  return watiRequest<WATISendResponse>(
    `/api/v1/sendSessionMessage/${normalized}`,
    {
      method: 'POST',
      body: JSON.stringify({ messageText: text }),
    }
  );
}

/** Send a template message */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  params: { name: string; value: string }[],
): Promise<WATISendResponse> {
  const normalized = normalizePhone(phone);
  return watiRequest<WATISendResponse>(
    `/api/v1/sendTemplateMessage/${normalized}`,
    {
      method: 'POST',
      body: JSON.stringify({
        template_name: templateName,
        broadcast_name: `cc_${Date.now()}`,
        parameters: params,
      }),
    }
  );
}

/** Fetch approved message templates */
export async function getMessageTemplates(): Promise<WATITemplate[]> {
  const data = await watiRequest<{ result?: string; messageTemplates?: WATITemplate[] }>(
    '/api/v1/getMessageTemplates'
  );
  return data.messageTemplates ?? [];
}

// ─── Phone Normalization ────────────────────────────────────

/** Normalize phone to E.164 format (strip non-digits, handle Israeli prefix) */
export function normalizePhone(phone: string): string {
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Israeli local → international
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '972' + digits.slice(1);
  }

  // Ensure starts with country code (default IL)
  if (!digits.startsWith('972') && digits.length === 9) {
    digits = '972' + digits;
  }

  return digits;
}
