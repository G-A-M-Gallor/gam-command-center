"use client";

import { useState, useMemo, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Search,
  Copy,
  Check,
  // --- Popular Lucide icons ---
  Home,
  Settings,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Star,
  Heart,
  Bell,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Download,
  Upload,
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Camera,
  Video,
  Music,
  Globe,
  Map as MapIcon,
  MapPin,
  Navigation,
  Bookmark,
  Tag,
  Flag,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  Key,
  Link,
  ExternalLink,
  Share2,
  Send,
  MessageSquare,
  MessageCircle,
  Hash,
  AtSign,
  Paperclip,
  Clipboard,
  Database,
  Server,
  Code,
  Terminal,
  Monitor,
  Smartphone,
  Wifi,
  Battery,
  Sun,
  Moon,
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  Layers,
  Grid,
  List,
  BarChart2,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  Award,
  Gift,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Briefcase,
  Building2,
  Truck,
  Package,
  Box,
  Wrench,
  Hammer,
  Palette,
  Pen,
  Scissors,
  RotateCcw,
  RefreshCw,
  Filter,
  SlidersHorizontal,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Layout,
  Maximize2,
  Minimize2,
  Move,
  Grip,
  type LucideIcon,
} from "lucide-react";

// ─── i18n Labels ─────────────────────────────────────────────────
const labels = {
  he: {
    title: "ספריית אייקונים וסמלים",
    subtitle: "אייקונים, סמלים יוניקוד ואימוג׳ים — לחצו להעתקה",
    search: "חיפוש...",
    tabs: { icons: "אייקונים", symbols: "סמלים", emojis: "אימוג׳ים", favorites: "מועדפים" },
    copied: "הועתק!",
    total: "פריטים",
    categories: {
      navigation: "ניווט",
      communication: "תקשורת",
      media: "מדיה",
      interface: "ממשק",
      data: "נתונים",
      status: "סטטוס",
      weather: "מזג אוויר",
      business: "עסקים",
      tools: "כלים",
      layout: "פריסה",
      arrows: "חצים",
      math: "מתמטיקה",
      currency: "מטבעות",
      punctuation: "פיסוק",
      misc: "שונות",
      faces: "פרצופים",
      hands: "ידיים",
      people: "אנשים",
      animals: "חיות",
      food: "אוכל",
      travel: "נסיעות",
      objects: "חפצים",
      flags: "דגלים",
    },
  },
  en: {
    title: "Icon & Symbol Library",
    subtitle: "Lucide icons, Unicode symbols, and emojis — click to copy",
    search: "Search...",
    tabs: { icons: "Icons", symbols: "Symbols", emojis: "Emojis", favorites: "Favorites" },
    copied: "Copied!",
    total: "items",
    categories: {
      navigation: "Navigation",
      communication: "Communication",
      media: "Media",
      interface: "Interface",
      data: "Data",
      status: "Status",
      weather: "Weather",
      business: "Business",
      tools: "Tools",
      layout: "Layout",
      arrows: "Arrows",
      math: "Math",
      currency: "Currency",
      punctuation: "Punctuation",
      misc: "Misc",
      faces: "Faces",
      hands: "Hands",
      people: "People",
      animals: "Animals",
      food: "Food",
      travel: "Travel",
      objects: "Objects",
      flags: "Flags",
    },
  },
  ru: {
    title: "Библиотека иконок и символов",
    subtitle: "Иконки Lucide, символы Unicode и эмодзи — нажмите для копирования",
    search: "Поиск...",
    tabs: { icons: "Иконки", symbols: "Символы", emojis: "Эмодзи", favorites: "Избранное" },
    copied: "Скопировано!",
    total: "элементов",
    categories: {
      navigation: "Навигация",
      communication: "Коммуникация",
      media: "Медиа",
      interface: "Интерфейс",
      data: "Данные",
      status: "Статус",
      weather: "Погода",
      business: "Бизнес",
      tools: "Инструменты",
      layout: "Макет",
      arrows: "Стрелки",
      math: "Математика",
      currency: "Валюты",
      punctuation: "Пунктуация",
      misc: "Разное",
      faces: "Лица",
      hands: "Руки",
      people: "Люди",
      animals: "Животные",
      food: "Еда",
      travel: "Путешествия",
      objects: "Объекты",
      flags: "Флаги",
    },
  },
} as const;

// ─── Icon Data ───────────────────────────────────────────────────
type IconCategory =
  | "navigation"
  | "communication"
  | "media"
  | "interface"
  | "data"
  | "status"
  | "weather"
  | "business"
  | "tools"
  | "layout";

interface IconEntry {
  name: string;
  icon: LucideIcon;
  category: IconCategory;
}

const ICONS: IconEntry[] = [
  // Navigation
  { name: "Home", icon: Home, category: "navigation" },
  { name: "Globe", icon: Globe, category: "navigation" },
  { name: "Map", icon: MapIcon, category: "navigation" },
  { name: "MapPin", icon: MapPin, category: "navigation" },
  { name: "Navigation", icon: Navigation, category: "navigation" },
  { name: "ArrowUp", icon: ArrowUp, category: "navigation" },
  { name: "ArrowDown", icon: ArrowDown, category: "navigation" },
  { name: "ArrowLeft", icon: ArrowLeft, category: "navigation" },
  { name: "ArrowRight", icon: ArrowRight, category: "navigation" },
  { name: "ChevronDown", icon: ChevronDown, category: "navigation" },
  { name: "ChevronUp", icon: ChevronUp, category: "navigation" },
  { name: "ChevronLeft", icon: ChevronLeft, category: "navigation" },
  { name: "ChevronRight", icon: ChevronRight, category: "navigation" },
  { name: "ExternalLink", icon: ExternalLink, category: "navigation" },
  { name: "Menu", icon: Menu, category: "navigation" },
  // Communication
  { name: "Mail", icon: Mail, category: "communication" },
  { name: "Phone", icon: Phone, category: "communication" },
  { name: "MessageSquare", icon: MessageSquare, category: "communication" },
  { name: "MessageCircle", icon: MessageCircle, category: "communication" },
  { name: "Send", icon: Send, category: "communication" },
  { name: "Share2", icon: Share2, category: "communication" },
  { name: "Bell", icon: Bell, category: "communication" },
  { name: "AtSign", icon: AtSign, category: "communication" },
  { name: "Hash", icon: Hash, category: "communication" },
  // Media
  { name: "Image", icon: Image, category: "media" },
  { name: "Camera", icon: Camera, category: "media" },
  { name: "Video", icon: Video, category: "media" },
  { name: "Music", icon: Music, category: "media" },
  { name: "Pen", icon: Pen, category: "media" },
  { name: "Palette", icon: Palette, category: "media" },
  // Interface
  { name: "Search", icon: Search, category: "interface" },
  { name: "Settings", icon: Settings, category: "interface" },
  { name: "Edit", icon: Edit, category: "interface" },
  { name: "Trash2", icon: Trash2, category: "interface" },
  { name: "Plus", icon: Plus, category: "interface" },
  { name: "Minus", icon: Minus, category: "interface" },
  { name: "X", icon: X, category: "interface" },
  { name: "Eye", icon: Eye, category: "interface" },
  { name: "EyeOff", icon: EyeOff, category: "interface" },
  { name: "Filter", icon: Filter, category: "interface" },
  { name: "SlidersHorizontal", icon: SlidersHorizontal, category: "interface" },
  { name: "MoreHorizontal", icon: MoreHorizontal, category: "interface" },
  { name: "MoreVertical", icon: MoreVertical, category: "interface" },
  { name: "Clipboard", icon: Clipboard, category: "interface" },
  { name: "Link", icon: Link, category: "interface" },
  { name: "Paperclip", icon: Paperclip, category: "interface" },
  { name: "Bookmark", icon: Bookmark, category: "interface" },
  { name: "Tag", icon: Tag, category: "interface" },
  { name: "Flag", icon: Flag, category: "interface" },
  { name: "Maximize2", icon: Maximize2, category: "interface" },
  { name: "Minimize2", icon: Minimize2, category: "interface" },
  { name: "Move", icon: Move, category: "interface" },
  { name: "Grip", icon: Grip, category: "interface" },
  { name: "RefreshCw", icon: RefreshCw, category: "interface" },
  { name: "RotateCcw", icon: RotateCcw, category: "interface" },
  // Data
  { name: "File", icon: File, category: "data" },
  { name: "FileText", icon: FileText, category: "data" },
  { name: "Folder", icon: Folder, category: "data" },
  { name: "FolderOpen", icon: FolderOpen, category: "data" },
  { name: "Database", icon: Database, category: "data" },
  { name: "Server", icon: Server, category: "data" },
  { name: "Download", icon: Download, category: "data" },
  { name: "Upload", icon: Upload, category: "data" },
  { name: "BarChart2", icon: BarChart2, category: "data" },
  { name: "PieChart", icon: PieChart, category: "data" },
  { name: "TrendingUp", icon: TrendingUp, category: "data" },
  { name: "Activity", icon: Activity, category: "data" },
  { name: "Layers", icon: Layers, category: "data" },
  { name: "Grid", icon: Grid, category: "data" },
  { name: "List", icon: List, category: "data" },
  // Status
  { name: "CheckCircle", icon: CheckCircle, category: "status" },
  { name: "XCircle", icon: XCircle, category: "status" },
  { name: "AlertTriangle", icon: AlertTriangle, category: "status" },
  { name: "AlertCircle", icon: AlertCircle, category: "status" },
  { name: "Info", icon: Info, category: "status" },
  { name: "HelpCircle", icon: HelpCircle, category: "status" },
  { name: "Star", icon: Star, category: "status" },
  { name: "Heart", icon: Heart, category: "status" },
  { name: "Zap", icon: Zap, category: "status" },
  { name: "Target", icon: Target, category: "status" },
  { name: "Award", icon: Award, category: "status" },
  // Weather
  { name: "Sun", icon: Sun, category: "weather" },
  { name: "Moon", icon: Moon, category: "weather" },
  { name: "Cloud", icon: Cloud, category: "weather" },
  { name: "Thermometer", icon: Thermometer, category: "weather" },
  { name: "Droplets", icon: Droplets, category: "weather" },
  { name: "Wind", icon: Wind, category: "weather" },
  // Business
  { name: "User", icon: User, category: "business" },
  { name: "Users", icon: Users, category: "business" },
  { name: "Briefcase", icon: Briefcase, category: "business" },
  { name: "Building2", icon: Building2, category: "business" },
  { name: "CreditCard", icon: CreditCard, category: "business" },
  { name: "DollarSign", icon: DollarSign, category: "business" },
  { name: "ShoppingCart", icon: ShoppingCart, category: "business" },
  { name: "Gift", icon: Gift, category: "business" },
  { name: "Calendar", icon: Calendar, category: "business" },
  { name: "Clock", icon: Clock, category: "business" },
  // Tools
  { name: "Lock", icon: Lock, category: "tools" },
  { name: "Unlock", icon: Unlock, category: "tools" },
  { name: "Key", icon: Key, category: "tools" },
  { name: "Shield", icon: Shield, category: "tools" },
  { name: "Code", icon: Code, category: "tools" },
  { name: "Terminal", icon: Terminal, category: "tools" },
  { name: "Monitor", icon: Monitor, category: "tools" },
  { name: "Smartphone", icon: Smartphone, category: "tools" },
  { name: "Wifi", icon: Wifi, category: "tools" },
  { name: "Battery", icon: Battery, category: "tools" },
  { name: "Wrench", icon: Wrench, category: "tools" },
  { name: "Hammer", icon: Hammer, category: "tools" },
  { name: "Scissors", icon: Scissors, category: "tools" },
  { name: "Truck", icon: Truck, category: "tools" },
  { name: "Package", icon: Package, category: "tools" },
  { name: "Box", icon: Box, category: "tools" },
  // Layout
  { name: "Layout", icon: Layout, category: "layout" },
];

// ─── Symbol Data ─────────────────────────────────────────────────
type SymbolCategory = "arrows" | "math" | "currency" | "punctuation" | "misc";

interface SymbolEntry {
  char: string;
  name: string;
  category: SymbolCategory;
}

const SYMBOLS: SymbolEntry[] = [
  // Arrows
  { char: "\u2190", name: "Left Arrow", category: "arrows" },
  { char: "\u2191", name: "Up Arrow", category: "arrows" },
  { char: "\u2192", name: "Right Arrow", category: "arrows" },
  { char: "\u2193", name: "Down Arrow", category: "arrows" },
  { char: "\u2194", name: "Left Right Arrow", category: "arrows" },
  { char: "\u2195", name: "Up Down Arrow", category: "arrows" },
  { char: "\u21D0", name: "Double Left Arrow", category: "arrows" },
  { char: "\u21D2", name: "Double Right Arrow", category: "arrows" },
  { char: "\u21D4", name: "Double Left Right Arrow", category: "arrows" },
  { char: "\u2196", name: "Upper Left Arrow", category: "arrows" },
  { char: "\u2197", name: "Upper Right Arrow", category: "arrows" },
  { char: "\u2198", name: "Lower Right Arrow", category: "arrows" },
  { char: "\u2199", name: "Lower Left Arrow", category: "arrows" },
  { char: "\u27A1", name: "Black Right Arrow", category: "arrows" },
  { char: "\u2B05", name: "Black Left Arrow", category: "arrows" },
  { char: "\u2B06", name: "Black Up Arrow", category: "arrows" },
  { char: "\u2B07", name: "Black Down Arrow", category: "arrows" },
  // Math
  { char: "\u00B1", name: "Plus Minus", category: "math" },
  { char: "\u00D7", name: "Multiply", category: "math" },
  { char: "\u00F7", name: "Divide", category: "math" },
  { char: "\u2260", name: "Not Equal", category: "math" },
  { char: "\u2264", name: "Less Than or Equal", category: "math" },
  { char: "\u2265", name: "Greater Than or Equal", category: "math" },
  { char: "\u221E", name: "Infinity", category: "math" },
  { char: "\u2211", name: "Summation", category: "math" },
  { char: "\u220F", name: "Product", category: "math" },
  { char: "\u221A", name: "Square Root", category: "math" },
  { char: "\u0394", name: "Delta", category: "math" },
  { char: "\u03C0", name: "Pi", category: "math" },
  { char: "\u2248", name: "Approximately Equal", category: "math" },
  { char: "\u2261", name: "Identical", category: "math" },
  { char: "\u2282", name: "Subset", category: "math" },
  { char: "\u2283", name: "Superset", category: "math" },
  { char: "\u2229", name: "Intersection", category: "math" },
  { char: "\u222A", name: "Union", category: "math" },
  { char: "\u2200", name: "For All", category: "math" },
  { char: "\u2203", name: "There Exists", category: "math" },
  // Currency
  { char: "$", name: "Dollar", category: "currency" },
  { char: "\u20AC", name: "Euro", category: "currency" },
  { char: "\u00A3", name: "Pound", category: "currency" },
  { char: "\u00A5", name: "Yen", category: "currency" },
  { char: "\u20AA", name: "Shekel", category: "currency" },
  { char: "\u20B9", name: "Rupee", category: "currency" },
  { char: "\u20BD", name: "Ruble", category: "currency" },
  { char: "\u20BF", name: "Bitcoin", category: "currency" },
  { char: "\u00A2", name: "Cent", category: "currency" },
  // Punctuation & Typography
  { char: "\u2022", name: "Bullet", category: "punctuation" },
  { char: "\u2026", name: "Ellipsis", category: "punctuation" },
  { char: "\u2014", name: "Em Dash", category: "punctuation" },
  { char: "\u2013", name: "En Dash", category: "punctuation" },
  { char: "\u00AB", name: "Left Guillemet", category: "punctuation" },
  { char: "\u00BB", name: "Right Guillemet", category: "punctuation" },
  { char: "\u201C", name: "Left Double Quote", category: "punctuation" },
  { char: "\u201D", name: "Right Double Quote", category: "punctuation" },
  { char: "\u2018", name: "Left Single Quote", category: "punctuation" },
  { char: "\u2019", name: "Right Single Quote", category: "punctuation" },
  { char: "\u00A7", name: "Section", category: "punctuation" },
  { char: "\u00B6", name: "Pilcrow", category: "punctuation" },
  { char: "\u2020", name: "Dagger", category: "punctuation" },
  { char: "\u2021", name: "Double Dagger", category: "punctuation" },
  // Misc
  { char: "\u2713", name: "Check Mark", category: "misc" },
  { char: "\u2717", name: "Cross Mark", category: "misc" },
  { char: "\u2605", name: "Black Star", category: "misc" },
  { char: "\u2606", name: "White Star", category: "misc" },
  { char: "\u2665", name: "Heart", category: "misc" },
  { char: "\u2666", name: "Diamond", category: "misc" },
  { char: "\u2663", name: "Club", category: "misc" },
  { char: "\u2660", name: "Spade", category: "misc" },
  { char: "\u266A", name: "Music Note", category: "misc" },
  { char: "\u266B", name: "Music Notes", category: "misc" },
  { char: "\u2602", name: "Umbrella", category: "misc" },
  { char: "\u2603", name: "Snowman", category: "misc" },
  { char: "\u2604", name: "Comet", category: "misc" },
  { char: "\u2615", name: "Hot Beverage", category: "misc" },
  { char: "\u262F", name: "Yin Yang", category: "misc" },
  { char: "\u2764", name: "Heavy Heart", category: "misc" },
  { char: "\u00A9", name: "Copyright", category: "misc" },
  { char: "\u00AE", name: "Registered", category: "misc" },
  { char: "\u2122", name: "Trademark", category: "misc" },
  { char: "\u2318", name: "Command Key", category: "misc" },
  { char: "\u2325", name: "Option Key", category: "misc" },
  { char: "\u21E7", name: "Shift Key", category: "misc" },
  { char: "\u2303", name: "Control Key", category: "misc" },
  { char: "\u232B", name: "Delete Key", category: "misc" },
  { char: "\u23CE", name: "Return Key", category: "misc" },
];

// ─── Emoji Data ──────────────────────────────────────────────────
type EmojiCategory =
  | "faces"
  | "hands"
  | "people"
  | "animals"
  | "food"
  | "travel"
  | "objects"
  | "flags";

interface EmojiEntry {
  char: string;
  name: string;
  category: EmojiCategory;
}

const EMOJIS: EmojiEntry[] = [
  // Faces
  { char: "\uD83D\uDE00", name: "Grinning", category: "faces" },
  { char: "\uD83D\uDE01", name: "Beaming", category: "faces" },
  { char: "\uD83D\uDE02", name: "Joy", category: "faces" },
  { char: "\uD83E\uDD23", name: "ROFL", category: "faces" },
  { char: "\uD83D\uDE03", name: "Smiley", category: "faces" },
  { char: "\uD83D\uDE04", name: "Smile", category: "faces" },
  { char: "\uD83D\uDE05", name: "Sweat Smile", category: "faces" },
  { char: "\uD83D\uDE06", name: "Laughing", category: "faces" },
  { char: "\uD83D\uDE09", name: "Wink", category: "faces" },
  { char: "\uD83D\uDE0A", name: "Blush", category: "faces" },
  { char: "\uD83D\uDE0B", name: "Yum", category: "faces" },
  { char: "\uD83D\uDE0E", name: "Sunglasses", category: "faces" },
  { char: "\uD83E\uDD29", name: "Star Eyes", category: "faces" },
  { char: "\uD83D\uDE0D", name: "Heart Eyes", category: "faces" },
  { char: "\uD83E\uDD70", name: "Smiling Hearts", category: "faces" },
  { char: "\uD83D\uDE18", name: "Kiss", category: "faces" },
  { char: "\uD83D\uDE14", name: "Pensive", category: "faces" },
  { char: "\uD83D\uDE1E", name: "Disappointed", category: "faces" },
  { char: "\uD83D\uDE22", name: "Crying", category: "faces" },
  { char: "\uD83D\uDE2D", name: "Sobbing", category: "faces" },
  { char: "\uD83D\uDE21", name: "Angry", category: "faces" },
  { char: "\uD83E\uDD2F", name: "Mind Blown", category: "faces" },
  { char: "\uD83E\uDD14", name: "Thinking", category: "faces" },
  { char: "\uD83E\uDD2D", name: "Shush", category: "faces" },
  { char: "\uD83E\uDD71", name: "Yawning", category: "faces" },
  { char: "\uD83D\uDE31", name: "Scream", category: "faces" },
  { char: "\uD83D\uDE33", name: "Flushed", category: "faces" },
  { char: "\uD83E\uDD75", name: "Hot", category: "faces" },
  { char: "\uD83E\uDD76", name: "Cold", category: "faces" },
  { char: "\uD83D\uDC7B", name: "Ghost", category: "faces" },
  { char: "\uD83D\uDC80", name: "Skull", category: "faces" },
  { char: "\uD83E\uDD16", name: "Robot", category: "faces" },
  // Hands
  { char: "\uD83D\uDC4D", name: "Thumbs Up", category: "hands" },
  { char: "\uD83D\uDC4E", name: "Thumbs Down", category: "hands" },
  { char: "\uD83D\uDC4F", name: "Clap", category: "hands" },
  { char: "\uD83D\uDE4C", name: "Raised Hands", category: "hands" },
  { char: "\uD83D\uDC4B", name: "Wave", category: "hands" },
  { char: "\u270B", name: "Raised Hand", category: "hands" },
  { char: "\u270C\uFE0F", name: "Peace", category: "hands" },
  { char: "\uD83E\uDD1E", name: "Fingers Crossed", category: "hands" },
  { char: "\uD83E\uDD1F", name: "Love You", category: "hands" },
  { char: "\uD83E\uDD18", name: "Rock On", category: "hands" },
  { char: "\uD83D\uDC4C", name: "OK Hand", category: "hands" },
  { char: "\uD83E\uDD0C", name: "Pinched Fingers", category: "hands" },
  { char: "\u261D\uFE0F", name: "Point Up", category: "hands" },
  { char: "\uD83D\uDC46", name: "Backhand Up", category: "hands" },
  { char: "\uD83D\uDC47", name: "Backhand Down", category: "hands" },
  { char: "\uD83D\uDC48", name: "Backhand Left", category: "hands" },
  { char: "\uD83D\uDC49", name: "Backhand Right", category: "hands" },
  { char: "\uD83D\uDCAA", name: "Flexed Biceps", category: "hands" },
  { char: "\uD83D\uDE4F", name: "Pray / Thanks", category: "hands" },
  { char: "\uD83E\uDD1D", name: "Handshake", category: "hands" },
  // People
  { char: "\uD83D\uDC68\u200D\uD83D\uDCBB", name: "Man Technologist", category: "people" },
  { char: "\uD83D\uDC69\u200D\uD83D\uDCBB", name: "Woman Technologist", category: "people" },
  { char: "\uD83D\uDC68\u200D\uD83D\uDD27", name: "Man Mechanic", category: "people" },
  { char: "\uD83D\uDC77", name: "Construction Worker", category: "people" },
  { char: "\uD83D\uDC68\u200D\uD83D\uDCBC", name: "Man Office Worker", category: "people" },
  { char: "\uD83E\uDDD1\u200D\uD83D\uDCBC", name: "Office Worker", category: "people" },
  { char: "\uD83E\uDDD1\u200D\uD83C\uDFA8", name: "Artist", category: "people" },
  { char: "\uD83D\uDE4B", name: "Raising Hand", category: "people" },
  { char: "\uD83E\uDD37", name: "Shrug", category: "people" },
  { char: "\uD83E\uDD26", name: "Facepalm", category: "people" },
  // Animals
  { char: "\uD83D\uDC36", name: "Dog", category: "animals" },
  { char: "\uD83D\uDC31", name: "Cat", category: "animals" },
  { char: "\uD83E\uDD81", name: "Lion", category: "animals" },
  { char: "\uD83D\uDC3B", name: "Bear", category: "animals" },
  { char: "\uD83E\uDD8A", name: "Fox", category: "animals" },
  { char: "\uD83D\uDC22", name: "Turtle", category: "animals" },
  { char: "\uD83E\uDD85", name: "Eagle", category: "animals" },
  { char: "\uD83D\uDC1D", name: "Bee", category: "animals" },
  { char: "\uD83E\uDD8B", name: "Butterfly", category: "animals" },
  { char: "\uD83D\uDC19", name: "Octopus", category: "animals" },
  // Food
  { char: "\uD83C\uDF55", name: "Pizza", category: "food" },
  { char: "\uD83C\uDF54", name: "Burger", category: "food" },
  { char: "\u2615", name: "Coffee", category: "food" },
  { char: "\uD83C\uDF7A", name: "Beer", category: "food" },
  { char: "\uD83C\uDF70", name: "Cake", category: "food" },
  { char: "\uD83C\uDF4E", name: "Apple", category: "food" },
  { char: "\uD83C\uDF53", name: "Strawberry", category: "food" },
  { char: "\uD83E\uDD51", name: "Avocado", category: "food" },
  { char: "\uD83C\uDF63", name: "Sushi", category: "food" },
  { char: "\uD83C\uDF69", name: "Donut", category: "food" },
  // Travel
  { char: "\u2708\uFE0F", name: "Airplane", category: "travel" },
  { char: "\uD83D\uDE97", name: "Car", category: "travel" },
  { char: "\uD83D\uDE8C", name: "Bus", category: "travel" },
  { char: "\uD83D\uDE82", name: "Train", category: "travel" },
  { char: "\uD83D\uDEA2", name: "Ship", category: "travel" },
  { char: "\uD83C\uDFE0", name: "House", category: "travel" },
  { char: "\uD83C\uDFE2", name: "Office Building", category: "travel" },
  { char: "\uD83C\uDFD7\uFE0F", name: "Construction", category: "travel" },
  { char: "\uD83C\uDF05", name: "Sunrise", category: "travel" },
  { char: "\uD83C\uDF03", name: "Night City", category: "travel" },
  // Objects
  { char: "\uD83D\uDCBB", name: "Laptop", category: "objects" },
  { char: "\uD83D\uDCF1", name: "Phone", category: "objects" },
  { char: "\uD83D\uDCE7", name: "Email", category: "objects" },
  { char: "\uD83D\uDCC5", name: "Calendar", category: "objects" },
  { char: "\uD83D\uDCCB", name: "Clipboard", category: "objects" },
  { char: "\uD83D\uDCC8", name: "Chart Up", category: "objects" },
  { char: "\uD83D\uDCC9", name: "Chart Down", category: "objects" },
  { char: "\uD83D\uDD11", name: "Key", category: "objects" },
  { char: "\uD83D\uDD12", name: "Lock", category: "objects" },
  { char: "\uD83D\uDD13", name: "Unlock", category: "objects" },
  { char: "\uD83D\uDCA1", name: "Light Bulb", category: "objects" },
  { char: "\uD83D\uDD27", name: "Wrench", category: "objects" },
  { char: "\u2699\uFE0F", name: "Gear", category: "objects" },
  { char: "\uD83D\uDEE0\uFE0F", name: "Toolbox", category: "objects" },
  { char: "\uD83C\uDFAF", name: "Bullseye", category: "objects" },
  { char: "\uD83D\uDD25", name: "Fire", category: "objects" },
  { char: "\uD83D\uDCA5", name: "Collision", category: "objects" },
  { char: "\u26A1", name: "Lightning", category: "objects" },
  { char: "\uD83C\uDF1F", name: "Glowing Star", category: "objects" },
  { char: "\uD83C\uDF89", name: "Party Popper", category: "objects" },
  // Flags
  { char: "\uD83C\uDDEE\uD83C\uDDF1", name: "Israel", category: "flags" },
  { char: "\uD83C\uDDFA\uD83C\uDDF8", name: "USA", category: "flags" },
  { char: "\uD83C\uDDEC\uD83C\uDDE7", name: "UK", category: "flags" },
  { char: "\uD83C\uDDEB\uD83C\uDDF7", name: "France", category: "flags" },
  { char: "\uD83C\uDDE9\uD83C\uDDEA", name: "Germany", category: "flags" },
  { char: "\uD83C\uDDF7\uD83C\uDDFA", name: "Russia", category: "flags" },
  { char: "\uD83C\uDDEF\uD83C\uDDF5", name: "Japan", category: "flags" },
  { char: "\uD83C\uDDE8\uD83C\uDDF3", name: "China", category: "flags" },
  { char: "\uD83C\uDDE7\uD83C\uDDF7", name: "Brazil", category: "flags" },
  { char: "\uD83C\uDDF3\uD83C\uDDFF", name: "New Zealand", category: "flags" },
  { char: "\uD83C\uDDF9\uD83C\uDDF7", name: "Turkey", category: "flags" },
  { char: "\uD83C\uDDEA\uD83C\uDDEC", name: "Egypt", category: "flags" },
  { char: "\uD83C\uDDEE\uD83C\uDDF3", name: "India", category: "flags" },
  { char: "\uD83D\uDEA9", name: "Triangle Flag", category: "flags" },
  { char: "\uD83C\uDFF4", name: "Black Flag", category: "flags" },
  { char: "\uD83C\uDFF3\uFE0F", name: "White Flag", category: "flags" },
];

// ─── Colors ──────────────────────────────────────────────────────
const COLOR_PALETTE = [
  { id: "default", value: "currentColor", label: "Default", bg: "bg-slate-300" },
  { id: "red", value: "#ef4444", label: "Red", bg: "bg-red-500" },
  { id: "orange", value: "#f97316", label: "Orange", bg: "bg-orange-500" },
  { id: "amber", value: "#f59e0b", label: "Amber", bg: "bg-amber-500" },
  { id: "green", value: "#22c55e", label: "Green", bg: "bg-green-500" },
  { id: "emerald", value: "#10b981", label: "Emerald", bg: "bg-emerald-500" },
  { id: "cyan", value: "#06b6d4", label: "Cyan", bg: "bg-cyan-500" },
  { id: "blue", value: "#3b82f6", label: "Blue", bg: "bg-blue-500" },
  { id: "violet", value: "#8b5cf6", label: "Violet", bg: "bg-violet-500" },
  { id: "pink", value: "#ec4899", label: "Pink", bg: "bg-pink-500" },
  { id: "rose", value: "#f43f5e", label: "Rose", bg: "bg-rose-500" },
  { id: "white", value: "#ffffff", label: "White", bg: "bg-white" },
];

const FAVORITES_KEY = "cc-icon-library-favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

// ─── Types ───────────────────────────────────────────────────────
type TabId = "icons" | "symbols" | "emojis" | "favorites";

// ─── Page Component ──────────────────────────────────────────────
export default function IconLibraryPage() {
  const { language } = useSettings();
  const isRtl = language === "he";
  const t = labels[language] || labels.en;

  const [tab, setTab] = useState<TabId>("icons");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("currentColor");
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const handleCopy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
      } catch {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
      }
    },
    []
  );

  const query = search.toLowerCase().trim();

  // ─── Filtered Icons ──────────────────────────────────────────
  const filteredIcons = useMemo(() => {
    if (!query) return ICONS;
    return ICONS.filter(
      (i) =>
        i.name.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
    );
  }, [query]);

  const iconsByCategory = useMemo(() => {
    const map: Map<string, IconEntry[]> = new Map();
    for (const icon of filteredIcons) {
      const arr = map.get(icon.category) || [];
      arr.push(icon);
      map.set(icon.category, arr);
    }
    return map;
  }, [filteredIcons]);

  // ─── Filtered Symbols ────────────────────────────────────────
  const filteredSymbols = useMemo(() => {
    if (!query) return SYMBOLS;
    return SYMBOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.char.includes(query)
    );
  }, [query]);

  const symbolsByCategory = useMemo(() => {
    const map: Map<string, SymbolEntry[]> = new Map();
    for (const sym of filteredSymbols) {
      const arr = map.get(sym.category) || [];
      arr.push(sym);
      map.set(sym.category, arr);
    }
    return map;
  }, [filteredSymbols]);

  // ─── Filtered Emojis ─────────────────────────────────────────
  const filteredEmojis = useMemo(() => {
    if (!query) return EMOJIS;
    return EMOJIS.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
    );
  }, [query]);

  const emojisByCategory = useMemo(() => {
    const map: Map<string, EmojiEntry[]> = new Map();
    for (const em of filteredEmojis) {
      const arr = map.get(em.category) || [];
      arr.push(em);
      map.set(em.category, arr);
    }
    return map;
  }, [filteredEmojis]);

  // ─── Favorites ─────────────────────────────────────────────────
  const favoriteIcons = useMemo(() => ICONS.filter((i) => favorites.has(`icon-${i.name}`)), [favorites]);
  const favoriteSymbols = useMemo(() => SYMBOLS.filter((s) => favorites.has(`sym-${s.name}`)), [favorites]);
  const favoriteEmojis = useMemo(() => EMOJIS.filter((e) => favorites.has(`emo-${e.name}`)), [favorites]);

  // ─── Count for current tab ────────────────────────────────────
  const currentCount =
    tab === "icons"
      ? filteredIcons.length
      : tab === "symbols"
        ? filteredSymbols.length
        : tab === "favorites"
          ? favoriteIcons.length + favoriteSymbols.length + favoriteEmojis.length
          : filteredEmojis.length;

  const tabDefs: { id: TabId; label: string; count?: number }[] = [
    { id: "favorites", label: `⭐ ${t.tabs.favorites}`, count: favorites.size },
    { id: "icons", label: t.tabs.icons },
    { id: "symbols", label: t.tabs.symbols },
    { id: "emojis", label: t.tabs.emojis },
  ];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="flex h-full flex-col overflow-hidden bg-slate-900"
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-700/60 bg-slate-900/80 px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-100">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>

        {/* Tabs + Search + Color */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-800/60 p-1">
            {tabDefs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tab === tb.id
                    ? "bg-[var(--cc-accent-primary,#8b5cf6)] text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                }`}
              >
                {tb.label}
                {tb.count !== undefined && tb.count > 0 && (
                  <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[9px] tabular-nums">{tb.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 p-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                title={c.label}
                className={`h-5 w-5 rounded-full transition-all ${c.bg} ${
                  selectedColor === c.value
                    ? "ring-2 ring-[var(--cc-accent-primary,#8b5cf6)] ring-offset-1 ring-offset-slate-900 scale-110"
                    : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 py-2 ps-10 pe-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-[var(--cc-accent-primary,#8b5cf6)] focus:ring-1 focus:ring-[var(--cc-accent-primary,#8b5cf6)]"
            />
          </div>

          {/* Count */}
          <span className="text-xs text-slate-500">
            {currentCount} {t.total}
          </span>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Icons Tab */}
        {tab === "icons" && (
          <div className="space-y-6">
            {[...iconsByCategory.entries()].map(([category, icons]) => (
              <div key={category}>
                <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  {(t.categories as Record<string, string>)[category] || category}
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                  {icons.map((entry) => {
                    const Icon = entry.icon;
                    const id = `icon-${entry.name}`;
                    const isCopied = copiedId === id;
                    const isFav = favorites.has(id);
                    return (
                      <div key={entry.name} className="group/card relative">
                        <button
                          onClick={() => handleCopy(`<${entry.name} />`, id)}
                          title={entry.name}
                          className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                            isCopied
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70"
                          }`}
                        >
                          {isCopied ? (
                            <Check className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Icon className="h-5 w-5" style={{ color: selectedColor === "currentColor" ? undefined : selectedColor }} />
                          )}
                          <span className="text-[10px] text-slate-500 truncate w-full text-center">
                            {isCopied ? t.copied : entry.name}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(id)}
                          className={`absolute top-1 right-1 rounded p-0.5 transition-all ${
                            isFav ? "text-amber-400 opacity-100" : "text-slate-600 opacity-0 group-hover/card:opacity-100 hover:text-amber-400"
                          }`}
                        >
                          <Star className="h-3 w-3" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredIcons.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500">
                No icons match your search.
              </p>
            )}
          </div>
        )}

        {/* Symbols Tab */}
        {tab === "symbols" && (
          <div className="space-y-6">
            {[...symbolsByCategory.entries()].map(([category, symbols]) => (
              <div key={category}>
                <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  {(t.categories as Record<string, string>)[category] || category}
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                  {symbols.map((entry) => {
                    const id = `sym-${entry.name}`;
                    const isCopied = copiedId === id;
                    const isFav = favorites.has(id);
                    return (
                      <div key={entry.name} className="group/card relative">
                        <button
                          onClick={() => handleCopy(entry.char, id)}
                          title={`${entry.name} (${entry.char})`}
                          className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                            isCopied
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70"
                          }`}
                        >
                          <span className="text-2xl" style={{ color: isCopied ? undefined : selectedColor === "currentColor" ? undefined : selectedColor }}>
                            {isCopied ? "\u2713" : entry.char}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate w-full text-center">
                            {isCopied ? t.copied : entry.name}
                          </span>
                        </button>
                        <button type="button" onClick={() => toggleFavorite(id)} className={`absolute top-1 right-1 rounded p-0.5 transition-all ${isFav ? "text-amber-400 opacity-100" : "text-slate-600 opacity-0 group-hover/card:opacity-100 hover:text-amber-400"}`}>
                          <Star className="h-3 w-3" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredSymbols.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500">
                No symbols match your search.
              </p>
            )}
          </div>
        )}

        {/* Emojis Tab */}
        {tab === "emojis" && (
          <div className="space-y-6">
            {[...emojisByCategory.entries()].map(([category, emojis]) => (
              <div key={category}>
                <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  {(t.categories as Record<string, string>)[category] || category}
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                  {emojis.map((entry) => {
                    const id = `emo-${entry.name}`;
                    const isCopied = copiedId === id;
                    const isFav = favorites.has(id);
                    return (
                      <div key={entry.name} className="group/card relative">
                        <button
                          onClick={() => handleCopy(entry.char, id)}
                          title={entry.name}
                          className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                            isCopied
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70"
                          }`}
                        >
                          <span className="text-2xl">{isCopied ? "\u2713" : entry.char}</span>
                          <span className="text-[10px] text-slate-500 truncate w-full text-center">
                            {isCopied ? t.copied : entry.name}
                          </span>
                        </button>
                        <button type="button" onClick={() => toggleFavorite(id)} className={`absolute top-1 right-1 rounded p-0.5 transition-all ${isFav ? "text-amber-400 opacity-100" : "text-slate-600 opacity-0 group-hover/card:opacity-100 hover:text-amber-400"}`}>
                          <Star className="h-3 w-3" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredEmojis.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500">
                No emojis match your search.
              </p>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {tab === "favorites" && (
          <div className="space-y-6">
            {favorites.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Star className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">{language === "he" ? "אין מועדפים עדיין — לחצו על הכוכב ליד כל פריט" : language === "ru" ? "Нет избранных — нажмите звёздочку у элемента" : "No favorites yet — click the star on any item"}</p>
              </div>
            ) : (
              <>
                {favoriteIcons.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wider">{t.tabs.icons}</h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                      {favoriteIcons.map((entry) => {
                        const Icon = entry.icon;
                        const id = `icon-${entry.name}`;
                        const isCopied = copiedId === id;
                        return (
                          <div key={entry.name} className="group/card relative">
                            <button onClick={() => handleCopy(`<${entry.name} />`, id)} title={entry.name} className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${isCopied ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70"}`}>
                              {isCopied ? <Check className="h-5 w-5 text-emerald-400" /> : <Icon className="h-5 w-5" style={{ color: selectedColor === "currentColor" ? undefined : selectedColor }} />}
                              <span className="text-[10px] text-slate-500 truncate w-full text-center">{isCopied ? t.copied : entry.name}</span>
                            </button>
                            <button type="button" onClick={() => toggleFavorite(id)} className="absolute top-1 right-1 rounded p-0.5 text-amber-400"><Star className="h-3 w-3" fill="currentColor" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {favoriteSymbols.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wider">{t.tabs.symbols}</h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                      {favoriteSymbols.map((entry) => {
                        const id = `sym-${entry.name}`;
                        const isCopied = copiedId === id;
                        return (
                          <div key={entry.name} className="group/card relative">
                            <button onClick={() => handleCopy(entry.char, id)} title={entry.name} className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${isCopied ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70"}`}>
                              <span className="text-2xl" style={{ color: isCopied ? undefined : selectedColor === "currentColor" ? undefined : selectedColor }}>{isCopied ? "\u2713" : entry.char}</span>
                              <span className="text-[10px] text-slate-500 truncate w-full text-center">{isCopied ? t.copied : entry.name}</span>
                            </button>
                            <button type="button" onClick={() => toggleFavorite(id)} className="absolute top-1 right-1 rounded p-0.5 text-amber-400"><Star className="h-3 w-3" fill="currentColor" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {favoriteEmojis.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-medium text-slate-400 uppercase tracking-wider">{t.tabs.emojis}</h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                      {favoriteEmojis.map((entry) => {
                        const id = `emo-${entry.name}`;
                        const isCopied = copiedId === id;
                        return (
                          <div key={entry.name} className="group/card relative">
                            <button onClick={() => handleCopy(entry.char, id)} title={entry.name} className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${isCopied ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70"}`}>
                              <span className="text-2xl">{isCopied ? "\u2713" : entry.char}</span>
                              <span className="text-[10px] text-slate-500 truncate w-full text-center">{isCopied ? t.copied : entry.name}</span>
                            </button>
                            <button type="button" onClick={() => toggleFavorite(id)} className="absolute top-1 right-1 rounded p-0.5 text-amber-400"><Star className="h-3 w-3" fill="currentColor" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
