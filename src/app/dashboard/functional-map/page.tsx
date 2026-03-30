"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  Lock, Check, Loader2, Wifi, WifiOff, X, Plus, Trash2,
  ExternalLink, BarChart3, CheckSquare, FileText, Link2,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import {
  getFunctionalMapCells,
  updateFunctionalMapCell,
  type FunctionalMapCell,
  type FuncMapItem,
  type FuncMapKpi,
  type FuncMapLink,
} from "@/lib/supabase/functionalMapQueries";
import {
  subscribeFunctionalMap,
  unsubscribeFromFunctionalMap,
} from "@/lib/supabase/functionalMapRealtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types & Constants ──────────────────────────────────

type Level = "strategy" | "management" | "operations";
type Func = "sales" | "delivery" | "finance" | "hr" | "technology";
type StatusFilter = "all" | "active" | "partial" | "planned";

const LEVELS: Level[] = ["strategy", "management", "operations"];
const FUNCS: Func[] = ["sales", "delivery", "finance", "hr", "technology"];

const LEVEL_COLORS: Record<Level, { bg: string; border: string; text: string; ring: string }> = {
  strategy:   { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", ring: "text-purple-500" },
  management: { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400",   ring: "text-blue-500" },
  operations: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", ring: "text-emerald-500" },
};

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-emerald-500",
  partial: "bg-amber-500",
  planned: "bg-slate-500",
};

const STALE_DAYS = 30;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function cellProgress(cell: FunctionalMapCell): { done: number; total: number; pct: number } {
  const items = cell.items ?? [];
  if (items.length === 0) return { done: 0, total: 0, pct: 0 };
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

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
    items: [],
    notes: "",
    notes_he: "",
    kpis: [],
    links: [],
    updated_at: new Date().toISOString(),
  }))
);

// ─── Stats Bar ──────────────────────────────────────────

function StatsBar({ cells, lang }: { cells: FunctionalMapCell[]; lang: string }) {
  const t = getTranslations(lang as "he" | "en" | "ru");
  const fm = t.functionalMap;

  const active = cells.filter((c) => c.status === "active").length;
  const partial = cells.filter((c) => c.status === "partial").length;
  const planned = cells.filter((c) => c.status === "planned").length;

  const totalItems = cells.reduce((a, c) => a + (c.items?.length ?? 0), 0);
  const doneItems = cells.reduce((a, c) => a + (c.items ?? []).filter((i) => i.done).length, 0);
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const stale = cells.filter((c) => daysSince(c.updated_at) > STALE_DAYS).length;

  return (
    <div data-cc-id="funcmap.stats" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {[
        { label: fm.cells ?? "Cells", value: cells.length, color: "text-slate-300" },
        { label: fm.statusActive, value: active, color: "text-emerald-400" },
        { label: fm.statusPartial, value: partial, color: "text-amber-400" },
        { label: fm.statusPlanned, value: planned, color: "text-slate-400" },
        { label: fm.items ?? "Items", value: `${doneItems}/${totalItems}`, color: "text-purple-400" },
        { label: fm.stale ?? "Stale", value: stale, color: stale > 0 ? "text-red-400" : "text-slate-500" },
      ].map((s) => (
        <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-center">
          <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
          <div className="text-[10px] text-slate-500 uppercase">{s.label}</div>
        </div>
      ))}
      {/* Overall progress */}
      <div className="col-span-2 sm:col-span-3 lg:col-span-6 bg-slate-800/30 rounded-lg px-3 py-1.5 flex items-center gap-3">
        <span className="text-xs text-slate-500">{fm.progress ?? "Progress"}</span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-300 min-w-[36px] text-end">{overallPct}%</span>
      </div>
    </div>
  );
}

// ─── Cell Card ──────────────────────────────────────────

function CellCard({
  cell,
  onClick,
  lang,
}: {
  cell: FunctionalMapCell;
  onClick: () => void;
  lang: "he" | "en" | "ru";
}) {
  const t = getTranslations(lang);
  const fm = t.functionalMap;
  const levelColor = LEVEL_COLORS[cell.level];
  const { done, total, pct } = cellProgress(cell);
  const stale = daysSince(cell.updated_at) > STALE_DAYS;
  const desc = lang === "he" ? cell.description_he : cell.description;
  const kpiCount = (cell.kpis ?? []).length;
  const linkCount = (cell.links ?? []).length;

  return (
    <div
      data-cc-id="funcmap.cell"
      onClick={onClick}
      className={`${levelColor.bg} ${levelColor.border} border rounded-lg p-3 cursor-pointer hover:brightness-125 transition-all group min-h-[110px] flex flex-col`}
    >
      {/* Top row: owner + status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400 truncate max-w-[70%]">
          {cell.owner || <span className="italic text-slate-600">{fm.noOwner}</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {stale && <AlertTriangle className="w-3 h-3 text-amber-500" />}
          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[cell.status]}`} />
        </div>
      </div>

      {/* Tools */}
      {cell.tools.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {cell.tools.slice(0, 3).map((tool) => (
            <span key={tool} className="text-[9px] bg-slate-700/60 text-slate-400 rounded px-1.5 py-0.5">
              {tool}
            </span>
          ))}
          {cell.tools.length > 3 && (
            <span className="text-[9px] text-slate-500">+{cell.tools.length - 3}</span>
          )}
        </div>
      )}

      {/* Description */}
      <p className="text-[11px] text-slate-500 line-clamp-2 flex-1">
        {desc || <span className="italic opacity-40">{fm.clickToEdit}</span>}
      </p>

      {/* Bottom row: progress + badges */}
      <div className="mt-2 space-y-1.5">
        {total > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-purple-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500">{done}/{total}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[9px] text-slate-600">
          {kpiCount > 0 && (
            <span className="flex items-center gap-0.5">
              <BarChart3 className="w-2.5 h-2.5" /> {kpiCount}
            </span>
          )}
          {linkCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Link2 className="w-2.5 h-2.5" /> {linkCount}
            </span>
          )}
          <span className="ms-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ───────────────────────────────────────

function DetailPanel({
  cell,
  onSave,
  onClose,
  lang,
}: {
  cell: FunctionalMapCell;
  onSave: (id: string, updates: Partial<FunctionalMapCell>) => Promise<void>;
  onClose: () => void;
  lang: "he" | "en" | "ru";
}) {
  const t = getTranslations(lang);
  const fm = t.functionalMap;

  const [owner, setOwner] = useState(cell.owner);
  const [tools, setTools] = useState(cell.tools.join(", "));
  const [status, setStatus] = useState(cell.status);
  const [desc, setDesc] = useState(lang === "he" ? cell.description_he : cell.description);
  const [items, setItems] = useState<FuncMapItem[]>(cell.items ?? []);
  const [notes, setNotes] = useState(lang === "he" ? (cell.notes_he ?? "") : (cell.notes ?? ""));
  const [kpis, setKpis] = useState<FuncMapKpi[]>(cell.kpis ?? []);
  const [links, setLinks] = useState<FuncMapLink[]>(cell.links ?? []);
  const [saving, setSaving] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const levelColor = LEVEL_COLORS[cell.level];
  const levelLabel = fm[`level${cell.level.charAt(0).toUpperCase() + cell.level.slice(1)}` as keyof typeof fm] as string;
  const funcLabel = fm[`func${cell.func.charAt(0).toUpperCase() + cell.func.slice(1)}` as keyof typeof fm] as string;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<FunctionalMapCell> = {
        owner,
        tools: tools.split(",").map((s) => s.trim()).filter(Boolean),
        status,
        items,
        kpis,
        links,
        ...(lang === "he"
          ? { description_he: desc, notes_he: notes }
          : { description: desc, notes }),
      };
      await onSave(cell.id, updates);
      onClose();
    } catch {
      // keep open on error
    } finally {
      setSaving(false);
    }
  };

  // ── Item helpers ──
  const addItem = () => {
    if (!newItemText.trim()) return;
    setItems([...items, {
      id: uid(),
      text: lang === "he" ? "" : newItemText.trim(),
      text_he: lang === "he" ? newItemText.trim() : "",
      done: false,
    }]);
    setNewItemText("");
  };

  const toggleItem = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  // ── KPI helpers ──
  const addKpi = () => {
    setKpis([...kpis, { id: uid(), label: "", label_he: "", value: 0, target: 100, unit: "" }]);
  };

  const updateKpi = (id: string, field: string, val: string | number) => {
    setKpis(kpis.map((k) => (k.id === id ? { ...k, [field]: val } : k)));
  };

  const removeKpi = (id: string) => {
    setKpis(kpis.filter((k) => k.id !== id));
  };

  // ── Link helpers ──
  const addLink = () => {
    setLinks([...links, { id: uid(), label: "", url: "" }]);
  };

  const updateLink = (id: string, field: string, val: string) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const days = daysSince(cell.updated_at);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir={lang === "he" ? "rtl" : "ltr"}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border-s border-slate-700 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className={`sticky top-0 z-10 ${levelColor.bg} border-b ${levelColor.border} px-5 py-4 flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-semibold ${levelColor.text}`}>
              {levelLabel} × {funcLabel}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {fm.lastUpdated ?? "Updated"}: {days === 0 ? (fm.saved ?? "today") : `${days} ${fm.daysAgo ?? "days ago"}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ── Info Section ── */}
          <section className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 uppercase">Status</label>
              <div className="flex gap-2">
                {(["active", "partial", "planned"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 text-xs rounded-lg px-3 py-2 border transition-colors ${
                      status === s
                        ? s === "active"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : s === "partial"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                            : "bg-slate-500/20 border-slate-500/50 text-slate-400"
                        : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    {fm[`status${s.charAt(0).toUpperCase() + s.slice(1)}` as keyof typeof fm] as string}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 uppercase">{fm.owner}</label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder={fm.noOwner}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 uppercase">{fm.tools}</label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  placeholder="Origami, Notion, n8n"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 uppercase">{fm.description}</label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </section>

          {/* ── Items / Checklist ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">{fm.items ?? "Items"}</span>
              {items.length > 0 && (
                <span className="text-[10px] text-slate-500">
                  {items.filter((i) => i.done).length}/{items.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group/item">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      item.done
                        ? "bg-purple-600 border-purple-500"
                        : "border-slate-600 hover:border-purple-500"
                    }`}
                  >
                    {item.done && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${item.done ? "line-through text-slate-600" : "text-slate-300"}`}>
                    {(lang === "he" ? item.text_he : item.text) || item.text || item.text_he}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-slate-600 italic py-1">{fm.noItems ?? "No items yet"}</p>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder={fm.itemPlaceholder ?? "New item..."}
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <button
                onClick={addItem}
                className="bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg px-3 py-1.5 text-xs hover:bg-purple-600/30 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </section>

          {/* ── KPIs ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">{fm.kpis ?? "KPIs"}</span>
            </div>
            <div className="space-y-2">
              {kpis.map((kpi) => {
                const kpiPct = kpi.target > 0 ? Math.min(100, Math.round((kpi.value / kpi.target) * 100)) : 0;
                return (
                  <div key={kpi.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 group/kpi">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none placeholder:text-slate-600"
                        placeholder={fm.labelPlaceholder ?? "Label"}
                        value={lang === "he" ? kpi.label_he : kpi.label}
                        onChange={(e) => updateKpi(kpi.id, lang === "he" ? "label_he" : "label", e.target.value)}
                      />
                      <button
                        onClick={() => removeKpi(kpi.id)}
                        className="opacity-0 group-hover/kpi:opacity-100 p-1 text-slate-600 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        value={kpi.value}
                        onChange={(e) => updateKpi(kpi.id, "value", Number(e.target.value))}
                      />
                      <span className="text-xs text-slate-500">/</span>
                      <input
                        type="number"
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        value={kpi.target}
                        onChange={(e) => updateKpi(kpi.id, "target", Number(e.target.value))}
                      />
                      <input
                        className="w-12 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="unit"
                        value={kpi.unit}
                        onChange={(e) => updateKpi(kpi.id, "unit", e.target.value)}
                      />
                      <span className={`text-xs font-medium min-w-[32px] text-end ${
                        kpiPct >= 80 ? "text-emerald-400" : kpiPct >= 50 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {kpiPct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          kpiPct >= 80 ? "bg-emerald-500" : kpiPct >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${kpiPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {kpis.length === 0 && (
                <p className="text-xs text-slate-600 italic py-1">{fm.noKpis ?? "No KPIs"}</p>
              )}
            </div>
            <button
              onClick={addKpi}
              className="mt-2 w-full bg-slate-800/50 border border-dashed border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> {fm.addKpi ?? "Add KPI"}
            </button>
          </section>

          {/* ── Links ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">{fm.links ?? "Links"}</span>
            </div>
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 group/link">
                  <input
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    placeholder={fm.labelPlaceholder ?? "Label"}
                    value={link.label}
                    onChange={(e) => updateLink(link.id, "label", e.target.value)}
                  />
                  <input
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateLink(link.id, "url", e.target.value)}
                  />
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => removeLink(link.id)}
                    className="opacity-0 group-hover/link:opacity-100 p-1 text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {links.length === 0 && (
                <p className="text-xs text-slate-600 italic py-1">{fm.noLinks ?? "No links"}</p>
              )}
            </div>
            <button
              onClick={addLink}
              className="mt-2 w-full bg-slate-800/50 border border-dashed border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> {fm.addLink ?? "Add Link"}
            </button>
          </section>

          {/* ── Notes ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">{fm.notes ?? "Notes"}</span>
            </div>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={fm.clickToEdit}
            />
          </section>
        </div>

        {/* ── Save Footer ── */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-5 py-3 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? fm.saving : t.common.save}
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg px-4 py-2.5 transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
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
  const [realtimeStatus, setRealtimeStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [selectedCell, setSelectedCell] = useState<FunctionalMapCell | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
      .catch(() => { /* no-op */ })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setRealtimeStatus("connecting");

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
    const timer = setTimeout(() => setRealtimeStatus("connected"), 1000);

    return () => {
      clearTimeout(timer);
      unsubscribeFromFunctionalMap(channel);
      channelRef.current = null;
      setRealtimeStatus("disconnected");
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

  const shouldDim = (cell: FunctionalMapCell) =>
    statusFilter !== "all" && cell.status !== statusFilter;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="functionalMap" />
      <div className="px-3 py-4 sm:p-6 space-y-4">
        {/* Stats */}
        <StatsBar cells={cells} lang={language} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs sm:text-sm text-slate-400">{fm.lockedNotice}</span>

          <div className="flex items-center gap-1 ms-auto">
            {/* Status filter */}
            {(["all", "active", "partial", "planned"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                  statusFilter === f
                    ? "bg-slate-700 text-slate-200"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f === "all" ? (fm.filterAll ?? "All") : fm[`status${f.charAt(0).toUpperCase() + f.slice(1)}` as keyof typeof fm] as string}
              </button>
            ))}

            <span className="w-px h-4 bg-slate-700 mx-1 hidden sm:block" />

            {/* Realtime indicator */}
            <span
              data-cc-id="funcmap.realtime-status"
              className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                realtimeStatus === "connected"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : realtimeStatus === "connecting"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
              }`}
            >
              {realtimeStatus === "connected" ? (
                <><Wifi size={11} /> {fm.realtimeConnected}</>
              ) : realtimeStatus === "connecting" ? (
                <><Wifi size={11} /> {fm.realtimeConnecting}</>
              ) : (
                <><WifiOff size={11} /> {fm.realtimeDisconnected}</>
              )}
            </span>
          </div>
        </div>

        {/* Desktop Grid */}
        <div data-cc-id="funcmap.grid" className={`hidden md:block ${!loaded ? "opacity-50" : ""}`}>
          <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mb-2">
            <div />
            {FUNCS.map((func) => (
              <div key={func} className="text-center text-sm font-medium text-slate-300">
                {funcLabels[func]}
              </div>
            ))}
          </div>

          {LEVELS.map((level) => (
            <div key={level} className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mb-2">
              <div className={`flex items-center justify-center rounded-lg px-2 py-3 ${LEVEL_COLORS[level].bg} ${LEVEL_COLORS[level].border} border`}>
                <span className={`text-sm font-medium ${LEVEL_COLORS[level].text} writing-mode-vertical`}>
                  {levelLabels[level]}
                </span>
              </div>
              {FUNCS.map((func) => {
                const cell = getCell(level, func);
                return (
                  <div key={`${level}-${func}`} className={`transition-opacity ${shouldDim(cell) ? "opacity-30" : ""}`}>
                    <CellCard
                      cell={cell}
                      onClick={() => setSelectedCell(cell)}
                      lang={language}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile Card Stack */}
        <div className={`md:hidden space-y-3 ${!loaded ? "opacity-50" : ""}`}>
          {LEVELS.map((level) => (
            <div key={level} className="space-y-2">
              <div className={`text-xs font-medium uppercase tracking-wider ${LEVEL_COLORS[level].text} px-1`}>
                {levelLabels[level]}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FUNCS.map((func) => {
                  const cell = getCell(level, func);
                  return (
                    <div key={`${level}-${func}`} className={`transition-opacity ${shouldDim(cell) ? "opacity-30" : ""}`}>
                      <div className="text-[10px] text-slate-500 uppercase mb-1 px-1">{funcLabels[func]}</div>
                      <CellCard
                        cell={cell}
                        onClick={() => setSelectedCell(cell)}
                        lang={language}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedCell && (
          <DetailPanel
            cell={selectedCell}
            onSave={handleSave}
            onClose={() => setSelectedCell(null)}
            lang={language}
          />
        )}
      </div>
    </div>
  );
}
