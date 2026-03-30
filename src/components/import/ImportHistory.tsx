"use client";

import { useState, useEffect } from "react";
import { _Clock, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { fetchImportLogs } from "@/lib/supabase/importQueries";
import type { ImportLog, ImportLogStatus } from "@/lib/import/types";

const STATUS_STYLES: Record<ImportLogStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400" },
  processing: { bg: "bg-blue-500/10", text: "text-blue-400" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  failed: { bg: "bg-red-500/10", text: "text-red-400" },
};

export function ImportHistory() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const it = t.importEngine;
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchImportLogs(20).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const statusLabel = (status: ImportLogStatus): string => {
    switch (status) {
      case "pending": return it.statusPending;
      case "processing": return it.statusProcessing;
      case "completed": return it.statusCompleted;
      case "failed": return it.statusFailed;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-_t-transparent" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <_Clock className="mb-2 h-8 w-8" />
        <p className="text-sm">{it.noImports}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/80">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">{it.fileName}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">{it.entityType}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">{it.date}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">{it.rowsImported}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">{it.status}</th>
            <th className="px-4 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const style = STATUS_STYLES[log.status];
            const isExpanded = expandedId === log.id;
            const errors = Array.isArray(log.errors) ? log.errors : [];

            return (
              <tr key={log.id} className="group">
                <td colSpan={6} className="p-0">
                  <div>
                    {/* Main row */}
                    <div
                      className="grid cursor-pointer border-b border-slate-700/50 hover:bg-slate-800/30"
                      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 40px" }}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <div className="px-4 py-2.5 text-slate-300 truncate">{log.file_name}</div>
                      <div className="px-4 py-2.5 text-slate-400">{log.entity_type}</div>
                      <div className="px-4 py-2.5 text-slate-500 text-xs">
                        {new Date(log.created_at).toLocaleDateString(language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                      <div className="px-4 py-2.5 text-slate-300">
                        {log.imported_rows} / {log.total_rows}
                        {log.failed_rows > 0 && (
                          <span className="ml-1 text-red-400">({log.failed_rows} failed)</span>
                        )}
                      </div>
                      <div className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                          {statusLabel(log.status)}
                        </span>
                      </div>
                      <div className="px-2 py-2.5 flex items-center justify-center">
                        {errors.length > 0 && (
                          isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Expanded error details */}
                    {isExpanded && errors.length > 0 && (
                      <div className="border-b border-slate-700/50 bg-slate-900/50 px-6 py-3">
                        <p className="mb-2 text-xs font-medium text-slate-400">
                          {it.viewErrors} ({errors.length})
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {errors.slice(0, 30).map((err, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                              <span className="text-slate-500">Row {err.row + 1}</span>
                              <span className="text-red-300">{err.message}</span>
                            </div>
                          ))}
                          {errors.length > 30 && (
                            <p className="text-[10px] text-slate-600">
                              + {errors.length - 30} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
