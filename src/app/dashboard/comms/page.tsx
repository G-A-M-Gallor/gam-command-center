'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Phone,
  MessageSquare,
  Mail,
  StickyNote,
  Bell,
  Plus,
  Loader2,
  X,
  ChevronDown,
  RefreshCw,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  BellRing,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';
import {
  fetchAllCommMessages,
  insertCommMessage,
  getGlobalUnreadCount,
  fetchNotificationLog,
  type FetchAllCommOptions,
  type NotificationLogRow,
} from '@/lib/supabase/commQueries';
import type { CommMessage } from '@/lib/wati/types';
import { createClient } from '@/lib/supabase/client';
import { SendEmailModal } from '@/components/email/SendEmailModal';
import { EmailDetailPanel } from '@/components/email/EmailDetailPanel';

const supabase = createClient();

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// ─── Types ──────────────────────────────────────────────

type CommTab = 'calls' | 'messages' | 'whatsapp_personal' | 'contacts' | 'docs' | 'notifications' | 'emails';

interface EmailSendRow {
  id: string;
  tenant_id: string | null;
  template_id: string | null;
  resend_id: string | null;
  from_email: string;
  to_email: string;
  cc: string[] | null;
  bcc: string[] | null;
  subject: string;
  html_body: string | null;
  variables: Record<string, string> | null;
  entity_id: string | null;
  status: string;
  opened_count: number;
  clicked_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  first_clicked_at: string | null;
  clicked_links: Array<{ url: string; count: number; first_at: string }> | null;
  bounce_reason: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  email_templates?: { name: string; category: string } | null;
}

interface ContactGroup {
  phone: string;
  name: string | null;
  entityId: string | null;
  messages: CommMessage[];
  lastActivity: string;
  channels: Set<string>;
}

// ─── Channel config ─────────────────────────────────────

const CHANNEL_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  whatsapp: { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  phone: { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  sms: { icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  email: { icon: Mail, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  note: { icon: StickyNote, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  reminder: { icon: Bell, color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

// ─── Helpers ────────────────────────────────────────────

function timeAgo(dateStr: string | undefined, lang: string): string {
  if (!dateStr) return '—';
  const ct = getTranslations(lang as "he" | "en" | "ru").comms as Record<string, string>;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return ct.timeNow;
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return ct.timeYesterday;
  return `${days}d`;
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

function getCallMeta(msg: CommMessage) {
  const meta = msg.channel_meta as Record<string, unknown> | null;
  const duration = meta?.duration as number | undefined;
  const status = (meta?.status as string) || '';
  const recordingUrl = meta?.recording_url as string | undefined;
  const answered = status.toLowerCase() === 'answered';
  return { duration, status, recordingUrl, answered };
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Tab channel mapping ────────────────────────────────

const TAB_CHANNELS: Record<CommTab, string[] | null> = {
  calls: ['phone'],
  messages: ['whatsapp', 'email', 'sms'],
  whatsapp_personal: ['whatsapp_personal'], // future — personal WhatsApp
  contacts: null, // all — grouped differently
  docs: ['note', 'reminder'],
  notifications: null, // separate data source
  emails: null, // separate data source (email_sends table)
};

// ─── Add Call Modal ─────────────────────────────────────

interface AddCallModalProps {
  c: Record<string, string>;
  isRtl: boolean;
  onClose: () => void;
  onSave: (msg: Omit<CommMessage, 'id'>) => void;
}

function AddCallModal({ c, isRtl, onClose, onSave }: AddCallModalProps) {
  const [phoneName, setPhoneName] = useState('');
  const [channel, setChannel] = useState<'phone' | 'note' | 'reminder'>('phone');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [summary, setSummary] = useState('');
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneName.trim() || !summary.trim()) return;
    setSaving(true);
    await onSave({
      entity_id: null,
      entity_phone: phoneName.trim(),
      channel,
      direction,
      sender_name: phoneName.trim(),
      body: summary.trim(),
      channel_meta: { manual: true },
      session_id: null,
      external_id: null,
      is_read: true,
      provider: 'manual',
      message_type: 'regular' as const,
      created_at: new Date(dateTime).toISOString(),
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <form
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{c.addCallTitle}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">{c.phoneName}</label>
          <input type="text" value={phoneName} onChange={(e) => setPhoneName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none" required />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">{c.channel}</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value as 'phone' | 'note' | 'reminder')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none">
            <option value="phone">{c.phone}</option>
            <option value="note">{c.notes}</option>
            <option value="reminder">{c.reminder}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">{c.direction}</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as 'inbound' | 'outbound')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none">
            <option value="inbound">{c.inbound}</option>
            <option value="outbound">{c.outbound}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">{c.summary}</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none resize-none" required />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">{c.dateTime}</label>
          <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">{c.cancel}</button>
          <button type="submit" disabled={saving || !phoneName.trim() || !summary.trim()}
            className="rounded-lg bg-[var(--cc-accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--cc-accent-500)] disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {c.save}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Card renderers ─────────────────────────────────────

function CallCard({ msg, c, lang, onClick }: { msg: CommMessage; c: Record<string, string>; lang: string; onClick: () => void }) {
  const { duration, answered } = getCallMeta(msg);
  const isIn = msg.direction === 'inbound';
  const DirIcon = !answered ? PhoneMissed : isIn ? PhoneIncoming : PhoneOutgoing;
  const dirColor = !answered ? 'text-red-400' : isIn ? 'text-emerald-400' : 'text-blue-400';

  return (
    <div onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-slate-700/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/30 ${!msg.is_read ? 'border-s-2 border-s-[var(--cc-accent-500)]' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${answered ? 'bg-slate-800' : 'bg-red-500/10'}`}>
          <DirIcon className={`h-4 w-4 ${dirColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm text-slate-200 truncate ${!msg.is_read ? 'font-semibold' : ''}`}>
              {msg.sender_name || msg.entity_phone || '—'}
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(msg.created_at, lang)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-mono">{msg.entity_phone || ''}</span>
            {duration != null && duration > 0 && (
              <span className="text-xs text-slate-500">({formatDuration(duration)})</span>
            )}
          </div>
          {msg.body && (
            <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">{msg.body}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${answered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {answered ? (isIn ? c.inbound : c.outbound) : c.missedCall}
            </span>
            <span className="text-[10px] text-slate-600">{formatTime(msg.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageCard({ msg, c, lang, onClick }: { msg: CommMessage; c: Record<string, string>; lang: string; onClick: () => void }) {
  const ch = CHANNEL_ICON[msg.channel] || CHANNEL_ICON.note;
  const ChIcon = ch.icon;
  const isIn = msg.direction === 'inbound';

  return (
    <div onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-slate-700/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/30 ${!msg.is_read ? 'border-s-2 border-s-[var(--cc-accent-500)]' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ch.bg}`}>
          <ChIcon className={`h-4 w-4 ${ch.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-sm text-slate-200 truncate ${!msg.is_read ? 'font-semibold' : ''}`}>
                {msg.sender_name || msg.entity_phone || '—'}
              </span>
              {isIn ? (
                <ArrowDownLeft className="h-3 w-3 text-emerald-400 shrink-0" />
              ) : (
                <ArrowUpRight className="h-3 w-3 text-blue-400 shrink-0" />
              )}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(msg.created_at, lang)}</span>
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${!msg.is_read ? 'text-slate-200' : 'text-slate-400'} line-clamp-2`}>
            {truncate(msg.body)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ch.bg} ${ch.color}`}>
              {c[msg.channel] || msg.channel}
            </span>
            {msg.provider ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                {msg.provider}
              </span>
            ) : null}
            {msg.message_type && msg.message_type !== 'regular' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {msg.message_type}
              </span>
            ) : null}
            <span className="text-[10px] text-slate-600">{formatTime(msg.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCard({ msg, c, lang, onClick }: { msg: CommMessage; c: Record<string, string>; lang: string; onClick: () => void }) {
  const isReminder = msg.channel === 'reminder';
  const DocIcon = isReminder ? Bell : StickyNote;
  const color = isReminder ? 'text-rose-400' : 'text-purple-400';
  const bg = isReminder ? 'bg-rose-500/10' : 'bg-purple-500/10';

  return (
    <div onClick={onClick}
      className="group cursor-pointer rounded-xl border border-slate-700/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/30">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
          <DocIcon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-200 truncate">
              {msg.sender_name || c.noteLabel}
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(msg.created_at, lang)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-400 line-clamp-3">{msg.body}</p>
          {msg.entity_phone && (
            <div className="flex items-center gap-1.5 mt-2">
              <Phone className="h-3 w-3 text-slate-600" />
              <span className="text-[10px] text-slate-500 font-mono">{msg.entity_phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactCard({ group, c, lang, onClick }: { group: ContactGroup; c: Record<string, string>; lang: string; onClick: () => void }) {
  const lastMsg = group.messages[0];
  const msgCount = group.messages.length;
  const unreadCount = group.messages.filter((m) => !m.is_read).length;

  return (
    <div onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-slate-700/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/30 ${unreadCount > 0 ? 'border-s-2 border-s-[var(--cc-accent-500)]' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-400)] text-sm font-semibold">
          {(group.name || group.phone)?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">
              {group.name || group.phone}
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(group.lastActivity, lang)}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">{group.phone}</span>

          {/* Channel badges */}
          <div className="flex items-center gap-1.5 mt-2">
            {Array.from(group.channels).map((ch) => {
              const conf = CHANNEL_ICON[ch] || CHANNEL_ICON.note;
              const I = conf.icon;
              return (
                <span key={ch} className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${conf.bg} ${conf.color}`}>
                  <I className="h-2.5 w-2.5" />
                </span>
              );
            })}
            <span className="text-[10px] text-slate-500">{msgCount} {c.messagesCount}</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Last message preview */}
          {lastMsg && (
            <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">{truncate(lastMsg.body, 80)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const EMAIL_STATUS: Record<string, { color: string; bg: string; label: Record<string, string> }> = {
  queued: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: { he: 'בתור', en: 'Queued', ru: 'В очереди' } },
  sent: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: { he: 'נשלח', en: 'Sent', ru: 'Отправлено' } },
  delivered: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: { he: 'נמסר', en: 'Delivered', ru: 'Доставлено' } },
  opened: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: { he: 'נפתח', en: 'Opened', ru: 'Открыто' } },
  clicked: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: { he: 'נלחץ', en: 'Clicked', ru: 'Клик' } },
  bounced: { color: 'text-red-400', bg: 'bg-red-500/10', label: { he: 'חזר', en: 'Bounced', ru: 'Отклонено' } },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: { he: 'נכשל', en: 'Failed', ru: 'Ошибка' } },
};

function EmailCard({ email, lang, onClick }: { email: EmailSendRow; lang: string; onClick: () => void }) {
  const st = EMAIL_STATUS[email.status] || EMAIL_STATUS.queued;

  return (
    <div onClick={onClick}
      className="group cursor-pointer rounded-xl border border-slate-700/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Mail className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">{email.subject}</span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(email.created_at, lang)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ArrowUpRight className="h-3 w-3 text-blue-400 shrink-0" />
            <span className="text-xs text-slate-400 truncate">{email.to_email}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
              {st.label[lang] || st.label.en}
            </span>
            {email.email_templates && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                {email.email_templates.name}
              </span>
            )}
            {email.opened_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                👁 {email.opened_count}
              </span>
            )}
            {email.clicked_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                🔗 {email.clicked_count}
              </span>
            )}
            <span className="text-[10px] text-slate-600">{formatTime(email.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ notif, lang }: { notif: NotificationLogRow; lang: string }) {
  const c = getTranslations(lang as "he" | "en" | "ru").comms as Record<string, string>;
  const isSent = notif.delivery_status === 'sent';
  const StatusIcon = isSent ? CheckCircle2 : XCircle;
  const statusColor = isSent ? 'text-emerald-400' : 'text-red-400';
  const meta = notif.meta as Record<string, string> | null;
  const channel = meta?.channel || '';
  const chConf = channel ? CHANNEL_ICON[channel] : null;

  return (
    <div className="group rounded-xl border border-slate-700/50 p-4 transition-all hover:bg-slate-800/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <BellRing className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">{notif.title}</span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(notif.created_at, lang)}</span>
          </div>
          {notif.body && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">{notif.body}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon className={`h-3 w-3 ${statusColor}`} />
            <span className={`text-[10px] ${statusColor}`}>
              {isSent ? c.statusSent : c.statusFailed}
            </span>
            {chConf && (
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${chConf.bg} ${chConf.color}`}>
                <chConf.icon className="h-2.5 w-2.5" />
              </span>
            )}
            {meta?.type === 'sync_summary' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">sync</span>
            )}
            <span className="text-[10px] text-slate-600">{formatTime(notif.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function CommsPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const c = t.comms as Record<string, string>;
  const isRtl = language === 'he';

  // Tabs — multi-select toggle (which result types to show)
  const [activeTabs, setActiveTabs] = useState<Set<CommTab>>(new Set(['calls']));

  // State
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('');

  // Modal & sync
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationLogRow[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifCursor, setNotifCursor] = useState<string | null>(null);

  // Email state
  const [emailSends, setEmailSends] = useState<EmailSendRow[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCursor, setEmailCursor] = useState<string | null>(null);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailSendRow | null>(null);

  // Load notifications when tab is active
  useEffect(() => {
    if (!activeTabs.has('notifications')) return;
    setNotifLoading(true);
    fetchNotificationLog({ limit: 50 }).then((res) => {
      setNotifications(res.data);
      setNotifCursor(res.nextCursor);
      setNotifLoading(false);
    });
  }, [activeTabs]);

  // Load emails when tab is active
  useEffect(() => {
    if (!activeTabs.has('emails')) return;
    setEmailLoading(true);
    fetch('/api/email/sends?limit=50')
      .then((r) => r.json())
      .then((res) => {
        setEmailSends(res.sends || []);
        setEmailCursor(res.nextCursor || null);
        setEmailLoading(false);
      })
      .catch(() => setEmailLoading(false));
  }, [activeTabs]);

  const reloadEmails = useCallback(() => {
    fetch('/api/email/sends?limit=50')
      .then((r) => r.json())
      .then((res) => {
        setEmailSends(res.sends || []);
        setEmailCursor(res.nextCursor || null);
      })
      .catch(() => { /* no-op */ });
  }, []);

  // Search debounce
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Toggle a tab on/off (at least one must remain)
  const toggleTab = (tab: CommTab) => {
    setActiveTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tab)) {
        if (next.size > 1) next.delete(tab);
      } else {
        next.add(tab);
      }
      return next;
    });
  };

  // Collect all channels that active tabs want
  const activeChannels: string[] = useMemo(() => {
    const channels: string[] = [];
    for (const tab of activeTabs) {
      const ch = TAB_CHANNELS[tab];
      if (ch) channels.push(...ch);
      else return []; // contacts tab = all channels → return empty to signal "no filter"
    }
    return channels;
  }, [activeTabs]);

  // When contacts tab is active, we need all channels (no DB-level filter)
  const hasContactsTab = activeTabs.has('contacts');

  // Build query — fetch broadly, filter client-side for multi-tab
  const queryOptions: FetchAllCommOptions = useMemo(() => ({
    search: debouncedSearch || undefined,
    // Only apply channel filter if exactly 1 channel and no contacts tab
    channel: !hasContactsTab && activeChannels.length === 1
      ? (activeChannels[0] as FetchAllCommOptions['channel'])
      : undefined,
    direction: directionFilter ? (directionFilter as 'inbound' | 'outbound' | 'internal') : undefined,
    sortField: 'created_at',
    sortDir: 'desc',
    limit: 50,
  }), [debouncedSearch, activeChannels, hasContactsTab, directionFilter]);

  // Load messages
  const loadMessages = useCallback(async (opts: FetchAllCommOptions, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const result = await fetchAllCommMessages(opts);

    if (append) {
      setMessages((prev) => [...prev, ...result.data]);
    } else {
      setMessages(result.data);
    }
    setNextCursor(result.nextCursor);
    if (!append) setLoading(false);
    else setLoadingMore(false);
  }, []);

  // Fetch on filter/tab change
  useEffect(() => {
    setMessages([]);
    setNextCursor(null);
    loadMessages(queryOptions);
  }, [queryOptions, loadMessages]);

  // Unread count
  useEffect(() => {
    getGlobalUnreadCount().then(setUnreadCount);
  }, [messages]);

  // Load more
  const handleLoadMore = () => {
    if (!nextCursor) return;
    loadMessages({ ...queryOptions, cursor: nextCursor }, true);
  };

  // Row click → open comms panel
  const handleRowClick = (msg: CommMessage) => {
    window.dispatchEvent(new CustomEvent('cc-open-comms-panel', {
      detail: { entityId: msg.entity_id, phone: msg.entity_phone, name: msg.sender_name },
    }));
  };

  const handleContactClick = (group: ContactGroup) => {
    window.dispatchEvent(new CustomEvent('cc-open-comms-panel', {
      detail: { entityId: group.entityId, phone: group.phone, name: group.name },
    }));
  };

  // Add call
  const handleAddCall = async (msg: Omit<CommMessage, 'id'>) => {
    const result = await insertCommMessage(msg);
    if (result) {
      setShowAddModal(false);
      loadMessages(queryOptions);
    }
  };

  // Sync WATI
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/comms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`${data.synced} msgs / ${data.contacts} contacts`);
        loadMessages(queryOptions);
      } else {
        setSyncResult(data.error || 'Sync failed');
      }
    } catch {
      setSyncResult('Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  // Determine which tab a message belongs to
  const msgToTab = (msg: CommMessage): CommTab => {
    if (msg.channel === 'phone') return 'calls';
    if (msg.channel === 'whatsapp' || msg.channel === 'email') return 'messages';
    return 'docs';
  };

  // Filter messages client-side by active tabs (when multiple channels fetched)
  const filteredMessages = useMemo(() => {
    // If all channels are fetched (contacts or multiple tabs), filter client-side
    if (hasContactsTab || activeChannels.length > 1) {
      return messages.filter((m) => {
        const tab = msgToTab(m);
        return activeTabs.has(tab) || activeTabs.has('contacts');
      });
    }
    return messages;
  }, [messages, activeTabs, hasContactsTab, activeChannels]);

  // Contact groups (only computed when contacts tab is active)
  const contactGroups: ContactGroup[] = useMemo(() => {
    if (!activeTabs.has('contacts')) return [];
    const map = new Map<string, ContactGroup>();
    for (const msg of messages) {
      const key = msg.entity_phone || msg.sender_name || 'unknown';
      const existing = map.get(key);
      if (existing) {
        existing.messages.push(msg);
        existing.channels.add(msg.channel);
        if (!existing.name && msg.sender_name) existing.name = msg.sender_name;
        if (!existing.entityId && msg.entity_id) existing.entityId = msg.entity_id;
        if (msg.created_at && msg.created_at > existing.lastActivity) {
          existing.lastActivity = msg.created_at;
        }
      } else {
        map.set(key, {
          phone: msg.entity_phone || key,
          name: msg.sender_name,
          entityId: msg.entity_id,
          messages: [msg],
          lastActivity: msg.created_at || '',
          channels: new Set([msg.channel]),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }, [messages, activeTabs]);

  // Check if only contacts tab is active (show grid), or mixed (show timeline + contacts section)
  const onlyContacts = activeTabs.size === 1 && activeTabs.has('contacts');
  const showTimeline = activeTabs.has('calls') || activeTabs.has('messages') || activeTabs.has('docs');
  const showContactsSection = activeTabs.has('contacts');
  const showNotifications = activeTabs.has('notifications');
  const showEmails = activeTabs.has('emails');

  // Non-contact messages for the timeline
  const timelineMessages = useMemo(() => {
    if (!showTimeline) return [];
    return filteredMessages.filter((m) => {
      const tab = msgToTab(m);
      return activeTabs.has(tab);
    });
  }, [filteredMessages, showTimeline, activeTabs]);

  // Tab definitions
  const tabs: { id: CommTab; icon: React.ElementType; label: string; disabled?: boolean }[] = [
    { id: 'calls', icon: Phone, label: c.tabCalls },
    { id: 'messages', icon: MessageSquare, label: c.tabMessages },
    { id: 'whatsapp_personal', icon: MessageSquare, label: 'WhatsApp גל', disabled: true },
    { id: 'contacts', icon: Users, label: c.tabContacts },
    { id: 'docs', icon: FileText, label: c.tabDocs },
    { id: 'emails', icon: Mail, label: c.tabEmails },
    { id: 'notifications', icon: BellRing, label: c.tabNotifications },
  ];

  // Render the correct card type based on the message's channel
  const renderCard = (msg: CommMessage) => {
    const key = msg.id || msg.external_id || msg.created_at;
    const tab = msgToTab(msg);
    if (tab === 'calls') return <CallCard key={key} msg={msg} c={c} lang={language} onClick={() => handleRowClick(msg)} />;
    if (tab === 'docs') return <DocCard key={key} msg={msg} c={c} lang={language} onClick={() => handleRowClick(msg)} />;
    return <MessageCard key={key} msg={msg} c={c} lang={language} onClick={() => handleRowClick(msg)} />;
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col h-full">
      <PageHeader pageKey="comms">
        <div className="flex items-center gap-2">
          {syncResult && (
            <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs text-slate-300">{syncResult}</span>
          )}
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
              {unreadCount} {c.unreadCount}
            </span>
          )}
          <button type="button" onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50" title="Sync WATI">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button type="button" onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--cc-accent-500)] transition-colors">
            <Plus className="h-4 w-4" />
            {c.addCall}
          </button>
          <button type="button" onClick={() => setShowSendEmail(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-colors">
            <Mail className="h-4 w-4" />
            {t.email.sendEmail}
          </button>
        </div>
      </PageHeader>

      {/* Source toggles — multi-select chips */}
      <div className="shrink-0 border-b border-slate-700/50 px-6 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 me-1">{c.showLabel}</span>
          {tabs.map(({ id, icon: TabIcon, label, disabled }) => {
            const isOn = activeTabs.has(id);
            if (disabled) {
              return (
                <span key={id} title={c.comingSoonTab}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-slate-700/30 bg-slate-800/20 text-slate-600 cursor-not-allowed opacity-50 select-none">
                  <TabIcon className="h-3.5 w-3.5" />
                  {label}
                </span>
              );
            }
            return (
              <button key={id} type="button" onClick={() => toggleTab(id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  isOn
                    ? 'bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)] border border-[var(--cc-accent-500)]/30'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-300 hover:border-slate-600'
                }`}>
                <TabIcon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-6 py-3 border-b border-slate-700/50">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={c.search}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 ps-9 pe-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[var(--cc-accent-500)] focus:outline-none" />
        </div>

        {/* Direction filter — shown when calls or messages are active */}
        {(activeTabs.has('calls') || activeTabs.has('messages')) && (
          <div className="relative">
            <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 pe-8 text-sm text-slate-300 focus:border-[var(--cc-accent-500)] focus:outline-none">
              <option value="">{c.filterDirection}: {c.all}</option>
              <option value="inbound">{c.inbound}</option>
              <option value="outbound">{c.outbound}</option>
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contacts section — grid of contact cards */}
            {showContactsSection && (
              <div>
                {!onlyContacts && (
                  <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                    <Users className="h-3.5 w-3.5" />
                    {c.sectionContacts}
                    <span className="text-slate-600">({contactGroups.length})</span>
                  </h3>
                )}
                {contactGroups.length === 0 ? (
                  <EmptyState icon={Users} text={c.noMessages} />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {contactGroups.map((group) => (
                      <ContactCard key={group.phone} group={group} c={c} lang={language}
                        onClick={() => handleContactClick(group)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline — mixed cards sorted by date */}
            {showTimeline && (
              <div>
                {showContactsSection && (
                  <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                    <Clock className="h-3.5 w-3.5" />
                    {c.sectionTimeline}
                    <span className="text-slate-600">({timelineMessages.length})</span>
                  </h3>
                )}
                {timelineMessages.length === 0 ? (
                  <EmptyState icon={MessageSquare} text={c.noMessages} />
                ) : (
                  <div className="space-y-2">
                    {timelineMessages.map(renderCard)}
                  </div>
                )}
              </div>
            )}

            {/* Emails section */}
            {showEmails && (
              <div>
                {(showTimeline || showContactsSection) && (
                  <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                    <Mail className="h-3.5 w-3.5" />
                    {c.sectionEmails}
                    <span className="text-slate-600">({emailSends.length})</span>
                  </h3>
                )}
                {emailLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  </div>
                ) : emailSends.length === 0 ? (
                  <EmptyState icon={Mail} text={c.noEmails} />
                ) : (
                  <div className="space-y-2">
                    {emailSends.map((email) => (
                      <EmailCard key={email.id} email={email} lang={language}
                        onClick={() => setSelectedEmail(email)} />
                    ))}
                  </div>
                )}
                {emailCursor && !emailLoading && (
                  <div className="flex justify-center py-3">
                    <button type="button" onClick={() => {
                      fetch(`/api/email/sends?limit=50&cursor=${emailCursor}`)
                        .then((r) => r.json())
                        .then((res) => {
                          setEmailSends((prev) => [...prev, ...(res.sends || [])]);
                          setEmailCursor(res.nextCursor || null);
                        });
                    }} className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                      {c.loadMore}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notifications section */}
            {showNotifications && (
              <div>
                {(showTimeline || showContactsSection) && (
                  <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                    <BellRing className="h-3.5 w-3.5" />
                    {c.sectionNotifications}
                    <span className="text-slate-600">({notifications.length})</span>
                  </h3>
                )}
                {notifLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  </div>
                ) : notifications.length === 0 ? (
                  <EmptyState icon={BellRing} text={c.noNotifications} />
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <NotificationCard key={n.id} notif={n} lang={language} />
                    ))}
                  </div>
                )}
                {notifCursor && !notifLoading && (
                  <div className="flex justify-center py-3">
                    <button type="button" onClick={() => {
                      fetchNotificationLog({ cursor: notifCursor, limit: 50 }).then((res) => {
                        setNotifications((prev) => [...prev, ...res.data]);
                        setNotifCursor(res.nextCursor);
                      });
                    }} className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                      {c.loadMore}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Edge case: nothing active (shouldn't happen, but fallback) */}
            {!showTimeline && !showContactsSection && !showNotifications && !showEmails && (
              <EmptyState icon={MessageSquare} text={c.noMessages} />
            )}
          </div>
        )}

        {/* Load more */}
        {nextCursor && !loading && (
          <div className="flex justify-center py-4">
            <button type="button" onClick={handleLoadMore} disabled={loadingMore}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50">
              {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {c.loadMore}
            </button>
          </div>
        )}
      </div>

      {/* Add call modal */}
      {showAddModal && (
        <AddCallModal c={c} isRtl={isRtl} onClose={() => setShowAddModal(false)} onSave={handleAddCall} />
      )}

      {/* Send email modal */}
      {showSendEmail && (
        <SendEmailModal
          onClose={() => setShowSendEmail(false)}
          onSent={reloadEmails}
        />
      )}

      {/* Email detail panel */}
      {selectedEmail && (
        <EmailDetailPanel
          emailSend={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <Icon className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
