"use client";

import { useState, useCallback, useEffect } from "react";
import { _Plus, Trash2, Pencil, Check, _X, _Clock, Settings2, RotateCcw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { VCanvas } from "@/components/vcanvas/VCanvas";
import {
  loadFeatures,
  saveFeatures,
  resetFeatures,
  FEATURE_LABELS,
  _DEFAULT_FEATURES,
} from "@/lib/vcanvas/canvasConfig";
import type { CanvasFeatures, CanvasContext } from "@/lib/vcanvas/canvasConfig";

// ─── Types & Storage ─────────────────────────────────
const STORAGE_KEY = "cc-vcanvas-list";

interface CanvasEntry {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function loadCanvasList(): CanvasEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCanvasList(list: CanvasEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore errors
  }
}

function deleteCanvasStorage(id: string) {
  // Clear all localStorage entries for this canvas
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes(id)) localStorage.removeItem(key);
    }
  } catch {
    // Ignore errors
  }
}

// ─── i18n labels ─────────────────────────────────────
const labels = {
  he: {
    newCanvas: "לוח חדש",
    untitled: "ללא שם",
    deleteConfirm: "למחוק את הלוח?",
    empty: "אין לוחות עדיין — צור את הראשון",
    back: "← חזרה",
    settings: "הגדרות Canvas",
    standalone: "vCanvas עצמאי",
    entity: "Canvas ישויות",
    resetDefaults: "אפס לברירת מחדל",
    featureConfig: "פיצ׳רים פעילים",
  },
  en: {
    newCanvas: "New Canvas",
    untitled: "Untitled",
    deleteConfirm: "Delete this canvas?",
    empty: "No canvases yet — create your first one",
    back: "← Back",
    settings: "Canvas Settings",
    standalone: "Standalone vCanvas",
    entity: "Entity Canvas",
    resetDefaults: "Reset to defaults",
    featureConfig: "Active Features",
  },
  ru: {
    newCanvas: "Новый холст",
    untitled: "Без названия",
    deleteConfirm: "Удалить холст?",
    empty: "Нет холстов — создайте первый",
    back: "← Назад",
    settings: "Настройки Canvas",
    standalone: "Самостоятельный vCanvas",
    entity: "Canvas сущностей",
    resetDefaults: "Сбросить к умолчаниям",
    featureConfig: "Активные функции",
  },
};

// ─── Feature Settings Panel ──────────────────────────
function FeatureSettingsPanel({
  language,
  onClose,
}: {
  language: "he" | "en" | "ru";
  onClose: () => void;
}) {
  const l = labels[language];
  const isRtl = language === "he";
  const [activeTab, setActiveTab] = useState<CanvasContext>("standalone");
  const [features, setFeatures] = useState<CanvasFeatures>(() => loadFeatures("standalone"));

  const switchTab = useCallback(
    (ctx: CanvasContext) => {
      setActiveTab(ctx);
      setFeatures(loadFeatures(ctx));
    },
    []
  );

  const toggleFeature = useCallback(
    (key: keyof CanvasFeatures) => {
      setFeatures((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveFeatures(activeTab, updated);
        return updated;
      });
    },
    [activeTab]
  );

  const handleReset = useCallback(() => {
    const defaults = resetFeatures(activeTab);
    setFeatures(defaults);
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir={isRtl ? "rtl" : "ltr"}>
      <div className="w-[440px] max-h-[80vh] rounded-2xl border border-white/[0.08] bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-slate-100">{l.settings}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-slate-300">
            <_X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {(["standalone", "entity"] as const).map((ctx) => (
            <button
              key={ctx}
              type="button"
              onClick={() => switchTab(ctx)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === ctx
                  ? "text-purple-400 border-b-2 border-purple-500"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {ctx === "standalone" ? l.standalone : l.entity}
            </button>
          ))}
        </div>

        {/* Feature toggles */}
        <div className="flex-1 overflow-y-auto p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-3">
            {l.featureConfig}
          </p>
          {(Object.keys(features) as (keyof CanvasFeatures)[]).map((key) => (
            <label
              key={key}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] cursor-pointer"
            >
              <span className="text-sm text-slate-300">{FEATURE_LABELS[key][language]}</span>
              <button
                type="button"
                onClick={() => toggleFeature(key)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  features[key] ? "bg-purple-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    features[key] ? (isRtl ? "start-0.5" : "start-[18px]") : (isRtl ? "start-[18px]" : "start-0.5")
                  }`}
                />
              </button>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-5 py-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            {l.resetDefaults}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────
export default function VCanvasPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const isRtl = language === "he";
  const l = labels[language];

  const [canvases, setCanvases] = useState<CanvasEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Load list on mount
  useEffect(() => {
    setCanvases(loadCanvasList());
  }, []);

  // Create new canvas
  const handleCreate = useCallback(() => {
    const id = `vc_${Date.now()}`;
    const entry: CanvasEntry = {
      id,
      name: `${l.untitled} ${canvases.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [entry, ...canvases];
    setCanvases(updated);
    saveCanvasList(updated);
    setActiveId(id);
  }, [canvases, l.untitled]);

  // Open existing canvas
  const handleOpen = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // Delete canvas
  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(l.deleteConfirm)) return;
      deleteCanvasStorage(id);
      const updated = canvases.filter((c) => c.id !== id);
      setCanvases(updated);
      saveCanvasList(updated);
      if (activeId === id) setActiveId(null);
    },
    [canvases, activeId, l.deleteConfirm]
  );

  // Rename
  const startRename = useCallback((id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(id);
    setEditingName(currentName);
  }, []);

  const commitRename = useCallback(() => {
    if (!editingNameId) return;
    const updated = canvases.map((c) =>
      c.id === editingNameId ? { ...c, name: editingName.trim() || l.untitled } : c
    );
    setCanvases(updated);
    saveCanvasList(updated);
    setEditingNameId(null);
  }, [canvases, editingNameId, editingName, l.untitled]);

  // Back to list
  const handleBack = useCallback(() => {
    setActiveId(null);
  }, []);

  // ─── Editor View ─────────────────────────────────
  if (activeId) {
    const current = canvases.find((c) => c.id === activeId);
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className="flex h-[calc(100vh-48px)] flex-col">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            {l.back}
          </button>
          <div className="h-4 w-px bg-white/[0.08]" />
          <span className="text-sm font-semibold text-slate-200 truncate">
            {current?.name || l.untitled}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            title={l.settings}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0">
          <VCanvas persistenceKey={activeId} context="standalone" mode="vCanvas" language={language} className="h-full" />
        </div>

        {showSettings && (
          <FeatureSettingsPanel language={language} onClose={() => setShowSettings(false)} />
        )}
      </div>
    );
  }

  // ─── List View ───────────────────────────────────
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex h-[calc(100vh-48px)] flex-col">
      <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between">
        <PageHeader pageKey="vcanvas" />
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded-lg border border-white/[0.08] p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            title={l.settings}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {l.newCanvas}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {canvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Pencil className="h-7 w-7 text-slate-700" />
            <p className="text-xs">{l.empty}</p>
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
            >
              <_Plus className="h-3.5 w-3.5" />
              {l.newCanvas}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpen(canvas.id)}
                onKeyDown={(e) => { if (e.key === "Enter") handleOpen(canvas.id); }}
                className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-start overflow-hidden cursor-pointer"
              >
                {/* Preview area */}
                <div className="h-24 bg-slate-900/50 flex items-center justify-center border-b border-white/[0.04]">
                  <Pencil className="h-5 w-5 text-slate-700 group-hover:text-slate-600 transition-colors" />
                </div>

                {/* Info */}
                <div className="p-2.5 flex flex-col gap-0.5">
                  {editingNameId === canvas.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingNameId(null);
                        }}
                        className="flex-1 rounded bg-white/[0.06] px-2 py-1 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-purple-500/50"
                        autoFocus
                      />
                      <button type="button" onClick={commitRename} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingNameId(null)} className="p-1 text-slate-500 hover:text-slate-300">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200 truncate">{canvas.name}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => startRename(canvas.id, canvas.name, e)}
                          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(canvas.id, e)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/[0.06]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock className="h-3 w-3" />
                    {new Date(canvas.updatedAt).toLocaleDateString(
                      language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US",
                      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <FeatureSettingsPanel language={language} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
