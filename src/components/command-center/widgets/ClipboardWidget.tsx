"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

const STORAGE_KEY = "cc-clipboard-history";
const EVENT_NAME = "clipboard-change";
const MAX_ITEMS = 10;

interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
}

function loadItems(): ClipboardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: ClipboardItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function ClipboardPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setItems(loadItems());
    function sync() {
      setItems(loadItems());
    }
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  const copyToClipboard = useCallback(
    async (item: ClipboardItem) => {
      try {
        await navigator.clipboard.writeText(item.text);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 1500);
      } catch {
        /* ignore */
      }
    },
    []
  );

  const removeItem = useCallback(
    (id: string) => {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      saveItems(updated);
    },
    [items]
  );

  const clearAll = useCallback(() => {
    setItems([]);
    saveItems([]);
  }, []);

  return (
    <div className="space-y-2">
      {/* Clear all */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-400"
          >
            <Trash2 className="h-3 w-3" />
            {t.widgets.clearAll}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {t.widgets.noClipboardItems}
        </p>
      ) : (
        <div className="space-y-0.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-slate-700/30"
            >
              <p className="min-w-0 flex-1 text-sm leading-tight text-slate-300">
                {item.text.length > 100
                  ? item.text.slice(0, 100) + "..."
                  : item.text}
              </p>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => copyToClipboard(item)}
                  className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-600 hover:text-slate-300"
                  aria-label="Copy"
                  title={t.widgets.copied}
                >
                  {copiedId === item.id ? (
                    <span className="text-[10px] text-emerald-400">
                      {t.widgets.copied}
                    </span>
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded p-1 text-slate-600 transition-colors hover:bg-slate-600 hover:text-slate-400"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClipboardBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [items, setItems] = useState<ClipboardItem[]>([]);

  // Listen for copy events within the app and store them
  useEffect(() => {
    function handleCopy() {
      const text = window.getSelection()?.toString()?.trim();
      if (!text) return;
      const current = loadItems();
      const filtered = current.filter((i) => i.text !== text);
      const updated = [
        { id: `clip-${Date.now()}`, text, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      saveItems(updated);
      setItems(updated);
    }
    function sync() {
      setItems(loadItems());
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setItems(loadItems());
    document.addEventListener("copy", handleCopy);
    window.addEventListener(EVENT_NAME, sync);
    return () => {
      document.removeEventListener("copy", handleCopy);
      window.removeEventListener(EVENT_NAME, sync);
    };
  }, []);

  if (size < 2) return null;

  // Size 2: count
  if (size === 2) {
    if (items.length === 0) return null;
    return (
      <span className="text-xs text-slate-400">
        {items.length} {t.widgets.clipboardItems}
      </span>
    );
  }

  // Size 3: latest item text
  if (size === 3) {
    const latest = items[0];
    if (!latest) return null;
    return (
      <span className="truncate text-xs text-slate-400">
        {latest.text.slice(0, 30)}
        {latest.text.length > 30 ? "..." : ""}
      </span>
    );
  }

  // Size 4: last 2 items
  const top2 = items.slice(0, 2);
  if (top2.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-col">
      {top2.map((item) => (
        <span key={item.id} className="truncate text-[10px] text-slate-400">
          {item.text.slice(0, 30)}
          {item.text.length > 30 ? "..." : ""}
        </span>
      ))}
    </div>
  );
}
