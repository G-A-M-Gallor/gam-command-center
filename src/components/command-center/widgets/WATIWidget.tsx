"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { timeAgo } from "@/lib/utils/timeAgo";
import type { WidgetSize } from "./WidgetRegistry";

interface WATIMessage {
  id: string;
  name: string;
  preview: string;
  timestamp: number;
  unread: boolean;
}

function createDemoMessages(): WATIMessage[] {
  return [
    { id: "1", name: "אבי כהן", preview: "שלום, אשמח לקבל עדכון על הפרויקט", timestamp: Date.now() - 300000, unread: true },
    { id: "2", name: "מיכל לוי", preview: "תודה, קיבלתי את המסמכים", timestamp: Date.now() - 1800000, unread: true },
    { id: "3", name: "יוסי דהן", preview: "מתי הפגישה הבאה?", timestamp: Date.now() - 7200000, unread: false },
  ];
}

export function WATIPanel() {
  const { language } = useSettings();
  const isHe = language === "he";
  const [messages, setMessages] = useState<WATIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const watiUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WATI_URL : null;

  useEffect(() => {
    // TODO: Replace with real WATI API when configured
    const timer = setTimeout(() => {
      setMessages(createDemoMessages());
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const unread = messages.filter((m) => m.unread).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          WhatsApp
        </span>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="rounded-full bg-green-500/20 px-1.5 text-[10px] font-medium text-green-400">
              {unread}
            </span>
          )}
          {watiUrl && (
            <a
              href={watiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <RefreshCw size={12} className="animate-spin" />
          {isHe ? "טוען..." : "Loading..."}
        </div>
      ) : messages.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {isHe ? "אין הודעות חדשות" : "No new messages"}
        </p>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30 ${
                msg.unread ? "" : "opacity-60"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle size={13} className="text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">{msg.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(msg.timestamp, language)}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{msg.preview}</p>
              </div>
              {msg.unread && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}

      {!watiUrl && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
          {isHe ? "הגדר NEXT_PUBLIC_WATI_URL לחיבור חי" : "Set NEXT_PUBLIC_WATI_URL for live connection"}
        </div>
      )}
    </div>
  );
}

export function WATIBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      WhatsApp
    </span>
  );
}
