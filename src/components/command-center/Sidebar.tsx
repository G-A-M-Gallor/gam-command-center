"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  FileEdit,
  Map,
  Grid3X3,
  Bot,
  Palette,
  Network,
  Calendar,
  Compass,
  Zap,
  Settings,
  Shield,
  X,
  LogOut,
  List,
  LayoutGrid,
  AlignJustify,
  Star,
  Download,
  Share,
  Database,
  BookOpen,
  Sheet,
  Presentation,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { useInstallPrompt } from "@/lib/pwa/useInstallPrompt";
import { loadFavorites, saveFavorites } from "./widgets/FavoritesWidget";
import type { FavoriteItem } from "./widgets/FavoritesWidget";

const FULL_WIDTH = 240;
const MOBILE_WIDTH = 280;
const STRIP_WIDTH = 48;

const FILTER_KEY = "cc-sidebar-filter";
const VIEW_MODE_KEY = "cc-sidebar-view-mode";

// ─── Types ──────────────────────────────────────────────

type SidebarFilter = "all" | "active" | "coming-soon" | "favorites";
type ViewMode = "list" | "grid" | "compact";

// ─── Grouped Navigation ─────────────────────────────────

export interface NavItem {
  href: string;
  key: string;
  icon: React.ElementType;
  status: "active" | "coming-soon";
}

export interface NavGroup {
  id: string;
  labelKey: "groupCore" | "groupTools" | "groupSystem";
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    labelKey: "groupCore",
    items: [
      { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, status: "active" },
      { href: "/dashboard/layers", key: "layers", icon: Layers, status: "active" },
      { href: "/dashboard/editor", key: "editor", icon: FileEdit, status: "active" },
      { href: "/dashboard/story-map", key: "storyMap", icon: Map, status: "active" },
      { href: "/dashboard/ai-hub", key: "aiHub", icon: Bot, status: "active" },
      { href: "/dashboard/entities", key: "entities", icon: Database, status: "active" },
      { href: "/dashboard/wiki", key: "wiki", icon: BookOpen, status: "active" },
    ],
  },
  {
    id: "tools",
    labelKey: "groupTools",
    items: [
      { href: "/dashboard/functional-map", key: "functionalMap", icon: Grid3X3, status: "active" },
      { href: "/dashboard/design-system", key: "designSystem", icon: Palette, status: "active" },
      { href: "/dashboard/architecture", key: "architecture", icon: Network, status: "active" },
      { href: "/dashboard/plan", key: "plan", icon: Calendar, status: "active" },
      { href: "/roadmap", key: "roadmap", icon: Compass, status: "active" },
      { href: "/dashboard/grid", key: "grid", icon: Sheet, status: "active" },
      { href: "/dashboard/slides", key: "slides", icon: Presentation, status: "active" },
    ],
  },
  {
    id: "system",
    labelKey: "groupSystem",
    items: [
      { href: "/dashboard/automations", key: "automations", icon: Zap, status: "active" },
      { href: "/dashboard/admin", key: "admin", icon: Shield, status: "active" },
      { href: "/dashboard/settings", key: "settings", icon: Settings, status: "active" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────

function loadFilter(): SidebarFilter {
  try {
    const v = localStorage.getItem(FILTER_KEY);
    if (v === "active" || v === "coming-soon" || v === "favorites") return v;
  } catch {}
  return "all";
}

function loadViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === "grid" || v === "compact") return v;
  } catch {}
  return "list";
}

// ─── Component ───────────────────────────────────────────

interface SidebarProps {
  /** Effective visibility mode (accounts for mobile/tablet overrides) */
  effectiveMode?: "visible" | "float" | "hidden";
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  effectiveMode,
  isFloating = false,
  isOpen = true,
  onClose,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const { language, sidebarPosition, sidebarVisibility, brandProfile } = useSettings();
  const { user, signOut, permissions } = useAuth();
  const { state: installState, canInstall, install: triggerInstall } = useInstallPrompt();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [hovered, setHovered] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(null);

  const [filter, setFilter] = useState<SidebarFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [favHrefs, setFavHrefs] = useState<Set<string>>(new Set());

  // Hydrate from localStorage + listen for cross-component favorites sync
  useEffect(() => {
    setFilter(loadFilter());
    setViewMode(loadViewMode());
    setFavHrefs(new Set(loadFavorites().map((f) => f.href)));

    const syncFavs = () => setFavHrefs(new Set(loadFavorites().map((f) => f.href)));
    window.addEventListener("cc-favorites-change", syncFavs);
    return () => window.removeEventListener("cc-favorites-change", syncFavs);
  }, []);

  const handleToggleFav = useCallback((href: string, label: string) => {
    const favs = loadFavorites();
    const idx = favs.findIndex((f) => f.href === href);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push({ id: `fav-${Date.now()}`, href, label });
    }
    saveFavorites(favs);
    setFavHrefs(new Set(favs.map((f) => f.href)));
    window.dispatchEvent(new Event("cc-favorites-change"));
  }, []);

  // Use effectiveMode (from DashboardShell) when available — it accounts for mobile/tablet overrides.
  // Fall back to raw sidebarVisibility for backwards compatibility.
  const mode = effectiveMode ?? sidebarVisibility;
  const isFloat = mode === "float";
  const isCollapsed = isFloat && !hovered;
  const onRight = sidebarPosition === "right";
  const expandedWidth = isMobile ? MOBILE_WIDTH : FULL_WIDTH;

  const isHidden = mode === "hidden";
  const shouldCloseOnNav = isHidden && isFloating && onClose;
  const isTranslatedOff = isHidden && isFloating && !isOpen;
  const translateClass =
    isTranslatedOff && onRight
      ? "translate-x-full"
      : isTranslatedOff && !onRight
        ? "-translate-x-full"
        : "translate-x-0";

  // ── Filter + view handlers ────────────────────────────
  const handleFilterChange = (f: SidebarFilter) => {
    setFilter(f);
    try { localStorage.setItem(FILTER_KEY, f); } catch {}
  };

  const handleViewModeChange = (v: ViewMode) => {
    setViewMode(v);
    try { localStorage.setItem(VIEW_MODE_KEY, v); } catch {}
  };

  // ── Compute filtered groups (includes RBAC page visibility) ─
  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      // RBAC: hide pages the user doesn't have access to
      if (permissions.visiblePages && !permissions.visiblePages.includes(item.key)) {
        return false;
      }
      if (filter === "all") return true;
      if (filter === "active") return item.status === "active";
      if (filter === "coming-soon") return item.status === "coming-soon";
      if (filter === "favorites") return favHrefs.has(item.href);
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  // ── Sliding active indicator measurement ─────────────
  useEffect(() => {
    if (isCollapsed || !navRef.current) {
      setIndicatorStyle(null);
      return;
    }
    requestAnimationFrame(() => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeEl) {
        const navRect = navRef.current.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          top: elRect.top - navRect.top + navRef.current.scrollTop,
          height: elRect.height,
        });
      } else {
        setIndicatorStyle(null);
      }
    });
  }, [pathname, isCollapsed, filter, viewMode]);

  // ── Filter tab definitions ────────────────────────────
  const sidebarT = t.sidebar as Record<string, string>;
  const filterTabs: { id: SidebarFilter; label: string }[] = [
    { id: "all", label: sidebarT.filterAll },
    { id: "active", label: sidebarT.filterActive },
    { id: "coming-soon", label: sidebarT.filterComingSoon },
    { id: "favorites", label: sidebarT.filterFavorites },
  ];

  const viewModes: { id: ViewMode; icon: React.ElementType; label: string }[] = [
    { id: "list", icon: List, label: sidebarT.viewList },
    { id: "grid", icon: LayoutGrid, label: sidebarT.viewGrid },
    { id: "compact", icon: AlignJustify, label: sidebarT.viewCompact },
  ];

  return (
    <aside
      data-cc-id="sidebar.root"
      className={`sidebar fixed top-12 z-50 shrink-0 overflow-hidden ${
        onRight ? "right-0 border-l" : "left-0 border-r"
      } border-slate-700/50 ${
        isFloat ? "shadow-lg" : ""
      } ${
        isHidden ? `transition-transform duration-200 ease-out ${translateClass}` : ""
      }`}
      style={{
        width: isCollapsed ? STRIP_WIDTH : expandedWidth,
        maxWidth: isMobile ? "100vw" : undefined,
        height: "calc(100vh - 48px)",
        transition: isFloat ? "width 300ms ease" : undefined,
        backgroundColor: isCollapsed
          ? "rgba(15, 23, 42, 0.8)"
          : "rgb(15, 23, 42)",
      }}
      onMouseEnter={isFloat ? () => setHovered(true) : undefined}
      onMouseLeave={isFloat ? () => setHovered(false) : undefined}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <header
          data-cc-id="sidebar.header"
          className="relative flex h-16 shrink-0 items-center border-b border-slate-700/50 overflow-hidden"
          style={{
            padding: isCollapsed ? "0" : "0 16px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: isCollapsed ? 0 : 8,
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[var(--cc-accent-500)]/[0.03] to-transparent pointer-events-none"
            aria-hidden
          />

          {(() => {
            const logoEl = brandProfile.logoDataUrl ? (
              <div data-cc-id="sidebar.header.logo" className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--cc-accent-600-20)]">
                <img src={brandProfile.logoDataUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div data-cc-id="sidebar.header.logo" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cc-accent-600-20)]">
                <Layers className="h-5 w-5 text-[var(--cc-accent-400)]" />
              </div>
            );
            const nameText = brandProfile.companyName || t.appName;

            if (isCollapsed) return <Link href="/" title="Workspace Hub" aria-label="Workspace Hub">{logoEl}</Link>;

            if (onRight) return (
              <>
                {isFloating && !isFloat && onClose && (
                  <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Link href="/" className="flex flex-1 items-center justify-end gap-2 transition-opacity hover:opacity-80" title="Workspace Hub">
                  <span data-cc-id="sidebar.header.name" data-cc-text="true" className="text-right text-[15px] font-semibold text-slate-100">{nameText}</span>
                  {logoEl}
                </Link>
              </>
            );

            return (
              <>
                <Link href="/" className="flex flex-1 items-center gap-2 transition-opacity hover:opacity-80" title="Workspace Hub">
                  {logoEl}
                  <span data-cc-id="sidebar.header.name" data-cc-text="true" className="text-left text-[15px] font-semibold text-slate-100">{nameText}</span>
                </Link>
                {isFloating && !isFloat && onClose && (
                  <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            );
          })()}
        </header>

        {/* Filter tabs + View mode (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="shrink-0 border-b border-slate-700/50 px-2 pt-2 pb-1.5 space-y-1.5">
            {/* Filter tabs */}
            <div data-cc-id="sidebar.filter-tabs" className="flex gap-0.5 rounded-lg bg-slate-800/50 p-0.5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={`flex-1 rounded-md px-1 py-1 text-[10px] font-medium transition-colors truncate ${
                    filter === tab.id
                      ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View mode toggle */}
            <div data-cc-id="sidebar.view-mode" className="flex items-center justify-center gap-0.5">
              {viewModes.map(({ id, icon: ModeIcon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleViewModeChange(id)}
                  title={label}
                  className={`rounded p-1 transition-colors ${
                    viewMode === id
                      ? "text-[var(--cc-accent-300)] bg-[var(--cc-accent-600-20)]"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  <ModeIcon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav with grouped items */}
        <nav
          ref={navRef}
          data-cc-id="sidebar.nav"
          className="relative min-h-0 flex-1 overflow-y-auto p-2"
        >
          {/* Sliding active indicator (list mode only) */}
          {!isCollapsed && viewMode === "list" && indicatorStyle && (
            <div
              className="absolute inset-x-2 rounded-lg bg-[var(--cc-accent-600-20)] border border-[var(--cc-accent-500)]/20 pointer-events-none transition-all duration-300 ease-out"
              style={{
                top: indicatorStyle.top,
                height: indicatorStyle.height,
              }}
            />
          )}

          {filteredGroups.map((group, gi) => (
            <div key={group.id}>
              {/* Group label / divider */}
              {gi > 0 && isCollapsed && (
                <div className="mx-2 my-2 border-t border-slate-700/30" />
              )}
              {!isCollapsed && viewMode === "list" && (
                <div className={gi === 0 ? "pt-1 pb-1 px-3" : "pt-4 pb-1 px-3"}>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                    {sidebarT[group.labelKey]}
                  </span>
                </div>
              )}
              {!isCollapsed && viewMode === "compact" && gi > 0 && (
                <div className="mx-2 my-1.5 border-t border-slate-700/30" />
              )}
              {!isCollapsed && viewMode === "grid" && (
                <div className={gi === 0 ? "pt-1 pb-1 px-1" : "pt-3 pb-1 px-1"}>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                    {sidebarT[group.labelKey]}
                  </span>
                </div>
              )}

              {/* Items — Grid view */}
              {!isCollapsed && viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-1 px-1">
                  {group.items.map(({ href, key, icon: Icon }) => {
                    const isActive = href === "/dashboard" ? pathname === "/dashboard" : (pathname === href || pathname.startsWith(href + "/"));
                    const label = (t.tabs as Record<string, string>)[key];
                    const isFav = favHrefs.has(href);
                    return (
                      <div key={href} className="group/grid relative">
                        <Link
                          href={href}
                          onClick={shouldCloseOnNav ? onClose : undefined}
                          data-active={isActive || undefined}
                          className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                            isActive
                              ? "nav-item-active bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-[9px] leading-tight truncate w-full">{label}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleFav(href, label); }}
                          className={`absolute top-0.5 right-0.5 rounded p-0.5 transition-all ${
                            isFav
                              ? "text-amber-400 opacity-100"
                              : "text-slate-600 opacity-0 group-hover/grid:opacity-100 hover:text-amber-400"
                          }`}
                          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className="h-2.5 w-2.5" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Items — List & Compact views */
                <div className={viewMode === "compact" && !isCollapsed ? "space-y-0" : "space-y-0.5"}>
                  {group.items.map(({ href, key, icon: Icon }) => {
                    const isActive = href === "/dashboard" ? pathname === "/dashboard" : (pathname === href || pathname.startsWith(href + "/"));
                    const label = (t.tabs as Record<string, string>)[key];

                    // ── Collapsed item ──
                    if (isCollapsed) {
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={shouldCloseOnNav ? onClose : undefined}
                          data-active={isActive || undefined}
                          aria-label={label}
                          className={`group relative flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                            isActive
                              ? "nav-item-active text-[var(--cc-accent-300)]"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          }`}
                        >
                          {isActive && (
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[var(--cc-accent-500)] ${
                                onRight ? "right-0" : "left-0"
                              }`}
                              aria-hidden
                            />
                          )}
                          <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                            !isActive ? "group-hover:scale-110" : ""
                          }`} />
                          {/* Tooltip */}
                          <span
                            className={`absolute ${
                              onRight ? "right-full mr-2" : "left-full ml-2"
                            } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                          >
                            {label}
                          </span>
                        </Link>
                      );
                    }

                    // ── Compact item ──
                    if (viewMode === "compact") {
                      const isFav = favHrefs.has(href);
                      return (
                        <div key={href} className="group/item relative">
                          <Link
                            href={href}
                            onClick={shouldCloseOnNav ? onClose : undefined}
                            data-active={isActive || undefined}
                            className={`relative z-10 flex items-center gap-2 rounded px-2.5 py-1 text-xs transition-colors ${
                              onRight ? "flex-row-reverse" : ""
                            } ${
                              isActive
                                ? "nav-item-active text-[var(--cc-accent-300)] font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>{label}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleFav(href, label)}
                            className={`absolute ${onRight ? "left-1" : "right-1"} top-1/2 -translate-y-1/2 z-20 rounded p-0.5 transition-all ${
                              isFav
                                ? "text-amber-400 opacity-100"
                                : "text-slate-600 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                            }`}
                            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className="h-2.5 w-2.5" fill={isFav ? "currentColor" : "none"} />
                          </button>
                        </div>
                      );
                    }

                    // ── Expanded list item ──
                    const isFav = favHrefs.has(href);
                    return (
                      <div key={href} className="group/item relative">
                        <Link
                          href={href}
                          onClick={shouldCloseOnNav ? onClose : undefined}
                          data-cc-id="sidebar.nav.link"
                          data-active={isActive || undefined}
                          className={`group relative z-10 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                            isActive
                              ? "nav-item-active text-[var(--cc-accent-300)] font-medium"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                          }`}
                        >
                          {onRight ? (
                            <>
                              <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="flex-1 text-right truncate">{label}</span>
                              <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                                !isActive ? "group-hover:scale-105" : ""
                              }`} />
                            </>
                          ) : (
                            <>
                              <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                                !isActive ? "group-hover:scale-105" : ""
                              }`} />
                              <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="flex-1 text-left truncate">{label}</span>
                            </>
                          )}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleFav(href, label)}
                          className={`absolute ${onRight ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 z-20 rounded p-0.5 transition-all ${
                            isFav
                              ? "text-amber-400 opacity-100"
                              : "text-slate-600 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                          }`}
                          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className="h-3 w-3" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Install app button */}
        {canInstall && (
          <div className="shrink-0 border-t border-slate-700/50 p-2">
            {isCollapsed ? (
              <button
                type="button"
                onClick={installState === "ios" ? undefined : triggerInstall}
                className="group relative flex w-full items-center justify-center rounded-lg p-2.5 text-[var(--cc-accent-400)] transition-colors hover:bg-[var(--cc-accent-600-20)]"
                title={t.pwa.installTitle}
              >
                {installState === "ios" ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                <span
                  className={`absolute ${
                    onRight ? "right-full mr-2" : "left-full ml-2"
                  } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                >
                  {t.pwa.installTitle}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={installState === "ios" ? undefined : triggerInstall}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-[var(--cc-accent-400)] hover:bg-[var(--cc-accent-600-20)] ${
                  onRight ? "flex-row-reverse" : ""
                }`}
              >
                {installState === "ios" ? <Share className="h-[18px] w-[18px] shrink-0" /> : <Download className="h-[18px] w-[18px] shrink-0" />}
                <span className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>
                  {t.pwa.installTitle}
                </span>
              </button>
            )}
            {/* iOS share guide (expanded only) */}
            {installState === "ios" && !isCollapsed && (
              <p className="mt-1 px-3 text-[10px] text-slate-500 leading-relaxed">
                {t.pwa.iosShareGuide}
              </p>
            )}
          </div>
        )}

        {/* User section */}
        {user && (
          <div className="shrink-0 border-t border-slate-700/50 p-2">
            {isCollapsed ? (
              <button
                type="button"
                onClick={signOut}
                className="group relative flex w-full items-center justify-center rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title={t.auth.signOut}
              >
                <LogOut className="h-4 w-4" />
                <span
                  className={`absolute ${
                    onRight ? "right-full mr-2" : "left-full ml-2"
                  } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                >
                  {t.auth.signOut}
                </span>
              </button>
            ) : (
              <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${onRight ? "flex-row-reverse" : ""}`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-400)] text-xs font-medium">
                  {(user.email?.[0] || "?").toUpperCase()}
                </div>
                <span className={`flex-1 truncate text-[11px] text-slate-500 ${onRight ? "text-right" : "text-left"}`}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded p-1 text-slate-600 transition-colors hover:text-red-400 hover:bg-red-500/10"
                  title={t.auth.signOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <footer data-cc-id="sidebar.footer" className="shrink-0 border-t border-slate-700/50 px-3 py-2">
            <span data-cc-id="sidebar.footer.tagline" data-cc-text="true" className="text-[10px] text-slate-600">{brandProfile.tagline || "GAM v1.0"}</span>
          </footer>
        )}
      </div>
    </aside>
  );
}
