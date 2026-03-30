"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  ExternalLink,
  PanelRight,
  Copy,
  Trash2,
  Star,
  Link,
  Palette,
  Paintbrush,
  X,
} from "lucide-react";

// ─── Color Rule Types ───────────────────────────────

export interface ColorRule {
  field: string;
  value: string;
  color: string;
}

const COLOR_RULES_KEY = "cc-hub-color-rules";

export function loadColorRules(): ColorRule[] {
  try {
    const raw = localStorage.getItem(COLOR_RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveColorRules(rules: ColorRule[]) {
  try {
    localStorage.setItem(COLOR_RULES_KEY, JSON.stringify(rules));
  } catch {
    // Ignore localStorage save errors - not critical for functionality
  }
}

// ─── Context Menu ───────────────────────────────────

interface RowContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpen?: () => void;
  onOpenSidePanel?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onCopyLink?: () => void;
  onEditIcon?: () => void;
  onColorRule?: () => void;
  t: Record<string, string>;
}

interface MenuAction {
  key: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

export function RowContextMenu({
  x,
  y,
  onClose,
  onOpen,
  onOpenSidePanel,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  isFavorite,
  onCopyLink,
  onEditIcon,
  onColorRule,
  t,
}: RowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Viewport edge adjustment
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let adjustedX = x;
    let adjustedY = y;
    if (x + rect.width > window.innerWidth - 8) {
      adjustedX = window.innerWidth - rect.width - 8;
    }
    if (y + rect.height > window.innerHeight - 8) {
      adjustedY = window.innerHeight - rect.height - 8;
    }
    if (adjustedX !== x || adjustedY !== y) {
      setPos({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const actions: MenuAction[] = [
    { key: "open", label: t.openItem, icon: ExternalLink, onClick: onOpen, hidden: !onOpen },
    { key: "sidePanel", label: t.openInSidePanel, icon: PanelRight, onClick: onOpenSidePanel, hidden: !onOpenSidePanel },
    { key: "duplicate", label: t.duplicate, icon: Copy, onClick: onDuplicate, hidden: !onDuplicate },
    { key: "favorite", label: isFavorite ? t.removeFromFavorites : t.addToFavorites, icon: Star, onClick: onToggleFavorite, hidden: !onToggleFavorite },
    { key: "copyLink", label: t.copyLink, icon: Link, onClick: onCopyLink, hidden: !onCopyLink },
    { key: "editIcon", label: t.editIcon, icon: Palette, onClick: onEditIcon, hidden: !onEditIcon },
    { key: "colorRule", label: t.colorRule, icon: Paintbrush, onClick: onColorRule, hidden: !onColorRule },
    { key: "delete", label: t.deleteItem, icon: Trash2, onClick: onDelete, destructive: true, hidden: !onDelete },
  ];

  const visibleActions = actions.filter((a) => !a.hidden);

  const handleAction = useCallback(
    (action: MenuAction) => {
      action.onClick?.();
      onClose();
    },
    [onClose]
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-lg border border-white/[0.08] bg-slate-900 py-1 shadow-xl shadow-black/40"
      style={{ left: pos.x, top: pos.y }}
    >
      {visibleActions.map((action, i) => {
        const Icon = action.icon;
        const showDivider = action.destructive && i > 0;
        return (
          <div key={action.key}>
            {showDivider && (
              <div className="mx-2 my-1 border-t border-white/[0.06]" />
            )}
            <button
              type="button"
              onClick={() => handleAction(action)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                action.destructive
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-slate-300 hover:bg-white/[0.05]"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{action.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Color Rule Dialog ──────────────────────────────

interface ColorRuleDialogProps {
  onClose: () => void;
  onSave: (rule: ColorRule) => void;
  onRemove?: () => void;
  existing?: ColorRule | null;
  t: Record<string, string>;
}

const PRESET_COLORS = [
  "#4ade80", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171",
  "#38bdf8", "#e879f9", "#34d399", "#fb923c", "#94a3b8",
];

export function ColorRuleDialog({
  onClose,
  onSave,
  onRemove,
  existing,
  t,
}: ColorRuleDialogProps) {
  const [field, setField] = useState(existing?.field ?? "status");
  const [value, setValue] = useState(existing?.value ?? "");
  const [color, setColor] = useState(existing?.color ?? PRESET_COLORS[0]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
      <div className="gam-card w-80 rounded-[var(--cc-radius-lg)] border border-white/[0.08] bg-slate-900 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200">
            {t.colorRuleTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">
              {t.colorRuleField}
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[var(--cc-accent-500)]"
            >
              <option value="status">Status</option>
              <option value="entity_type">Entity Type</option>
              <option value="layer">Layer</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">
              {t.colorRuleValue}
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. active"
              className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[var(--cc-accent-500)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">
              {t.colorRuleColor}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-md border-2 transition-all ${
                    color === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (value.trim()) {
                onSave({ field, value: value.trim(), color });
              }
            }}
            disabled={!value.trim()}
            className="flex-1 rounded-md bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-50"
          >
            {t.colorRuleSave}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
            >
              {t.colorRuleRemove}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
