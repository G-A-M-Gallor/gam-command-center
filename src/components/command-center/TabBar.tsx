"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const RECENT_PAGES_KEY = "cc-recent-pages";

interface RecentPage {
  href: string;
  label: string;
  timestamp: number;
}

interface TabBarProps {
  contentMarginLeft?: string | number;
  contentMarginRight?: string | number;
}

export function TabBar({ contentMarginLeft, contentMarginRight }: TabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<RecentPage[]>([]);

  // Load recent pages from localStorage
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(RECENT_PAGES_KEY);
        if (raw) setPages(JSON.parse(raw));
      } catch {}
    };
    load();

    // Re-read when pathname changes (DashboardShell writes to localStorage on navigation)
    const id = setTimeout(load, 50);
    return () => clearTimeout(id);
  }, [pathname, language]);

  const handleRemove = (href: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const raw = localStorage.getItem(RECENT_PAGES_KEY);
      const current: RecentPage[] = raw ? JSON.parse(raw) : [];
      const updated = current.filter((p) => p.href !== href);
      localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
      setPages(updated);

      // If removing the active tab, navigate to the next one
      if (href === pathname && updated.length > 0) {
        router.push(updated[0].href);
      }
    } catch {}
  };

  if (pages.length === 0) return null;

  return (
    <div
      data-cc-id="tabbar.root"
      className="fixed z-30 flex h-8 items-center border-b border-slate-700/50 backdrop-blur-sm"
      style={{
        top: 48,
        left: contentMarginLeft ?? 0,
        right: contentMarginRight ?? 0,
        backgroundColor: "color-mix(in srgb, var(--nav-bg) 90%, transparent)",
      }}
    >
      <div
        ref={scrollRef}
        className="flex h-full flex-1 items-center gap-0.5 overflow-x-auto px-1 scrollbar-none"
      >
        {pages.map((page) => {
          const isActive = page.href === pathname;
          return (
            <button
              key={page.href}
              type="button"
              onClick={() => router.push(page.href)}
              className={`group flex h-6 shrink-0 items-center gap-1 rounded px-2 text-[11px] transition-colors ${
                isActive
                  ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)] font-medium"
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
              }`}
            >
              <span className="truncate max-w-[120px]">{page.label}</span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => handleRemove(page.href, e)}
                className={`rounded p-0.5 transition-all ${
                  isActive
                    ? "text-[var(--cc-accent-400)] hover:bg-[var(--cc-accent-600-30)]"
                    : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-400"
                }`}
                aria-label={`Close ${page.label}`}
              >
                <X className="h-2.5 w-2.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
