"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X as XIcon, ChevronDown, ChevronUp, Pipette, RotateCcw, Clock } from "lucide-react";
import { useStyleOverrides } from "@/contexts/StyleOverrideContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
import { getTranslations } from "@/lib/i18n";
import { getStylableElement } from "@/lib/styleOverrideRegistry";
import { ColorPicker } from "./ColorPicker";

// ─── Context Menu Provider ───────────────────────────────────

interface MenuState {
  open: boolean;
  x: number;
  y: number;
  ccId: string;
}

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuState>({ open: false, x: 0, y: 0, ccId: "" });
  const { editMode } = useDashboardMode();

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Only intercept when edit mode is on
    if (!editMode) return;

    // Shift+right-click = native menu
    if (e.shiftKey) return;

    // Don't intercept on form elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    // Walk up to find nearest data-cc-id
    let el: HTMLElement | null = target;
    while (el && !el.dataset.ccId) {
      el = el.parentElement;
    }
    if (!el?.dataset.ccId) return;

    e.preventDefault();
    setMenu({ open: true, x: e.clientX, y: e.clientY, ccId: el.dataset.ccId });
  }, [editMode]);

  const handleClose = useCallback(() => {
    setMenu((prev) => ({ ...prev, open: false }));
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!menu.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menu.open, handleClose]);

  return (
    <div onContextMenu={handleContextMenu} data-edit-mode={editMode || undefined}>
      {editMode && (
        <style>{`[data-edit-mode] [data-cc-id]:hover { outline: 1px dashed var(--cc-accent-500, #8b5cf6); outline-offset: 2px; }`}</style>
      )}
      {children}
      {menu.open && (
        <ContextMenu ccId={menu.ccId} x={menu.x} y={menu.y} onClose={handleClose} />
      )}
    </div>
  );
}

// ─── Context Menu Panel ──────────────────────────────────────

type ColorTarget = "backgroundColor" | "color" | "textHighlight" | "borderColor";

const COLOR_TARGETS: { key: ColorTarget; tKey: string }[] = [
  { key: "backgroundColor", tKey: "backgroundColor" },
  { key: "color", tKey: "textColor" },
  { key: "textHighlight", tKey: "textHighlight" },
  { key: "borderColor", tKey: "borderColor" },
];

const FONT_SIZE_PRESETS = ["11", "12", "14", "16", "18", "20", "24"];

const FONT_OPTIONS = [
  { value: "var(--font-geist-sans)", label: "Geist" },
  { value: "var(--font-inter), sans-serif", label: "Inter" },
  { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: "System" },
];

function ContextMenu({
  ccId,
  x,
  y,
  onClose,
}: {
  ccId: string;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { language, savedColors } = useSettings();
  const { overrides, setElementStyle, resetElement, resetAll, textHistory, clearTextHistory } = useStyleOverrides();
  const t = getTranslations(language);
  const element = getStylableElement(ccId);

  const [position, setPosition] = useState({ top: y, left: x });
  const [activeColorTarget, setActiveColorTarget] = useState<ColorTarget>("backgroundColor");
  const [showPicker, setShowPicker] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [typographyOpen, setTypographyOpen] = useState(true);
  const [textOpen, setTextOpen] = useState(true);

  const currentStyle = useMemo(() => overrides[ccId] || {}, [overrides, ccId]);
  const cm = t.contextMenu;
  const elLabels = t.elementLabels;
  const label = element ? (elLabels as Record<string, string>)[element.labelKey] || ccId : ccId;

  // RTL-aware positioning
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dir = document.documentElement.dir;

    let adjustedX = x;
    let adjustedY = y;

    if (y + rect.height > vh - 8) adjustedY = y - rect.height;
    if (dir === "rtl") {
      adjustedX = x - rect.width;
      if (adjustedX < 8) adjustedX = x;
    } else {
      if (x + rect.width > vw - 8) adjustedX = x - rect.width;
    }
    setPosition({
      top: Math.max(8, adjustedY),
      left: Math.max(8, adjustedX),
    });
  }, [x, y]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid catching the same right-click
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const handleColorChange = useCallback(
    (hex: string) => {
      setElementStyle(ccId, { [activeColorTarget]: hex });
    },
    [ccId, activeColorTarget, setElementStyle]
  );

  const handleClearColor = useCallback(() => {
    const updated = { ...currentStyle };
    delete updated[activeColorTarget];
    // Re-set all remaining props
    setElementStyle(ccId, updated);
    // Actually need to reset and re-apply
    resetElement(ccId);
    if (Object.keys(updated).length > 0) {
      setElementStyle(ccId, updated);
    }
  }, [ccId, activeColorTarget, currentStyle, setElementStyle, resetElement]);

  const supportsColors = element
    ? COLOR_TARGETS.some((ct) => element.supports[ct.key])
    : true;
  const supportsTypography = element
    ? !!(element.supports.fontFamily || element.supports.fontSize || element.supports.letterSpacing || element.supports.lineHeight)
    : true;
  const supportsText = element?.supports.textContent ?? false;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-80 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 shadow-2xl"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <div>
          <h3 className="text-sm font-medium text-slate-200">{label}</h3>
          <p className="text-[10px] font-mono text-slate-500">{ccId}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Colors Section */}
        {supportsColors && (
          <CollapsibleSection
            label={cm.colors}
            open={colorsOpen}
            onToggle={() => setColorsOpen(!colorsOpen)}
          >
            {/* Color target tabs */}
            <div className="mb-2 flex gap-1">
              {COLOR_TARGETS.filter(
                (ct) => !element || element.supports[ct.key]
              ).map((ct) => (
                <button
                  key={ct.key}
                  type="button"
                  onClick={() => { setActiveColorTarget(ct.key); setShowPicker(false); }}
                  className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                    activeColorTarget === ct.key
                      ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                      : "bg-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {(cm as Record<string, string>)[ct.tKey]}
                </button>
              ))}
            </div>

            {/* Current value indicator */}
            {currentStyle[activeColorTarget] && (
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded border border-slate-600"
                  style={{ backgroundColor: currentStyle[activeColorTarget] }}
                />
                <span className="font-mono text-[10px] text-slate-400">
                  {currentStyle[activeColorTarget]}
                </span>
                <button
                  type="button"
                  onClick={handleClearColor}
                  className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-slate-700 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            )}

            {/* Saved palette swatches */}
            {savedColors.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {savedColors.map((sc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleColorChange(sc.hex)}
                    className="h-6 w-6 rounded-full border border-slate-600 transition-all hover:scale-110"
                    style={{ backgroundColor: sc.hex }}
                    title={sc.name || sc.hex}
                  />
                ))}
              </div>
            )}

            {/* Transparent option */}
            <button
              type="button"
              onClick={() => handleColorChange("transparent")}
              className="mb-2 rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:text-slate-300"
            >
              {cm.transparent}
            </button>

            {/* Toggle full picker */}
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="mb-2 flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:text-slate-300"
            >
              <Pipette className="h-3 w-3" />
              {cm.openPicker}
            </button>

            {showPicker && (
              <div className="mb-1">
                <ColorPicker
                  value={currentStyle[activeColorTarget] || "#9333ea"}
                  onChange={handleColorChange}
                />
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Typography Section */}
        {supportsTypography && (
          <CollapsibleSection
            label={cm.typography}
            open={typographyOpen}
            onToggle={() => setTypographyOpen(!typographyOpen)}
          >
            {/* Font Family */}
            {(!element || element.supports.fontFamily) && (
              <div className="mb-3">
                <label className="mb-1 block text-[10px] text-slate-500">{cm.fontFamily}</label>
                <div className="flex gap-1">
                  {FONT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setElementStyle(ccId, { fontFamily: opt.value })}
                      className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                        currentStyle.fontFamily === opt.value
                          ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                          : "bg-slate-700 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Font Size */}
            {(!element || element.supports.fontSize) && (
              <div className="mb-3">
                <label className="mb-1 block text-[10px] text-slate-500">{cm.fontSize}</label>
                <div className="flex flex-wrap gap-1">
                  {FONT_SIZE_PRESETS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setElementStyle(ccId, { fontSize: `${size}px` })}
                      className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                        currentStyle.fontSize === `${size}px`
                          ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                          : "bg-slate-700 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="px"
                    defaultValue={currentStyle.fontSize?.replace("px", "") || ""}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val) setElementStyle(ccId, { fontSize: val.endsWith("px") ? val : `${val}px` });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="w-12 rounded bg-slate-700 px-2 py-1 text-center text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                  />
                </div>
              </div>
            )}

            {/* Letter Spacing */}
            {(!element || element.supports.letterSpacing) && (
              <div className="mb-3">
                <label className="mb-1 block text-[10px] text-slate-500">{cm.letterSpacing}</label>
                <input
                  type="text"
                  placeholder="0.05em"
                  defaultValue={currentStyle.letterSpacing || ""}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) setElementStyle(ccId, { letterSpacing: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className="w-20 rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                />
              </div>
            )}

            {/* Line Height */}
            {(!element || element.supports.lineHeight) && (
              <div className="mb-3">
                <label className="mb-1 block text-[10px] text-slate-500">{cm.lineHeight}</label>
                <input
                  type="text"
                  placeholder="1.5"
                  defaultValue={currentStyle.lineHeight || ""}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) setElementStyle(ccId, { lineHeight: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className="w-20 rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                />
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Text Content Section */}
        {supportsText && (
          <CollapsibleSection
            label={cm.textContent}
            open={textOpen}
            onToggle={() => setTextOpen(!textOpen)}
          >
            <input
              type="text"
              placeholder={cm.textContent}
              defaultValue={currentStyle.textContent || ""}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  setElementStyle(ccId, { textContent: val });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
            />

            {/* Name History Log */}
            <TextHistoryLog
              ccId={ccId}
              history={textHistory[ccId] || []}
              onRestore={(text) => setElementStyle(ccId, { textContent: text })}
              onClear={() => clearTextHistory(ccId)}
              cm={cm}
            />
          </CollapsibleSection>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-slate-700 px-3 py-2">
        <button
          type="button"
          onClick={() => { resetElement(ccId); onClose(); }}
          className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:text-slate-300"
        >
          <RotateCcw className="h-3 w-3" />
          {cm.resetElement}
        </button>
        <button
          type="button"
          onClick={() => { resetAll(); onClose(); }}
          className="rounded bg-slate-700 px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-900/30"
        >
          {cm.resetAll}
        </button>
      </div>
    </div>
  );
}

// ─── Text History Log ────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "<1m";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function TextHistoryLog({
  ccId,
  history,
  onRestore,
  onClear,
  cm,
}: {
  ccId: string;
  history: { text: string; timestamp: number }[];
  onRestore: (text: string) => void;
  onClear: () => void;
  cm: Record<string, string>;
}) {
  if (history.length === 0) return null;

  // Show newest first
  const reversed = [...history].reverse();

  return (
    <div className="mt-2 border-t border-slate-700/50 pt-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <Clock className="h-3 w-3" />
          {cm.nameHistory}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[9px] text-slate-500 transition-colors hover:text-red-400"
        >
          ×
        </button>
      </div>
      <div className="max-h-28 space-y-0.5 overflow-y-auto">
        {reversed.map((entry, i) => (
          <button
            key={`${ccId}-${entry.timestamp}-${i}`}
            type="button"
            onClick={() => onRestore(entry.text)}
            className="flex w-full items-center justify-between rounded px-1.5 py-1 text-start transition-colors hover:bg-slate-700"
            title={cm.restoreName}
          >
            <span className="truncate font-mono text-[11px] text-slate-300">
              {entry.text}
            </span>
            <span className="ms-2 shrink-0 text-[9px] text-slate-500">
              {formatRelativeTime(entry.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-700/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:text-white"
      >
        {label}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
