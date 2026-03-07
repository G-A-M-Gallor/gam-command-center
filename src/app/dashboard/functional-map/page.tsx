"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { Lock, Check, Loader2, Wifi, WifiOff } from "lucide-react";
import {
  getFunctionalMapCells,
  updateFunctionalMapCell,
  type FunctionalMapCell,
} from "@/lib/supabase/functionalMapQueries";
import {
  subscribeFunctionalMap,
  unsubscribeFromFunctionalMap,
} from "@/lib/supabase/functionalMapRealtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ──────────────────────────────────────────────

type Level = "strategy" | "management" | "operations";
type Func = "sales" | "delivery" | "finance" | "hr" | "technology";

const LEVELS: Level[] = ["strategy", "management", "operations"];
const FUNCS: Func[] = ["sales", "delivery", "finance", "hr", "technology"];

const LEVEL_COLORS: Record<Level, { bg: string; border: string; text: string }> = {
  strategy:   { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  management: { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400" },
  operations: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
};

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-emerald-500",
  partial: "bg-amber-500",
  planned: "bg-slate-500",
};

// ─── Demo Data ──────────────────────────────────────────

const DEMO_CELLS: FunctionalMapCell[] = LEVELS.flatMap((level) =>
  FUNCS.map((func) => ({
    id: `${level}-${func}`,
    level,
    func,
    owner: "",
    tools: [],
    status: "planned" as const,
    description: "",
    description_he: "",
    updated_at: new Date().toISOString(),
  }))
);

// ─── Cell Component ─────────────────────────────────────

function CellCard({
  cell,
  onSave,
  lang,
}: {
  cell: FunctionalMapCell;
  onSave: (id: string, updates: Partial<FunctionalMapCell>) => Promise<void>;
  lang: "he" | "en";
}) {
  const t = getTranslations(lang);
  const fm = t.functionalMap;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [owner, setOwner] = useState(cell.owner);
  const [tools, setTools] = useState(cell.tools.join(", "));
  const [status, setStatus] = useState(cell.status);
  const [desc, setDesc] = useState(lang === "he" ? cell.description_he : cell.description);

  const statusLabels: Record<string, string> = {
    active: fm.statusActive,
    partial: fm.statusPartial,
    planned: fm.statusPlanned,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<FunctionalMapCell> = {
        owner,
        tools: tools.split(",").map((s) => s.trim()).filter(Boolean),
        status,
        ...(lang === "he"
          ? { description_he: desc }
          : { description: desc }),
      };
      await onSave(cell.id, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setEditing(false);
    } catch {
      // keep editing open on error
    } finally {
      setSaving(false);
    }
  };

  const levelColor = LEVEL_COLORS[cell.level];

  if (editing) {
    return (
      <div
        data-cc-id="funcmap.cell"
        className={`${levelColor.bg} ${levelColor.border} border rounded-lg p-3 space-y-2`}
      >
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-500 uppercase">{fm.owner}</label>
          <input
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder={fm.noOwner}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-500 uppercase">{fm.tools}</label>
          <input
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            value={tools}
            onChange={(e) => setTools(e.target.value)}
            placeholder="Origami, Notion, n8n"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-500 uppercase">{fm.description}</label>
          <textarea
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-500 uppercase">Status</label>
          <select
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            value={status}
            onChange={(e) => setStatus(e.target.value as FunctionalMapCell["status"])}
          >
            <option value="active">{fm.statusActive}</option>
            <option value="partial">{fm.statusPartial}</option>
            <option value="planned">{fm.statusPlanned}</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs rounded px-2 py-1.5 flex items-center justify-center gap-1"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {saving ? fm.saving : t.common.save}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded px-2 py-1.5"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-cc-id="funcmap.cell"
      onClick={() => setEditing(true)}
      className={`${levelColor.bg} ${levelColor.border} border rounded-lg p-3 cursor-pointer hover:bg-opacity-20 transition-colors group min-h-[100px]`}
      title={fm.clickToEdit}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">
          {cell.owner || <span className="italic text-slate-600">{fm.noOwner}</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {saved && <span className="text-[10px] text-emerald-400">{fm.saved}</span>}
          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[cell.status]}`} title={statusLabels[cell.status]} />
        </div>
      </div>
      {cell.tools.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cell.tools.map((tool) => (
            <span key={tool} className="text-[10px] bg-slate-700/50 text-slate-400 rounded px-1.5 py-0.5">
              {tool}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 line-clamp-2">
        {(lang === "he" ? cell.description_he : cell.description) || (
          <span className="italic opacity-50">{fm.clickToEdit}</span>
        )}
      </p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function FunctionalMapPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const fm = t.functionalMap;
  const [cells, setCells] = useState<FunctionalMapCell[]>(DEMO_CELLS);
  const [loaded, setLoaded] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const pendingIds = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const levelLabels: Record<Level, string> = {
    strategy: fm.levelStrategy,
    management: fm.levelManagement,
    operations: fm.levelOperations,
  };

  const funcLabels: Record<Func, string> = {
    sales: fm.funcSales,
    delivery: fm.funcDelivery,
    finance: fm.funcFinance,
    hr: fm.funcHr,
    technology: fm.funcTechnology,
  };

  useEffect(() => {
    getFunctionalMapCells()
      .then((data) => {
        if (data.length > 0) setCells(data);
      })
      .catch(() => {
        // fallback to demo data
      })
      .finally(() => setLoaded(true));
  }, []);

  // ── Realtime subscription ───────────────────────────
  useEffect(() => {
    if (!loaded) return;

    setRealtimeStatus('connecting');

    const channel = subscribeFunctionalMap({
      onUpdate: (cell) => {
        if (pendingIds.current.has(cell.id)) {
          pendingIds.current.delete(cell.id);
          return;
        }
        setCells((prev) =>
          prev.map((c) => (c.id === cell.id ? { ...c, ...cell } : c))
        );
      },
    });

    channelRef.current = channel;
    const timer = setTimeout(() => setRealtimeStatus('connected'), 1000);

    return () => {
      clearTimeout(timer);
      unsubscribeFromFunctionalMap(channel);
      channelRef.current = null;
      setRealtimeStatus('disconnected');
    };
  }, [loaded]);

  const handleSave = useCallback(async (id: string, updates: Partial<FunctionalMapCell>) => {
    pendingIds.current.add(id);
    try {
      const updated = await updateFunctionalMapCell(id, updates);
      setCells((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    } catch {
      pendingIds.current.delete(id);
      setCells((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
      );
    }
  }, []);

  const getCell = (level: Level, func: Func) =>
    cells.find((c) => c.level === level && c.func === func) ??
    DEMO_CELLS.find((c) => c.level === level && c.func === func)!;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="functionalMap" />
      <div className="p-6 space-y-4">
        {/* Notice bar */}
        <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm text-slate-400">{fm.lockedNotice}</span>
          <div className="flex items-center gap-3 ms-auto text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {fm.statusActive}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> {fm.statusPartial}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> {fm.statusPlanned}
            </span>
            <span data-cc-id="funcmap.realtime-status" className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
              realtimeStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400'
                : realtimeStatus === 'connecting'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-red-500/10 text-red-400'
            }`}>
              {realtimeStatus === 'connected'
                ? <><Wifi size={11} /> {fm.realtimeConnected}</>
                : realtimeStatus === 'connecting'
                  ? <><Wifi size={11} /> {fm.realtimeConnecting}</>
                  : <><WifiOff size={11} /> {fm.realtimeDisconnected}</>
              }
            </span>
          </div>
        </div>

        {/* Grid */}
        <div data-cc-id="funcmap.grid" className={`${!loaded ? "opacity-50" : ""}`}>
          {/* Column headers */}
          <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-2 mb-2">
            <div /> {/* empty corner */}
            {FUNCS.map((func) => (
              <div key={func} className="text-center text-sm font-medium text-slate-300">
                {funcLabels[func]}
              </div>
            ))}
          </div>

          {/* Rows */}
          {LEVELS.map((level) => (
            <div key={level} className="grid grid-cols-[120px_repeat(5,1fr)] gap-2 mb-2">
              <div className={`flex items-center justify-center rounded-lg px-2 py-3 ${LEVEL_COLORS[level].bg} ${LEVEL_COLORS[level].border} border`}>
                <span className={`text-sm font-medium ${LEVEL_COLORS[level].text} writing-mode-vertical`}>
                  {levelLabels[level]}
                </span>
              </div>
              {FUNCS.map((func) => (
                <CellCard
                  key={`${level}-${func}`}
                  cell={getCell(level, func)}
                  onSave={handleSave}
                  lang={language}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
