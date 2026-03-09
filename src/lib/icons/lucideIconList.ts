import {
  Activity, AlertTriangle, Archive, ArrowRight, Award,
  Banknote, BarChart3, Bell, BookOpen, Bookmark, Box, Briefcase, Bug, Building2,
  Calendar, CalendarCheck, Camera, Check, CheckCircle2, ChevronRight, Circle, Clipboard, Clock, Cloud, Code, Cog, Command, Copy, CreditCard,
  Database, Download,
  Edit3, ExternalLink, Eye,
  File, FileCheck, FileText, Filter, Flag, Folder, FolderOpen,
  Gift, Globe, GraduationCap, Grid3X3,
  HardHat, Hash, Heart, HelpCircle, Home,
  Image, Inbox, Info,
  Key,
  Landmark, Layers, Layout, LifeBuoy, Link2, List, ListChecks, Lock, LogIn,
  Mail, Map, MapPin, MessageCircle, MessageSquare, Mic, Monitor, Moon, MoreHorizontal,
  Navigation,
  Package, Palette, PenTool, Phone, Pin, Play, Plug, Plus, Printer,
  QrCode,
  Radio, RefreshCw, Repeat, Rocket,
  Save, Scale, Scan, Search, Send, Settings, Share2, Shield, ShoppingCart, Smile, Speaker, Star, Sun, Swords,
  Table2, Tag, Target, Terminal, ThumbsUp, Timer, Trash2, TrendingUp, Trophy, Truck, Tv,
  Umbrella, Upload, User, UserCheck, UserPlus, Users,
  Video, Volume2,
  Wallet, Wand2, Wifi, Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LucideCategory {
  id: string;
  labelHe: string;
  labelEn: string;
  labelRu: string;
  icons: string[];
}

/** name → component map (static imports for tree-shaking) */
export const LUCIDE_MAP: Record<string, LucideIcon> = {
  Activity, AlertTriangle, Archive, ArrowRight, Award,
  Banknote, BarChart3, Bell, BookOpen, Bookmark, Box, Briefcase, Bug, Building2,
  Calendar, CalendarCheck, Camera, Check, CheckCircle2, ChevronRight, Circle, Clipboard, Clock, Cloud, Code, Cog, Command, Copy, CreditCard,
  Database, Download,
  Edit3, ExternalLink, Eye,
  File, FileCheck, FileText, Filter, Flag, Folder, FolderOpen,
  Gift, Globe, GraduationCap, Grid3X3,
  HardHat, Hash, Heart, HelpCircle, Home,
  Image, Inbox, Info,
  Key,
  Landmark, Layers, Layout, LifeBuoy, Link2, List, ListChecks, Lock, LogIn,
  Mail, Map, MapPin, MessageCircle, MessageSquare, Mic, Monitor, Moon, MoreHorizontal,
  Navigation,
  Package, Palette, PenTool, Phone, Pin, Play, Plug, Plus, Printer,
  QrCode,
  Radio, RefreshCw, Repeat, Rocket,
  Save, Scale, Scan, Search, Send, Settings, Share2, Shield, ShoppingCart, Smile, Speaker, Star, Sun, Swords,
  Table2, Tag, Target, Terminal, ThumbsUp, Timer, Trash2, TrendingUp, Trophy, Truck, Tv,
  Umbrella, Upload, User, UserCheck, UserPlus, Users,
  Video, Volume2,
  Wallet, Wand2, Wifi, Wrench,
  XCircle,
  Zap,
};

export const LUCIDE_CATEGORIES: LucideCategory[] = [
  {
    id: 'general',
    labelHe: 'כללי',
    labelEn: 'General',
    labelRu: 'Общее',
    icons: ['Home', 'Star', 'Heart', 'Bookmark', 'Flag', 'Tag', 'Pin', 'Zap', 'Rocket', 'Award', 'Trophy', 'Gift', 'Smile', 'Target', 'Wand2'],
  },
  {
    id: 'files',
    labelHe: 'קבצים',
    labelEn: 'Files',
    labelRu: 'Файлы',
    icons: ['File', 'FileText', 'FileCheck', 'Folder', 'FolderOpen', 'Archive', 'Clipboard', 'Copy', 'Download', 'Upload', 'Inbox', 'Package', 'Box', 'Save'],
  },
  {
    id: 'communication',
    labelHe: 'תקשורת',
    labelEn: 'Communication',
    labelRu: 'Коммуникация',
    icons: ['Mail', 'MessageCircle', 'MessageSquare', 'Phone', 'Send', 'Bell', 'Mic', 'Video', 'Share2', 'Radio', 'Speaker', 'Volume2'],
  },
  {
    id: 'people',
    labelHe: 'אנשים',
    labelEn: 'People',
    labelRu: 'Люди',
    icons: ['User', 'Users', 'UserPlus', 'UserCheck', 'GraduationCap', 'HardHat', 'Briefcase'],
  },
  {
    id: 'data',
    labelHe: 'נתונים',
    labelEn: 'Data',
    labelRu: 'Данные',
    icons: ['Database', 'BarChart3', 'Table2', 'Grid3X3', 'Hash', 'List', 'ListChecks', 'Filter', 'Search', 'TrendingUp', 'Activity'],
  },
  {
    id: 'development',
    labelHe: 'פיתוח',
    labelEn: 'Development',
    labelRu: 'Разработка',
    icons: ['Code', 'Terminal', 'Bug', 'Cog', 'Settings', 'Wrench', 'Command', 'Plug', 'Globe', 'Cloud', 'Wifi', 'Monitor'],
  },
  {
    id: 'business',
    labelHe: 'עסקים',
    labelEn: 'Business',
    labelRu: 'Бизнес',
    icons: ['Building2', 'Landmark', 'Banknote', 'CreditCard', 'Wallet', 'ShoppingCart', 'Truck', 'Scale', 'Shield', 'Key', 'Lock'],
  },
  {
    id: 'time',
    labelHe: 'זמן',
    labelEn: 'Time',
    labelRu: 'Время',
    icons: ['Calendar', 'CalendarCheck', 'Clock', 'Timer', 'RefreshCw', 'Repeat', 'Play'],
  },
];

export const ALL_LUCIDE_NAMES = Object.keys(LUCIDE_MAP);
