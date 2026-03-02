"use client";

import { useState } from "react";
import { X, Lock, Plus, Trash2 } from "lucide-react";
import { widgetRegistry } from "./WidgetRegistry";
import { FolderCreator } from "./FolderCreator";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

interface WidgetLibraryProps {
  onClose: () => void;
}

export function WidgetLibrary({ onClose }: WidgetLibraryProps) {
  const { hiddenWidgets, widgetSizes, toggleWidget, folders, removeFolder } = useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);
  const ft = (t as unknown as Record<string, Record<string, string>>).folders;
  const [creatorOpen, setCreatorOpen] = useState(false);

  const activeWidgets = widgetRegistry.filter((w) => w.status === "active");
  const comingSoonWidgets = widgetRegistry.filter(
    (w) => w.status === "coming-soon"
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label={t.widgets.close}
      />
      <div className="relative z-10 w-96 border border-slate-700 bg-slate-800 shadow-xl" style={{ borderRadius: "var(--cc-radius-lg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-100">
            {t.widgets.library}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Active section */}
          <div className="mb-1 px-3 pt-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {t.widgets.activeWidgets}
            </span>
          </div>
          {activeWidgets.map((widget) => {
            const isEnabled = !hiddenWidgets.includes(widget.id);
            const size = widgetSizes[widget.id] ?? widget.defaultSize;

            return (
              <div
                key={widget.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <widget.icon className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">
                      {widget.label[language]}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {size}x
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {widget.description[language]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className={`relative h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                    isEnabled ? "bg-[var(--cc-accent-600)]" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}

          {/* Folders section */}
          <div className="mb-1 mt-3 border-t border-slate-700/50 px-3 pt-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {ft?.folders}
            </span>
          </div>
          {folders.map((folder) => {
            const isEnabled = !hiddenWidgets.includes(folder.id);
            return (
              <div
                key={folder.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <span className="text-base">{folder.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">
                      {folder.label[language]}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {folder.items.length} {ft?.items}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWidget(folder.id)}
                  className={`relative h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                    isEnabled ? "bg-[var(--cc-accent-600)]" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeFolder(folder.id)}
                  className="text-slate-600 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setCreatorOpen(true)}
            className="mx-3 mt-1 flex w-[calc(100%-24px)] items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-600 py-2 text-xs text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-400"
          >
            <Plus className="h-3 w-3" />
            {ft?.createFolder}
          </button>

          {creatorOpen && (
            <FolderCreator onClose={() => setCreatorOpen(false)} />
          )}

          {/* Coming Soon section */}
          {comingSoonWidgets.length > 0 && (
            <>
              <div className="mb-1 mt-3 border-t border-slate-700/50 px-3 pt-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {t.widgets.comingSoonWidgets}
                </span>
              </div>
              {comingSoonWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-50"
                >
                  <widget.icon className="h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-400">
                        {widget.label[language]}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                        <Lock className="h-2.5 w-2.5" />
                        {t.widgets.comingSoon}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-600">
                      {widget.description[language]}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
