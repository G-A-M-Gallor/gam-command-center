"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Grid3X3, _X } from "lucide-react";
import {
  widgetRegistry,
  getWidgetById,
  getEffectivePlacement,
} from "./WidgetRegistry";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";

const PANEL_WIDTH = 288; // w-72 = 18rem = 288px

interface AppsDrawerProps {
  /** Called when a modal/side-panel widget is selected from the drawer */
  onOpenWidget: (widgetId: string) => void;
}

export function AppsDrawer({ onOpenWidget }: AppsDrawerProps) {
  const { widgetPlacements } = useWidgets();
  const { language } = useSettings();
  const _t = getTranslations(language);

  const [open, setOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate panel position from button rect, clamped to viewport
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const top = rect.bottom + 4; // 4px gap below button
    let left = rect.right - PANEL_WIDTH; // align right edge to button right
    // Clamp: don't overflow left edge
    if (left < 8) left = 8;
    // Clamp: don't overflow right edge
    if (left + PANEL_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - PANEL_WIDTH - 8;
    }
    setPanelPos({ top, left });
  }, []);

  // Recalculate on open and on resize
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSelectedAppId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const appsWidgets = widgetRegistry.filter(
    (w) =>
      w.status === "active" &&
      getEffectivePlacement(w.id, widgetPlacements, w.isRemovable) === "apps"
  );

  const handleAppClick = (widgetId: string) => {
    const w = getWidgetById(widgetId);
    if (!w) return;

    // Modal / side-panel widgets — delegate to TopBar's handler
    if (w.panelMode === "modal" || w.panelMode === "side-panel") {
      onOpenWidget(widgetId);
      setOpen(false);
      setSelectedAppId(null);
      return;
    }

    // Dropdown widgets — toggle inline panel
    setSelectedAppId((prev) => (prev === widgetId ? null : widgetId));
  };

  const selectedWidget = selectedAppId ? getWidgetById(selectedAppId) : null;
  const SelectedContent = selectedWidget?.component;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((p) => !p);
          if (open) setSelectedAppId(null);
        }}
        className={`relative mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
          open
            ? "bg-[var(--cc-accent-600)] text-white"
            : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
        }`}
        title={t.widgets.appsDrawer}
      >
        <Grid3X3 className="h-4 w-4" />
        {/* Badge dot when apps exist */}
        {!open && appsWidgets.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--cc-accent-500)]" />
        )}
      </button>

      {open && panelPos && (
        <div
          ref={panelRef}
          className="fixed z-[60] w-72 border border-slate-700 bg-slate-800 shadow-xl"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            borderRadius: "var(--cc-radius-lg)",
            maxHeight: `calc(100vh - ${panelPos.top + 8}px)`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-100">
              {t.widgets.appsDrawer}
            </h3>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSelectedAppId(null);
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: `calc(100vh - ${panelPos.top + 60}px)` }}>
            {/* Grid */}
            <div className="p-3">
              {appsWidgets.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  {_t.widgets.appsEmpty}
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {appsWidgets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleAppClick(w.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
                        selectedAppId === w.id
                          ? "bg-slate-700 text-slate-100"
                          : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700">
                        <w.icon className="h-5 w-5" />
                      </div>
                      <span className="max-w-full truncate text-[10px] font-medium">
                        {w.label[language]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inline panel for selected dropdown widget */}
            {selectedWidget && SelectedContent && (
              <div className="border-_t border-slate-700">
                <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-2.5">
                  <selectedWidget.icon className="h-4 w-4 text-[var(--cc-accent-400)]" />
                  <span className="text-sm font-semibold text-slate-200">
                    {selectedWidget.label[language]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAppId(null)}
                    className="ml-auto text-slate-500 hover:text-slate-300"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-4">
                  <SelectedContent />
                </div>
              </div>
            )}

            {/* Hint footer */}
            <div className="border-t border-slate-700 px-4 py-2 text-[10px] text-slate-600">
              {t.widgets.appsHint}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
