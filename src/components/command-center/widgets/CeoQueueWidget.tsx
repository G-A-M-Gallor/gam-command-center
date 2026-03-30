"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ListTodo,
  Zap,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Bell,
  History,
} from "lucide-react";
import type { WidgetSize } from "./WidgetRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface QueueCounts {
  total: number;
  immediate: number;
  inProgress: number;
  waiting: number;
  questions: number;
  forReview: number;
}

interface QueueItem {
  id: string;
  url: string;
  number: string;
  title: string;
  codeName: string;
  urgency: string;
  status: string;
  immediate: boolean;
  queueScore: number;
}

const NOTION_TABLE_URL =
  "https://www.notion.so/3218f27212f8810ebf87f25267047840";

const STORAGE_KEY = "cc-ceo-queue-seen";

function statusIcon(status: string) {
  if (status.includes("בתור")) return <Clock className="h-3 w-3 text-slate-400" />;
  if (status.includes("בעבודה")) return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
  if (status.includes("שאלה")) return <HelpCircle className="h-3 w-3 text-amber-400" />;
  if (status.includes("לבדיקת")) return <CheckCircle2 className="h-3 w-3 text-yellow-400" />;
  if (status.includes("חסום")) return <AlertCircle className="h-3 w-3 text-red-400" />;
  if (status.includes("לתיקון")) return <AlertCircle className="h-3 w-3 text-purple-400" />;
  return <Clock className="h-3 w-3 text-slate-500" />;
}

/** Track which item IDs the user has already seen */
function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markAllSeen(items: QueueItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map((i) => i.id)));
  } catch {
    // silent
  }
}

// ─── Panel ─────────────────────────────────────────

export function CeoQueuePanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const cq = (t as unknown as Record<string, Record<string, string>>).ceoQueue ?? {};
  const supabase = createClient();
  const isRtl = language === "he";

  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"queue" | "updates">("queue");
  const seenRef = useRef<Set<string>>(getSeenIds());

  const fetchQueue = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/ceo-intake", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const fetched: QueueItem[] = data.items?.slice(0, 12) ?? [];
      setItems(fetched);
      setCounts(data.counts ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Mark all as seen when panel opens
  useEffect(() => {
    if (items.length > 0) {
      markAllSeen(items);
      seenRef.current = new Set(items.map((i) => i.id));
    }
  }, [items]);

  const reviewItems = items.filter((i) => i.status.includes("לבדיקת"));
  const questionItems = items.filter((i) => i.status.includes("שאלה"));
  const needsAttention = [...reviewItems, ...questionItems];
  const queueItems = items.filter(
    (i) => !i.status.includes("לבדיקת") && !i.status.includes("שאלה"),
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-cc-id="widget.ceo-queue.panel"
      className="w-80 max-h-[480px] overflow-y-auto"
    >
      {/* Header counts */}
      {counts && (
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-700/50">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-100">
              {counts.waiting}
            </div>
            <div className="text-[10px] text-slate-500">
              {cq.waiting || "Waiting"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {counts.inProgress}
            </div>
            <div className="text-[10px] text-slate-500">
              {cq.inProgress || "In Progress"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {counts.forReview}
            </div>
            <div className="text-[10px] text-slate-500">
              {cq.forReview || "For Review"}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setTab("queue")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors ${
            tab === "queue"
              ? "text-slate-200 border-b-2 border-blue-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <ListTodo className="h-3 w-3" />
          {cq.queueTab || "Queue"}
        </button>
        <button
          onClick={() => setTab("updates")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors ${
            tab === "updates"
              ? "text-slate-200 border-b-2 border-yellow-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Bell className="h-3 w-3" />
          {cq.updatesTab || "Updates"}
          {needsAttention.length > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-500 px-1 text-[9px] font-bold text-black">
              {needsAttention.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="p-2">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        )}

        {!loading && tab === "updates" && (
          <>
            {needsAttention.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                {cq.noUpdates || "No pending updates"}
              </div>
            ) : (
              <>
                {reviewItems.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" />
                      {cq.readyForReview || "Ready for your review"}
                    </div>
                    {reviewItems.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
                {questionItems.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                      <HelpCircle className="h-3 w-3" />
                      {cq.questionsForYou || "Claude has questions"}
                    </div>
                    {questionItems.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!loading && tab === "queue" && (
          <>
            {queueItems.length === 0 && needsAttention.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                {cq.empty || "Queue is empty"}
              </div>
            )}
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-2 flex gap-1">
        <a
          href={NOTION_TABLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
        >
          <ExternalLink className="h-3 w-3" />
          {cq.openInNotion || "Open in Notion"}
        </a>
        <a
          href={NOTION_TABLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
        >
          <History className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: QueueItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors hover:bg-slate-800/60"
    >
      <div className="mt-0.5">{statusIcon(item.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {item.immediate && (
            <Zap className="h-3 w-3 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-200 truncate">
            {item.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">
            {item.number} · {item.status}
          </span>
          {item.codeName && (
            <span className="text-[9px] text-purple-400/80 font-mono truncate">
              {item.codeName}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ─── Bar Content ───────────────────────────────────

export function CeoQueueBarContent({ size }: { size: WidgetSize }) {
  const supabase = createClient();
  const [count, setCount] = useState(0);
  const [urgent, setUrgent] = useState(0);
  const [forReview, setForReview] = useState(0);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetch_() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch("/api/ceo-intake", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        if (mounted) {
          const newTotal = data.counts?.total ?? 0;
          const newReview = data.counts?.forReview ?? 0;
          setCount(newTotal);
          setUrgent(data.counts?.immediate ?? 0);
          setForReview(newReview);

          // Detect new items needing attention
          const seen = getSeenIds();
          const currentIds: string[] = (data.items ?? []).map((i: { id: string }) => i.id);
          const hasUnseen = currentIds.some((id: string) => !seen.has(id));
          setHasNew(hasUnseen || newReview > 0);
        }
      } catch {
        // silent
      }
    }

    fetch_();
    const interval = setInterval(fetch_, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [supabase]);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <ListTodo className="h-4 w-4" />
        {count > 0 && (
          <span
            className={`absolute -top-1.5 -end-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white ${
              urgent > 0 ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {count}
          </span>
        )}
      </div>
      {size >= 2 && (
        <span className="text-xs text-slate-400">CEO</span>
      )}
      {hasNew && forReview > 0 && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-500 px-1 text-[9px] font-bold text-black animate-pulse">
          {forReview}
        </span>
      )}
    </div>
  );
}
