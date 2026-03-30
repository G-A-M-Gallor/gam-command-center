"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Pin, PinOff, PanelLeftOpen, PanelRightOpen, _X, Trash2 } from "lucide-react";
import { useTray } from "@/lib/hooks/useTray";
import { useSplitScreen } from "@/lib/hooks/useSplitScreen";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";

interface TabTrayProps {
  contentMarginLeft?: string | number;
  contentMarginRight?: string | number;
  topbarHover?: boolean;
  topbarVisible?: boolean;
  /** Offset from top when tabbar is also visible */
  tabBarVisible?: boolean;
}

export function TabTray({
  contentMarginLeft,
  contentMarginRight,
  topbarHover = false,
  topbarVisible = true,
  tabBarVisible = false,
}: TabTrayProps) {
  const _router = useRouter();
  const pathname = usePathname();
  const { language } = useSettings();
  const _t = getTranslations(language);
  const tray = useTray();
  const split = useSplitScreen();

  const topbarHidden = topbarHover && !topbarVisible;
  const baseTop = topbarHidden ? 0 : 48;
  const tabBarOffset = tabBarVisible ? 32 : 0;
  const trayTop = baseTop + tabBarOffset;

  const handlePin = useCallback(() => {
    // Get current page label from recent pages
    try {
      const raw = localStorage.getItem("cc-recent-pages");
      const pages: { href: string; label: string }[] = raw ? JSON.parse(raw) : [];
      const current = pages.find((p) => p.href === pathname);
      tray.pin(pathname, current?.label || pathname.split("/").pop() || "Page");
    } catch {
      tray.pin(pathname, pathname.split("/").pop() || "Page");
    }
  }, [pathname, tray]);

  const trayT = t.tray as Record<string, string>;

  return (
    <div
      data-cc-id="tray.root"
      className="fixed z-30 flex h-8 items-center border-b border-slate-700/50 backdrop-blur-sm transition-all duration-200 ease-out"
      style={{
        top: trayTop,
        left: contentMarginLeft ?? 0,
        right: contentMarginRight ?? 0,
        backgroundColor: "color-mix(in srgb, var(--nav-bg) 85%, transparent)",
      }}
    >
      {/* Pin current page button */}
      <button
        type="button"
        onClick={tray.isPinned(pathname) ? () => tray.unpin(pathname) : handlePin}
        className={`flex h-full shrink-0 items-center gap-1 border-e border-slate-700/50 px-2 text-[10px] transition-colors ${
          tray.isPinned(pathname)
            ? "text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)]"
            : "text-slate-500 hover:text-slate-300"
        }`}
        title={tray.isPinned(pathname) ? trayT.unpinFromTray : trayT.pinToTray}
      >
        {tray.isPinned(pathname) ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
      </button>

      {/* Pinned items */}
      <div className="flex h-full flex-1 items-center gap-0.5 overflow-x-auto px-1 scrollbar-none">
        {tray.items.length === 0 ? (
          <span className="px-2 text-[10px] text-slate-600 italic">{trayT.emptyTray}</span>
        ) : (
          tray.items.map((item) => {
            const isActive = item.href === pathname;
            const dockedSide = split.getSide(item.href);
            return (
              <div
                key={item.href}
                className={`group flex h-6 shrink-0 items-center gap-0.5 rounded text-[11px] transition-colors ${
                  isActive
                    ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)] font-medium"
                    : dockedSide
                      ? "bg-slate-700/50 text-slate-300"
                      : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
              >
                {/* Navigate */}
                <button
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="truncate max-w-[100px] px-1.5 py-0.5"
                >
                  {item.label}
                </button>

                {/* Split icons */}
                <span className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => split.dock(item.href, "left")}
                    className={`rounded p-0.5 transition-colors ${
                      dockedSide === "left"
                        ? "text-[var(--cc-accent-400)]"
                        : "text-slate-600 hover:text-slate-300"
                    }`}
                    title={trayT.splitLeft}
                  >
                    <PanelLeftOpen className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => split.dock(item.href, "right")}
                    className={`rounded p-0.5 transition-colors ${
                      dockedSide === "right"
                        ? "text-[var(--cc-accent-400)]"
                        : "text-slate-600 hover:text-slate-300"
                    }`}
                    title={trayT.splitRight}
                  >
                    <PanelRightOpen className="h-2.5 w-2.5" />
                  </button>
                </span>

                {/* Unpin */}
                <button
                  type="button"
                  onClick={() => {
                    // Also undock if docked
                    if (split.getSide(item.href)) {
                      const side = split.getSide(item.href)!;
                      split.undock(side);
                    }
                    tray.unpin(item.href);
                  }}
                  className="rounded p-0.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:text-red-400"
                  aria-label={`Unpin ${item.label}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Right side: split indicator + clear */}
      <div className="flex h-full shrink-0 items-center gap-1 border-s border-slate-700/50 px-2">
        {split.isActive && (
          <button
            type="button"
            onClick={split.clearSplit}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-amber-400 hover:bg-amber-500/10 transition-colors"
            title={trayT.closeSplit}
          >
            <_X className="h-2.5 w-2.5" />
            <span>{trayT.closeSplit}</span>
          </button>
        )}
        {tray.items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              split.clearSplit();
              tray.clear();
            }}
            className="rounded p-1 text-slate-600 hover:text-red-400 transition-colors"
            title={trayT.clearAll}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
