"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, Loader2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/contexts/ToastContext";
import { getTranslations } from "@/lib/i18n";
import { fetchEntityTypes, createNote } from "@/lib/supabase/entityQueries";
import type { EntityType } from "@/lib/entities/types";
import type { WidgetSize } from "./WidgetRegistry";

const CREATED_ITEMS_KEY = "cc-created-items";

interface CreatedItem {
  type: string;
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
  const lang = language === "he" ? "he" : language === "ru" ? "ru" : "en";

  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntityTypes().then(setEntityTypes);
  }, []);

  const creatingType = creating
    ? entityTypes.find((et) => et.slug === creating)
    : null;

  const handleCreate = useCallback(async () => {
    if (!title.trim() || !creating || saving) return;
    setSaving(true);

    const et = entityTypes.find((e) => e.slug === creating);
    const label = et?.label[lang] || creating;

    try {
      const note = await createNote(title.trim(), creating);
      if (!note) throw new Error("createNote failed");

      saveItem({ type: creating, title: title.trim(), timestamp: Date.now() });
      toast({ message: `${label}: ${title.trim()}`, type: "success" });
      window.dispatchEvent(
        new CustomEvent("cc-notify", {
          detail: {
            type: "status",
            titleHe: `${label}: ${title.trim()}`,
            titleEn: `${label}: ${title.trim()}`,
          },
        })
      );
      // Navigate to the new entity detail page
      router.push(`/dashboard/entities/${creating}/${note.id}`);
    } catch {
      saveItem({ type: creating, title: title.trim(), timestamp: Date.now() });
      toast({
        message: `${label}: ${title.trim()} (${language === "he" ? "שמור מקומית" : "saved locally"})`,
        type: "warning",
      });
    }
    setSaving(false);
    setTitle("");
    setCreating(null);
  }, [title, creating, saving, entityTypes, lang, toast, language, router]);

  const todayCount = getCreatedTodayCount();

  return (
    <div className="space-y-3">
      {/* Action cards — Document + all entity types */}
      <div className="grid grid-cols-3 gap-2">
        {/* Document — navigates to editor */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/editor")}
          className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/30 p-3 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/50"
        >
          <FileText className="h-5 w-5 text-blue-400" />
          <span className="text-[11px]">{t.widgets.newDocAction}</span>
        </button>

        {/* Dynamic entity type buttons */}
        {entityTypes.map((et) => (
          <button
            key={et.slug}
            type="button"
            onClick={() => setCreating(et.slug)}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/30 p-3 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/50"
          >
            <span className="text-lg">{et.icon}</span>
            <span className="text-[11px] truncate max-w-full">
              {et.label[lang] || et.slug}
            </span>
          </button>
        ))}
      </div>

      {/* Inline creation form */}
      {creating && (
        <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              {creatingType && <span>{creatingType.icon}</span>}
              {creatingType?.label[lang] || creating}
            </span>
            <button
              type="button"
              onClick={() => {
                setCreating(null);
                setTitle("");
              }}
              className="text-slate-500 hover:text-slate-300"
              aria-label="Close"
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
              disabled={!title.trim() || saving}
              className="flex items-center gap-1.5 rounded bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
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
