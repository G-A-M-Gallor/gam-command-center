"use client";

import { useState, useEffect } from "react";
import { Users, Circle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import type { WidgetSize } from "./WidgetRegistry";

interface TeamMemberStatus {
  id: string;
  name: string;
  role: { he: string; en: string };
  status: "online" | "busy" | "away" | "offline";
  activity?: { he: string; en: string };
}

const DEMO_TEAM: TeamMemberStatus[] = [
  { id: "1", name: "גל", role: { he: "מנהל פרויקטים", en: "Project Manager" }, status: "online", activity: { he: "עובד על vBrain.io", en: "Working on vBrain.io" } },
  { id: "2", name: "חני", role: { he: "מנהלת תפעול", en: "Operations Manager" }, status: "online", activity: { he: "סקירת לקוחות", en: "Client review" } },
  { id: "3", name: "יואב", role: { he: "מפתח", en: "Developer" }, status: "busy", activity: { he: "פגישה", en: "In a meeting" } },
  { id: "4", name: "נועה", role: { he: "עיצוב", en: "Design" }, status: "away" },
  { id: "5", name: "רון", role: { he: "מכירות", en: "Sales" }, status: "offline" },
];

const STATUS_COLORS: Record<string, string> = {
  online: "text-emerald-400",
  busy: "text-red-400",
  away: "text-amber-400",
  offline: "text-slate-600",
};

const STATUS_LABELS: Record<string, { he: string; en: string }> = {
  online: { he: "מחובר", en: "Online" },
  busy: { he: "עסוק", en: "Busy" },
  away: { he: "לא זמין", en: "Away" },
  offline: { he: "לא מחובר", en: "Offline" },
};

export function TeamPanel() {
  const { language } = useSettings();
  const isHe = language === "he";
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);

  useEffect(() => {
    // TODO: Replace with Supabase Realtime presence when available
    setTeam(DEMO_TEAM);
  }, []);

  const onlineCount = team.filter((m) => m.status === "online" || m.status === "busy").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {isHe ? "צוות" : "Team"}
        </span>
        <span className="text-[10px] text-slate-500">
          {onlineCount}/{team.length} {isHe ? "מחוברים" : "online"}
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
                  {member.role[isHe ? "he" : "en"]}
                </span>
              </div>
              {member.activity && (
                <p className="text-[11px] text-slate-500 truncate">
                  {member.activity[isHe ? "he" : "en"]}
                </p>
              )}
            </div>
            <span className={`text-[10px] ${STATUS_COLORS[member.status]}`}>
              {STATUS_LABELS[member.status][isHe ? "he" : "en"]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  if (size < 2) return null;

  const onlineCount = DEMO_TEAM.filter((m) => m.status === "online" || m.status === "busy").length;
  return (
    <span className="truncate text-xs text-slate-400">
      {onlineCount} {language === "he" ? "מחוברים" : "online"}
    </span>
  );
}
