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
  Pencil,
  Check,
  EyeOff,
  Eye,
  GripVertical,
  RotateCcw,
  BarChart3,
  Plus,
  Trash2,
  Cpu,
  Cloud,
  FolderArchive,
  Bookmark,
  BookMarked,
  Library,
  DatabaseZap,
  Lock,
  KeyRound,
  ShieldCheck,
  Image,
  Video,
  AudioLines,
  UserCircle,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "@/lib/hooks/useShellPrefs";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { loadFavorites, saveFavorites } from "./widgets/FavoritesWidget";
import { useSidebarCustomization } from "@/lib/sidebar/useSidebarCustomization";
import { buildDisplayGroups } from "@/lib/sidebar/sidebarCustomization";
import type { ItemCustomization } from "@/lib/sidebar/sidebarCustomization";
import { SidebarContextMenu } from "./SidebarContextMenu";
import { ItemEditPopover, getIconByName } from "./ItemEditPopover";
import { SOCIAL_LINKS, SocialIcon } from "./DownloadReminder";

const FULL_WIDTH = 240;
const MOBILE_WIDTH = 280;
const STRIP_WIDTH = 48;

const FILTER_KEY = "cc-sidebar-filter";
const VIEW_MODE_KEY = "cc-sidebar-view-mode";
const FOLDER_MODE_KEY = "cc-sidebar-folder-mode";

// ─── Types ──────────────────────────────────────────────

type SidebarFilter = "me" | "team" | "hidden" | "favorites";
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

// ─── Sortable Wrapper ────────────────────────────────────

function SortableNavItem({
  id,
  editMode,
  isHidden,
  onToggleHide,
  onRight,
  onEditClick,
  children,
}: {
  id: string;
  editMode: boolean;
  isHidden: boolean;
  onToggleHide: () => void;
  onRight: boolean;
  onEditClick?: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : isHidden ? 0.3 : 1,
  };

  if (!editMode) return <>{children}</>;

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group/sortable relative">
      <div
        {...listeners}
        className={`absolute top-1/2 -translate-y-1/2 z-30 cursor-grab active:cursor-grabbing p-0.5 rounded text-slate-600 hover:text-slate-400 transition-colors ${
          onRight ? "right-0" : "left-0"
        }`}
      >
        <GripVertical className="h-3 w-3" />
      </div>
      <div
        className={onRight ? "pr-5" : "pl-5"}
        onClick={(e) => {
          if (onEditClick) {
            e.preventDefault();
            e.stopPropagation();
            onEditClick();
          }
        }}
        style={{ cursor: onEditClick ? "pointer" : undefined }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleHide(); }}
        className={`absolute top-1/2 -translate-y-1/2 z-30 rounded p-0.5 transition-all ${
          onRight ? "left-1" : "right-1"
        } ${
          isHidden
            ? "text-amber-400 opacity-100"
            : "text-slate-600 opacity-0 group-hover/sortable:opacity-100 hover:text-slate-400"
        }`}
      >
        {isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      </button>
    </div>
  );
}

export interface NavGroup {
  id: string;
  labelKey: string;
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
      {
        type: "folder",
        href: "/dashboard/ai-hub",
        key: "aiHub",
        icon: Bot,
        status: "active",
        children: [
          { href: "/dashboard/ai-hub", key: "cliAi", icon: Bot, status: "active" },
          { href: "/dashboard/boardroom", key: "aiAdvisors", icon: Users, status: "active" },
          { href: "/dashboard/agents", key: "agents", icon: Cpu, status: "coming-soon" },
        ],
      },
      { href: "/dashboard/entities", key: "entities", icon: Database, status: "active" },
      { href: "/dashboard/comms", key: "comms", icon: MessagesSquare, status: "active" },
      { href: "/dashboard/documents", key: "documents", icon: FileSignature, status: "active" },
      { href: "/dashboard/wiki", key: "wiki", icon: BookOpen, status: "active" },
      {
        type: "folder",
        href: "/dashboard/vcloud",
        key: "vcloud",
        icon: Cloud,
        status: "coming-soon",
        children: [
          { href: "/dashboard/vcloud/files", key: "vcloudFiles", icon: FolderArchive, status: "coming-soon" },
          { href: "/dashboard/vcloud/images", key: "vcloudImages", icon: Image, status: "coming-soon" },
          { href: "/dashboard/vcloud/video", key: "vcloudVideo", icon: Video, status: "coming-soon" },
          { href: "/dashboard/vcloud/sound", key: "vcloudSound", icon: AudioLines, status: "coming-soon" },
          { href: "/dashboard/vcloud/personal", key: "vcloudPersonal", icon: UserCircle, status: "coming-soon" },
        ],
      },
    ],
  },
  {
    id: "tools",
    labelKey: "groupTools",
    items: [
      { href: "/dashboard/functional-map", key: "functionalMap", icon: Grid3X3, status: "active" },
      {
        type: "folder",
        href: "/dashboard/design-system",
        key: "libraries",
        icon: Library,
        status: "active",
        children: [
          { href: "/dashboard/entities/fields", key: "entityFields", icon: ListTree, status: "active" },
          { href: "/dashboard/design-system", key: "designSystem", icon: Palette, status: "active" },
          { href: "/dashboard/entities/field-templates", key: "fieldTemplates", icon: Layers, status: "coming-soon" },
        ],
      },
      {
        type: "folder",
        href: "/dashboard/grid",
        key: "databases",
        icon: DatabaseZap,
        status: "active",
        children: [
          { href: "/dashboard/grid", key: "grid", icon: Sheet, status: "active" },
          { href: "/dashboard/matching", key: "matching", icon: Sparkles, status: "active" },
        ],
      },
      { href: "/dashboard/slides", key: "slides", icon: Presentation, status: "active" },
      { href: "/dashboard/email-templates", key: "emailTemplates", icon: Mail, status: "active" },
      {
        type: "folder",
        href: "/dashboard/vault",
        key: "vault",
        icon: Lock,
        status: "coming-soon",
        children: [
          { href: "/dashboard/vault/passwords", key: "vaultPasswords", icon: KeyRound, status: "coming-soon" },
          { href: "/dashboard/vault/secrets", key: "vaultSecrets", icon: ShieldCheck, status: "coming-soon" },
        ],
      },
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
          { href: "/dashboard/plan", key: "plan", icon: Calendar, status: "active" },
          { href: "/dashboard/architecture", key: "architecture", icon: Network, status: "active" },
          { href: "/dashboard/admin", key: "admin", icon: Shield, status: "active" },
          { href: "/dashboard/audit", key: "audit", icon: ClipboardList, status: "active" },
        ],
      },
      { href: "/dashboard/import", key: "import", icon: Upload, status: "active" },
      {
        type: "folder",
        href: "/dashboard/feeds",
        key: "bookmarks",
        icon: Bookmark,
        status: "active",
        children: [
          { href: "/dashboard/feeds", key: "feeds", icon: Rss, status: "active" },
          { href: "/dashboard/read-list", key: "readList", icon: BookMarked, status: "coming-soon" },
        ],
      },
      { href: "/dashboard/automations", key: "automations", icon: Zap, status: "active" },
      { href: "/dashboard/settings", key: "settings", icon: Settings, status: "active" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────

function loadFilter(): SidebarFilter {
  try {
    const v = localStorage.getItem(FILTER_KEY);
    if (v === "me" || v === "team" || v === "hidden" || v === "favorites") return v;
  } catch {}
  return "me";
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

  const [filter, setFilter] = useState<SidebarFilter>("me");
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

  // ── Sidebar customization (reorder, hide, folders, usage tracking) ──
  const {
    customization, editMode, reorder, createFolder: createCustomFolder, deleteFolder,
    moveToFolder: moveItemToFolder, removeFromFolder, toggleHide, trackUsage,
    toggleAutoSort: handleToggleAutoSort, toggleEditMode, reset: resetSidebarCustom, setEditMode,
    updateItem, clearItem,
    toggleSection, renameSection, createSection: createCustomSection, deleteSection,
    moveItemToSection, removeItemFromSection,
  } = useSidebarCustomization();

  // Per-item edit popover state
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  // Section inline rename state
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  // New section creation
  const [creatingSection, setCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const newSectionInputRef = useRef<HTMLInputElement>(null);

  // Collapsed sections set for quick lookup
  const collapsedSet = new Set(customization.collapsedSections);

  // Helper: resolve label for an item based on customization
  const resolveLabel = useCallback((itemKey: string, defaultLabel: string): string => {
    const ic = customization.itemCustomizations[itemKey];
    if (!ic?.labelLanguage) return defaultLabel;
    if (ic.labelLanguage === "custom" && ic.customLabel) return ic.customLabel;
    if (ic.labelLanguage === "custom") return defaultLabel;
    // For he/en/ru — get translations from that language
    const langTranslations = getTranslations(ic.labelLanguage);
    return ((langTranslations.tabs as Record<string, string>)?.[itemKey]) || defaultLabel;
  }, [customization.itemCustomizations]);

  // Helper: resolve icon for an item
  const resolveIcon = useCallback((itemKey: string, DefaultIcon: React.ElementType): React.ElementType => {
    const ic = customization.itemCustomizations[itemKey];
    if (!ic?.customIcon) return DefaultIcon;
    const custom = getIconByName(ic.customIcon);
    return custom || DefaultIcon;
  }, [customization.itemCustomizations]);

  // Helper: get icon position for an item
  const getIconPosition = useCallback((itemKey: string): "start" | "end" | "above" => {
    return customization.itemCustomizations[itemKey]?.iconPosition || "start";
  }, [customization.itemCustomizations]);


  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{
    x: number; y: number; itemKey: string; href: string; label: string;
  } | null>(null);

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  // ── Compute filtered groups (uses customization engine) ─
  const filteredGroups = buildDisplayGroups(
    NAV_GROUPS, customization, filter, favHrefs, permissions, editMode,
  ).map((dg) => ({
    id: dg.id,
    labelKey: dg.labelKey,
    isCustomFolder: dg.isCustomFolder,
    customFolderName: dg.customFolderName,
    isCustomSection: dg.isCustomSection,
    displayName: dg.displayName,
    emoji: dg.emoji,
    items: dg.items,
  }));

  // DnD handler — reorder items within a group
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Find which group contains both items
    for (const group of filteredGroups) {
      const flatItemKeys = group.items.flatMap((e) =>
        isFolder(e) ? [e.key, ...e.children.map((c) => c.key)] : [e.key]
      );
      const oldIdx = flatItemKeys.indexOf(active.id as string);
      const newIdx = flatItemKeys.indexOf(over.id as string);
      if (oldIdx !== -1 && newIdx !== -1) {
        const newOrder = arrayMove(flatItemKeys, oldIdx, newIdx);
        reorder(group.id, newOrder);
        break;
      }
    }
  }, [filteredGroups, reorder]);

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

  // Edit popover labels
  const editLabels = {
    customLabel: sidebarT.customLabel || "Custom Label",
    language: sidebarT.language || "Display Language",
    iconPosition: sidebarT.iconPosition || "Icon Position",
    changeIcon: sidebarT.changeIcon || "Change Icon",
    reset: sidebarT.resetItem || "Reset",
    langHe: sidebarT.langHe || "עברית",
    langEn: sidebarT.langEn || "English",
    langRu: sidebarT.langRu || "Русский",
    langCustom: sidebarT.langCustom || "Custom",
    posStart: sidebarT.posStart || "Start",
    posEnd: sidebarT.posEnd || "End",
    posAbove: sidebarT.posAbove || "Above",
  };

  const filterTabs: { id: SidebarFilter; label: string }[] = [
    { id: "me", label: sidebarT.filterMe },
    { id: "team", label: sidebarT.filterTeam },
    { id: "hidden", label: sidebarT.filterHidden },
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
              <div className="mx-1 h-3 w-px bg-slate-700/50" />
              <button
                type="button"
                onClick={toggleEditMode}
                title={editMode ? (sidebarT.doneEditing || "Done") : (sidebarT.editMode || "Customize")}
                className={`rounded p-1 transition-colors ${
                  editMode
                    ? "text-amber-400 bg-amber-400/10"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Edit mode toolbar */}
            {editMode && (
              <div className="flex items-center justify-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={handleToggleAutoSort}
                  title={sidebarT.autoSort || "Sort by usage"}
                  className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                    customization.autoSortByUsage
                      ? "text-[var(--cc-accent-300)] bg-[var(--cc-accent-600-20)]"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  <BarChart3 className="h-3 w-3 inline mr-0.5" />
                  {sidebarT.autoSort || "Usage"}
                </button>
                <button
                  type="button"
                  onClick={() => { if (confirm(sidebarT.resetConfirm || "Reset all customizations?")) resetSidebarCustom(); }}
                  title={sidebarT.resetOrder || "Reset"}
                  className="rounded px-1.5 py-0.5 text-[10px] text-slate-600 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="h-3 w-3 inline mr-0.5" />
                  {sidebarT.resetOrder || "Reset"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Nav with grouped items */}
        <nav
          ref={navRef}
          data-cc-id="sidebar.nav"
          className="relative min-h-0 flex-1 overflow-y-auto p-2"
        >
          {/* Sliding active indicator (list mode only) */}
          {!isCollapsed && viewMode === "list" && indicatorStyle && !editMode && (
            <div
              className="absolute inset-x-2 rounded-lg bg-[var(--cc-accent-600-20)] border border-[var(--cc-accent-500)]/20 pointer-events-none transition-all duration-300 ease-out"
              style={{
                top: indicatorStyle.top,
                height: indicatorStyle.height,
              }}
            />
          )}

         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {filteredGroups.map((group, gi) => {
            // Collect all sortable IDs for this group
            const sortableIds = group.items.flatMap((e) =>
              isFolder(e) ? [e.key, ...e.children.map((c) => c.key)] : [e.key]
            );
            const isSectionCollapsed = collapsedSet.has(group.id);
            const sectionLabel = group.displayName || group.customFolderName || sidebarT[group.labelKey] || group.id;
            const sectionEmoji = group.emoji;
            const isRenamingThis = renamingSectionId === group.id;
            const canDelete = group.isCustomSection || group.isCustomFolder;

            return (
            <SortableContext key={group.id} items={sortableIds} strategy={verticalListSortingStrategy}>
            <div>
              {/* Group label / divider — now interactive toggle */}
              {gi > 0 && isCollapsed && (
                <div className="mx-2 my-2 border-t border-slate-700/30" />
              )}
              {!isCollapsed && (viewMode === "list" || viewMode === "grid") && (
                <div className={`${gi === 0 ? "pt-1 pb-1" : "pt-3 pb-1"} ${viewMode === "grid" ? "px-1" : "px-2"}`}>
                  <div className={`group/section flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 transition-colors ${
                    editMode ? "hover:bg-slate-800/50" : "hover:bg-slate-800/30 cursor-pointer"
                  }`}>
                    {/* Collapse chevron */}
                    <button
                      type="button"
                      onClick={() => toggleSection(group.id)}
                      className="shrink-0 rounded p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <ChevronRight className={`h-2.5 w-2.5 transition-transform duration-200 ${isSectionCollapsed ? "" : "rotate-90"}`} />
                    </button>

                    {/* Section name — clickable toggle or inline edit */}
                    {isRenamingThis ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          if (renameValue.trim()) renameSection(group.id, renameValue.trim());
                          setRenamingSectionId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (renameValue.trim()) renameSection(group.id, renameValue.trim());
                            setRenamingSectionId(null);
                          }
                          if (e.key === "Escape") setRenamingSectionId(null);
                        }}
                        className="flex-1 bg-transparent border-b border-[var(--cc-accent-500)] text-[10px] uppercase tracking-wider text-slate-300 font-medium outline-none px-0.5"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (editMode) {
                            setRenamingSectionId(group.id);
                            setRenameValue(sectionLabel);
                          } else {
                            toggleSection(group.id);
                          }
                        }}
                        className="flex-1 text-start"
                      >
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                          {sectionEmoji ? `${sectionEmoji} ` : ""}{sectionLabel}
                        </span>
                      </button>
                    )}

                    {/* Item count badge */}
                    {isSectionCollapsed && (
                      <span className="text-[9px] text-slate-700 tabular-nums">{group.items.length}</span>
                    )}

                    {/* Edit mode: delete custom section */}
                    {editMode && canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (group.isCustomSection) deleteSection(group.id);
                          else if (group.isCustomFolder) deleteFolder(group.id);
                        }}
                        className="shrink-0 rounded p-0.5 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover/section:opacity-100"
                        title={sidebarT.deleteSection || "Delete section"}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!isCollapsed && viewMode === "compact" && gi > 0 && (
                <div className="mx-1 my-1">
                  <div className={`group/section flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors ${
                    editMode ? "hover:bg-slate-800/50" : "hover:bg-slate-800/30 cursor-pointer"
                  }`}>
                    <button
                      type="button"
                      onClick={() => toggleSection(group.id)}
                      className="shrink-0 rounded p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <ChevronRight className={`h-2.5 w-2.5 transition-transform duration-200 ${isSectionCollapsed ? "" : "rotate-90"}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editMode) { setRenamingSectionId(group.id); setRenameValue(sectionLabel); }
                        else toggleSection(group.id);
                      }}
                      className="flex-1 text-start"
                    >
                      <span className="text-[9px] uppercase tracking-wider text-slate-600 font-medium">
                        {sectionEmoji ? `${sectionEmoji} ` : ""}{sectionLabel}
                      </span>
                    </button>
                    {isSectionCollapsed && (
                      <span className="text-[9px] text-slate-700 tabular-nums">{group.items.length}</span>
                    )}
                    {editMode && canDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if (group.isCustomSection) deleteSection(group.id); else if (group.isCustomFolder) deleteFolder(group.id); }}
                        className="shrink-0 rounded p-0.5 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover/section:opacity-100"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Items — collapse wrapper */}
              <div className={`overflow-hidden transition-all duration-200 ease-out ${
                isSectionCollapsed && !isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
              }`}>

              {/* Items — Grid view */}
              {!isCollapsed && viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-1 px-1">
                  {group.items.map((entry) => {
                    // Flatten folders into grid — show folder + children as separate grid items
                    const flatItems: NavItem[] = isFolder(entry)
                      ? [{ href: entry.href, key: entry.key, icon: entry.icon, status: entry.status }, ...entry.children]
                      : [entry];
                    return flatItems
                      .filter(({ key: k }) => !customization.hiddenItems.includes(k) || editMode)
                      .map(({ href, key: itemKey, icon: DefaultIcon }) => {
                      const isActive = href === "/dashboard" ? pathname === "/dashboard" : (pathname === href || pathname.startsWith(href + "/"));
                      const rawLabel = (t.tabs as Record<string, string>)[itemKey];
                      const gridLabel = resolveLabel(itemKey, rawLabel);
                      const GridIcon = resolveIcon(itemKey, DefaultIcon);
                      const isFav = favHrefs.has(href);
                      const isItemHidden = customization.hiddenItems.includes(itemKey);
                      return (
                        <div key={href} className={`group/grid relative ${isItemHidden && editMode ? "opacity-30" : ""}`}
                          onContextMenu={(e) => { if (editMode) return; e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, itemKey, href, label: gridLabel }); }}
                          onClick={editMode ? (e) => { e.preventDefault(); e.stopPropagation(); setEditingItemKey(editingItemKey === itemKey ? null : itemKey); } : undefined}
                        >
                          <Link
                            href={editMode ? "#" : href}
                            onClick={(e) => {
                              if (editMode) { e.preventDefault(); return; }
                              trackUsage(itemKey); if (shouldCloseOnNav) onClose?.();
                            }}
                            data-active={isActive || undefined}
                            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                              isActive
                                ? "nav-item-active bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            } ${editMode ? "ring-1 ring-slate-700/50 ring-dashed" : ""}`}
                          >
                            <GridIcon className="h-4 w-4 shrink-0" />
                            <span className="text-[9px] leading-tight truncate w-full">{gridLabel}</span>
                          </Link>
                          {!editMode && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleFav(href, gridLabel); }}
                            className={`absolute top-0.5 right-0.5 rounded p-0.5 transition-all ${
                              isFav
                                ? "text-amber-400 opacity-100"
                                : "text-slate-600 opacity-0 group-hover/grid:opacity-100 hover:text-amber-400"
                            }`}
                            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className="h-2.5 w-2.5" fill={isFav ? "currentColor" : "none"} />
                          </button>
                          )}
                          {editMode && editingItemKey === itemKey && (
                            <ItemEditPopover
                              itemKey={itemKey}
                              currentLabel={rawLabel}
                              customization={customization.itemCustomizations[itemKey]}
                              onUpdate={(patch) => updateItem(itemKey, patch)}
                              onClear={() => clearItem(itemKey)}
                              onClose={() => setEditingItemKey(null)}
                              isRtl={language === "he"}
                              labels={editLabels}
                            />
                          )}
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
                                trackUsage(key);
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
                      if (customization.hiddenItems.includes(key) && !editMode) return null;
                      const collapsedLabel = resolveLabel(key, label);
                      const CollapsedIcon = resolveIcon(key, Icon);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => { trackUsage(key); if (shouldCloseOnNav) onClose?.(); }}
                          onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, itemKey: key, href, label: collapsedLabel }); }}
                          data-active={isActive || undefined}
                          aria-label={collapsedLabel}
                          className={`group relative flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                            isActive
                              ? "nav-item-active text-[var(--cc-accent-300)]"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          } ${customization.hiddenItems.includes(key) ? "opacity-30" : ""}`}
                        >
                          {isActive && (
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[var(--cc-accent-500)] ${
                                onRight ? "right-0" : "left-0"
                              }`}
                              aria-hidden
                            />
                          )}
                          <CollapsedIcon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                            !isActive ? "group-hover:scale-110" : ""
                          }`} />
                          {/* Tooltip */}
                          <span
                            className={`absolute ${
                              onRight ? "right-full mr-2" : "left-full ml-2"
                            } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                          >
                            {collapsedLabel}
                          </span>
                        </Link>
                      );
                    }

                    // ── Compact item ──
                    if (viewMode === "compact") {
                      const isFav = favHrefs.has(href);
                      const isItemHidden = customization.hiddenItems.includes(key);
                      const compactLabel = resolveLabel(key, label);
                      const CompactIcon = resolveIcon(key, Icon);
                      return (
                        <SortableNavItem
                          key={href}
                          id={key}
                          editMode={editMode}
                          isHidden={isItemHidden}
                          onToggleHide={() => toggleHide(key)}
                          onRight={onRight}
                          onEditClick={editMode ? () => setEditingItemKey(editingItemKey === key ? null : key) : undefined}
                        >
                        <div className="group/item relative"
                          onContextMenu={(e) => { if (editMode) return; e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, itemKey: key, href, label: compactLabel }); }}
                        >
                          <Link
                            href={editMode ? "#" : href}
                            onClick={(e) => {
                              if (editMode) { e.preventDefault(); return; }
                              trackUsage(key); if (shouldCloseOnNav) onClose?.();
                            }}
                            data-active={isActive || undefined}
                            className={`relative z-10 flex items-center gap-2 rounded px-2.5 py-1 text-xs transition-colors ${
                              onRight ? "flex-row-reverse" : ""
                            } ${
                              isActive
                                ? "nav-item-active text-[var(--cc-accent-300)] font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                            } ${isItemHidden && editMode ? "line-through" : ""} ${editMode ? "ring-1 ring-slate-700/50 ring-dashed" : ""}`}
                          >
                            <CompactIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>{compactLabel}</span>
                          </Link>
                          {!editMode && (
                          <button
                            type="button"
                            onClick={() => handleToggleFav(href, compactLabel)}
                            className={`absolute ${onRight ? "left-1" : "right-1"} top-1/2 -translate-y-1/2 z-20 rounded p-0.5 transition-all ${
                              isFav
                                ? "text-amber-400 opacity-100"
                                : "text-slate-600 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                            }`}
                            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className="h-2.5 w-2.5" fill={isFav ? "currentColor" : "none"} />
                          </button>
                          )}
                          {editMode && editingItemKey === key && (
                            <ItemEditPopover
                              itemKey={key}
                              currentLabel={label}
                              customization={customization.itemCustomizations[key]}
                              onUpdate={(patch) => updateItem(key, patch)}
                              onClear={() => clearItem(key)}
                              onClose={() => setEditingItemKey(null)}
                              isRtl={language === "he"}
                              labels={editLabels}
                            />
                          )}
                        </div>
                        </SortableNavItem>
                      );
                    }

                    // ── Expanded list item ──
                    const isFav = favHrefs.has(href);
                    const isItemHidden = customization.hiddenItems.includes(key);
                    const displayLabel = resolveLabel(key, label);
                    const ResolvedIcon = resolveIcon(key, Icon);
                    const iconPos = getIconPosition(key);
                    const isIconAbove = iconPos === "above";
                    const isIconEnd = iconPos === "end";
                    // For RTL: "start" means right side, "end" means left side
                    // For LTR: "start" means left side, "end" means right side
                    const showIconFirst = onRight ? isIconEnd : !isIconEnd;

                    return (
                      <SortableNavItem
                        key={href}
                        id={key}
                        editMode={editMode}
                        isHidden={isItemHidden}
                        onToggleHide={() => toggleHide(key)}
                        onRight={onRight}
                        onEditClick={editMode ? () => setEditingItemKey(editingItemKey === key ? null : key) : undefined}
                      >
                      <div className="group/item relative"
                        onContextMenu={(e) => {
                          if (editMode) return;
                          e.preventDefault();
                          setCtxMenu({ x: e.clientX, y: e.clientY, itemKey: key, href, label: displayLabel });
                        }}
                      >
                        <Link
                          href={editMode ? "#" : href}
                          onClick={(e) => {
                            if (editMode) { e.preventDefault(); return; }
                            trackUsage(key); if (shouldCloseOnNav) onClose?.();
                          }}
                          data-cc-id="sidebar.nav.link"
                          data-active={isActive || undefined}
                          className={`group relative z-10 flex ${isIconAbove ? "flex-col items-center gap-1" : "items-center gap-3"} rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                            isActive
                              ? "nav-item-active text-[var(--cc-accent-300)] font-medium"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                          } ${isItemHidden && editMode ? "line-through" : ""} ${editMode ? "ring-1 ring-slate-700/50 ring-dashed" : ""}`}
                        >
                          {isIconAbove ? (
                            <>
                              <ResolvedIcon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                                !isActive ? "group-hover:scale-105" : ""
                              }`} />
                              <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="text-center truncate w-full text-xs">{displayLabel}</span>
                            </>
                          ) : showIconFirst ? (
                            <>
                              <ResolvedIcon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                                !isActive ? "group-hover:scale-105" : ""
                              }`} />
                              <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>{displayLabel}</span>
                            </>
                          ) : (
                            <>
                              <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className={`flex-1 truncate ${onRight ? "text-right" : "text-left"}`}>{displayLabel}</span>
                              <ResolvedIcon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                                !isActive ? "group-hover:scale-105" : ""
                              }`} />
                            </>
                          )}
                        </Link>
                        {!editMode && (
                        <button
                          type="button"
                          onClick={() => handleToggleFav(href, displayLabel)}
                          className={`absolute ${onRight ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 z-20 rounded p-0.5 transition-all ${
                            isFav
                              ? "text-amber-400 opacity-100"
                              : "text-slate-600 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                          }`}
                          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className="h-3 w-3" fill={isFav ? "currentColor" : "none"} />
                        </button>
                        )}
                        {/* Edit popover */}
                        {editMode && editingItemKey === key && (
                          <ItemEditPopover
                            itemKey={key}
                            currentLabel={label}
                            customization={customization.itemCustomizations[key]}
                            onUpdate={(patch) => updateItem(key, patch)}
                            onClear={() => clearItem(key)}
                            onClose={() => setEditingItemKey(null)}
                            isRtl={language === "he"}
                            labels={editLabels}
                          />
                        )}
                      </div>
                      </SortableNavItem>
                    );
                  })}
                </div>
              )}

              </div>{/* end collapse wrapper */}
            </div>
            </SortableContext>
          );
          })}

          {/* Add Section button (edit mode only) */}
          {editMode && !isCollapsed && (
            <div className="px-2 pt-2">
              {creatingSection ? (
                <div className="flex items-center gap-1 px-1">
                  <input
                    ref={newSectionInputRef}
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onBlur={() => {
                      if (newSectionName.trim()) createCustomSection(newSectionName.trim());
                      setCreatingSection(false);
                      setNewSectionName("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (newSectionName.trim()) createCustomSection(newSectionName.trim());
                        setCreatingSection(false);
                        setNewSectionName("");
                      }
                      if (e.key === "Escape") { setCreatingSection(false); setNewSectionName(""); }
                    }}
                    placeholder={sidebarT.newSectionName || "Section name..."}
                    className="flex-1 bg-transparent border-b border-[var(--cc-accent-500)] text-[10px] text-slate-300 font-medium outline-none px-0.5 py-0.5"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreatingSection(true)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-slate-600 hover:text-[var(--cc-accent-300)] hover:bg-[var(--cc-accent-600-20)] transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {sidebarT.addSection || "Add Section"}
                </button>
              )}
            </div>
          )}

         </DndContext>
        </nav>

        {/* Context menu */}
        {ctxMenu && (
          <SidebarContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            itemKey={ctxMenu.itemKey}
            href={ctxMenu.href}
            label={ctxMenu.label}
            isHidden={customization.hiddenItems.includes(ctxMenu.itemKey)}
            customFolders={customization.customFolders}
            isFavorite={favHrefs.has(ctxMenu.href)}
            onToggleFav={() => handleToggleFav(ctxMenu.href, ctxMenu.label)}
            onToggleHide={() => toggleHide(ctxMenu.itemKey)}
            onMoveToFolder={(fid) => moveItemToFolder(ctxMenu.itemKey, fid)}
            onRemoveFromFolder={() => removeFromFolder(ctxMenu.itemKey)}
            onCreateFolder={(name) => createCustomFolder(name, "core")}
            onClose={() => setCtxMenu(null)}
            isRtl={language === "he"}
            labels={{
              hide: sidebarT.hide || "Hide",
              show: sidebarT.show || "Show",
              openNewTab: sidebarT.openNewTab || "Open in new tab",
              addFav: sidebarT.addFav || "Add to favorites",
              removeFav: sidebarT.removeFav || "Remove from favorites",
              moveToFolder: sidebarT.moveToFolder || "Move to folder...",
              newFolder: sidebarT.newFolder || "New folder...",
              removeFromFolder: sidebarT.removeFromFolder || "Remove from folder",
              folderName: sidebarT.folderName || "Folder name",
              addNote: sidebarT.addNote || "Add note",
              editNote: sidebarT.editNote || "Edit note",
            }}
          />
        )}

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
