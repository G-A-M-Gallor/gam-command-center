"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderPlus, CheckSquare, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/contexts/ToastContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

const CREATED_ITEMS_KEY = "cc-created-items";

interface CreatedItem {
  type: "project" | "task";
  title: string;
  timestamp: number;
}

function loadCreatedItems(): CreatedItem[] {
  try {
    const raw = localStorage.getItem(CREATED_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItem(item: CreatedItem) {
  const items = loadCreatedItems();
  items.push(item);
  localStorage.setItem(CREATED_ITEMS_KEY, JSON.stringify(items));
}

function getCreatedTodayCount(): number {
  const items = loadCreatedItems();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return items.filter((i) => i.timestamp >= today.getTime()).length;
}

export function QuickCreatePanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const router = useRouter();
  const { toast } = useToast();

  const [creating, setCreating] = useState<"project" | "task" | null>(null);
  const [title, setTitle] = useState("");

  const handleCreate = useCallback(() => {
    if (!title.trim() || !creating) return;
    saveItem({ type: creating, title: title.trim(), timestamp: Date.now() });
    const label = creating === "project" ? t.widgets.newProjectAction : t.widgets.newTaskAction;
    toast({ message: `${label}: ${title.trim()}`, type: "success" });
    setTitle("");
    setCreating(null);
  }, [title, creating, t, toast]);

  const todayCount = getCreatedTodayCount();

  return (
    <div className="space-y-3">
      {/* Action cards */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/editor")}
          className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/30 p-3 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/50"
        >
          <FileText className="h-5 w-5 text-blue-400" />
          <span className="text-[11px]">{t.widgets.newDocAction}</span>
        </button>
        <button
          type="button"
          onClick={() => setCreating("project")}
          className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/30 p-3 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/50"
        >
          <FolderPlus className="h-5 w-5 text-emerald-400" />
          <span className="text-[11px]">{t.widgets.newProjectAction}</span>
        </button>
        <button
          type="button"
          onClick={() => setCreating("task")}
          className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/30 p-3 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/50"
        >
          <CheckSquare className="h-5 w-5 text-amber-400" />
          <span className="text-[11px]">{t.widgets.newTaskAction}</span>
        </button>
      </div>

      {/* Inline creation form */}
      {creating && (
        <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              {creating === "project"
                ? t.widgets.newProjectAction
                : t.widgets.newTaskAction}
            </span>
            <button
              type="button"
              onClick={() => {
                setCreating(null);
                setTitle("");
              }}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={t.widgets.titlePlaceholder}
              className="flex-1 rounded border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!title.trim()}
              className="rounded bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40"
            >
              {t.widgets.create}
            </button>
          </div>
        </div>
      )}

      {/* Counter */}
      {todayCount > 0 && (
        <p className="text-center text-[11px] text-slate-500">
          {t.widgets.createdToday}: {todayCount}
        </p>
      )}
    </div>
  );
}

export function QuickCreateBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);

  if (size < 2) return null;

  const count = getCreatedTodayCount();

  if (size >= 3 && count > 0) {
    return (
      <span className="truncate text-xs text-slate-400">
        {t.widgets.new} ({count})
      </span>
    );
  }

  return (
    <span className="truncate text-xs text-slate-400">{t.widgets.new}</span>
  );
}
