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
  CalendarDays,
  Bot,
  Palette,
  Network,
  Calendar,
  Compass,
  Users,
  Zap,
  Rss,
  MessagesSquare,
  MessageCircle,
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
  Wrench,
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
  GraduationCap,
  Store,
  BrainCircuit,
  FileStack,
  Phone,
  MessageSquareCode,
  Plug,
  Cable,
  Image,
  Video,
  AudioLines,
  UserCircle,
  Film,
  Search,
  Clock,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "@/lib/hooks/useShellPrefs";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { loadFavorites, saveFavorites } from "./widgets/FavoritesWidget";
import { useSidebarCustomization } from "@/lib/sidebar/useSidebarCustomization";
import { buildDisplayGroups } from "@/lib/sidebar/sidebarCustomization";
import type { ItemCustomization } from "@/lib/sidebar/sidebarCustomization";
import { useAppsRegistry, getAppStatusByRoute, getStatusBadge, type AppRecord } from "@/lib/hooks/useAppsRegistry";
import { useRecentItems, deleteRecentItem } from "@/lib/hooks/useRecentItems";
import { SidebarContextMenu } from "./SidebarContextMenu";
import { ItemEditPopover, getIconByName } from "./ItemEditPopover";
import { SOCIAL_LINKS, SocialIcon } from "./DownloadReminder";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

// ── Gradient map: sidebar nav key → [from, to] ──
// Matches app-catalog gradients for the apps-only view
const APP_GRADIENTS: Record<string, [string, string]> = {
  dashboard:       ["#6366f1", "#818cf8"],
  appLauncher:     ["#8b5cf6", "#a78bfa"],
  layers:          ["#3b82f6", "#60a5fa"],
  editor:          ["#6366f1", "#a78bfa"],
  storyMap:        ["#ec4899", "#f472b6"],
  aiHub:           ["#8b5cf6", "#c084fc"],
  cliAi:           ["#8b5cf6", "#c084fc"],
  aiAdvisors:      ["#7c3aed", "#a78bfa"],
  agents:          ["#6d28d9", "#8b5cf6"],
  aiKnowledge:     ["#7c3aed", "#a78bfa"],
  semanticBrain:   ["#6d28d9", "#a855f7"],
  entities:        ["#f97316", "#fb923c"],
  comms:           ["#06b6d4", "#22d3ee"],
  documents:       ["#a855f7", "#c084fc"],
  vclip:           ["#ef4444", "#f87171"],
  weeklyPlanner:   ["#10b981", "#34d399"],
  wiki:            ["#3b82f6", "#60a5fa"],
  wikiPages:       ["#3b82f6", "#60a5fa"],
  skills:          ["#8b5cf6", "#a78bfa"],
  skillsStore:     ["#7c3aed", "#a78bfa"],
  vcloud:          ["#0ea5e9", "#38bdf8"],
  vcloudFiles:     ["#0ea5e9", "#38bdf8"],
  vcloudImages:    ["#14b8a6", "#2dd4bf"],
  vcloudVideo:     ["#ef4444", "#f87171"],
  vcloudSound:     ["#f59e0b", "#fbbf24"],
  vcloudPersonal:  ["#8b5cf6", "#a78bfa"],
  functionalMap:   ["#10b981", "#34d399"],
  designSystem:    ["#ec4899", "#f472b6"],
  libraries:       ["#6366f1", "#818cf8"],
  entityFields:    ["#f97316", "#fb923c"],
  fieldTemplates:  ["#f97316", "#fb923c"],
  iconLibrary:     ["#eab308", "#facc15"],
  courses:         ["#8b5cf6", "#a78bfa"],
  databases:       ["#f97316", "#fb923c"],
  grid:            ["#f97316", "#fb923c"],
  matching:        ["#8b5cf6", "#c084fc"],
  slides:          ["#ec4899", "#f472b6"],
  templates:       ["#06b6d4", "#22d3ee"],
  emailTemplates:  ["#06b6d4", "#22d3ee"],
  phoneTemplates:  ["#10b981", "#34d399"],
  prompts:         ["#8b5cf6", "#c084fc"],
  integrations:    ["#6366f1", "#818cf8"],
  myConnections:   ["#6366f1", "#818cf8"],
  appStore:        ["#3b82f6", "#60a5fa"],
  vault:           ["#64748b", "#94a3b8"],
  vaultPasswords:  ["#64748b", "#94a3b8"],
  vaultSecrets:    ["#475569", "#64748b"],
  control:         ["#64748b", "#94a3b8"],
  roadmap:         ["#10b981", "#34d399"],
  plan:            ["#3b82f6", "#60a5fa"],
  architecture:    ["#64748b", "#94a3b8"],
  admin:           ["#64748b", "#94a3b8"],
  audit:           ["#f59e0b", "#fbbf24"],
  import:          ["#10b981", "#34d399"],
  bookmarks:       ["#f59e0b", "#fbbf24"],
  feeds:           ["#f97316", "#fb923c"],
  readList:        ["#f59e0b", "#fbbf24"],
  automations:     ["#eab308", "#facc15"],
  settings:        ["#64748b", "#94a3b8"],
};

const APPS_VIEW_WIDTH = 64;

const FULL_WIDTH = 240;
const MOBILE_WIDTH = 280;
const STRIP_WIDTH = 60;

const FILTER_KEY = "cc-sidebar-filter";
const VIEW_MODE_KEY = "cc-sidebar-view-mode";
const FOLDER_MODE_KEY = "cc-sidebar-folder-mode";

// ─── Types ──────────────────────────────────────────────

type SidebarFilter = "me" | "team" | "hidden" | "favorites";
type ViewMode = "list" | "grid" | "compact" | "apps";

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

/** Tiny status badge from vb_apps DB — shows "בפיתוח" / "מתוכנן" / "רעיון" */
function AppStatusBadge({ href, allApps }: { href: string; allApps: AppRecord[] }) {
  const status = getAppStatusByRoute(allApps, href);
  if (!status) return null;
  const label = getStatusBadge(status);
  if (!label) return null;
  const colors = status === "in-progress"
    ? "text-blue-400 bg-blue-400/10"
    : status === "idea"
      ? "text-slate-500 bg-slate-500/10"
      : "text-amber-400 bg-amber-400/10";
  return (
    <span className={`shrink-0 rounded px-1 py-0 text-[8px] font-medium leading-tight ${colors}`}>
      {label}
    </span>
  );
}

// ─── Sortable Section Wrapper ─────────────────────────────

function SortableSectionDiv({ id, editMode, children }: { id: string; editMode: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(editMode ? listeners : {})} className={editMode ? "cursor-grab active:cursor-grabbing" : ""}>
      {children}
    </div>
  );
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
      { href: "/dashboard/app-launcher", key: "appLauncher", icon: LayoutGrid, status: "active" },
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
          { href: "/dashboard/ai-knowledge", key: "aiKnowledge", icon: BookMarked, status: "coming-soon" },
          { href: "/dashboard/brain", key: "semanticBrain", icon: BrainCircuit, status: "active" },
        ],
      },
      { href: "/dashboard/entities", key: "entities", icon: Database, status: "active" },
      { href: "/dashboard/comms", key: "comms", icon: MessagesSquare, status: "active" },
      { href: "/dashboard/whatsapp", key: "whatsapp", icon: MessageCircle, status: "active" },
      { href: "/dashboard/documents", key: "documents", icon: FileSignature, status: "active" },
      { href: "/dashboard/vclip", key: "vclip", icon: Film, status: "active" },
      { href: "/dashboard/vcanvas", key: "vcanvas", icon: Pencil, status: "active" },
      { href: "/dashboard/weekly-planner", key: "weeklyPlanner", icon: CalendarDays, status: "active" },
      {
        type: "folder",
        href: "/dashboard/wiki",
        key: "wiki",
        icon: BookOpen,
        status: "active",
        children: [
          { href: "/dashboard/wiki", key: "wikiPages", icon: BookOpen, status: "active" },
          { href: "/dashboard/skills", key: "skills", icon: GraduationCap, status: "coming-soon" },
          { href: "/dashboard/skills/templates", key: "skillsStore", icon: Store, status: "coming-soon" },
        ],
      },
      {
        type: "folder",
        href: "/dashboard/vcloud",
        key: "vcloud",
        icon: Cloud,
        status: "active",
        children: [
          { href: "/dashboard/vcloud/files", key: "vcloudFiles", icon: FolderArchive, status: "active" },
          { href: "/dashboard/vcloud/images", key: "vcloudImages", icon: Image, status: "active" },
          { href: "/dashboard/vcloud/video", key: "vcloudVideo", icon: Video, status: "active" },
          { href: "/dashboard/vcloud/sound", key: "vcloudSound", icon: AudioLines, status: "active" },
          { href: "/dashboard/vcloud/personal", key: "vcloudPersonal", icon: UserCircle, status: "active" },
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
          { href: "/dashboard/icon-library", key: "iconLibrary", icon: Sparkles, status: "active" },
          { href: "/dashboard/vcloud?tab=courses", key: "courses", icon: GraduationCap, status: "active" },
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
      { href: "/dashboard/toolkit", key: "toolkit", icon: Wrench, status: "active" },
      {
        type: "folder",
        href: "/dashboard/email-templates",
        key: "templates",
        icon: FileStack,
        status: "active",
        children: [
          { href: "/dashboard/email-templates", key: "emailTemplates", icon: Mail, status: "active" },
          { href: "/dashboard/phone-templates", key: "phoneTemplates", icon: Phone, status: "coming-soon" },
          { href: "/dashboard/prompts", key: "prompts", icon: MessageSquareCode, status: "coming-soon" },
        ],
      },
      {
        type: "folder",
        href: "/dashboard/integrations",
        key: "integrations",
        icon: Plug,
        status: "active",
        children: [
          { href: "/dashboard/integrations", key: "myConnections", icon: Cable, status: "active" },
          { href: "/dashboard/integrations/store", key: "appStore", icon: Store, status: "active" },
        ],
      },
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
          { href: "/dashboard/maintenance", key: "maintenance", icon: Wrench, status: "active" },
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
    if (v === "grid" || v === "compact" || v === "apps") return v;
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
  /** When true, sidebar stays expanded and pushes content */
  sidebarPinned?: boolean;
  /** Toggle pin state */
  onPinToggle?: () => void;
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
  sidebarPinned = false,
  onPinToggle,
  onWidthChange,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, sidebarPosition, sidebarVisibility, brandProfile } = useSettings();
  const { user, signOut, permissions } = useAuth();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const { allApps } = useAppsRegistry();
  const { recentItems } = useRecentItems();
  const queryClient = useQueryClient();
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // userMenuOpen removed — handled by WorkspaceSwitcher
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  // userMenuRef removed — handled by WorkspaceSwitcher
  const socialMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navTop, setNavTop] = useState(120);
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(null);

  const [filter, setFilter] = useState<SidebarFilter>("me");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [favHrefs, setFavHrefs] = useState<Set<string>>(new Set());
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set<string>());

  // Hydrate openFolders from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const v = localStorage.getItem("cc-sidebar-folders");
      if (v) setOpenFolders(new Set(JSON.parse(v)));
    } catch {}
  }, []);
  const [folderMode, setFolderMode] = useState<boolean>(true);

  // Hydrate folderMode from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const v = localStorage.getItem(FOLDER_MODE_KEY);
      if (v === "flat") setFolderMode(false);
    } catch {}
  }, []);

  // ── Sidebar customization (reorder, hide, folders, usage tracking) ──
  const {
    customization, editMode, reorder, createFolder: createCustomFolder, deleteFolder,
    moveToFolder: moveItemToFolder, removeFromFolder, toggleHide, trackUsage,
    toggleAutoSort: handleToggleAutoSort, toggleEditMode, reset: resetSidebarCustom, setEditMode,
    updateItem, clearItem,
    toggleSection, renameSection, createSection: createCustomSection, deleteSection, isSectionEmpty,
    moveItemToSection, removeItemFromSection, updateSection: updateSectionOverride,
  } = useSidebarCustomization(language);

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

  // Helper: get icon position for an item (default to "start" before hydration to avoid mismatch)
  const getIconPosition = useCallback((itemKey: string): "start" | "end" | "above" => {
    if (!mounted) return "start";
    return customization.itemCustomizations[itemKey]?.iconPosition || "start";
  }, [customization.itemCustomizations, mounted]);


  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{
    x: number; y: number; itemKey: string; href: string; label: string;
  } | null>(null);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

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

  // navTop: compute position for workspace switcher dropdown
  useEffect(() => {
    if (navRef.current) {
      setNavTop(navRef.current.getBoundingClientRect().top - 8);
    }
  }, []);

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
  // When pinned, sidebar stays expanded and pushes content (not overlay)
  const isHoverReveal = mode === "visible" && sidebarHoverMode && !sidebarPinned && !isMobile;
  const isAppsView = viewMode === "apps";
  const isCollapsed = isAppsView ? false : isFloat ? !hovered : isHoverReveal ? !hovered : false;
  const onRight = sidebarPosition === "right";
  const expandedWidth = isAppsView ? APPS_VIEW_WIDTH : isMobile ? MOBILE_WIDTH : (customWidth ?? FULL_WIDTH);

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
  const tabsT = t.tabs as Record<string, string>;

  const filteredGroups = buildDisplayGroups(
    NAV_GROUPS, customization, filter, favHrefs, permissions, editMode,
  ).map((dg) => {
    let items = dg.items;

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.flatMap((entry) => {
        if (isFolder(entry)) {
          // Check folder label
          const folderLabel = (resolveLabel(entry.key, tabsT[entry.key] || entry.key)).toLowerCase();
          // Filter children
          const matchingChildren = entry.children.filter((child) => {
            const childLabel = (resolveLabel(child.key, tabsT[child.key] || child.key)).toLowerCase();
            return childLabel.includes(q) || child.key.toLowerCase().includes(q);
          });
          // If folder itself matches, keep all children; otherwise keep only matching children
          if (folderLabel.includes(q)) return [entry];
          if (matchingChildren.length > 0) return [{ ...entry, children: matchingChildren }];
          return [];
        }
        const label = (resolveLabel(entry.key, tabsT[entry.key] || entry.key)).toLowerCase();
        return (label.includes(q) || entry.key.toLowerCase().includes(q)) ? [entry] : [];
      });
    }

    return {
      id: dg.id,
      labelKey: dg.labelKey,
      isCustomFolder: dg.isCustomFolder,
      customFolderName: dg.customFolderName,
      isCustomSection: dg.isCustomSection,
      displayName: dg.displayName,
      emoji: dg.emoji,
      items,
    };
  }).filter((g) => g.items.length > 0 || !searchQuery.trim());

  // DnD handler — reorder items within a group
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    // Case 1: Section reorder (both IDs are section: prefixed)
    if (activeId.startsWith("section:") && overId.startsWith("section:")) {
      const activeSectionId = activeId.replace("section:", "");
      const overSectionId = overId.replace("section:", "");
      const sectionIds = filteredGroups.map((g) => g.id);
      const oldIdx = sectionIds.indexOf(activeSectionId);
      const newIdx = sectionIds.indexOf(overSectionId);
      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = arrayMove(sectionIds, oldIdx, newIdx);
        reordered.forEach((id, i) => {
          updateSectionOverride(id, { sortOrder: i * 10 });
        });
      }
      return;
    }

    // Case 2: Item dropped onto a section header → move to that section
    if (!activeId.startsWith("section:") && overId.startsWith("section:")) {
      const targetSectionId = overId.replace("section:", "");
      const targetGroup = filteredGroups.find((g) => g.id === targetSectionId);
      if (targetGroup?.isCustomSection) {
        moveItemToSection(activeId, targetSectionId);
      }
      return;
    }

    // Case 3: Normal item reorder within same group
    for (const group of filteredGroups) {
      const flatItemKeys = group.items.flatMap((e) =>
        isFolder(e) ? [e.key, ...e.children.map((c) => c.key)] : [e.key]
      );
      const oldIdx = flatItemKeys.indexOf(activeId);
      const newIdx = flatItemKeys.indexOf(overId);
      if (oldIdx !== -1 && newIdx !== -1) {
        const newOrder = arrayMove(flatItemKeys, oldIdx, newIdx);
        reorder(group.id, newOrder);
        break;
      }
    }
  }, [filteredGroups, reorder, moveItemToSection, updateSectionOverride]);

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
    { id: "apps", icon: CircleDot, label: sidebarT.viewApps || "Apps" },
  ];

  return (
    <aside
      data-cc-id="sidebar.root"
      className={`sidebar fixed top-12 shrink-0 overflow-hidden ${
        isHoverReveal && hovered ? "z-[45] shadow-2xl" : "z-[35]"
      } ${
        onRight ? "right-0 border-l" : "border-r"
      } border-slate-700/50 ${
        isFloat ? "shadow-lg" : ""
      } ${
        isHidden ? `transition-transform duration-200 ease-out ${translateClass}` : ""
      }`}
      style={{
        width: isCollapsed ? STRIP_WIDTH : expandedWidth,
        maxWidth: isMobile ? "100vw" : undefined,
        height: "calc(100vh - 48px)",
        ...(!onRight ? { left: 48 } : {}),
        transition: "width 300ms ease-out",
        backgroundColor: isCollapsed
          ? "color-mix(in srgb, var(--nav-bg) 80%, transparent)"
          : "var(--nav-bg)",
      }}
      onMouseEnter={(isFloat || isHoverReveal) ? () => setHovered(true) : undefined}
      onMouseLeave={(isFloat || isHoverReveal) ? () => setHovered(false) : undefined}
    >
      <div className="flex h-full flex-col">
        {/* Close button for floating sidebar (no header logo) */}
        {isFloating && !isFloat && onClose && (
          <div className="flex justify-end px-2 pt-2">
            <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pin button — shown in hover-reveal mode when expanded */}
        {isHoverReveal && hovered && onPinToggle && (
          <div className="flex justify-end px-2 pt-1">
            <button
              type="button"
              onClick={onPinToggle}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-purple-300 transition-colors"
              title={sidebarPinned ? "בטל נעיצה" : "נעץ sidebar"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </button>
          </div>
        )}
        {/* Unpin button — shown when pinned */}
        {sidebarPinned && sidebarHoverMode && onPinToggle && !isCollapsed && (
          <div className="flex justify-end px-2 pt-1">
            <button
              type="button"
              onClick={onPinToggle}
              className="rounded p-1.5 text-purple-400 hover:bg-slate-800 hover:text-purple-300 transition-colors"
              title="בטל נעיצה"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </button>
          </div>
        )}

        {/* Workspace Switcher — replaces old user menu */}
        {user && !isAppsView && (
          <WorkspaceSwitcher
            user={user}
            isCollapsed={isCollapsed}
            onRight={onRight}
            expandedWidth={expandedWidth}
            navTop={navTop}
          />
        )}

        {/* Filter tabs + View mode (hidden when collapsed or apps view) */}
        {!isCollapsed && !isAppsView && (
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

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "he" ? "חיפוש בתפריט..." : "Search menu..."}
                className="w-full rounded-md border border-slate-700/50 bg-slate-800/50 py-1 ps-7 pe-7 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
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

        {/* Apps-only view — gradient icon strip */}
        {isAppsView && (() => {
          // Build filtered items using the same filter logic as main nav
          const appsFilteredItems = NAV_GROUPS.flatMap((group) =>
            group.items.flatMap((entry): NavItem[] => {
              if (isFolder(entry)) {
                return [
                  { href: entry.href, key: entry.key, icon: entry.icon, status: entry.status },
                  ...entry.children,
                ];
              }
              return [entry];
            })
          )
            // Apply filter
            .filter((item) => {
              if (filter === "hidden") return customization.hiddenItems.includes(item.key);
              if (filter === "favorites") return favHrefs.has(item.href);
              // "me" and "team" show non-hidden
              return !customization.hiddenItems.includes(item.key);
            })
            // Deduplicate by href
            .filter((item, idx, arr) => arr.findIndex((a) => a.href === item.href) === idx);

          return (
          <nav className="flex flex-1 flex-col overflow-hidden">
            {/* Top controls — compact filter + view toggle */}
            <div className="shrink-0 px-1.5 pt-2 pb-1 space-y-1.5">
              {/* Filter icons row */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-0.5 rounded-lg bg-slate-800/50 p-0.5">
                  {filterTabs.map((tab) => {
                    const filterIcons: Record<SidebarFilter, React.ElementType> = {
                      me: UserIcon,
                      team: Users,
                      hidden: EyeOff,
                      favorites: Star,
                    };
                    const FilterIcon = filterIcons[tab.id];
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleFilterChange(tab.id)}
                        title={tab.label}
                        className={`rounded-md p-1.5 transition-colors ${
                          filter === tab.id
                            ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                      >
                        <FilterIcon className="h-3 w-3" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center justify-center gap-0.5">
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
                    <ModeIcon className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent items */}
            {recentItems.length > 0 && (
              <div className="px-1.5 pt-1.5 pb-0.5">
                <div className="flex items-center gap-1 px-1 mb-1">
                  <Clock className="h-2.5 w-2.5 text-slate-600" />
                  <span className="text-[9px] text-slate-600 font-medium">אחרונים</span>
                </div>
                <div className="space-y-0.5 max-h-36 overflow-y-auto scrollbar-none">
                  {recentItems.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={item.route}
                      onClick={() => { if (shouldCloseOnNav) onClose?.(); }}
                      className="group/recent flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="text-[10px] shrink-0">{item.icon || "📄"}</span>
                      <span className="text-[10px] text-slate-400 truncate flex-1">{item.title}</span>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await deleteRecentItem(item.id);
                          await queryClient.invalidateQueries({ queryKey: ["recent-items"] });
                        }}
                        className="opacity-0 group-hover/recent:opacity-100 shrink-0 rounded p-0.5 text-slate-700 hover:text-red-400 transition-all"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Accent divider */}
            <div className="mx-2 divider-accent" />

            {/* App icons grid */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2 scrollbar-none">
              <div className="flex flex-col items-center gap-2">
                {appsFilteredItems.length === 0 ? (
                  <div className="py-6 text-center">
                    <EyeOff className="h-4 w-4 mx-auto text-slate-700 mb-1" />
                    <span className="text-[9px] text-slate-700">{filter === "favorites" ? "★" : "—"}</span>
                  </div>
                ) : (
                  appsFilteredItems.map((item) => {
                    const isActive = item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                    const gradient = APP_GRADIENTS[item.key] || ["#475569", "#64748b"];
                    const [from, to] = gradient;
                    const itemLabel = resolveLabel(item.key, tabsT[item.key] || item.key);
                    const ItemIcon = resolveIcon(item.key, item.icon);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => { trackUsage(item.key); if (shouldCloseOnNav) onClose?.(); }}
                        className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-all duration-200 ${
                          isActive
                            ? "scale-110"
                            : "hover:scale-108 opacity-75 hover:opacity-100"
                        } ${item.status === "coming-soon" ? "opacity-30 grayscale" : ""}`}
                        style={{
                          background: `linear-gradient(135deg, ${from}, ${to})`,
                          boxShadow: isActive
                            ? `0 6px 16px ${from}50, 0 0 0 2px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`
                            : `0 2px 8px ${from}20`,
                        }}
                      >
                        {/* Gloss overlay */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-[14px]"
                          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%)" }}
                        />
                        <ItemIcon className="relative z-10 h-5 w-5 text-white drop-shadow-sm" />
                        {/* Active indicator — bottom dot */}
                        {isActive && (
                          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full"
                            style={{ background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: `0 0 6px ${from}60` }}
                          />
                        )}
                        {/* Tooltip */}
                        <span
                          className={`absolute ${
                            onRight ? "right-full mr-3" : "left-full ml-3"
                          } rounded-lg px-2.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50 shadow-xl`}
                          style={{
                            background: `linear-gradient(135deg, ${from}ee, ${to}ee)`,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          {itemLabel}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Settings shortcut at bottom */}
            <div className="shrink-0 px-1.5 pb-2 pt-1">
              <div className="mx-1 mb-1.5 divider-accent" />
              <div className="flex items-center justify-center">
                <Link
                  href="/dashboard/settings"
                  className={`group relative rounded-lg p-2 transition-colors ${
                    pathname === "/dashboard/settings"
                      ? "text-[var(--cc-accent-300)] bg-[var(--cc-accent-600-20)]"
                      : "text-slate-600 hover:text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span
                    className={`absolute ${
                      onRight ? "right-full mr-2" : "left-full ml-2"
                    } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                  >
                    {tabsT.settings || "Settings"}
                  </span>
                </Link>
              </div>
            </div>
          </nav>
          );
        })()}

        {/* Nav with grouped items */}
        {!isAppsView && <nav
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

         <DndContext
           id="sidebar-dnd"
           sensors={sensors}
           collisionDetection={closestCenter}
           onDragEnd={handleDragEnd}
           autoScroll={{ threshold: { x: 0, y: 0.15 }, interval: 5 }}
         >
          <SortableContext items={filteredGroups.map((g) => `section:${g.id}`)} strategy={verticalListSortingStrategy}>
          {filteredGroups.map((group, gi) => {
            // Collect all sortable IDs for this group (section header + items)
            const sortableIds = [`section:${group.id}`, ...group.items.flatMap((e) =>
              isFolder(e) ? [e.key, ...e.children.map((c) => c.key)] : [e.key]
            )];
            const isSectionCollapsed = collapsedSet.has(group.id);
            const sectionLabel = group.displayName || group.customFolderName || sidebarT[group.labelKey] || group.id;
            const sectionEmoji = group.emoji;
            const isRenamingThis = renamingSectionId === group.id;
            const canDelete = (group.isCustomSection || group.isCustomFolder) && isSectionEmpty(group.id);

            return (
            <SortableContext key={group.id} items={sortableIds} strategy={viewMode === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
            <SortableSectionDiv id={`section:${group.id}`} editMode={editMode}>
              {/* Group label / divider — now interactive toggle */}
              {gi > 0 && isCollapsed && (
                <div className="mx-2 my-2 border-t border-slate-700/30" />
              )}
              {!isCollapsed && (viewMode === "list" || viewMode === "grid") && (
                <div className={`${gi === 0 ? "pt-1 pb-1" : "pt-3 pb-1"} ${viewMode === "grid" ? "px-1" : "px-2"}`}>
                  <div className={`group/section relative flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 transition-colors ${
                    editMode ? "hover:bg-slate-800/50" : "hover:bg-slate-800/30 cursor-pointer"
                  }`}>
                    {/* Decorative accent shape */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md" aria-hidden>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-12 rounded-full bg-gradient-to-l from-[var(--cc-accent-500)]/[0.04] to-transparent blur-sm" />
                    </div>
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
                  <div className={`group/section relative flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors ${
                    editMode ? "hover:bg-slate-800/50" : "hover:bg-slate-800/30 cursor-pointer"
                  }`}>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md" aria-hidden>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-10 rounded-full bg-gradient-to-l from-[var(--cc-accent-500)]/[0.04] to-transparent blur-sm" />
                    </div>
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
              <div className={`transition-all duration-200 ease-out ${
                isSectionCollapsed && !isCollapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-[2000px] opacity-100"
              } ${editingItemKey && sortableIds.includes(editingItemKey) ? "overflow-visible" : "overflow-hidden"}`}>

              {/* Items — Grid view */}
              {!isCollapsed && viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-1 px-1">
                  {group.items.map((entry) => {
                    // Flatten folders into grid — show folder + children as separate grid items
                    const flatItems: NavItem[] = isFolder(entry)
                      ? [{ href: entry.href, key: entry.key, icon: entry.icon, status: entry.status }, ...entry.children]
                      : [entry];
                    // Deduplicate by href (folder parent can share href with first child)
                    const seen = new Set<string>();
                    return flatItems
                      .filter(({ href: h, key: k }) => {
                        if (seen.has(h)) return false;
                        seen.add(h);
                        return !customization.hiddenItems.includes(k) || editMode;
                      })
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
                      const { href, key, icon: DefaultFolderIcon, children } = entry;
                      const rawFolderLabel = (t.tabs as Record<string, string>)[key];
                      const folderLabel = resolveLabel(key, rawFolderLabel);
                      const FolderIcon = resolveIcon(key, DefaultFolderIcon);
                      const isOpen = openFolders.has(key);
                      const isFolderActive = pathname === href || pathname.startsWith(href + "/");
                      const hasActiveChild = children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
                      const isHighlighted = isFolderActive || hasActiveChild;
                      const isFolderHidden = customization.hiddenItems.includes(key);

                      if (isCollapsed) {
                        if (isFolderHidden && !editMode) return null;
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
                            } ${isFolderHidden ? "opacity-30" : ""}`}
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
                        <SortableNavItem
                          key={key}
                          id={key}
                          editMode={editMode}
                          isHidden={isFolderHidden}
                          onToggleHide={() => toggleHide(key)}
                          onRight={onRight}
                          onEditClick={editMode ? () => setEditingItemKey(editingItemKey === key ? null : key) : undefined}
                        >
                        <div className={`group/item relative ${isFolderHidden && editMode ? "opacity-30" : ""}`}>
                          {/* Folder header — name navigates + opens, chevron toggles */}
                          <div className="flex items-center">
                            <Link
                              href={editMode ? "#" : href}
                              onClick={(e) => {
                                if (editMode) { e.preventDefault(); return; }
                                trackUsage(key);
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
                              } ${editMode ? "ring-1 ring-slate-700/50 ring-dashed" : ""}`}
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
                          {/* Edit popover for folder */}
                          {editMode && editingItemKey === key && (
                            <ItemEditPopover
                              itemKey={key}
                              currentLabel={rawFolderLabel}
                              customization={customization.itemCustomizations[key]}
                              onUpdate={(patch) => updateItem(key, patch)}
                              onClear={() => clearItem(key)}
                              onClose={() => setEditingItemKey(null)}
                              isRtl={language === "he"}
                              labels={editLabels}
                            />
                          )}
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
                        </SortableNavItem>
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
                          key={key}
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
                        key={key}
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
                              <AppStatusBadge href={href} allApps={allApps} />
                            </>
                          ) : (
                            <>
                              <AppStatusBadge href={href} allApps={allApps} />
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
            </SortableSectionDiv>
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

         </SortableContext>
         </DndContext>
        </nav>}

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
        {!isCollapsed && !isAppsView && (
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
      {!isMobile && !isCollapsed && !isAppsView && (
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
