"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";
import type { CommMessage } from "@/lib/wati/types";
import { supabase } from "@/lib/supabaseClient";

export function CommunicationWidgetPanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const [recentMessages, setRecentMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("comm_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentMessages((data ?? []) as CommMessage[]);
      } catch {
        // Table may not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unread = recentMessages.filter((m) => !m.is_read && m.direction === "inbound").length;

  const channelIcons: Record<string, typeof MessageCircle> = {
    whatsapp: MessageCircle,
    phone: Phone,
    email: Mail,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {_t.comms.title}
        </span>
        {unread > 0 && (
          <span className="rounded-full bg-purple-500/20 px-1.5 text-[10px] font-medium text-purple-400">
            {unread}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4 text-sm text-slate-500">
          {_t.common.loading}
        </div>
      ) : recentMessages.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {_t.comms.noMessages}
        </p>
      ) : (
        <div className="space-y-1">
          {recentMessages.map((msg) => {
            const Icon = channelIcons[msg.channel] ?? MessageCircle;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30 ${
                  msg.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                  <Icon size={13} className="text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">
                      {msg.sender_name ?? msg.entity_phone ?? msg.channel}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {msg.channel}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-400">{msg.body}</p>
                </div>
                {!msg.is_read && msg.direction === "inbound" && (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CommunicationBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      {_t.comms.title}
    </span>
  );
}
