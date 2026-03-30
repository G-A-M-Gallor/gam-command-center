"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  _X,
  Pin,
  PinOff,
  MessageCircle,
  Phone,
  Mail,
  StickyNote,
  Bell,
  Send,
  ChevronDown,
  Loader2,
  FileText,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { fetchCommMessages } from "@/lib/supabase/commQueries";
import {
  subscribeToCommMessagesByEntity,
  unsubscribeFromCommMessages,
} from "@/lib/supabase/commRealtime";
import type { CommMessage, ChannelFilter } from "@/lib/wati/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Channel Icons ──────────────────────────────────

const channelIcons: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  note: StickyNote,
  reminder: Bell,
};

const channelColors: Record<string, string> = {
  whatsapp: "text-green-400",
  phone: "text-blue-400",
  email: "text-amber-400",
  note: "text-slate-400",
  reminder: "text-purple-400",
};

// ─── Date Helpers ───────────────────────────────────

function formatMessageDate(dateStr: string, lang: "he" | "en" | "ru"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return lang === "he" ? "היום" : lang === "ru" ? "Сегодня" : "Today";
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return lang === "he" ? "אתמול" : lang === "ru" ? "Вчера" : "Yesterday";
  }
  return date.toLocaleDateString(lang === "he" ? "he-IL" : lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ─── Types ──────────────────────────────────────────

interface PanelContext {
  entityId: string;
  entityName: string;
  phone?: string;
}

// ─── Main Component ─────────────────────────────────

export function CommunicationPanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);

  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [_context, setContext] = useState<PanelContext | null>(null);
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [composeText, setComposeText] = useState("");
  const [sending, setSending] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Listen for open events ─────────────────────────

  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent).detail as PanelContext;
      if (detail) {
        setContext(detail);
        setIsOpen(true);
        setMessages([]);
        setCursor(null);
        setChannelFilter("all");
      }
    }

    window.addEventListener("cc-open-comms-panel", handleOpen);
    return () => window.removeEventListener("cc-open-comms-panel", handleOpen);
  }, []);

  // ─── Fetch messages when context/filter changes ─────

  const loadMessages = useCallback(async (entityId: string, filter: ChannelFilter, cursorVal: string | null) => {
    setLoading(true);
    try {
      const result = await fetchCommMessages(entityId, { channel: filter }, cursorVal, 50);
      if (cursorVal) {
        setMessages((prev) => [...prev, ...result.data]);
      } else {
        setMessages(result.data);
      }
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch {
      // Silently handle — panel shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !_context) return;
    loadMessages(_context.entityId, channelFilter, null);
  }, [isOpen, _context, channelFilter, loadMessages]);

  // ─── Realtime subscription ──────────────────────────

  useEffect(() => {
    if (!isOpen || !_context) return;

    channelRef.current = subscribeToCommMessagesByEntity(_context.entityId, {
      onInsert: (msg) => {
        setMessages((prev) => [msg, ...prev]);
      },
      onUpdate: (msg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? msg : m)),
        );
      },
    });

    return () => {
      if (channelRef.current) {
        unsubscribeFromCommMessages(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isOpen, context]);

  // ─── Send message ──────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!composeText.trim() || !context?.phone) return;

    setSending(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) return;

      const res = await fetch("/api/comms/send", {
        method: "POST",
        _headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          phone: _context.phone,
          message: composeText.trim(),
          entity_id: context.entityId,
        }),
      });

      if (res.ok) {
        setComposeText("");
      }
    } catch {
      // Error handled silently — realtime will show the message if it went through
    } finally {
      setSending(false);
    }
  }, [composeText, context]);

  // ─── Load more ────────────────────────────────────

  const handleLoadMore = useCallback(() => {
    if (!_context || !cursor || loading) return;
    loadMessages(_context.entityId, channelFilter, cursor);
  }, [_context, cursor, loading, channelFilter, loadMessages]);

  // ─── Close ────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (!isPinned) setIsOpen(false);
  }, [isPinned]);

  if (!isOpen) return null;

  // ─── Channel tabs ─────────────────────────────────

  const channels: { key: ChannelFilter; label: string; icon: typeof MessageCircle }[] = [
    { key: "all", label: t.comms.allChannels, icon: MessageCircle },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "note", label: t.comms.notes, icon: StickyNote },
  ];

  // ─── Group messages by date ───────────────────────

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
  );

  const dateGroups: { date: string; label: string; messages: CommMessage[] }[] = [];
  let lastDateKey = "";
  for (const msg of sortedMessages) {
    const dk = getDateKey(msg.created_at ?? new Date().toISOString());
    if (dk !== lastDateKey) {
      dateGroups.push({
        date: dk,
        label: formatMessageDate(msg.created_at ?? new Date().toISOString(), language),
        messages: [],
      });
      lastDateKey = dk;
    }
    dateGroups[dateGroups.length - 1].messages.push(msg);
  }

  const isRtl = language === "he";

  return (
    <>
      {/* Backdrop */}
      {!isPinned && (
        <button
          type="button"
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/20"
          aria-label="Close panel"
        />
      )}

      {/* Panel */}
      <div
        data-cc-id="communication-panel"
        dir={isRtl ? "rtl" : "ltr"}
        className={`fixed top-0 z-50 flex h-full w-[400px] flex-col border-slate-700/50 bg-slate-900 shadow-2xl transition-transform duration-200 ${
          isRtl ? "left-0 border-e" : "right-0 border-s"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-slate-100">
              {context?.entityName ?? t.comms.title}
            </h2>
            {context?.phone && (
              <p className="text-xs text-slate-500" dir="ltr">{_context.phone}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
              title={isPinned ? t.comms.unpin : t.comms.pin}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Channel Filter Tabs */}
        <div className="flex gap-1 border-b border-slate-700/30 px-3 py-2">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const isActive = channelFilter === ch.key;
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => setChannelFilter(ch.key)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-300"
                }`}
              >
                <Icon size={12} />
                {ch.label}
              </button>
            );
          })}
        </div>

        {/* Message Timeline */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
          {/* Load more button */}
          {hasMore && (
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-slate-300"
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ChevronDown size={12} className="rotate-180" />
                )}
                {t.comms.loadMore}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle size={32} className="mb-3 text-slate-600" />
              <p className="text-sm text-slate-400">{_t.comms.noMessages}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-slate-500" />
            </div>
          )}

          {/* Messages grouped by date */}
          {dateGroups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-700/50" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-slate-700/50" />
              </div>

              {/* Messages */}
              {group.messages.map((msg) => {
                const ChannelIcon = channelIcons[msg.channel] ?? MessageCircle;
                const colorClass = channelColors[msg.channel] ?? "text-slate-400";
                const isOutbound = msg.direction === "outbound";
                const isInternal = msg.direction === "internal";

                return (
                  <div
                    key={msg.id ?? msg.external_id ?? msg.created_at}
                    className={`mb-2 flex gap-2 ${isOutbound ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar / icon */}
                    {!isOutbound && (
                      <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 ${colorClass}`}>
                        <ChannelIcon size={12} />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOutbound
                          ? "bg-purple-500/15 text-slate-200"
                          : isInternal
                            ? "bg-amber-500/10 text-slate-300"
                            : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {/* Sender name */}
                      {msg.sender_name && (
                        <p className="mb-0.5 text-[10px] font-medium text-slate-400">
                          {msg.sender_name}
                        </p>
                      )}
                      {/* Body */}
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">
                        {msg.body}
                      </p>
                      {/* Time + channel badge */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">
                          {formatTime(msg.created_at ?? new Date().toISOString())}
                        </span>
                        {msg.channel !== "whatsapp" && (
                          <span className={`text-[10px] ${colorClass}`}>
                            {msg.channel}
                          </span>
                        )}
                        {!msg.is_read && msg.direction === "inbound" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Compose Bar */}
        {context?.phone && (
          <div className="border-t border-slate-700/50 px-3 py-2">
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
                title={_t.comms.templates}
              >
                <FileText size={16} />
              </button>
              <div className="min-h-[36px] flex-1">
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t.comms.composePlaceholder}
                  rows={1}
                  className="w-full resize-none rounded-lg border border-slate-700/50 bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-purple-500/50"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={!composeText.trim() || sending}
                className="rounded-lg bg-purple-500/20 p-2 text-purple-300 transition-colors hover:bg-purple-500/30 disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
