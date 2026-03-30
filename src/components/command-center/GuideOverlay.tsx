"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Info, Bot } from "lucide-react";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { getStylableElement } from "@/lib/styleOverrideRegistry";

interface TooltipState {
  visible: boolean;
  ccId: string;
  x: number;
  y: number;
  expanded: boolean;
}

const TOOLTIP_W = 280;

function getSupportChips(
  supports: Partial<Record<string, boolean>>,
  guide: Record<string, string>
): string[] {
  const chips: string[] = [];
  if (supports.backgroundColor || supports.color || supports.textHighlight || supports.borderColor) {
    chips.push(guide.colors);
  }
  if (supports.fontFamily || supports.fontSize || supports.letterSpacing || supports.lineHeight) {
    chips.push(guide.typography);
  }
  if (supports.textContent) {
    chips.push(guide.text);
  }
  return chips;
}

export function GuideOverlay() {
  const { guideMode, editMode } = useDashboardMode();
  const { language } = useSettings();
  const _t = getTranslations(language);
  const elLabels = t.elementLabels as Record<string, string>;
  const elDescs = (_t as unknown as Record<string, Record<string, string>>).elementDescriptions;
  const guide = (_t as unknown as Record<string, Record<string, string>>).guide;

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    ccId: "",
    x: 0,
    y: 0,
    expanded: false,
  });

  const tooltipRef = useRef<HTMLDivElement>(null);
  const currentTarget = useRef<HTMLElement | null>(null);

  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      if (!guideMode) return;

      let el = e.target as HTMLElement | null;
      while (el && !el.dataset.ccId) {
        el = el.parentElement;
      }
      if (!el?.dataset.ccId) return;

      // Same element — skip
      if (currentTarget.current === el) return;
      currentTarget.current = el;

      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Position tooltip near the element
      let left = rect.left;
      let top = rect.bottom + 8;

      // Clamp horizontally
      if (left + TOOLTIP_W > vw - 8) left = vw - TOOLTIP_W - 8;
      if (left < 8) left = 8;

      // If below overflows, try above
      if (top + 200 > vh) top = rect.top - 200 - 8;
      if (top < 8) top = 8;

      setTooltip({
        visible: true,
        ccId: el.dataset.ccId,
        x: left,
        y: top,
        expanded: false,
      });
    },
    [guideMode, setTooltip]
  );

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      if (!guideMode) return;

      const related = e.relatedTarget as HTMLElement | null;
      // Don't close if mouse moved into the tooltip
      if (tooltipRef.current?.contains(related)) return;

      // Don't close if still over a data-cc-id element
      let el = related;
      while (el && !el?.dataset?.ccId) {
        el = el.parentElement;
      }
      if (el?.dataset?.ccId) return;

      currentTarget.current = null;
      setTooltip((prev) => ({ ...prev, visible: false }));
    },
    [guideMode, setTooltip]
  );

  // Close tooltip when mouse leaves the tooltip itself
  const handleTooltipLeave = useCallback(() => {
    currentTarget.current = null;
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [setTooltip]);

  useEffect(() => {
    if (!guideMode) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      currentTarget.current = null;
      return;
    }

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
    };
  }, [guideMode, handleMouseOver, handleMouseOut]);

  if (!guideMode || !tooltip.visible) return null;

  const element = getStylableElement(tooltip.ccId);
  const label = element
    ? elLabels[element.labelKey] || tooltip.ccId
    : tooltip.ccId;
  const description = element
    ? elDescs?.[element.descriptionKey] || ""
    : "";
  const chips = element
    ? getSupportChips(element.supports as Record<string, boolean>, guide)
    : [];

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[90] border-s-[3px] border-s-[var(--cc-accent-500,#8b5cf6)] bg-slate-800 shadow-xl"
      style={{
        top: tooltip.y,
        left: tooltip.x,
        width: TOOLTIP_W,
        borderRadius: "0 var(--cc-radius-lg, 8px) var(--cc-radius-lg, 8px) 0",
      }}
      onMouseLeave={handleTooltipLeave}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <h4 className="text-sm font-semibold text-slate-100">{label}</h4>
        <p className="mt-0.5 text-[11px] font-mono text-slate-500">{tooltip.ccId}</p>
      </div>

      {/* Description */}
      {description && (
        <p className="px-3 pb-2 text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      )}

      {/* Support chips */}
      {chips.length > 0 && (
        <div className="flex gap-1.5 px-3 pb-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Expanded info */}
      {tooltip.expanded && element && (
        <div className="border-_t border-slate-700/50 px-3 py-2">
          <p className="mb-1 text-[10px] font-medium text-slate-500">{guide.supports}</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(element.supports).map(
              ([key, val]) =>
                val && (
                  <span
                    key={key}
                    className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[9px] font-mono text-slate-400"
                  >
                    {key}
                  </span>
                )
            )}
          </div>
          {editMode && (
            <p className="mt-2 text-[10px] text-[var(--cc-accent-400,#a78bfa)]">
              {guide.editHint}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex border-t border-slate-700/50">
        <button
          type="button"
          onClick={() =>
            setTooltip((prev) => ({ ...prev, expanded: !prev.expanded }))
          }
          className="flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
        >
          <Info className="h-3 w-3" />
          {guide.moreInfo}
        </button>
        <button
          type="button"
          onClick={() => {
            // Dispatch custom event to open AI with element context
            const event = new CustomEvent("cc-open-ai", {
              detail: { _context: `element:${tooltip.ccId}` },
            });
            window.dispatchEvent(event);
          }}
          className="flex flex-1 items-center justify-center gap-1 border-s border-slate-700/50 py-2 text-[10px] font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
        >
          <Bot className="h-3 w-3" />
          {guide.askAI}
        </button>
      </div>
    </div>
  );
}
