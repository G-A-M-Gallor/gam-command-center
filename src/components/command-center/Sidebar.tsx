"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Layers,
  FileEdit,
  Map,
  Grid3X3,
  Bot,
  Palette,
  Network,
  Calendar,
  Compass,
  Users,
  Zap,
  Rss,
  MessagesSquare,
  Upload,
  Sparkles,
  Settings,
  Shield,
  X,
  LogOut,
  List,
  LayoutGrid,
  AlignJustify,
  Star,
  Download,
  Database,
  BookOpen,
  Sheet,
  Presentation,
  Globe,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
  CircleDot,
  FileSignature,
  ClipboardList,
  Mail,
  ChevronRight,
  Gauge,
  FolderOpen,
  ListTree,
} from "lucide-react";
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "@/lib/hooks/useShellPrefs";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { loadFavorites, saveFavorites } from "./widgets/FavoritesWidget";
import { SOCIAL_LINKS, SocialIcon } from "./DownloadReminder";

const FULL_WIDTH = 240;
const MOBILE_WIDTH = 280;
const STRIP_WIDTH = 48;

const FILTER_KEY = "cc-sidebar-filter";
const VIEW_MODE_KEY = "cc-sidebar-view-mode";
const FOLDER_MODE_KEY = "cc-sidebar-folder-mode";

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

export interface NavFolder {
  type: "folder";
  href: string;
  key: string;
  icon: React.ElementType;
  status: "active" | "coming-soon";
  children: NavItem[];
}

export type NavEntry = NavItem | NavFolder;

function isFolder(entry: NavEntry): entry is NavFolder {
  return "type" in entry && entry.type === "folder";
}

export interface NavGroup {
  id: string;
  labelKey: "groupCore" | "groupTools" | "groupSystem";
  items: NavEntry[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    labelKey: "groupCore",
    items: [
      { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, status: "active" },
      { href: "/dashboard/layers", key: "layers", icon: Activity, status: "active" },
      { href: "/dashboard/editor", key: "editor", icon: FileEdit, status: "active" },
      { href: "/dashboard/story-map", key: "storyMap", icon: Map, status: "active" },
      { href: "/dashboard/ai-hub", key: "aiHub", icon: Bot, status: "active" },
      { href: "/dashboard/entities", key: "entities", icon: Database, status: "active" },
      { href: "/dashboard/comms", key: "comms", icon: MessagesSquare, status: "active" },
      { href: "/dashboard/documents", key: "documents", icon: FileSignature, status: "active" },
      { href: "/dashboard/wiki", key: "wiki", icon: BookOpen, status: "active" },
    ],
  },
  {
    id: "tools",
    labelKey: "groupTools",
    items: [
      { href: "/dashboard/functional-map", key: "functionalMap", icon: Grid3X3, status: "active" },
      { href: "/dashboard/design-system", key: "designSystem", icon: Palette, status: "active" },
      { href: "/dashboard/plan", key: "plan", icon: Calendar, status: "active" },
      { href: "/dashboard/grid", key: "grid", icon: Sheet, status: "active" },
      { href: "/dashboard/slides", key: "slides", icon: Presentation, status: "active" },
      { href: "/dashboard/boardroom", key: "boardroom", icon: Users, status: "active" },
      { href: "/dashboard/matching", key: "matching", icon: Sparkles, status: "active" },
      { href: "/dashboard/email-templates", key: "emailTemplates", icon: Mail, status: "active" },
    ],
  },
  {
    id: "system",
    labelKey: "groupSystem",
    items: [
      {
        type: "folder",
        href: "/dashboard/control",
        key: "control",
        icon: Gauge,
        status: "active",
        children: [
          { href: "/dashboard/roadmap", key: "roadmap", icon: Compass, status: "active" },
          { href: "/dashboard/architecture", key: "architecture", icon: Network, status: "active" },
          { href: "/dashboard/admin", key: "admin", icon: Shield, status: "active" },
          { href: "/dashboard/audit", key: "audit", icon: ClipboardList, status: "active" },
        ],
      },
      { href: "/dashboard/import", key: "import", icon: Upload, status: "active" },
      { href: "/dashboard/feeds", key: "feeds", icon: Rss, status: "active" },
      { href: "/dashboard/automations", key: "automations", icon: Zap, status: "active" },
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
  /** Custom width from ShellPrefs (replaces FULL_WIDTH) */
  customWidth?: number;
  /** When true, sidebar collapses to strip and expands on hover (for "visible" mode) */
  sidebarHoverMode?: boolean;
  /** Callback when sidebar width changes via drag resize */
  onWidthChange?: (width: number) => void;
}

export function Sidebar({
  effectiveMode,
  isFloating = false,
  isOpen = true,
  onClose,
  customWidth,
  sidebarHoverMode = false,
  onWidthChange,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, sidebarPosition, sidebarVisibility, brandProfile } = useSettings();
  const { user, signOut, permissions } = useAuth();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [hovered, setHovered] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const socialMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navTop, setNavTop] = useState(120);
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(null);

  const [filter, setFilter] = useState<SidebarFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [favHrefs, setFavHrefs] = useState<Set<string>>(new Set());
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    try {
      const v = localStorage.getItem("cc-sidebar-folders");
      return v ? new Set(JSON.parse(v)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [folderMode, setFolderMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FOLDER_MODE_KEY) !== "flat";
    } catch { return true; }
  });

  const toggleFolder = useCallback((key: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("cc-sidebar-folders", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const handleFolderModeToggle = useCallback(() => {
    setFolderMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(FOLDER_MODE_KEY, next ? "folders" : "flat"); } catch {}
      return next;
    });
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  useEffect(() => {
    if (userMenuOpen && navRef.current) {
      setNavTop(navRef.current.getBoundingClientRect().top - 8);
    }
  }, [userMenuOpen]);

  // Close social menu on outside click
  useEffect(() => {
    if (!socialMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (socialMenuRef.current && !socialMenuRef.current.contains(e.target as Node)) {
        setSocialMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [socialMenuOpen]);

  // Hydrate from localStorage + listen for cross-component favorites sync
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
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
  // Hover-reveal: in visible mode with sidebarHoverMode, collapse to strip and expand on hover
  const isHoverReveal = mode === "visible" && sidebarHoverMode && !isMobile;
  const isCollapsed = isFloat ? !hovered : isHoverReveal ? !hovered : false;
  const onRight = sidebarPosition === "right";
  const expandedWidth = isMobile ? MOBILE_WIDTH : (customWidth ?? FULL_WIDTH);

  // Resize drag state
  const [resizing, setResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(expandedWidth);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      const delta = onRight
        ? resizeStartX.current - e.clientX
        : e.clientX - resizeStartX.current;
      const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, resizeStartW.current + delta));
      onWidthChange?.(newWidth);
    };
    const handleUp = () => setResizing(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [resizing, onRight, onWidthChange]);

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
  const filterEntry = (entry: NavEntry): boolean => {
    if (permissions.visiblePages && !permissions.visiblePages.includes(entry.key)) return false;
    if (filter === "all") return true;
    if (filter === "active") return entry.status === "active";
    if (filter === "coming-soon") return entry.status === "coming-soon";
    if (filter === "favorites") {
      if (isFolder(entry)) return entry.children.some((c) => favHrefs.has(c.href)) || favHrefs.has(entry.href);
      return favHrefs.has(entry.href);
    }
    return true;
  };

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(filterEntry).map((entry) => {
      if (isFolder(entry)) {
        return { ...entry, children: entry.children.filter(filterEntry) } as NavFolder;
      }
      return entry;
    }),
  })).filter((group) => group.items.length > 0);

  // Auto-open folder if a child page is active
  useEffect(() => {
    for (const group of NAV_GROUPS) {
      for (const entry of group.items) {
        if (isFolder(entry) && entry.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
          setOpenFolders((prev) => {
            if (prev.has(entry.key)) return prev;
            const next = new Set(prev);
            next.add(entry.key);
            try { localStorage.setItem("cc-sidebar-folders", JSON.stringify([...next])); } catch {}
            return next;
          });
        }
      }
    }
  }, [pathname]);

  // ── Sliding active indicator measurement ─────────────
  useEffect(() => {
    if (isCollapsed || !navRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
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
      className={`sidebar fixed top-12 z-[35] shrink-0 overflow-hidden ${
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
        transition: (isFloat || isHoverReveal) ? "width 300ms ease" : undefined,
        backgroundColor: isCollapsed
          ? "color-mix(in srgb, var(--nav-bg) 80%, transparent)"
          : "var(--nav-bg)",
      }}
      onMouseEnter={(isFloat || isHoverReveal) ? () => setHovered(true) : undefined}
      onMouseLeave={(isFloat || isHoverReveal) ? () => setHovered(false) : undefined}
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
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL */}
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

        {/* User account section — below header, above filters */}
        {user && !isCollapsed && (
          <div ref={userMenuRef} className="shrink-0 border-b border-slate-700/50 px-2 py-2 relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-800/50 ${
                onRight ? "flex-row-reverse" : ""
              }`}
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--cc-accent-600-20)]">
                <span className="text-xs font-semibold text-[var(--cc-accent-400)]">
                  {(user.email?.[0] || "?").toUpperCase()}
                </span>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
              </div>
              <div className={`flex-1 min-w-0 ${onRight ? "text-right" : "text-left"}`}>
                <div className="truncate text-xs font-medium text-slate-200">
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                </div>
                <div className="truncate text-[10px] text-slate-500">
                  {user.email}
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${
                userMenuOpen ? "rotate-180" : ""
              }`} />
            </button>

            {/* Dropdown menu — opens to the SIDE of the sidebar, never overlapping */}
            {userMenuOpen && (() => {
              const um = t.userMenu as Record<string, string>;
              const roleName = permissions.role === "admin" ? um.admin : permissions.role === "viewer" ? um.viewer : um.member;
              return (
                <div
                  className="fixed z-50 w-56 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--nav-bg)",
                    top: navTop,
                    ...(onRight
                      ? { right: expandedWidth + 8 }
                      : { left: expandedWidth + 8 }),
                  }}
                >
                  {/* Role badge */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50">
                    <CircleDot className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] text-slate-500">{um.online}</span>
                    <span className="ms-auto rounded-full bg-[var(--cc-accent-600-20)] px-2 py-0.5 text-[9px] font-medium text-[var(--cc-accent-300)]">
                      {roleName}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); router.push("/dashboard/settings"); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800/50 ${onRight ? "flex-row-reverse" : ""}`}
                    >
                      <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                      {um.profile}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); router.push("/dashboard/settings"); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800/50 ${onRight ? "flex-row-reverse" : ""}`}
                    >
                      <SettingsIcon className="h-3.5 w-3.5 text-slate-500" />
                      {um.settings}
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-slate-700/50 py-1">
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 ${onRight ? "flex-row-reverse" : ""}`}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {um.signOut}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        {/* Collapsed: user avatar only (tooltip on hover, no menu) */}
        {user && isCollapsed && (
          <div className="shrink-0 border-b border-slate-700/50 py-2 flex justify-center">
            <div
              className="group relative"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cc-accent-600-20)]">
                <span className="text-xs font-semibold text-[var(--cc-accent-400)]">
                  {(user.email?.[0] || "?").toUpperCase()}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
              </div>
              <span
                className={`absolute ${
                  onRight ? "right-full mr-2" : "left-full ml-2"
                } top-1/2 -translate-y-1/2 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
              >
                {user.email}
              </span>
            </div>
          </div>
        )}

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

            {/* View mode toggle + folder mode */}
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
              <div className="mx-1 h-3 w-px bg-slate-700/50" />
              <button
                type="button"
                onClick={handleFolderModeToggle}
                title={folderMode ? (sidebarT.viewFlat || "Flat") : (sidebarT.viewFolders || "Folders")}
                className={`rounded p-1 transition-colors ${
                  folderMode
                    ? "text-[var(--cc-accent-300)] bg-[var(--cc-accent-600-20)]"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {folderMode ? <ListTree className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
              </button>
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
                  {group.items.map((entry) => {
                    // Flatten folders into grid — show folder + children as separate grid items
                    const flatItems: NavItem[] = isFolder(entry)
                      ? [{ href: entry.href, key: entry.key, icon: entry.icon, status: entry.status }, ...entry.children]
                      : [entry];
                    return flatItems.map(({ href, key, icon: Icon }) => {
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
                    });
                  })}
                </div>
              ) : (
                /* Items — List & Compact views */
                <div className={viewMode === "compact" && !isCollapsed ? "space-y-0" : "space-y-0.5"}>
                  {/* Flatten folders when folderMode is off */}
                  {(folderMode
                    ? group.items
                    : group.items.flatMap((entry): NavEntry[] =>
                        isFolder(entry)
                          ? [{ href: entry.href, key: entry.key, icon: entry.icon, status: entry.status }, ...entry.children]
                          : [entry]
                      )
                  ).map((entry) => {
                    // ── Folder rendering (only when folderMode is on) ──
                    if (isFolder(entry)) {
                      const { href, key, icon: FolderIcon, children } = entry;
                      const folderLabel = (t.tabs as Record<string, string>)[key];
                      const isOpen = openFolders.has(key);
                      const isFolderActive = pathname === href || pathname.startsWith(href + "/");
                      const hasActiveChild = children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
                      const isHighlighted = isFolderActive || hasActiveChild;

                      if (isCollapsed) {
                        return (
                          <Link
                            key={key}
                            href={href}
                            data-active={isHighlighted || undefined}
                            aria-label={folderLabel}
                            className={`group relative flex w-full items-center justify-center rounded-lg p-2.5 transition-colors ${
                              isHighlighted
                                ? "nav-item-active text-[var(--cc-accent-300)]"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            }`}
                          >
                            {isHighlighted && (
                              <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[var(--cc-accent-500)] ${onRight ? "right-0" : "left-0"}`} aria-hidden />
                            )}
                            <FolderIcon className="h-4 w-4 shrink-0" />
                            <span className={`absolute ${onRight ? "right-full mr-2" : "left-full ml-2"} rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                              {folderLabel}
                            </span>
                          </Link>
                        );
                      }

                      return (
                        <div key={key}>
                          {/* Folder header — name navigates + opens, chevron toggles */}
                          <div className="group/item relative flex items-center">
                            <Link
                              href={href}
                              onClick={() => {
                                // Toggle folder open/close when navigating
                                setOpenFolders((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(key)) next.delete(key); else next.add(key);
                                  return next;
                                });
                                if (shouldCloseOnNav) onClose?.();
                              }}
                              data-active={isFolderActive || undefined}
                              className={`relative z-10 flex flex-1 items-center gap-3 rounded-lg ${viewMode === "compact" ? "px-2.5 py-1 text-xs" : "px-3 py-2 text-sm"} transition-all duration-150 ${
                                onRight ? "flex-row-reverse" : ""
                              } ${
                                isHighlighted
                                  ? "nav-item-active text-[var(--cc-accent-300)] font-medium"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                              }`}
                            >
                              <FolderIcon className={`${viewMode === "compact" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} shrink-0`} />
                              <span className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>{folderLabel}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleFolder(key)}
                              className={`${onRight ? "ml-0.5" : "mr-0.5"} rounded p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition-colors`}
                              aria-label={isOpen ? "Collapse" : "Expand"}
                            >
                              <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                            </button>
                          </div>
                          {/* Folder children */}
                          <div
                            className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <div className={`${onRight ? "pr-3" : "pl-3"} ${viewMode === "compact" ? "" : "mt-0.5"}`}>
                              {children.map(({ href: cHref, key: cKey, icon: CIcon }) => {
                                const cActive = pathname === cHref || pathname.startsWith(cHref + "/");
                                const cLabel = (t.tabs as Record<string, string>)[cKey];
                                const cFav = favHrefs.has(cHref);
                                return (
                                  <div key={cHref} className="group/child relative">
                                    <Link
                                      href={cHref}
                                      onClick={shouldCloseOnNav ? onClose : undefined}
                                      data-active={cActive || undefined}
                                      className={`relative z-10 flex items-center gap-2.5 rounded-md ${viewMode === "compact" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]"} transition-colors ${
                                        onRight ? "flex-row-reverse" : ""
                                      } ${
                                        cActive
                                          ? "nav-item-active text-[var(--cc-accent-300)] font-medium"
                                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                                      }`}
                                    >
                                      <CIcon className={`${viewMode === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} shrink-0`} />
                                      <span className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>{cLabel}</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFav(cHref, cLabel)}
                                      className={`absolute ${onRight ? "left-1" : "right-1"} top-1/2 -translate-y-1/2 z-20 rounded p-0.5 transition-all ${
                                        cFav
                                          ? "text-amber-400 opacity-100"
                                          : "text-slate-600 opacity-0 group-hover/child:opacity-100 hover:text-amber-400"
                                      }`}
                                      aria-label={cFav ? "Remove from favorites" : "Add to favorites"}
                                    >
                                      <Star className="h-2.5 w-2.5" fill={cFav ? "currentColor" : "none"} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ── Regular item rendering ──
                    const { href, key, icon: Icon } = entry;
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

        {/* Footer — Downloads + Social */}
        {!isCollapsed && (
          <footer ref={socialMenuRef} data-cc-id="sidebar.footer" className="relative shrink-0 border-t border-slate-700/50 px-2 py-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("cc-show-download-reminder"))}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 ${
                onRight ? "flex-row-reverse" : ""
              }`}
            >
              <Download className="h-3 w-3 shrink-0" />
              {(t.downloads as Record<string, string>).title}
            </button>
            <div className="h-3 w-px bg-slate-700/50" />
            <button
              type="button"
              onClick={() => setSocialMenuOpen((v) => !v)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 ${
                onRight ? "flex-row-reverse" : ""
              }`}
            >
              <Globe className="h-3 w-3 shrink-0" />
              {(t.downloads as Record<string, string>).gamOnline}
            </button>

            {/* Social links popup */}
            {socialMenuOpen && (
              <div
                className="absolute z-50 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--nav-bg)",
                  bottom: "100%",
                  marginBottom: 6,
                  ...(onRight ? { right: 0 } : { left: 0 }),
                  width: expandedWidth - 16,
                }}
              >
                <div className="px-3 py-2 border-b border-slate-700/50">
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                    {(t.downloads as Record<string, string>).gamOnline}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 px-3 py-3">
                  {Object.entries(SOCIAL_LINKS).map(([name, href]) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSocialMenuOpen(false)}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                      title={name}
                    >
                      <SocialIcon name={name} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </footer>
        )}
        {isCollapsed && (
          <footer className="shrink-0 border-t border-slate-700/50 p-1 flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("cc-show-download-reminder"))}
              className="group relative rounded p-1.5 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-400"
              title={(t.downloads as Record<string, string>).title}
            >
              <Download className="h-3.5 w-3.5" />
              <span
                className={`absolute ${
                  onRight ? "right-full mr-2" : "left-full ml-2"
                } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
              >
                {(t.downloads as Record<string, string>).title}
              </span>
            </button>
          </footer>
        )}
      </div>

      {/* Resize handle */}
      {!isMobile && !isCollapsed && (
        <div
          className={`absolute top-0 bottom-0 w-1 cursor-col-resize transition-colors hover:bg-[var(--cc-accent-500)]/30 active:bg-[var(--cc-accent-500)]/50 ${
            onRight ? "left-0" : "right-0"
          } ${resizing ? "bg-[var(--cc-accent-500)]/50" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            resizeStartX.current = e.clientX;
            resizeStartW.current = expandedWidth;
            setResizing(true);
          }}
        />
      )}
    </aside>
  );
}
