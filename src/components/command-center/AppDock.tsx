"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search, Bot, Plus, Pin, Calendar, CalendarDays, Bell, Clock,
  ClipboardList, Settings, MessageCircle, Users, BarChart3,
  Rss, TrendingUp, Mail,
  GripVertical, X, LayoutDashboard, FileEdit, Map, Layers, Grid3X3,
  Palette, Compass, Zap, Shield, BookOpen, MessagesSquare,
  FileSignature, Gauge, Globe, Video, Image, Phone, Contact,
  Activity, PieChart, Calculator, Terminal, Filter, History,
  Camera, Mic, Download, Star, EyeOff, Eye,
  ExternalLink, Copy, ArrowUpToLine, ArrowDownToLine, Pencil, Trash2 as Trash2Icon,
  PanelLeft, PanelTop, SquareSplitHorizontal,
  // Icon picker extras
  Home, Heart, Bookmark, Tag, Hash, AtSign, Link, Send, Share2,
  Folder, FolderOpen, File, FileText, FilePlus, FileCheck,
  Lock, Unlock, Key, Fingerprint, ShieldCheck,
  Wifi, Bluetooth, Cloud, CloudUpload, CloudDownload,
  Monitor, Smartphone, Tablet, Laptop, Cpu, HardDrive, Server, Database,
  Code, GitBranch, GitPullRequest, GitMerge, GitCommit,
  Play, Pause, SkipForward, Volume2, Music, Headphones,
  Sun, Moon, CloudSun, Thermometer, Droplets, Wind,
  MapPin, Navigation, Route, Truck, Car, Plane,
  Briefcase, Building, Building2 as Building2Icon, Landmark, Wallet, CreditCard, Receipt, DollarSign, Coins,
  Brain, Sparkles, Wand2, Lightbulb, Atom, Rocket, Target, Trophy, Award, Crown, Gem, Diamond,
  AlertTriangle, AlertCircle, Info, HelpCircle, CheckCircle, XCircle, Ban,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, RotateCw, Repeat, Shuffle,
  Maximize, Minimize, Move, Crosshair, ScanLine, QrCode,
  Scissors, PenTool, Eraser, Paintbrush, Highlighter, Pipette,
  Table, Kanban, BarChart, LineChart, AreaChart,
  UserPlus, UserCheck, UserX, UsersRound, Contact2,
  MessageSquare, PhoneCall, PhoneOff, VideoOff, Voicemail,
  Package, Box, Archive, FolderPlus,
  Flame, Snowflake, Leaf, TreePine, Mountain, Waves,
  Cat, Dog, Bug, Fish, Bird,
  Pizza, Coffee, IceCream, Apple, Cherry,
  Shirt, Watch, Glasses, Umbrella,
  Flag, Megaphone, PartyPopper, Gift, Cake, Ribbon,
  Stethoscope, Pill, Syringe, HeartPulse, Dumbbell,
  GraduationCap, BookMarked, Library, PencilRuler, Presentation,
  Hammer, Wrench, SlidersHorizontal, Cog, CircleDot,
  HardHat, Ruler, Construction, Warehouse, Factory,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSettings } from "@/contexts/SettingsContext";
import { useWidgets } from "@/contexts/WidgetContext";
import { getTranslations } from "@/lib/i18n";

// ─── Icon Library ───────────────────────────────────────

interface IconEntry {
  name: string;
  icon: LucideIcon;
}

interface IconCategory {
  key: string;
  he: string;
  en: string;
  icons: IconEntry[];
}

const ICON_LIBRARY: IconCategory[] = [
  {
    key: "general", he: "כללי", en: "General",
    icons: [
      { name: "Home", icon: Home }, { name: "Search", icon: Search }, { name: "Settings", icon: Settings },
      { name: "Plus", icon: Plus }, { name: "Star", icon: Star }, { name: "Heart", icon: Heart },
      { name: "Bookmark", icon: Bookmark }, { name: "Pin", icon: Pin }, { name: "Tag", icon: Tag },
      { name: "Hash", icon: Hash }, { name: "AtSign", icon: AtSign }, { name: "Link", icon: Link },
      { name: "Flag", icon: Flag }, { name: "Target", icon: Target }, { name: "Crosshair", icon: Crosshair },
      { name: "Info", icon: Info }, { name: "HelpCircle", icon: HelpCircle }, { name: "AlertTriangle", icon: AlertTriangle },
      { name: "CheckCircle", icon: CheckCircle }, { name: "XCircle", icon: XCircle }, { name: "Ban", icon: Ban },
      { name: "CircleDot", icon: CircleDot }, { name: "QrCode", icon: QrCode }, { name: "ScanLine", icon: ScanLine },
    ],
  },
  {
    key: "navigation", he: "ניווט", en: "Navigation",
    icons: [
      { name: "ArrowUp", icon: ArrowUp }, { name: "ArrowDown", icon: ArrowDown },
      { name: "ArrowLeft", icon: ArrowLeft }, { name: "ArrowRight", icon: ArrowRight },
      { name: "RefreshCw", icon: RefreshCw }, { name: "RotateCw", icon: RotateCw },
      { name: "Repeat", icon: Repeat }, { name: "Shuffle", icon: Shuffle },
      { name: "Maximize", icon: Maximize }, { name: "Minimize", icon: Minimize },
      { name: "Move", icon: Move }, { name: "Compass", icon: Compass },
      { name: "MapPin", icon: MapPin }, { name: "Navigation", icon: Navigation },
      { name: "Route", icon: Route }, { name: "Map", icon: Map }, { name: "Globe", icon: Globe },
    ],
  },
  {
    key: "comm", he: "תקשורת", en: "Communication",
    icons: [
      { name: "Mail", icon: Mail }, { name: "Send", icon: Send }, { name: "MessageCircle", icon: MessageCircle },
      { name: "MessageSquare", icon: MessageSquare }, { name: "MessagesSquare", icon: MessagesSquare },
      { name: "Phone", icon: Phone }, { name: "PhoneCall", icon: PhoneCall },
      { name: "Video", icon: Video }, { name: "Megaphone", icon: Megaphone },
      { name: "Share2", icon: Share2 }, { name: "AtSign", icon: AtSign },
      { name: "Contact", icon: Contact }, { name: "Voicemail", icon: Voicemail },
    ],
  },
  {
    key: "files", he: "קבצים", en: "Files",
    icons: [
      { name: "File", icon: File }, { name: "FileText", icon: FileText }, { name: "FilePlus", icon: FilePlus },
      { name: "FileCheck", icon: FileCheck }, { name: "FileEdit", icon: FileEdit },
      { name: "FileSignature", icon: FileSignature }, { name: "Folder", icon: Folder },
      { name: "FolderOpen", icon: FolderOpen }, { name: "FolderPlus", icon: FolderPlus },
      { name: "Archive", icon: Archive }, { name: "Package", icon: Package },
      { name: "Box", icon: Box }, { name: "Trash2", icon: Trash2Icon },
      { name: "Download", icon: Download }, { name: "CloudUpload", icon: CloudUpload },
      { name: "CloudDownload", icon: CloudDownload },
    ],
  },
  {
    key: "users", he: "משתמשים", en: "Users",
    icons: [
      { name: "Users", icon: Users }, { name: "UsersRound", icon: UsersRound },
      { name: "UserPlus", icon: UserPlus }, { name: "UserCheck", icon: UserCheck },
      { name: "UserX", icon: UserX }, { name: "Contact2", icon: Contact2 },
    ],
  },
  {
    key: "business", he: "עסקים ופיננסים", en: "Business",
    icons: [
      { name: "Briefcase", icon: Briefcase }, { name: "Building", icon: Building },
      { name: "Building2", icon: Building2Icon }, { name: "Landmark", icon: Landmark },
      { name: "Wallet", icon: Wallet }, { name: "CreditCard", icon: CreditCard },
      { name: "Receipt", icon: Receipt }, { name: "DollarSign", icon: DollarSign },
      { name: "Coins", icon: Coins }, { name: "BarChart3", icon: BarChart3 },
      { name: "TrendingUp", icon: TrendingUp }, { name: "PieChart", icon: PieChart },
    ],
  },
  {
    key: "data", he: "נתונים וקוד", en: "Data & Code",
    icons: [
      { name: "Database", icon: Database }, { name: "Server", icon: Server },
      { name: "Cpu", icon: Cpu }, { name: "HardDrive", icon: HardDrive },
      { name: "Code", icon: Code }, { name: "Terminal", icon: Terminal },
      { name: "GitBranch", icon: GitBranch }, { name: "GitPullRequest", icon: GitPullRequest },
      { name: "GitMerge", icon: GitMerge }, { name: "GitCommit", icon: GitCommit },
      { name: "Table", icon: Table }, { name: "Kanban", icon: Kanban },
      { name: "BarChart", icon: BarChart }, { name: "LineChart", icon: LineChart },
      { name: "AreaChart", icon: AreaChart }, { name: "Activity", icon: Activity },
      { name: "Gauge", icon: Gauge },
    ],
  },
  {
    key: "devices", he: "מכשירים", en: "Devices",
    icons: [
      { name: "Monitor", icon: Monitor }, { name: "Laptop", icon: Laptop },
      { name: "Smartphone", icon: Smartphone }, { name: "Tablet", icon: Tablet },
      { name: "Wifi", icon: Wifi }, { name: "Bluetooth", icon: Bluetooth },
      { name: "Cloud", icon: Cloud },
    ],
  },
  {
    key: "media", he: "מדיה", en: "Media",
    icons: [
      { name: "Image", icon: Image }, { name: "Camera", icon: Camera },
      { name: "Video", icon: Video }, { name: "Mic", icon: Mic },
      { name: "Play", icon: Play }, { name: "Pause", icon: Pause },
      { name: "SkipForward", icon: SkipForward }, { name: "Volume2", icon: Volume2 },
      { name: "Music", icon: Music }, { name: "Headphones", icon: Headphones },
    ],
  },
  {
    key: "security", he: "אבטחה", en: "Security",
    icons: [
      { name: "Shield", icon: Shield }, { name: "ShieldCheck", icon: ShieldCheck },
      { name: "Lock", icon: Lock }, { name: "Unlock", icon: Unlock },
      { name: "Key", icon: Key }, { name: "Fingerprint", icon: Fingerprint },
      { name: "Eye", icon: Eye }, { name: "EyeOff", icon: EyeOff },
    ],
  },
  {
    key: "design", he: "עיצוב", en: "Design",
    icons: [
      { name: "Palette", icon: Palette }, { name: "Paintbrush", icon: Paintbrush },
      { name: "Pencil", icon: Pencil }, { name: "PenTool", icon: PenTool },
      { name: "Eraser", icon: Eraser }, { name: "Highlighter", icon: Highlighter },
      { name: "Pipette", icon: Pipette }, { name: "Scissors", icon: Scissors },
      { name: "Layers", icon: Layers }, { name: "Grid3X3", icon: Grid3X3 },
    ],
  },
  {
    key: "time", he: "זמן", en: "Time",
    icons: [
      { name: "Clock", icon: Clock }, { name: "Calendar", icon: Calendar },
      { name: "CalendarDays", icon: CalendarDays }, { name: "History", icon: History },
      { name: "Bell", icon: Bell }, { name: "Zap", icon: Zap },
    ],
  },
  {
    key: "ai", he: "AI ומדע", en: "AI & Science",
    icons: [
      { name: "Brain", icon: Brain }, { name: "Bot", icon: Bot },
      { name: "Sparkles", icon: Sparkles }, { name: "Wand2", icon: Wand2 },
      { name: "Lightbulb", icon: Lightbulb }, { name: "Atom", icon: Atom },
      { name: "Rocket", icon: Rocket },
    ],
  },
  {
    key: "construction", he: "בנייה ותעשייה", en: "Construction",
    icons: [
      { name: "HardHat", icon: HardHat }, { name: "Hammer", icon: Hammer },
      { name: "Wrench", icon: Wrench }, { name: "Construction", icon: Construction },
      { name: "Ruler", icon: Ruler }, { name: "Warehouse", icon: Warehouse },
      { name: "Factory", icon: Factory }, { name: "Truck", icon: Truck },
      { name: "PencilRuler", icon: PencilRuler },
    ],
  },
  {
    key: "transport", he: "תחבורה", en: "Transport",
    icons: [
      { name: "Car", icon: Car }, { name: "Truck", icon: Truck },
      { name: "Plane", icon: Plane },
    ],
  },
  {
    key: "health", he: "בריאות", en: "Health",
    icons: [
      { name: "Stethoscope", icon: Stethoscope }, { name: "Pill", icon: Pill },
      { name: "Syringe", icon: Syringe }, { name: "HeartPulse", icon: HeartPulse },
      { name: "Dumbbell", icon: Dumbbell },
    ],
  },
  {
    key: "education", he: "חינוך", en: "Education",
    icons: [
      { name: "GraduationCap", icon: GraduationCap }, { name: "BookOpen", icon: BookOpen },
      { name: "BookMarked", icon: BookMarked }, { name: "Library", icon: Library },
      { name: "Presentation", icon: Presentation },
    ],
  },
  {
    key: "nature", he: "טבע ומזג אוויר", en: "Nature & Weather",
    icons: [
      { name: "Sun", icon: Sun }, { name: "Moon", icon: Moon }, { name: "CloudSun", icon: CloudSun },
      { name: "Thermometer", icon: Thermometer }, { name: "Droplets", icon: Droplets }, { name: "Wind", icon: Wind },
      { name: "Flame", icon: Flame }, { name: "Snowflake", icon: Snowflake },
      { name: "Leaf", icon: Leaf }, { name: "TreePine", icon: TreePine },
      { name: "Mountain", icon: Mountain }, { name: "Waves", icon: Waves },
    ],
  },
  {
    key: "fun", he: "כיף ואירועים", en: "Fun & Events",
    icons: [
      { name: "Trophy", icon: Trophy }, { name: "Award", icon: Award },
      { name: "Crown", icon: Crown }, { name: "Gem", icon: Gem }, { name: "Diamond", icon: Diamond },
      { name: "PartyPopper", icon: PartyPopper }, { name: "Gift", icon: Gift },
      { name: "Cake", icon: Cake }, { name: "Ribbon", icon: Ribbon },
      { name: "Coffee", icon: Coffee }, { name: "Pizza", icon: Pizza },
      { name: "IceCream", icon: IceCream }, { name: "Apple", icon: Apple }, { name: "Cherry", icon: Cherry },
    ],
  },
  {
    key: "animals", he: "בעלי חיים", en: "Animals",
    icons: [
      { name: "Cat", icon: Cat }, { name: "Dog", icon: Dog },
      { name: "Bug", icon: Bug }, { name: "Fish", icon: Fish }, { name: "Bird", icon: Bird },
    ],
  },
  {
    key: "accessories", he: "אביזרים", en: "Accessories",
    icons: [
      { name: "Shirt", icon: Shirt }, { name: "Watch", icon: Watch },
      { name: "Glasses", icon: Glasses }, { name: "Umbrella", icon: Umbrella },
    ],
  },
];

const ICON_OVERRIDES_KEY = "cc-app-dock-icon-overrides";

// Build a flat lookup from all icon library entries
const ALL_ICONS_MAP: Record<string, LucideIcon> = {};
for (const cat of ICON_LIBRARY) {
  for (const entry of cat.icons) {
    ALL_ICONS_MAP[entry.name] = entry.icon;
  }
}

// ─── Dock item definitions ──────────────────────────────

interface DockItem {
  id: string;
  icon: LucideIcon;
  label: { he: string; en: string };
  color: string; // gradient classes
  category: string; // category key
  href?: string; // navigation link
  action?: string; // widget action (open panel)
}

const CATEGORIES: { key: string; he: string; en: string }[] = [
  { key: "pages", he: "עמודים", en: "Pages" },
  { key: "widgets", he: "ווידג׳טים", en: "Widgets" },
  { key: "comms", he: "תקשורת", en: "Communication" },
  { key: "data", he: "נתונים וגרפים", en: "Data & Charts" },
  { key: "tools", he: "כלים", en: "Tools" },
  { key: "media", he: "מדיה", en: "Media" },
];

const ALL_DOCK_ITEMS: DockItem[] = [
  // ── Pages ──
  { id: "dashboard", icon: LayoutDashboard, label: { he: "דאשבורד", en: "Dashboard" }, color: "from-blue-500 to-blue-600", category: "pages", href: "/dashboard" },
  { id: "entities", icon: Layers, label: { he: "ישויות", en: "Entities" }, color: "from-purple-500 to-purple-600", category: "pages", href: "/dashboard/entities" },
  { id: "matching", icon: TrendingUp, label: { he: "שיבוץ", en: "Matching" }, color: "from-emerald-500 to-emerald-600", category: "pages", href: "/dashboard/matching" },
  { id: "ai-hub", icon: Bot, label: { he: "מרכז AI", en: "AI Hub" }, color: "from-violet-500 to-violet-600", category: "pages", href: "/dashboard/ai-hub" },
  { id: "editor", icon: FileEdit, label: { he: "עורך", en: "Editor" }, color: "from-amber-500 to-amber-600", category: "pages", href: "/dashboard/editor" },
  { id: "story-map", icon: Map, label: { he: "מפת סיפור", en: "Story Map" }, color: "from-rose-500 to-rose-600", category: "pages", href: "/dashboard/story-map" },
  { id: "documents", icon: FileSignature, label: { he: "מסמכים", en: "Documents" }, color: "from-cyan-500 to-cyan-600", category: "pages", href: "/dashboard/documents" },
  { id: "wiki", icon: BookOpen, label: { he: "ויקי", en: "Wiki" }, color: "from-teal-500 to-teal-600", category: "pages", href: "/dashboard/wiki" },
  { id: "design-system", icon: Palette, label: { he: "עיצוב", en: "Design" }, color: "from-pink-500 to-pink-600", category: "pages", href: "/dashboard/design-system" },
  { id: "roadmap", icon: Compass, label: { he: "מפת דרכים", en: "Roadmap" }, color: "from-orange-500 to-orange-600", category: "pages", href: "/dashboard/roadmap" },
  { id: "grid", icon: Grid3X3, label: { he: "גיליון", en: "Grid" }, color: "from-slate-400 to-slate-500", category: "pages", href: "/dashboard/grid" },
  { id: "feeds", icon: Rss, label: { he: "עדכונים", en: "Feeds" }, color: "from-orange-400 to-orange-500", category: "pages", href: "/dashboard/feeds" },
  { id: "automations", icon: Zap, label: { he: "אוטומציות", en: "Automations" }, color: "from-yellow-500 to-yellow-600", category: "pages", href: "/dashboard/automations" },
  { id: "settings-page", icon: Settings, label: { he: "הגדרות", en: "Settings" }, color: "from-gray-400 to-gray-500", category: "pages", href: "/dashboard/settings" },
  { id: "admin", icon: Shield, label: { he: "אדמין", en: "Admin" }, color: "from-red-500 to-red-600", category: "pages", href: "/dashboard/admin" },
  // ── Widgets ──
  { id: "w-search", icon: Search, label: { he: "חיפוש", en: "Search" }, color: "from-blue-400 to-cyan-500", category: "widgets", action: "search" },
  { id: "w-quick-create", icon: Plus, label: { he: "יצירה מהירה", en: "Quick Create" }, color: "from-green-500 to-emerald-500", category: "widgets", action: "quick-create" },
  { id: "w-favorites", icon: Pin, label: { he: "מועדפים", en: "Favorites" }, color: "from-amber-400 to-amber-500", category: "widgets", action: "favorites" },
  { id: "w-notifications", icon: Bell, label: { he: "התראות", en: "Notifications" }, color: "from-red-400 to-red-500", category: "widgets", action: "notifications" },
  { id: "w-clipboard", icon: ClipboardList, label: { he: "לוח הדבקות", en: "Clipboard" }, color: "from-lime-500 to-lime-600", category: "widgets", action: "clipboard" },
  // ── Communication ──
  { id: "comms", icon: MessagesSquare, label: { he: "תקשורת", en: "Communication" }, color: "from-indigo-500 to-indigo-600", category: "comms", href: "/dashboard/comms" },
  { id: "w-gmail", icon: Mail, label: { he: "Gmail", en: "Gmail" }, color: "from-red-500 to-orange-500", category: "comms", action: "gmail" },
  { id: "w-phone", icon: Phone, label: { he: "טלפון", en: "Phone" }, color: "from-green-500 to-green-600", category: "comms", action: "phone" },
  { id: "w-contacts", icon: Contact, label: { he: "אנשי קשר", en: "Contacts" }, color: "from-sky-500 to-sky-600", category: "comms", action: "contacts" },
  // ── Data & Charts ──
  { id: "w-kpi", icon: BarChart3, label: { he: "KPI", en: "KPI" }, color: "from-emerald-400 to-emerald-500", category: "data", action: "kpi" },
  { id: "w-activity", icon: Activity, label: { he: "פעילות", en: "Activity" }, color: "from-cyan-400 to-cyan-500", category: "data", action: "activity" },
  { id: "w-gauge", icon: Gauge, label: { he: "מד ביצועים", en: "Performance" }, color: "from-orange-400 to-orange-500", category: "data", action: "gauge" },
  { id: "w-piechart", icon: PieChart, label: { he: "תרשים עוגה", en: "Pie Chart" }, color: "from-violet-400 to-violet-500", category: "data", action: "pie-chart" },
  // ── Tools ──
  { id: "w-today", icon: Calendar, label: { he: "היום", en: "Today" }, color: "from-sky-500 to-sky-600", category: "tools", action: "today" },
  { id: "w-timer", icon: Clock, label: { he: "טיימר", en: "Timer" }, color: "from-fuchsia-500 to-fuchsia-600", category: "tools", action: "timer" },
  { id: "w-planner", icon: CalendarDays, label: { he: "סדר שבועי", en: "Weekly Planner" }, color: "from-indigo-400 to-indigo-500", category: "tools", action: "weekly-planner" },
  { id: "w-gcal", icon: CalendarDays, label: { he: "יומן", en: "Calendar" }, color: "from-blue-500 to-blue-600", category: "tools", action: "google-calendar" },
  { id: "w-calculator", icon: Calculator, label: { he: "מחשבון", en: "Calculator" }, color: "from-slate-400 to-slate-500", category: "tools", action: "calculator" },
  { id: "w-terminal", icon: Terminal, label: { he: "טרמינל", en: "Terminal" }, color: "from-gray-500 to-gray-600", category: "tools", action: "terminal" },
  { id: "w-filter", icon: Filter, label: { he: "מסננים", en: "Filters" }, color: "from-teal-400 to-teal-500", category: "tools", action: "filters" },
  { id: "w-history", icon: History, label: { he: "היסטוריה", en: "History" }, color: "from-amber-500 to-amber-600", category: "tools", action: "history" },
  // ── Media ──
  { id: "w-vcloud", icon: Video, label: { he: "vCloud", en: "vCloud" }, color: "from-violet-400 to-violet-500", category: "media", href: "/dashboard/vcloud" },
  { id: "w-gallery", icon: Image, label: { he: "גלריה", en: "Gallery" }, color: "from-pink-400 to-pink-500", category: "media", href: "/dashboard/icon-library" },
  { id: "w-camera", icon: Camera, label: { he: "מצלמה", en: "Camera" }, color: "from-rose-400 to-rose-500", category: "media", action: "camera" },
  { id: "w-mic", icon: Mic, label: { he: "מיקרופון", en: "Microphone" }, color: "from-red-400 to-pink-500", category: "media", action: "mic" },
  { id: "w-download", icon: Download, label: { he: "הורדות", en: "Downloads" }, color: "from-blue-400 to-blue-500", category: "media", action: "downloads" },
];

const STORAGE_KEY = "cc-app-dock-items";
const FAVORITES_KEY = "cc-app-dock-favorites";
const HIDDEN_KEY = "cc-app-dock-hidden";
// Starts empty — user picks from the store
const DEFAULT_ITEMS: string[] = [];

// ─── Sortable Dock Item ─────────────────────────────────

function SortableDockItem({
  item,
  editMode,
  lang,
  resolvedIcon: ResolvedIcon,
  onRemove,
  onClick,
  onContextMenu,
  onTooltipEnter,
  onTooltipLeave,
}: {
  item: DockItem;
  editMode: boolean;
  lang: "he" | "en";
  resolvedIcon: LucideIcon;
  onRemove: (id: string) => void;
  onClick: (item: DockItem) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onTooltipEnter: (id: string, top: number) => void;
  onTooltipLeave: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group">
      <button
        type="button"
        onClick={() => { if (!isDragging) onClick(item); }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(item.id, e.clientX, e.clientY);
        }}
        onMouseEnter={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          onTooltipEnter(item.id, rect.top + rect.height / 2);
        }}
        onMouseLeave={onTooltipLeave}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 hover:scale-110 cursor-pointer group"
      >
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-150`} />
        <ResolvedIcon className="h-[18px] w-[18px] text-slate-400 group-hover:text-white relative z-10 transition-colors duration-150" />
      </button>

      {/* Remove button in edit mode */}
      {editMode && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute -top-1 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Sortable Grid Item (for store modal) ───────────────

function SortableGridItem({
  item,
  lang,
  icon: Icon,
  onRemove,
}: {
  item: DockItem;
  lang: "he" | "en";
  icon: LucideIcon;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/grid relative flex flex-col items-center gap-1 rounded-xl p-2 bg-white/[0.03] border border-slate-700/30 hover:border-slate-600/50 transition-colors cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${item.color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-[10px] text-slate-400 truncate w-full text-center">{item.label[lang]}</span>
      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 group-hover/grid:opacity-100 transition-opacity cursor-pointer hover:bg-red-400"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────

interface AppDockProps {
  topOffset?: number;
}

// Map dock item action → TopBar widget ID (they match)
function dockToWidgetId(item: DockItem): string | null {
  return item.action || null; // action field = widget ID in WidgetContext
}

function widgetIdToDockId(widgetId: string): string | null {
  const found = ALL_DOCK_ITEMS.find(d => d.action === widgetId);
  return found?.id || null;
}

export function AppDock({ topOffset = 48 }: AppDockProps) {
  const { language } = useSettings();
  const { setWidgetPlacement, widgetPlacements } = useWidgets();
  const t = getTranslations(language);
  const lang = language === "he" ? "he" : "en";

  const [dockIds, setDockIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [iconOverrides, setIconOverrides] = useState<Record<string, string>>({});
  const [showHidden, setShowHidden] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tooltip, setTooltip] = useState<{ id: string; top: number } | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeCategory, setStoreCategory] = useState<string | null>(null);
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const [iconCat, setIconCat] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setDockIds(raw ? JSON.parse(raw) : DEFAULT_ITEMS);
    } catch {
      setDockIds(DEFAULT_ITEMS);
    }
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavoriteIds(new Set(JSON.parse(raw)));
    } catch { /* */ }
    try {
      const raw = localStorage.getItem(HIDDEN_KEY);
      if (raw) setHiddenIds(new Set(JSON.parse(raw)));
    } catch { /* */ }
    try {
      const raw = localStorage.getItem(ICON_OVERRIDES_KEY);
      if (raw) setIconOverrides(JSON.parse(raw));
    } catch { /* */ }
  }, []);

  // Save
  const saveDock = useCallback((ids: string[]) => {
    setDockIds(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const addItem = useCallback((id: string) => {
    saveDock([...dockIds, id]);
  }, [dockIds, saveDock]);

  const removeItem = useCallback((id: string) => {
    saveDock(dockIds.filter(i => i !== id));
  }, [dockIds, saveDock]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
      return next;
    });
    // Also remove from dock if hiding
    if (!hiddenIds.has(id) && dockIds.includes(id)) {
      saveDock(dockIds.filter(i => i !== id));
    }
  }, [hiddenIds, dockIds, saveDock]);

  const setIconOverride = useCallback((itemId: string, iconName: string) => {
    setIconOverrides((prev) => {
      const next = { ...prev, [itemId]: iconName };
      localStorage.setItem(ICON_OVERRIDES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Get the effective icon for a dock item (with override support)
  const getItemIcon = useCallback((item: DockItem): LucideIcon => {
    const override = iconOverrides[item.id];
    if (override && ALL_ICONS_MAP[override]) return ALL_ICONS_MAP[override];
    return item.icon;
  }, [iconOverrides]);

  // Resolve items
  const dockItems = dockIds
    .map(id => ALL_DOCK_ITEMS.find(d => d.id === id))
    .filter(Boolean) as DockItem[];

  const availableItems = ALL_DOCK_ITEMS.filter(d => !dockIds.includes(d.id) && !hiddenIds.has(d.id));

  const handleClick = useCallback((item: DockItem) => {
    if (editMode) {
      setIconPickerFor(item.id);
      setIconSearch("");
      setIconCat(null);
      return;
    }
    if (item.href) {
      window.location.href = item.href;
    } else if (item.action) {
      window.dispatchEvent(new CustomEvent("cc-widget-open", { detail: item.action }));
    }
  }, [editMode]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dockIds.indexOf(active.id as string);
      const newIndex = dockIds.indexOf(over.id as string);
      saveDock(arrayMove(dockIds, oldIndex, newIndex));
    }
  }, [dockIds, saveDock]);

  // Move item from dock → topbar
  const moveToDockFromTopbar = useCallback((widgetId: string) => {
    const dockId = widgetIdToDockId(widgetId);
    if (!dockId || dockIds.includes(dockId)) return;
    saveDock([...dockIds, dockId]);
    setWidgetPlacement(widgetId, "apps");
  }, [dockIds, saveDock, setWidgetPlacement]);

  const moveToTopbar = useCallback((item: DockItem) => {
    const widgetId = dockToWidgetId(item);
    if (!widgetId) return;
    removeItem(item.id);
    setWidgetPlacement(widgetId, "toolbar");
  }, [removeItem, setWidgetPlacement]);

  // Listen for "move to dock" events from TopBar
  useEffect(() => {
    const handler = (e: Event) => {
      const widgetId = (e as CustomEvent<string>).detail;
      moveToDockFromTopbar(widgetId);
    };
    window.addEventListener("cc-move-to-dock", handler);
    return () => window.removeEventListener("cc-move-to-dock", handler);
  }, [moveToDockFromTopbar]);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMenu]);

  const handleContextMenu = useCallback((itemId: string, x: number, y: number) => {
    setCtxMenu({ id: itemId, x, y });
  }, []);

  // Render a single store item with favorite/hide actions
  const renderStoreItem = (item: DockItem) => (
    <div key={item.id} className="group/item relative flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-white/[0.05] border border-transparent hover:border-slate-700/50 transition-all">
      <button
        type="button"
        onClick={() => addItem(item.id)}
        className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer text-start"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color}`}>
          <item.icon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[12px] text-slate-300 truncate">{item.label[lang]}</span>
      </button>
      {/* Actions — visible on hover */}
      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => toggleFavorite(item.id)}
          className={`flex h-5 w-5 items-center justify-center rounded transition-colors cursor-pointer ${
            favoriteIds.has(item.id) ? "text-amber-400" : "text-slate-600 hover:text-amber-400"
          }`}
          title={lang === "he" ? "מועדף" : "Favorite"}
        >
          <Star className={`h-2.5 w-2.5 ${favoriteIds.has(item.id) ? "fill-current" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => toggleHidden(item.id)}
          className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
          title={lang === "he" ? "הסתר" : "Hide"}
        >
          <EyeOff className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );

  // Dock is always pinned to the far left
  const dockLeft = 0;

  return (
    <>
      <div
        ref={dockRef}
        data-cc-id="app-dock"
        className="fixed z-[34] flex flex-col items-center"
        style={{
          top: topOffset,
          left: dockLeft,
          width: 48,
          height: `calc(100vh - ${topOffset}px)`,
          backgroundColor: "color-mix(in srgb, var(--nav-bg) 60%, transparent)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Scrollable icon area with grid slots */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full py-1.5 scrollbar-none">
          {/* Grid slot background — shows available positions */}
          <div className="relative flex flex-col items-center gap-0.5">
            {(() => {
              const SLOT_SIZE = 40; // px per slot
              const maxSlots = Math.max(dockItems.length + 2, 8); // show at least 2 empty slots below items
              return Array.from({ length: maxSlots }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-[${SLOT_SIZE}px] w-10 items-center justify-center shrink-0`}
                  style={{ height: SLOT_SIZE, width: 40 }}
                >
                  {i >= dockItems.length && (
                    <div className="h-8 w-8 rounded-xl border border-dashed border-slate-700/30" />
                  )}
                </div>
              ));
            })()}
            {/* Actual items — positioned over grid */}
            <div className="absolute top-0 left-0 right-0 flex flex-col items-center gap-0.5">
            {dockItems.length === 0 && !editMode && (
              <div style={{ height: 40 }} className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-dashed border-slate-600 text-slate-600 hover:border-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
                  title={lang === "he" ? "הוסף אפליקציות" : "Add apps"}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={dockIds} strategy={verticalListSortingStrategy}>
                {dockItems.map((item) => (
                  <SortableDockItem
                    key={item.id}
                    item={item}
                    editMode={editMode}
                    lang={lang}
                    resolvedIcon={getItemIcon(item)}
                    onRemove={removeItem}
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                    onTooltipEnter={(id, top) => setTooltip({ id, top })}
                    onTooltipLeave={() => setTooltip(null)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-6 h-px bg-slate-700/50 my-1" />

        {/* Edit/add button */}
        <div className="pb-2">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              editMode
                ? "bg-purple-500/20 text-purple-400"
                : "text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]"
            }`}
            title={editMode ? "Done" : "Customize"}
          >
            {editMode ? (
              <span className="text-[10px] font-bold">OK</span>
            ) : (
              <GripVertical className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tooltip portal */}
      {tooltip && !editMode && (() => {
        const item = ALL_DOCK_ITEMS.find(d => d.id === tooltip.id);
        if (!item) return null;
        return createPortal(
          <div
            className="fixed z-[60] pointer-events-none"
            style={{
              left: dockLeft + 56,
              top: tooltip.top,
              transform: "translateY(-50%)",
            }}
          >
            <div className="rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 whitespace-nowrap shadow-lg">
              {item.label[lang]}
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Context Menu */}
      {ctxMenu && (() => {
        const ctxItem = ALL_DOCK_ITEMS.find(d => d.id === ctxMenu.id);
        if (!ctxItem) return null;
        const CtxIcon = getItemIcon(ctxItem);
        const isFav = favoriteIds.has(ctxItem.id);
        const idx = dockIds.indexOf(ctxItem.id);
        const isFirst = idx === 0;
        const isLast = idx === dockIds.length - 1;

        // Widget-specific actions based on item type
        const specialActions: { label: string; icon: LucideIcon; onClick: () => void }[] = [];
        if (ctxItem.href) {
          specialActions.push({
            label: lang === "he" ? "פתח בטאב חדש" : "Open in new tab",
            icon: ExternalLink,
            onClick: () => { window.open(ctxItem.href!, "_blank"); setCtxMenu(null); },
          });
          specialActions.push({
            label: lang === "he" ? "העתק קישור" : "Copy link",
            icon: Copy,
            onClick: () => { navigator.clipboard.writeText(window.location.origin + ctxItem.href!); setCtxMenu(null); },
          });
        }
        if (ctxItem.action === "search") {
          specialActions.push({
            label: lang === "he" ? "חיפוש מהיר (⌘K)" : "Quick search (⌘K)",
            icon: Search,
            onClick: () => { window.dispatchEvent(new Event("cc-open-search")); setCtxMenu(null); },
          });
        }

        return createPortal(
          <div
            ref={ctxRef}
            className="fixed z-[65] rounded-xl border border-slate-700/80 overflow-hidden py-1"
            style={{
              backgroundColor: "var(--nav-bg)",
              left: ctxMenu.x,
              top: ctxMenu.y,
              minWidth: 200,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
              animation: "dock-panel-in 0.15s cubic-bezier(0.16,1,0.3,1)",
              transformOrigin: "top left",
            }}
          >
            {/* Item header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${ctxItem.color}`}>
                <CtxIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[12px] font-medium text-slate-200 truncate">{ctxItem.label[lang]}</span>
            </div>

            {/* Special actions for this item */}
            {specialActions.length > 0 && (
              <div className="py-1 border-b border-slate-700/20">
                {specialActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <action.icon className="h-3.5 w-3.5 text-slate-500" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Move between bars */}
            <div className="py-1 border-b border-slate-700/20">
              <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                {lang === "he" ? "העבר ל..." : "Move to..."}
              </div>
              {/* Move to TopBar — only for widget items (have action) */}
              {ctxItem.action && (
                <button
                  type="button"
                  onClick={() => { moveToTopbar(ctxItem); setCtxMenu(null); }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <PanelTop className="h-3.5 w-3.5 text-slate-500" />
                  {lang === "he" ? "סרגל עליון" : "Top bar"}
                </button>
              )}
              {/* Open in new tab — for pages */}
              {ctxItem.href && (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("cc-split-open", { detail: ctxItem.href }));
                    setCtxMenu(null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <SquareSplitHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  {lang === "he" ? "מסך מפוצל" : "Split screen"}
                </button>
              )}
            </div>

            {/* Reorder */}
            <div className="py-1 border-b border-slate-700/20">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => { saveDock(arrayMove(dockIds, idx, 0)); setCtxMenu(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUpToLine className="h-3.5 w-3.5 text-slate-500" />
                {lang === "he" ? "העבר לראש" : "Move to top"}
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => { saveDock(arrayMove(dockIds, idx, dockIds.length - 1)); setCtxMenu(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDownToLine className="h-3.5 w-3.5 text-slate-500" />
                {lang === "he" ? "העבר לסוף" : "Move to bottom"}
              </button>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => { toggleFavorite(ctxItem.id); setCtxMenu(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <Star className={`h-3.5 w-3.5 ${isFav ? "text-amber-400 fill-current" : "text-slate-500"}`} />
                {isFav ? (lang === "he" ? "הסר ממועדפים" : "Remove from favorites") : (lang === "he" ? "הוסף למועדפים" : "Add to favorites")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIconPickerFor(ctxItem.id);
                  setIconSearch("");
                  setIconCat(null);
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-500" />
                {lang === "he" ? "שנה אייקון" : "Change icon"}
              </button>
              <button
                type="button"
                onClick={() => { toggleHidden(ctxItem.id); setCtxMenu(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                {lang === "he" ? "הסתר" : "Hide"}
              </button>
              <button
                type="button"
                onClick={() => { removeItem(ctxItem.id); setCtxMenu(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-red-400/80 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                {lang === "he" ? "הסר מהסרגל" : "Remove from dock"}
              </button>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* App Store — centered modal */}
      {editMode && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm"
            onClick={() => setEditMode(false)}
            style={{ animation: "dock-backdrop-in 0.2s ease-out" }}
          />
          <div
            className="fixed z-[60] rounded-2xl border border-slate-700/80 overflow-hidden"
            style={{
              backgroundColor: "var(--nav-bg)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(440px, 90vw)",
              maxHeight: "70vh",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
              animation: "dock-panel-in 0.25s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <style>{`
              @keyframes dock-panel-in {
                from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
              @keyframes dock-backdrop-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>

            {/* Header + search */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-700/40">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-100">
                  {lang === "he" ? "חנות אפליקציות" : "App Store"}
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 left-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder={lang === "he" ? "חיפוש..." : "Search..."}
                  className="w-full rounded-lg bg-white/[0.04] border border-slate-700/50 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[var(--cc-accent-500)]/40 transition-colors"
                />
              </div>
              {/* Category tabs */}
              <div className="flex gap-1 mt-2.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => { setStoreCategory(null); setShowHidden(false); }}
                  className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                    !storeCategory && !showHidden ? "bg-[var(--cc-accent-500)]/15 text-[var(--cc-accent-300)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  {lang === "he" ? "הכל" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStoreCategory("favorites"); setShowHidden(false); }}
                  className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                    storeCategory === "favorites" ? "bg-amber-500/15 text-amber-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <Star className="h-2.5 w-2.5" />
                  {lang === "he" ? "מועדפים" : "Favorites"}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => { setStoreCategory(cat.key); setShowHidden(false); }}
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                      storeCategory === cat.key && !showHidden ? "bg-[var(--cc-accent-500)]/15 text-[var(--cc-accent-300)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {cat[lang]}
                  </button>
                ))}
                {hiddenIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => { setShowHidden(!showHidden); setStoreCategory(null); }}
                    className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                      showHidden ? "bg-slate-600/20 text-slate-300" : "text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    <EyeOff className="h-2.5 w-2.5" />
                    {lang === "he" ? "מוסתרים" : "Hidden"}
                    <span className="text-[9px] opacity-60">({hiddenIds.size})</span>
                  </button>
                )}
              </div>
            </div>

            {/* My Dock — draggable grid */}
            {dockItems.length > 0 && (
              <div className="px-3 pt-3 pb-1 border-b border-slate-700/30">
                <div className="flex items-center gap-1.5 px-1 mb-2">
                  <div className="text-[9px] font-semibold uppercase tracking-widest text-[var(--cc-accent-400)]">
                    {lang === "he" ? "הסרגל שלי" : "My Dock"}
                  </div>
                  <span className="text-[9px] text-slate-600">({dockItems.length})</span>
                  <div className="flex-1" />
                  <span className="text-[9px] text-slate-600 italic">
                    {lang === "he" ? "גרור לסידור" : "Drag to reorder"}
                  </span>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={dockIds} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-4 gap-1.5 pb-2">
                      {dockItems.map((item) => {
                        const Icon = getItemIcon(item);
                        return (
                          <SortableGridItem
                            key={item.id}
                            item={item}
                            lang={lang}
                            icon={Icon}
                            onRemove={removeItem}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* Items grid — filtered */}
            <div className="overflow-y-auto max-h-[50vh] p-3">
              {(() => {
                // Hidden items view
                if (showHidden) {
                  const hiddenItems = ALL_DOCK_ITEMS.filter(d => hiddenIds.has(d.id));
                  if (hiddenItems.length === 0) return (
                    <div className="py-8 text-center text-[11px] text-slate-500">
                      {lang === "he" ? "אין פריטים מוסתרים" : "No hidden items"}
                    </div>
                  );
                  return (
                    <div className="grid grid-cols-2 gap-1.5">
                      {hiddenItems.map((item) => (
                        <div key={item.id} className="group/item flex items-center gap-2 rounded-xl px-2.5 py-2 bg-white/[0.02] border border-slate-700/30 opacity-60">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color}`}>
                            <item.icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="flex-1 text-[12px] text-slate-400 truncate">{item.label[lang]}</span>
                          <button
                            type="button"
                            onClick={() => toggleHidden(item.id)}
                            className="shrink-0 flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title={lang === "he" ? "הצג" : "Show"}
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                const q = storeSearch.toLowerCase();

                // Favorites view
                if (storeCategory === "favorites") {
                  const favItems = availableItems.filter(i => favoriteIds.has(i.id));
                  const matchedFavs = q ? favItems.filter(i => i.label.he.includes(q) || i.label.en.toLowerCase().includes(q)) : favItems;
                  if (matchedFavs.length === 0) return (
                    <div className="py-8 text-center text-[11px] text-slate-500">
                      {lang === "he" ? "אין מועדפים עדיין — לחץ על הכוכב ליד פריט" : "No favorites yet — click the star on any item"}
                    </div>
                  );
                  return (
                    <div className="grid grid-cols-2 gap-1.5">
                      {matchedFavs.map((item) => renderStoreItem(item))}
                    </div>
                  );
                }

                // Regular filtered view
                const filtered = availableItems.filter((item) => {
                  if (storeCategory && item.category !== storeCategory) return false;
                  if (q && !item.label.he.includes(q) && !item.label.en.toLowerCase().includes(q) && !item.id.includes(q)) return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 text-center text-[11px] text-slate-500">
                      {lang === "he" ? "לא נמצאו תוצאות" : "No results found"}
                    </div>
                  );
                }

                // Favorites first, then group by category
                const favs = filtered.filter(i => favoriteIds.has(i.id));
                const rest = filtered.filter(i => !favoriteIds.has(i.id));

                const grouped = CATEGORIES
                  .map((cat) => ({
                    ...cat,
                    items: rest.filter((i) => i.category === cat.key),
                  }))
                  .filter((g) => g.items.length > 0);

                return (
                  <>
                    {favs.length > 0 && !storeCategory && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-amber-500/70 px-1 mb-1.5">
                          <Star className="h-2.5 w-2.5" />
                          {lang === "he" ? "מועדפים" : "Favorites"}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {favs.map((item) => renderStoreItem(item))}
                        </div>
                      </div>
                    )}
                    {grouped.map((group) => (
                      <div key={group.key} className="mb-3 last:mb-0">
                        {!storeCategory && (
                          <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 px-1 mb-1.5">
                            {group[lang]}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1.5">
                          {group.items.map((item) => renderStoreItem(item))}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Icon Picker Modal */}
      {iconPickerFor && createPortal(
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={() => setIconPickerFor(null)}
            style={{ animation: "dock-backdrop-in 0.15s ease-out" }}
          />
          <div
            className="fixed z-[71] rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col"
            style={{
              backgroundColor: "var(--nav-bg)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(520px, 92vw)",
              maxHeight: "75vh",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
              animation: "dock-panel-in 0.25s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-700/40 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    {lang === "he" ? "בחר אייקון" : "Choose Icon"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {(() => {
                      const target = ALL_DOCK_ITEMS.find(d => d.id === iconPickerFor);
                      return target ? target.label[lang] : "";
                    })()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIconPickerFor(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 left-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder={lang === "he" ? "חיפוש אייקון..." : "Search icon..."}
                  className="w-full rounded-lg bg-white/[0.04] border border-slate-700/50 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[var(--cc-accent-500)]/40 transition-colors"
                  autoFocus
                />
              </div>
              {/* Category tabs */}
              <div className="flex gap-1 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  onClick={() => setIconCat(null)}
                  className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                    !iconCat ? "bg-[var(--cc-accent-500)]/15 text-[var(--cc-accent-300)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  {lang === "he" ? "הכל" : "All"}
                </button>
                {ICON_LIBRARY.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setIconCat(cat.key)}
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      iconCat === cat.key ? "bg-[var(--cc-accent-500)]/15 text-[var(--cc-accent-300)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {cat[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon grid */}
            <div className="overflow-y-auto flex-1 p-3">
              {(() => {
                const q = iconSearch.toLowerCase();
                const cats = iconCat
                  ? ICON_LIBRARY.filter(c => c.key === iconCat)
                  : ICON_LIBRARY;

                const filtered = cats.map(cat => ({
                  ...cat,
                  icons: cat.icons.filter(ic =>
                    !q || ic.name.toLowerCase().includes(q) || cat.he.includes(q) || cat.en.toLowerCase().includes(q)
                  ),
                })).filter(c => c.icons.length > 0);

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 text-center text-[11px] text-slate-500">
                      {lang === "he" ? "לא נמצאו אייקונים" : "No icons found"}
                    </div>
                  );
                }

                return filtered.map(cat => (
                  <div key={cat.key} className="mb-4 last:mb-0">
                    {!iconCat && (
                      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 px-1 mb-2">
                        {cat[lang]}
                      </div>
                    )}
                    <div className="grid grid-cols-8 gap-1">
                      {cat.icons.map((entry) => {
                        const isSelected = iconOverrides[iconPickerFor] === entry.name;
                        return (
                          <button
                            key={entry.name}
                            type="button"
                            onClick={() => {
                              setIconOverride(iconPickerFor, entry.name);
                              setIconPickerFor(null);
                            }}
                            className={`group/ic flex flex-col items-center justify-center rounded-lg p-2 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[var(--cc-accent-500)]/15 border border-[var(--cc-accent-500)]/30"
                                : "hover:bg-white/[0.06] border border-transparent"
                            }`}
                            title={entry.name}
                          >
                            <entry.icon className={`h-5 w-5 transition-colors ${
                              isSelected ? "text-[var(--cc-accent-300)]" : "text-slate-400 group-hover/ic:text-slate-200"
                            }`} />
                            <span className="text-[8px] text-slate-600 mt-1 truncate w-full text-center">
                              {entry.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Reset button */}
            {iconOverrides[iconPickerFor] && (
              <div className="border-t border-slate-700/40 px-4 py-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIconOverrides((prev) => {
                      const next = { ...prev };
                      delete next[iconPickerFor!];
                      localStorage.setItem(ICON_OVERRIDES_KEY, JSON.stringify(next));
                      return next;
                    });
                    setIconPickerFor(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {lang === "he" ? "↩ חזור לאייקון ברירת מחדל" : "↩ Reset to default icon"}
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
