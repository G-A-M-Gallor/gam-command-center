"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomBar } from "./MobileBottomBar";
// EditToolbar moved into CanvasEditor — FieldLibrary opens from canvas toolbar
import { ContextMenuProvider } from "./ContextMenu";
import { GuideOverlay } from "./GuideOverlay";
import { useSettings } from "@/contexts/SettingsContext";
import { StyleOverrideProvider } from "@/contexts/StyleOverrideContext";
import { DashboardModeProvider } from "@/contexts/DashboardModeContext";
import { ShortcutsProvider } from "@/contexts/ShortcutsContext";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { InstallPrompt } from "./InstallPrompt";
import { GibberishDetector } from "./GibberishDetector";

const SIDEBAR_WIDTH = "15rem";
const STRIP_WIDTH = "48px";

const RECENT_PAGES_KEY = "cc-recent-pages";
const MAX_RECENT_PAGES = 10;

const tabLabels: Record<string, { he: string; en: string; ru: string }> = {
  "/dashboard/layers": { he: "שכבות", en: "Layers", ru: "Слои" },
  "/dashboard/editor": { he: "עורך", en: "Editor", ru: "Редактор" },
  "/dashboard/story-map": { he: "מפת סיפור", en: "Story Map", ru: "Карта историй" },
  "/dashboard/functional-map": { he: "מפה פונקציונלית", en: "Functional Map", ru: "Функциональная карта" },
  "/dashboard/ai-hub": { he: "מרכז AI", en: "AI Hub", ru: "Центр AI" },
  "/dashboard/design-system": { he: "מערכת עיצוב", en: "Design System", ru: "Дизайн-система" },
  "/dashboard/formily": { he: "טפסים", en: "Formily", ru: "Формы" },
  "/dashboard/architecture": { he: "ארכיטקטורה", en: "Architecture", ru: "Архитектура" },
  "/dashboard/plan": { he: "תוכנית", en: "Plan", ru: "План" },
  "/dashboard/settings": { he: "הגדרות", en: "Settings", ru: "Настройки" },
  "/dashboard/automations": { he: "אוטומציות", en: "Automations", ru: "Автоматизация" },
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarPosition, sidebarVisibility, language } = useSettings();
  const pathname = usePathname();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [floatOpen, setFloatOpen] = useState(false);

  // Bottom bar callbacks
  const handleBottomBarSidebarToggle = useCallback(() => setFloatOpen((prev) => !prev), []);
  const handleBottomBarWidgetPanelOpen = useCallback(() => {
    window.dispatchEvent(new Event("cc-widget-panel-toggle"));
  }, []);

  // Override sidebar behavior based on screen size
  const effectiveVisibility = useMemo(() => {
    if (breakpoint === "mobile") return "hidden";
    if (breakpoint === "tablet" && sidebarVisibility === "visible") return "float";
    return sidebarVisibility;
  }, [breakpoint, sidebarVisibility]);

  // Close sidebar when switching to hidden mode
  useEffect(() => {
    if (effectiveVisibility === "hidden") setFloatOpen(false);
  }, [effectiveVisibility]);

  // Track recent page visits
  useEffect(() => {
    const labels = tabLabels[pathname];
    if (!labels) return;
    const label = labels[language];
    try {
      const raw = localStorage.getItem(RECENT_PAGES_KEY);
      const pages: { href: string; label: string; timestamp: number }[] = raw
        ? JSON.parse(raw)
        : [];
      const filtered = pages.filter((p) => p.href !== pathname);
      const updated = [
        { href: pathname, label, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_PAGES);
      localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }, [pathname, language]);

  const isVisible = effectiveVisibility === "visible";
  const isFloat = effectiveVisibility === "float";
  const isHidden = effectiveVisibility === "hidden";

  // Backdrop only for hidden mode
  const showBackdrop = isHidden && floatOpen;

  const contentMargin = isVisible
    ? {
        marginLeft: sidebarPosition === "left" ? SIDEBAR_WIDTH : 0,
        marginRight: sidebarPosition === "right" ? SIDEBAR_WIDTH : 0,
      }
    : isFloat
      ? {
          marginLeft: sidebarPosition === "left" ? STRIP_WIDTH : 0,
          marginRight: sidebarPosition === "right" ? STRIP_WIDTH : 0,
        }
      : undefined;

  return (
    <DashboardModeProvider>
    <ShortcutsProvider>
    <StyleOverrideProvider>
    <ContextMenuProvider>
    <div data-cc-id="shell.root" className="min-h-screen bg-slate-900 text-slate-100">
      {/* Backdrop: only for hidden mode */}
      {showBackdrop && (
        <button
          type="button"
          onClick={() => setFloatOpen(false)}
          className="fixed inset-x-0 bottom-0 top-12 z-40 bg-black/30"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar: always rendered for visible + float; translate-controlled for hidden */}
      <Sidebar
        effectiveMode={effectiveVisibility}
        isFloating={isFloat || isHidden}
        isOpen={isFloat ? true : floatOpen}
        onClose={() => setFloatOpen(false)}
      />

      {/* Top Bar */}
      <TopBar onSidebarOpen={isHidden ? () => setFloatOpen(true) : undefined} />

      <main
        data-cc-id="content.main"
        className={`min-h-screen overflow-x-hidden p-[var(--cc-density-content)] ${
          isMobile ? "pt-12" : "pt-16"
        }`}
        style={{
          ...contentMargin,
          ...(isMobile ? { paddingBottom: "calc(3.5rem + var(--safe-area-bottom, 0px) + 1rem)" } : undefined),
        }}
      >
        {children}
      </main>

      {/* Mobile bottom navigation bar */}
      {isMobile && (
        <MobileBottomBar
          sidebarOpen={floatOpen}
          onSidebarToggle={handleBottomBarSidebarToggle}
          onWidgetPanelOpen={handleBottomBarWidgetPanelOpen}
        />
      )}

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* Gibberish auto-detection */}
      <GibberishDetector />

      {/* Guide mode overlay */}
      <GuideOverlay />
    </div>
    </ContextMenuProvider>
    </StyleOverrideProvider>
    </ShortcutsProvider>
    </DashboardModeProvider>
  );
}
