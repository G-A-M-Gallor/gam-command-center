"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { _X, Bot } from "lucide-react";
import type { WidgetDefinition } from "./WidgetRegistry";
import { widgetRegistry } from "./WidgetRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { useWidgets } from "@/contexts/WidgetContext";
import { _getTranslations } from "@/lib/i18n";

const MIN_WIDTH = 300;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 400;
const STORAGE_KEY = "cc-side-panel-width";

/** Custom event to open a widget in the side panel */
export const SIDE_PANEL_OPEN_EVENT = "cc-side-panel-open";

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

// ─── Single widget tab (legacy API — still used) ─────────

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
  return (
    <TabbedSidePanel
      initialWidgetId={widget.id}
      onClose={onClose}
    />
  );
}

// ─── Tabbed Side Panel ──────────────────────────────────

interface TabbedSidePanelProps {
  initialWidgetId?: string;
  /** Whether AI tab should be shown (always true by default) */
  showAiTab?: boolean;
  onClose: () => void;
}

export function TabbedSidePanel({
  initialWidgetId,
  showAiTab = true,
  onClose,
}: TabbedSidePanelProps) {
  const { language, sidebarPosition } = useSettings();
  const { widgetLabels } = useWidgets();
  const _t = getTranslations(language);

  // Tabs: AI is always first (if showAiTab), then other opened widgets
  const [tabs, setTabs] = useState<string[]>(() => {
    const initial: string[] = [];
    if (showAiTab) initial.push("ai-assistant");
    if (initialWidgetId && initialWidgetId !== "ai-assistant") {
      initial.push(initialWidgetId);
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState<string>(
    initialWidgetId || (showAiTab ? "ai-assistant" : "")
  );

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

  const panelSide = sidebarPosition === "left" ? "right" : "left";

  // Listen for external open events
  useEffect(() => {
    const handler = (e: Event) => {
      const widgetId = (e as CustomEvent<string>).detail;
      if (!widgetId) return;
      setTabs((prev) => {
        if (prev.includes(widgetId)) return prev;
        return [...prev, widgetId];
      });
      setActiveTab(widgetId);
    };
    window.addEventListener(SIDE_PANEL_OPEN_EVENT, handler);
    return () => window.removeEventListener(SIDE_PANEL_OPEN_EVENT, handler);
  }, []);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch { /* ignore */ }
  }, [width]);

  const closeTab = useCallback((widgetId: string) => {
    // Can't close AI tab
    if (widgetId === "ai-assistant") return;
    setTabs((prev) => {
      const next = prev.filter((id) => id !== widgetId);
      if (next.length === 0) {
        onClose();
        return prev;
      }
      return next;
    });
    setActiveTab((prev) => {
      if (prev === widgetId) {
        // Switch to AI tab or first available
        return showAiTab ? "ai-assistant" : tabs.find((id) => id !== widgetId) || "";
      }
      return prev;
    });
  }, [tabs, showAiTab, onClose]);

  const activeWidget = widgetRegistry.find((w) => w.id === activeTab);
  const ActiveContent = activeWidget?.component;
  const customLabel = activeWidget ? (widgetLabels[activeWidget.id]?.[language] || activeWidget.label[language]) : "";

  return (
    <div
      className="fixed top-0 bottom-0 z-[55] flex border-slate-700 bg-slate-800 shadow-2xl"
      style={{
        width,
        [panelSide]: 0,
        borderLeft: panelSide === "right" ? "1px solid" : undefined,
        borderRight: panelSide === "left" ? "1px solid" : undefined,
        borderColor: "rgb(51 65 85 / 1)",
        animation: "sidePanelSlideIn 200ms ease-out",
      }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--cc-accent-500-50)] z-10"
        style={{ [panelSide === "right" ? "left" : "right"]: 0 }}
        onMouseDown={handleResizeStart}
      />

      {/* Edge tabs — vertical strip on the inner edge */}
      <div
        className="flex flex-col items-center gap-1 py-14 px-0.5 border-slate-700/50 shrink-0"
        style={{
          borderRight: panelSide === "right" ? undefined : "1px solid rgb(51 65 85 / 0.5)",
          borderLeft: panelSide === "right" ? "1px solid rgb(51 65 85 / 0.5)" : undefined,
          order: panelSide === "right" ? -1 : 1,
        }}
      >
        {tabs.map((widgetId) => {
          const w = widgetRegistry.find((wr) => wr.id === widgetId);
          if (!w) return null;
          const Icon = w.icon;
          const isActive = activeTab === widgetId;
          const wLabel = widgetLabels[widgetId]?.[language] || w.label[language];
          return (
            <button
              key={widgetId}
              type="button"
              onClick={() => setActiveTab(widgetId)}
              className={`group relative flex items-center justify-center rounded-md p-1.5 transition-all ${
                isActive
                  ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
              }`}
              title={wLabel}
            >
              <Icon className="h-4 w-4" />
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute w-1 h-1 rounded-full bg-[var(--cc-accent-400)]"
                  style={{
                    [panelSide === "right" ? "left" : "right"]: -3,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              )}
              {/* Close button on non-AI tabs */}
              {widgetId !== "ai-assistant" && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(widgetId);
                  }}
                  className="absolute -top-1 -end-1 flex h-3 w-3 items-center justify-center rounded-full bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 hover:text-white"
                >
                  <X className="h-2 w-2" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {activeWidget && <activeWidget.icon className="h-4 w-4 shrink-0 text-[var(--cc-accent-400)]" />}
            <h3 className="truncate text-sm font-semibold text-slate-100">{customLabel}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {activeTab !== "ai-assistant" && (
              <button
                type="button"
                onClick={() => closeTab(activeTab)}
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
                title={t.widgets.close || "Close"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeWidget && ActiveContent ? (
            <PanelErrorBoundary widgetId={activeWidget.id}>
              <ActiveContent />
            </PanelErrorBoundary>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              {_t.widgets.noResults}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes sidePanelSlideIn {
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
