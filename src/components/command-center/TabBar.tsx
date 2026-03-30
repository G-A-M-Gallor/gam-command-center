"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { _X } from "lucide-react";
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
  /** When true, TopBar is in hover mode (hidden by default) — TabBar sticks to top and moves with TopBar */
  topbarHover?: boolean;
  /** Whether TopBar is currently visible (always true if topbarHover is false) */
  topbarVisible?: boolean;
}

export function TabBar({ contentMarginLeft, contentMarginRight, topbarHover = false, topbarVisible = true }: TabBarProps) {
  const pathname = usePathname();
  const _router = useRouter();
  const { language } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<RecentPage[]>([]);

  // Load recent pages from localStorage
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(RECENT_PAGES_KEY);
        if (raw) setPages(JSON.parse(raw));
      } catch (_error) {
        // Ignore localStorage errors
      }
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
    } catch (_error) {
      // Ignore navigation errors
    }
  };

  if (pages.length === 0) return null;

  // When topbar is in hover mode:
  // - If topbar hidden → tabbar sticks to top (0)
  // - If topbar visible (hovered) → tabbar sits below topbar (48px)
  // When topbar is normal → always below topbar (48px)
  const topbarHidden = topbarHover && !topbarVisible;
  const tabTop = topbarHidden ? 0 : 48;

  return (
    <div
      data-cc-id="tabbar.root"
      className="fixed z-30 flex h-8 items-center border-b border-slate-700/50 backdrop-blur-sm transition-all duration-200 ease-out"
      style={{
        top: tabTop,
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
