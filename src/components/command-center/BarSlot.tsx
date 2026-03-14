"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Lock, Unlock } from "lucide-react";
import { widgetRegistry, type WidgetSize } from "./widgets/WidgetRegistry";
import { useWidgets, type TopBarDisplayMode } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

const UNIT = 48;

interface BarSlotProps {
  widgetId: string;
  size: WidgetSize;
  locked: boolean;
  column: number;
  editMode: boolean;
  onToggleLock: (widgetId: string) => void;
  onWidgetClick: (widgetId: string) => void;
  onEditWidget: (widgetId: string) => void;
  displayMode: TopBarDisplayMode;
}

export function BarSlot({
  widgetId,
  size,
  locked,
  column,
  editMode,
  onToggleLock,
  onWidgetClick,
  onEditWidget,
  displayMode,
}: BarSlotProps) {
  const { widgetLabels } = useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);
  const [hovered, setHovered] = useState(false);

  const widget = widgetRegistry.find((w) => w.id === widgetId);
  if (!widget) return null;

  const Icon = widget.icon;
  const customLabel = widgetLabels[widgetId]?.[language];
  const label = customLabel || widget.label[language];

  const unitSize = displayMode === "compact" ? 36 : displayMode === "icons-only" ? 32 : UNIT;
  const showLabel = displayMode === "icons-only" ? false : size >= 2;

  // DnD
  const canDrag = !locked && editMode;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widgetId,
    disabled: !canDrag,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: column * UNIT,
    top: 0,
    bottom: 0,
    width: size * UNIT,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : "left 200ms ease, width 200ms ease",
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
    >
      <button
        type="button"
        onClick={() => {
          if (editMode) {
            onEditWidget(widgetId);
          } else {
            onWidgetClick(widgetId);
          }
        }}
        className={`relative flex h-full w-full items-center justify-center gap-1.5 rounded-sm transition-colors ${
          editMode
            ? "cursor-move border border-dashed border-slate-600/50 hover:border-[var(--cc-accent-500-50)]"
            : "hover:bg-slate-700/50"
        } ${locked ? "ring-1 ring-inset ring-amber-500/20" : ""}`}
        style={{ height: unitSize }}
      >
        <Icon className="h-4 w-4 shrink-0 text-slate-300" />
        {showLabel && (
          <span className="truncate text-xs text-slate-400">{label}</span>
        )}
      </button>

      {/* Lock indicator — visible on hover or when locked */}
      {(hovered || locked) && !isDragging && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(widgetId);
          }}
          className={`absolute -top-0.5 -right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-[9px] transition-all ${
            locked
              ? "bg-amber-600/90 text-white"
              : "bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100"
          }`}
          title={locked ? t.smartBar?.unlockWidget : t.smartBar?.lockWidget}
        >
          {locked ? <Lock size={9} /> : <Unlock size={9} />}
        </button>
      )}
    </div>
  );
}
