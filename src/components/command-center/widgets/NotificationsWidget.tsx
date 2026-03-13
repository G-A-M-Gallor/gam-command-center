"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AtSign,
  Clock,
  Sparkles,
  Check,
  CheckCheck,
  BellRing,
  BellOff,
  Loader2,
  FileText,
  MessageCircle,
  Phone,
  Mail,
  StickyNote,
  AlarmClock,
  RefreshCw,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { usePushSubscription } from "@/lib/pwa/usePushSubscription";
import { updateAppBadge } from "@/lib/pwa/badge";
import type { WidgetSize } from "./WidgetRegistry";

const STORAGE_KEY = "cc-notifications";
const EVENT_NAME = "notifications-change";

interface NotificationItem {
  id: string;
  type: "status" | "mention" | "deadline" | "ai" | "entity";
  title: { he: string; en: string; ru: string };
  timestamp: number;
  read: boolean;
  actionUrl?: string | null;
}

function loadNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(items: NotificationItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** Try to persist to Supabase (fire-and-forget) */
function persistToServer(detail: { type: string; titleHe: string; titleEn: string; titleRu?: string }) {
  fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(detail),
  }).catch(() => { /* localStorage fallback is fine */ });
}

/** Push a notification from anywhere: window.dispatchEvent(new CustomEvent("cc-notify", { detail })) */
function pushNotification(detail: { type: NotificationItem["type"]; titleHe: string; titleEn: string; titleRu?: string }) {
  const items = loadNotifications();
  const newItem: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: detail.type,
    title: { he: detail.titleHe, en: detail.titleEn, ru: detail.titleRu || detail.titleEn },
    timestamp: Date.now(),
    read: false,
  };
  const updated = [newItem, ...items].slice(0, 50);
  saveNotifications(updated);
  persistToServer(detail);
}

// Global listener — install once (flag on window to survive HMR)
if (typeof window !== "undefined" && !(window as unknown as Record<string, unknown>).__ccNotifyInstalled) {
  window.addEventListener("cc-notify", ((e: CustomEvent) => {
    if (e.detail) pushNotification(e.detail);
  }) as EventListener);
  (window as unknown as Record<string, unknown>).__ccNotifyInstalled = true;
}

function timeAgo(timestamp: number, lang: "he" | "en" | "ru"): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return lang === "he" ? "עכשיו" : lang === "ru" ? "Сейчас" : "Just now";
  if (minutes < 60)
    return lang === "he" ? `לפני ${minutes} דק'` : lang === "ru" ? `${minutes} мин. назад` : `${minutes}m ago`;
  if (hours < 24)
    return lang === "he" ? `לפני ${hours} שע'` : lang === "ru" ? `${hours} ч. назад` : `${hours}h ago`;
  return lang === "he" ? `לפני ${days} ימים` : lang === "ru" ? `${days} дн. назад` : `${days}d ago`;
}

const typeIcons = {
  status: AlertTriangle,
  mention: AtSign,
  deadline: Clock,
  ai: Sparkles,
  entity: FileText,
};

const typeColors = {
  status: "text-amber-400",
  mention: "text-blue-400",
  deadline: "text-red-400",
  ai: "text-[var(--cc-accent-400)]",
  entity: "text-purple-400",
};

type NotifPreferences = Record<string, boolean>;

const PREF_CHANNELS = [
  { key: "whatsapp", icon: MessageCircle, color: "text-green-400" },
  { key: "phone", icon: Phone, color: "text-blue-400" },
  { key: "sms", icon: MessageSquare, color: "text-cyan-400" },
  { key: "email", icon: Mail, color: "text-amber-400" },
  { key: "note", icon: StickyNote, color: "text-purple-400" },
  { key: "reminder", icon: AlarmClock, color: "text-red-400" },
  { key: "sync_summary", icon: RefreshCw, color: "text-slate-400" },
] as const;

export function NotificationsPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const { state: pushState, subscribe, unsubscribe } = usePushSubscription();
  const [pushLoading, setPushLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotifPreferences>({});
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Load preferences when push is subscribed
  useEffect(() => {
    if (pushState !== "subscribed") return;
    fetch("/api/push/preferences")
      .then((r) => r.json())
      .then((d) => { if (d.preferences) setPrefs(d.preferences); })
      .catch(() => {});
  }, [pushState]);

  const togglePref = useCallback(async (key: string) => {
    const current = prefs[key] !== false; // undefined/true = on
    const updated = { ...prefs, [key]: !current };
    setPrefs(updated);
    setPrefsSaving(true);
    try {
      await fetch("/api/push/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !current }),
      });
    } catch { /* revert on failure */ setPrefs(prefs); }
    setPrefsSaving(false);
  }, [prefs]);

  const handlePushToggle = useCallback(async () => {
    setPushLoading(true);
    if (pushState === "subscribed") {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setPushLoading(false);
  }, [pushState, subscribe, unsubscribe]);

  // Update app badge when unread count changes
  useEffect(() => {
    const unread = items.filter((n) => !n.read).length;
    updateAppBadge(unread);
  }, [items]);

  useEffect(() => {
    // Load from localStorage first (instant)
    setItems(loadNotifications());

    // Then try to load from server and merge
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.persisted && data.notifications?.length > 0) {
          const local = loadNotifications();
          const localIds = new Set(local.map((n) => n.id));
          const serverItems: NotificationItem[] = data.notifications.filter(
            (n: NotificationItem) => !localIds.has(n.id)
          );
          if (serverItems.length > 0) {
            const merged = [...local, ...serverItems]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 50);
            saveNotifications(merged);
            setItems(merged);
          }
        }
      })
      .catch(() => { /* localStorage data is fine */ });

    const sync = () => setItems(loadNotifications());
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  // Supabase Realtime subscription for live notifications
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    import("@/lib/supabaseClient").then(({ supabase }) => {
      channel = supabase
        .channel("notifications-realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "dashboard_notifications" },
          (payload: { new: Record<string, unknown> }) => {
            const n = payload.new;
            const newItem: NotificationItem = {
              id: n.id as string,
              type: (n.notification_type as NotificationItem["type"]) || "status",
              title: {
                he: (n.title_he || n.title) as string,
                en: n.title as string,
                ru: (n.title_ru || n.title) as string,
              },
              timestamp: new Date(n.created_at as string).getTime(),
              read: false,
              actionUrl: (n.action_url as string) || null,
            };
            const current = loadNotifications();
            if (!current.some(i => i.id === newItem.id)) {
              const updated = [newItem, ...current].slice(0, 50);
              saveNotifications(updated);
              setItems(updated);
            }
          }
        )
        .subscribe();
    }).catch(() => {});
    return () => {
      if (channel) {
        import("@/lib/supabaseClient").then(({ supabase }) => {
          supabase.removeChannel(channel);
        }).catch(() => {});
      }
    };
  }, []);

  const markRead = useCallback(
    (id: string) => {
      const updated = items.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      setItems(updated);
      saveNotifications(updated);
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    },
    [items]
  );

  const markAllRead = useCallback(() => {
    const updated = items.map((n) => ({ ...n, read: true }));
    setItems(updated);
    saveNotifications(updated);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {});
  }, [items]);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-2">
      {/* Push notification toggle */}
      {pushState !== "unsupported" && (
        <div className="flex items-center justify-between rounded-lg bg-slate-700/30 px-2.5 py-2">
          <span className="text-xs text-slate-400">
            {pushState === "denied"
              ? t.pwa.pushBlocked
              : pushState === "subscribed"
                ? t.pwa.pushEnabled
                : t.pwa.pushEnable}
          </span>
          <button
            type="button"
            onClick={handlePushToggle}
            disabled={pushLoading || pushState === "denied"}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-slate-600/50 disabled:opacity-40"
          >
            {pushLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            ) : pushState === "subscribed" ? (
              <BellOff className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <BellRing className="h-3.5 w-3.5 text-[var(--cc-accent-400)]" />
            )}
          </button>
        </div>
      )}

      {/* Notification preferences */}
      {pushState === "subscribed" && (
        <div className="rounded-lg bg-slate-700/20">
          <button
            type="button"
            onClick={() => setPrefsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-2.5 py-2 text-xs text-slate-400 transition-colors hover:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              {t.pwa.notifPreferences}
            </span>
            {prefsSaving && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
          </button>
          {prefsOpen && (
            <div className="space-y-0.5 px-2.5 pb-2">
              {PREF_CHANNELS.map(({ key, icon: Icon, color }) => {
                const isOn = prefs[key] !== false;
                const label = t.pwa[`notif${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof t.pwa] || key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePref(key)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors hover:bg-slate-600/30"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${isOn ? color : "text-slate-600"}`} />
                      <span className={isOn ? "text-slate-300" : "text-slate-500"}>{label}</span>
                    </span>
                    <span className={`h-4 w-7 rounded-full transition-colors ${isOn ? "bg-[var(--cc-accent-500)]" : "bg-slate-600"} relative`}>
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${isOn ? "left-3.5" : "left-0.5"}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {unreadCount} {t.widgets.unread}
          </span>
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--cc-accent-400)] transition-colors hover:bg-slate-700/50"
          >
            <CheckCheck className="h-3 w-3" />
            {t.widgets.markAllRead}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {t.widgets.noNotifications}
        </p>
      ) : (
        <div className="space-y-0.5">
          {items.map((n) => {
            const Icon = typeIcons[n.type] ?? AlertTriangle;
            const handleClick = () => {
              if (n.actionUrl) {
                if (!n.read) markRead(n.id);
                router.push(n.actionUrl);
              }
            };
            return (
              <div
                key={n.id}
                onClick={handleClick}
                className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30 ${
                  n.read ? "opacity-60" : ""
                } ${n.actionUrl ? "cursor-pointer" : ""}`}
              >
                <Icon
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${typeColors[n.type] ?? "text-slate-400"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight text-slate-300">
                    {n.title[language]}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {timeAgo(n.timestamp, language)}
                  </span>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded p-1 text-slate-600 transition-colors hover:bg-slate-700 hover:text-slate-400"
                    aria-label={t.widgets.markAllRead}
                    title={t.widgets.markAllRead}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NotificationsBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const [, setTick] = useState(0);

  useEffect(() => {
    function sync() {
      setTick((n) => n + 1);
    }
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  const items = loadNotifications();
  const unread = items.filter((n) => !n.read).length;

  if (size < 2) {
    if (unread === 0) return null;
    return (
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
    );
  }

  if (size === 2) {
    if (unread === 0) return null;
    return (
      <span className="rounded-full bg-red-500/20 px-1.5 text-xs font-medium text-red-400">
        {unread}
      </span>
    );
  }

  if (size === 3) {
    const latest = items.find((n) => !n.read);
    return (
      <span className="truncate text-xs text-slate-400">
        {unread > 0 && (
          <span className="mr-1.5 rounded-full bg-red-500/20 px-1.5 text-red-400">
            {unread}
          </span>
        )}
        {latest ? latest.title[language].slice(0, 25) + "..." : ""}
      </span>
    );
  }

  const top2 = items.filter((n) => !n.read).slice(0, 2);
  if (top2.length === 0) {
    return (
      <span className="truncate text-xs text-slate-500">
        {language === "he" ? "אין חדשות" : language === "ru" ? "Всё в порядке" : "All clear"}
      </span>
    );
  }
  return (
    <div className="flex min-w-0 flex-col">
      {top2.map((n) => (
        <span key={n.id} className="truncate text-[10px] text-slate-400">
          {n.title[language].slice(0, 30)}
          {n.title[language].length > 30 ? "..." : ""}
        </span>
      ))}
    </div>
  );
}
