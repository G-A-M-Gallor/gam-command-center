"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import type { WidgetDefinition } from "./WidgetRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { useWidgets } from "@/contexts/WidgetContext";
import { getTranslations } from "@/lib/i18n";

const MIN_WIDTH = 300;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 400;
const STORAGE_KEY = "cc-side-panel-width";

// ─── Per-widget error boundary ──────────────────────────
class PanelErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 text-xs text-red-400">
          Widget error
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="ms-2 rounded bg-slate-700 px-2 py-1 text-slate-300"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface UniversalSidePanelProps {
  widget: WidgetDefinition;
  onClose: () => void;
  onSwitchToDropdown: () => void;
}

export function UniversalSidePanel({
  widget,
  onClose,
  onSwitchToDropdown,
}: UniversalSidePanelProps) {
  const { language, sidebarPosition } = useSettings();
  const { widgetLabels } = useWidgets();
  const t = getTranslations(language);

  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const w = parseInt(saved, 10);
        if (w >= MIN_WIDTH && w <= MAX_WIDTH) return w;
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDTH;
  });

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  // Panel opens on opposite side of sidebar
  const panelSide = sidebarPosition === "left" ? "right" : "left";

  const customLabel = widgetLabels[widget.id]?.[language];
  const label = customLabel || widget.label[language];
  const WidgetContent = widget.component;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startX.current = e.clientX;
      startW.current = width;

      const handleMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const dx = panelSide === "right"
          ? startX.current - ev.clientX
          : ev.clientX - startX.current;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + dx));
        setWidth(newWidth);
      };

      const handleUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
        try {
          localStorage.setItem(STORAGE_KEY, String(width));
        } catch { /* ignore */ }
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [width, panelSide]
  );

  // Save width on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch { /* ignore */ }
  }, [width]);

  return (
    <div
      className="fixed top-0 bottom-0 z-[55] flex flex-col border-slate-700 bg-slate-800 shadow-2xl"
      style={{
        width,
        [panelSide]: 0,
        borderLeft: panelSide === "right" ? "1px solid" : undefined,
        borderRight: panelSide === "left" ? "1px solid" : undefined,
        borderColor: "rgb(51 65 85 / 1)", // slate-700
        animation: "slideIn 200ms ease-out",
      }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--cc-accent-500-50)]"
        style={{ [panelSide === "right" ? "left" : "right"]: 0 }}
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <widget.icon className="h-4 w-4 shrink-0 text-[var(--cc-accent-400)]" />
          <h3 className="truncate text-sm font-semibold text-slate-100">{label}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onSwitchToDropdown}
            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
            title={t.widgets.panelModeDropdown || "Switch to dropdown"}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <PanelErrorBoundary widgetId={widget.id}>
          {WidgetContent && <WidgetContent />}
        </PanelErrorBoundary>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(${panelSide === "right" ? "100%" : "-100%"});
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
