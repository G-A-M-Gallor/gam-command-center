"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ListTodo,
  Zap,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
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
  urgency: string;
  status: string;
  immediate: boolean;
  queueScore: number;
}

const NOTION_TABLE_URL =
  "https://www.notion.so/3218f27212f8810ebf87f25267047840";

function statusIcon(status: string) {
  if (status.includes("בתור")) return <Clock className="h-3 w-3 text-slate-400" />;
  if (status.includes("בעבודה")) return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
  if (status.includes("שאלה")) return <HelpCircle className="h-3 w-3 text-amber-400" />;
  if (status.includes("לבדיקת")) return <CheckCircle2 className="h-3 w-3 text-yellow-400" />;
  if (status.includes("חסום")) return <AlertCircle className="h-3 w-3 text-red-400" />;
  if (status.includes("לתיקון")) return <AlertCircle className="h-3 w-3 text-purple-400" />;
  return <Clock className="h-3 w-3 text-slate-500" />;
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
      setItems(data.items?.slice(0, 8) ?? []);
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

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-cc-id="widget.ceo-queue.panel"
      className="w-80 max-h-[420px] overflow-y-auto"
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

      {/* Items */}
      <div className="p-2">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-500">
            {cq.empty || "Queue is empty"}
          </div>
        )}

        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors hover:bg-slate-800/60"
          >
            {statusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {item.immediate && (
                  <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                )}
                <span className="text-xs font-medium text-slate-200 truncate">
                  {item.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {item.number} · {item.status}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-2">
        <a
          href={NOTION_TABLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
        >
          <ExternalLink className="h-3 w-3" />
          {cq.openInNotion || "Open in Notion"}
        </a>
      </div>
    </div>
  );
}

// ─── Bar Content ───────────────────────────────────

export function CeoQueueBarContent({ size }: { size: WidgetSize }) {
  const supabase = createClient();
  const [count, setCount] = useState(0);
  const [urgent, setUrgent] = useState(0);

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
          setCount(data.counts?.total ?? 0);
          setUrgent(data.counts?.immediate ?? 0);
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
    </div>
  );
}
