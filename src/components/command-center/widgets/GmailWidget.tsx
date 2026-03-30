'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inbox, ExternalLink, Loader2, Settings, ChevronDown } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import type { WidgetSize } from './WidgetRegistry';

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface GoogleAccount {
  id: string;
  google_email: string;
  display_name: string | null;
  scopes: string[];
  is_active: boolean;
}

function formatFrom(from: string): string {
  // "John Doe <john@example.com>" → "John Doe"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split('@')[0];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function GmailPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const g = t.gmail as Record<string, string>;

  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Load accounts
  useEffect(() => {
    fetch('/api/google/accounts')
      .then((r) => r.json())
      .then((data) => {
        const active = (data.accounts || []).filter(
          (a: GoogleAccount) => a.is_active && a.scopes?.includes('https://www.googleapis.com/auth/gmail.readonly')
        );
        setAccounts(active);
        if (active.length > 0 && !selectedAccountId) {
          setSelectedAccountId(active[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Load messages when account selected
  const loadMessages = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/google/gmail?account_id=${selectedAccountId}&limit=10`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // No accounts connected
  if (!loading && accounts.length === 0) {
    return (
      <div className="w-80 p-4" data-cc-id="widget.gmail.panel">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Inbox className="h-8 w-8 text-slate-600" />
          <p className="text-xs text-slate-500">{g.noAccount}</p>
          <a
            href="/dashboard/settings"
            className="flex items-center gap-1 text-xs text-purple-400 transition-colors hover:text-purple-300"
          >
            <Settings className="h-3 w-3" />
            {g.connectAccount}
          </a>
        </div>
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="w-80 p-3" data-cc-id="widget.gmail.panel">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-300">{g.inbox}</h3>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountPicker(!showAccountPicker)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
              >
                {selectedAccount?.google_email?.split('@')[0]}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showAccountPicker && (
                <div className="absolute end-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-white/[0.06] bg-slate-800 p-1 shadow-xl">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setShowAccountPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-[11px] transition-colors hover:bg-white/[0.05] ${
                        acc.id === selectedAccountId ? 'text-purple-400' : 'text-slate-400'
                      }`}
                    >
                      <Inbox className="h-3 w-3 shrink-0" />
                      {acc.google_email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-slate-600" />}
        </div>
      </div>

      {/* Messages */}
      {messages.length === 0 && !loading ? (
        <p className="py-6 text-center text-xs text-slate-600">{g.noMessages}</p>
      ) : (
        <div className="space-y-0.5">
          {messages.map((msg) => (
            <a
              key={msg.id}
              href={`https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`truncate text-[11px] ${
                      msg.isUnread ? 'font-semibold text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {formatFrom(msg.from)}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {timeAgo(msg.date)}
                  </span>
                </div>
                <div
                  className={`truncate text-[11px] ${
                    msg.isUnread ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {msg.subject}
                </div>
                <div className="truncate text-[10px] text-slate-600">{msg.snippet}</div>
              </div>
              {msg.isUnread && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
              )}
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <a
        href="https://mail.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-1.5 text-[11px] text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
      >
        <ExternalLink className="h-3 w-3" />
        {g.openInGmail}
      </a>
    </div>
  );
}

export function GmailBarContent({ size }: { size: WidgetSize }) {
  const [unread, setUnread] = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    // Find first active gmail account
    fetch('/api/google/accounts')
      .then((r) => r.json())
      .then((data) => {
        const acc = (data.accounts || []).find(
          (a: GoogleAccount) =>
            a.is_active && a.scopes?.includes('https://www.googleapis.com/auth/gmail.readonly')
        );
        if (acc) setAccountId(acc.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!accountId) return;

    const fetchUnread = () => {
      fetch(`/api/google/gmail?account_id=${accountId}&limit=20`)
        .then((r) => r.json())
        .then((data) => {
          const count = (data.messages || []).filter((m: GmailMessage) => m.isUnread).length;
          setUnread(count);
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accountId]);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Inbox className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -end-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>
      {size >= 2 && (
        <span className="text-xs text-slate-400">Gmail</span>
      )}
    </div>
  );
}
