"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

interface ExportButtonProps {
  table: string;
  filters?: Record<string, string>;
  filename?: string;
}

export function ExportButton({ table, filters, filename }: ExportButtonProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const ex = t.export;
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ table, format: "csv" });
      if (filters && Object.keys(filters).length > 0) {
        params.set("filters", JSON.stringify(filters));
      }

      const res = await fetch(`/api/export?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error || ex.exportError;
        if (res.status === 404) {
          window.dispatchEvent(new CustomEvent("cc-notify", {
            detail: { type: "info", message: ex.noData },
          }));
        } else {
          window.dispatchEvent(new CustomEvent("cc-notify", {
            detail: { type: "error", message: msg },
          }));
        }
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `${table}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.dispatchEvent(new CustomEvent("cc-notify", {
        detail: { type: "success", message: ex.exportSuccess },
      }));
    } catch {
      window.dispatchEvent(new CustomEvent("cc-notify", {
        detail: { type: "error", message: ex.exportError },
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-300 disabled:opacity-50"
      title={ex.exportCsv}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? ex.exporting : ex.exportCsv}
    </button>
  );
}
