"use client";

import { useState, useEffect } from "react";
import { FileCheck, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { timeAgo } from "@/lib/utils/timeAgo";
import type { WidgetSize } from "./WidgetRegistry";

interface FormSubmission {
  id: string;
  formName: string;
  submittedBy: string;
  status: "approved" | "pending" | "rejected";
  timestamp: number;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: { he: string; en: string } }> = {
  approved: { icon: CheckCircle2, color: "text-emerald-400", label: { he: "אושר", en: "Approved" } },
  pending: { icon: Clock, color: "text-amber-400", label: { he: "ממתין", en: "Pending" } },
  rejected: { icon: XCircle, color: "text-red-400", label: { he: "נדחה", en: "Rejected" } },
};

function createDemoSubmissions(): FormSubmission[] {
  return [
    { id: "1", formName: "טופס קליטת לקוח", submittedBy: "אבי כהן", status: "pending", timestamp: Date.now() - 1800000 },
    { id: "2", formName: "דוח בדיקה שבועי", submittedBy: "מיכל לוי", status: "approved", timestamp: Date.now() - 7200000 },
    { id: "3", formName: "אישור עבודה", submittedBy: "יוסי דהן", status: "approved", timestamp: Date.now() - 86400000 },
    { id: "4", formName: "דוח חריגות", submittedBy: "נועה בן-דוד", status: "rejected", timestamp: Date.now() - 172800000 },
  ];
}

export function FormSubmissionsPanel() {
  const { language } = useSettings();
  const isHe = language === "he";
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real Origami/Supabase API when available
    const timer = setTimeout(() => {
      setSubmissions(createDemoSubmissions());
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {isHe ? "הגשות" : "Submissions"}
        </span>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-medium text-amber-400">
            {pendingCount} {isHe ? "ממתינים" : "pending"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <RefreshCw size={12} className="animate-spin" />
          {isHe ? "טוען..." : "Loading..."}
        </div>
      ) : submissions.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {isHe ? "אין הגשות אחרונות" : "No recent submissions"}
        </p>
      ) : (
        <div className="space-y-1">
          {submissions.map((sub) => {
            const cfg = STATUS_CONFIG[sub.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={sub.id}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30"
              >
                <StatusIcon size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-200 truncate">{sub.formName}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(sub.timestamp, language)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 truncate">{sub.submittedBy}</span>
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

export function FormSubmissionsBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      {language === "he" ? "הגשות" : "Submissions"}
    </span>
  );
}
