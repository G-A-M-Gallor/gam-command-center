"use client";

import { Circle, Wifi, WifiOff } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { useTeamPresence } from "@/hooks/useTeamPresence";
import type { WidgetSize } from "./WidgetRegistry";

type LangKey = "he" | "en" | "ru";

interface TeamMemberStatus {
  id: string;
  name: string;
  role: Record<LangKey, string>;
  status: "online" | "busy" | "away" | "offline";
  activity?: Record<LangKey, string>;
}

// Demo data moved to useTeamPresence hook

const STATUS_COLORS: Record<string, string> = {
  online: "text-emerald-400",
  busy: "text-red-400",
  away: "text-amber-400",
  offline: "text-slate-600",
};

const STATUS_LABELS: Record<string, Record<LangKey, string>> = {
  online: { he: "מחובר", en: "Online", ru: "Онлайн" },
  busy: { he: "עסוק", en: "Busy", ru: "Занят" },
  away: { he: "לא זמין", en: "Away", ru: "Отошёл" },
  offline: { he: "לא מחובר", en: "Offline", ru: "Оффлайн" },
};

export function TeamPanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const { team, isConnected, error } = useTeamPresence();

  const onlineCount = team.filter((m) => m.status === "online" || m.status === "busy").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {_t.widgets.teamTitle}
          </span>
          {isConnected ? (
            <Wifi size={10} className="text-emerald-400" />
          ) : (
            <div title={error || "Using demo data"}>
              <WifiOff size={10} className="text-amber-400" />
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-500">
          {onlineCount}/{team.length} {t.widgets.teamOnline}
        </span>
      </div>

      <div className="space-y-1">
        {team.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-700/30"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {member.name[0]}
              </div>
              <Circle
                size={8}
                className={`absolute -bottom-0.5 -right-0.5 ${STATUS_COLORS[member.status]}`}
                fill="currentColor"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-200 truncate">{member.name}</span>
                <span className="text-[10px] text-slate-600">
                  {member.role[language]}
                </span>
              </div>
              {member.activity && (
                <p className="text-[11px] text-slate-500 truncate">
                  {member.activity[language]}
                </p>
              )}
            </div>
            <span className={`text-[10px] ${STATUS_COLORS[member.status]}`}>
              {STATUS_LABELS[member.status][language]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const { team } = useTeamPresence();

  if (size < 2) return null;

  const onlineCount = team.filter((m) => m.status === "online" || m.status === "busy").length;
  return (
    <span className="truncate text-xs text-slate-400">
      {onlineCount} {_t.widgets.teamBar}
    </span>
  );
}
