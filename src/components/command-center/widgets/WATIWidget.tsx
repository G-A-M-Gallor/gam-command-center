"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { timeAgo } from "@/lib/utils/timeAgo";
import { supabase } from "@/lib/supabaseClient";
import type { WidgetSize } from "./WidgetRegistry";
import type { CommMessage } from "@/lib/wati/types";

export function WATIPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const watiUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WATI_URL : null;

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("comm_messages")
          .select("*")
          .eq("channel", "whatsapp")
          .order("created_at", { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          setMessages(data as CommMessage[]);
        } else {
          // Fallback to demo data when table is empty or doesn't exist
          setMessages(createDemoMessages());
        }
      } catch {
        setMessages(createDemoMessages());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOpenPanel = useCallback((msg: CommMessage) => {
    window.dispatchEvent(
      new CustomEvent("cc-open-comms-panel", {
        detail: {
          entityId: msg.entity_id,
          entityName: msg.sender_name ?? msg.entity_phone ?? "WhatsApp",
          phone: msg.entity_phone,
        },
      }),
    );
  }, []);

  const unread = messages.filter((m) => !m.is_read && m.direction !== "outbound").length;

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
          {t.common.loading}
        </div>
      ) : messages.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {t.widgets.watiNoMessages}
        </p>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <button
              key={msg.id ?? msg.external_id}
              type="button"
              onClick={() => handleOpenPanel(msg)}
              className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-slate-700/30 ${
                msg.is_read ? "opacity-60" : ""
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle size={13} className="text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {msg.sender_name ?? msg.entity_phone ?? "WhatsApp"}
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {timeAgo(new Date(msg.created_at ?? Date.now()).getTime(), language)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{msg.body}</p>
              </div>
              {!msg.is_read && msg.direction === "inbound" && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}

      {!watiUrl && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
          {t.widgets.watiConfigNote}
        </div>
      )}
    </div>
  );
}

export function WATIBarContent({ size }: { size: WidgetSize }) {
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      WhatsApp
    </span>
  );
}

// Demo data fallback when comm_messages is empty
function createDemoMessages(): CommMessage[] {
  return [
    {
      id: "demo-1",
      entity_id: null,
      entity_phone: "972501234567",
      channel: "whatsapp",
      direction: "inbound",
      sender_name: "אבי כהן",
      body: "שלום, אשמח לקבל עדכון על הפרויקט",
      channel_meta: {},
      session_id: null,
      external_id: "demo-1",
      is_read: false,
      provider: "wati",
      message_type: "regular",
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "demo-2",
      entity_id: null,
      entity_phone: "972521234567",
      channel: "whatsapp",
      direction: "inbound",
      sender_name: "מיכל לוי",
      body: "תודה, קיבלתי את המסמכים",
      channel_meta: {},
      session_id: null,
      external_id: "demo-2",
      is_read: false,
      provider: "wati",
      message_type: "regular",
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "demo-3",
      entity_id: null,
      entity_phone: "972531234567",
      channel: "whatsapp",
      direction: "inbound",
      sender_name: "יוסי דהן",
      body: "מתי הפגישה הבאה?",
      channel_meta: {},
      session_id: null,
      external_id: "demo-3",
      is_read: true,
      provider: "wati",
      message_type: "regular",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
}
