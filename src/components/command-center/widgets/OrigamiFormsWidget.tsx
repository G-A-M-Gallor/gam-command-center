"use client";

import { useState, useEffect } from "react";
import { FileText, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import type { WidgetSize } from "./WidgetRegistry";

interface OrigamiEntity {
  id: string;
  name: string;
  fields_count?: number;
}

export function OrigamiFormsPanel() {
  const { language } = useSettings();
  const isHe = language === "he";
  const [entities, setEntities] = useState<OrigamiEntity[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEntities = () => {
    setLoading(true);
    fetch("/api/origami/entities")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setConnected(data.connected);
        setEntities(data.entities || []);
      })
      .catch(() => {
        setConnected(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntities(); }, []);

  const origamiUrl = process.env.NEXT_PUBLIC_ORIGAMI_URL || "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {connected ? (
            <CheckCircle2 size={12} className="text-emerald-400" />
          ) : (
            <AlertCircle size={12} className="text-amber-400" />
          )}
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Origami
          </span>
        </div>
        <button
          type="button"
          onClick={fetchEntities}
          disabled={loading}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <RefreshCw size={12} className="animate-spin" />
          {isHe ? "טוען..." : "Loading..."}
        </div>
      ) : !connected ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 text-center py-2">
            {isHe ? "לא מחובר ל-Origami CRM" : "Not connected to Origami CRM"}
          </p>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
            {isHe ? "הגדר ORIGAMI_API_KEY + ORIGAMI_BASE_URL" : "Set ORIGAMI_API_KEY + ORIGAMI_BASE_URL"}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {entities.slice(0, 8).map((entity) => (
            <a
              key={entity.id}
              href={origamiUrl ? `${origamiUrl}/entities/${entity.id}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-700/30 group"
            >
              <FileText size={13} className="text-slate-400 shrink-0" />
              <span className="flex-1 min-w-0 text-sm text-slate-300 truncate">{entity.name}</span>
              {entity.fields_count != null && (
                <span className="text-[10px] text-slate-600 shrink-0">
                  {entity.fields_count} {isHe ? "שדות" : "fields"}
                </span>
              )}
              <ExternalLink size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
          {entities.length > 8 && (
            <p className="text-center text-[10px] text-slate-600 pt-1">
              +{entities.length - 8} {isHe ? "נוספים" : "more"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function OrigamiFormsBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      {language === "he" ? "טפסים" : "Forms"}
    </span>
  );
}
