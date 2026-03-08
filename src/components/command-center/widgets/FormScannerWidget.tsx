"use client";

import { useState, useEffect } from "react";
import { FileScan, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { timeAgo } from "@/lib/utils/timeAgo";
import type { WidgetSize } from "./WidgetRegistry";

interface ScannedDocument {
  id: string;
  name: string;
  type: string;
  status: "verified" | "needs-review" | "processing";
  timestamp: number;
}

const SCAN_STATUS: Record<string, { icon: typeof CheckCircle2; color: string; label: { he: string; en: string } }> = {
  verified: { icon: CheckCircle2, color: "text-emerald-400", label: { he: "מאומת", en: "Verified" } },
  "needs-review": { icon: AlertTriangle, color: "text-amber-400", label: { he: "דורש בדיקה", en: "Needs Review" } },
  processing: { icon: Clock, color: "text-blue-400", label: { he: "מעבד", en: "Processing" } },
};

function createDemoScans(): ScannedDocument[] {
  return [
    { id: "1", name: "תעודת זהות — אבי כהן", type: "ID", status: "verified", timestamp: Date.now() - 3600000 },
    { id: "2", name: "אישור קבלן רשום", type: "License", status: "needs-review", timestamp: Date.now() - 7200000 },
    { id: "3", name: "פוליסת ביטוח 2026", type: "Insurance", status: "processing", timestamp: Date.now() - 10800000 },
  ];
}

export function FormScannerPanel() {
  const { language } = useSettings();
  const isHe = language === "he";
  const [scans, setScans] = useState<ScannedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real scanning API when available
    const timer = setTimeout(() => {
      setScans(createDemoScans());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const reviewCount = scans.filter((s) => s.status === "needs-review").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {isHe ? "סריקות" : "Scans"}
        </span>
        {reviewCount > 0 && (
          <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-medium text-amber-400">
            {reviewCount} {isHe ? "לבדיקה" : "to review"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <RefreshCw size={12} className="animate-spin" />
          {isHe ? "טוען..." : "Loading..."}
        </div>
      ) : scans.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {isHe ? "אין סריקות אחרונות" : "No recent scans"}
        </p>
      ) : (
        <div className="space-y-1">
          {scans.map((scan) => {
            const cfg = SCAN_STATUS[scan.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={scan.id}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30"
              >
                <StatusIcon size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-200 truncate">{scan.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(scan.timestamp, language)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-slate-700/50 px-1 text-[10px] text-slate-400">{scan.type}</span>
                    <span className={`text-[10px] ${cfg.color}`}>
                      {cfg.label[isHe ? "he" : "en"]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FormScannerBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      {language === "he" ? "סורק" : "Scanner"}
    </span>
  );
}
