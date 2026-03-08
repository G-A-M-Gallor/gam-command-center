"use client";

import { useState, useEffect, useCallback } from "react";
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
  type: "status" | "mention" | "deadline" | "ai";
  title: { he: string; en: string; ru: string };
  timestamp: number;
  read: boolean;
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
};

const typeColors = {
  status: "text-amber-400",
  mention: "text-blue-400",
  deadline: "text-red-400",
  ai: "text-[var(--cc-accent-400)]",
};

export function NotificationsPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const { state: pushState, subscribe, unsubscribe } = usePushSubscription();
  const [pushLoading, setPushLoading] = useState(false);

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
            const Icon = typeIcons[n.type];
            return (
              <div
                key={n.id}
                className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <Icon
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${typeColors[n.type]}`}
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
