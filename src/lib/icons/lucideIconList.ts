import {
  Activity, AlertTriangle, Archive, ArrowRight, ArrowRightCircle, Award,
  BadgeCheck, Banknote, BarChart3, Bell, BookOpen, Bookmark, Box, Briefcase, Bug, Building, Building2,
  Calendar, CalendarCheck, CalendarDays, CalendarPlus, CalendarRange, CalendarX, Camera, Check, CheckCircle2, CheckSquare, ChevronRight, Circle, CircleDot, Clipboard, Clock, Cloud, Code, Cog, Coins, Command, Copy, CreditCard,
  Database, DollarSign, Download,
  Edit3, ExternalLink, Eye,
  Factory, File, FileCheck, FileSignature, FileStack, FileText, Filter, Flag, Folder, FolderOpen,
  Gift, GitBranch, GitPullRequest, Globe, GraduationCap, Grid3X3,
  HardHat, Hash, Heart, HelpCircle, Home,
  Image, Inbox, Info,
  Key,
  Landmark, Languages, Layers, Layout, LifeBuoy, Link, Link2, List, ListChecks, Lock, LogIn,
  Mail, Map, MapPin, Megaphone, MessageCircle, MessageSquare, Mic, Monitor, Moon, MoreHorizontal,
  Navigation,
  Package, Palette, Palmtree, PenTool, Percent, Phone, PhoneCall, Pin, Play, Plug, Plus, Printer,
  QrCode,
  Radio, Receipt, RefreshCw, Repeat, Rocket, Ruler,
  Save, Scale, Scan, Search, Send, Server, Settings, Share2, Shield, ShoppingCart, Smile, Speaker, Star, StickyNote, Sun, Swords,
  Table2, Tag, Tags, Target, Terminal, ThumbsUp, Timer, Trash2, TrendingUp, Trophy, Truck, Tv, Type,
  Umbrella, Upload, User, UserCheck, UserCircle, UserCog, UserPlus, Users,
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
  Activity, AlertTriangle, Archive, ArrowRight, ArrowRightCircle, Award,
  BadgeCheck, Banknote, BarChart3, Bell, BookOpen, Bookmark, Box, Briefcase, Bug, Building, Building2,
  Calendar, CalendarCheck, CalendarDays, CalendarPlus, CalendarRange, CalendarX, Camera, Check, CheckCircle2, CheckSquare, ChevronRight, Circle, CircleDot, Clipboard, Clock, Cloud, Code, Cog, Coins, Command, Copy, CreditCard,
  Database, DollarSign, Download,
  Edit3, ExternalLink, Eye,
  Factory, File, FileCheck, FileSignature, FileStack, FileText, Filter, Flag, Folder, FolderOpen,
  Gift, GitBranch, GitPullRequest, Globe, GraduationCap, Grid3X3,
  HardHat, Hash, Heart, HelpCircle, Home,
  Image, Inbox, Info,
  Key,
  Landmark, Languages, Layers, Layout, LifeBuoy, Link, Link2, List, ListChecks, Lock, LogIn,
  Mail, Map, MapPin, Megaphone, MessageCircle, MessageSquare, Mic, Monitor, Moon, MoreHorizontal,
  Navigation,
  Package, Palette, Palmtree, PenTool, Percent, Phone, PhoneCall, Pin, Play, Plug, Plus, Printer,
  QrCode,
  Radio, Receipt, RefreshCw, Repeat, Rocket, Ruler,
  Save, Scale, Scan, Search, Send, Server, Settings, Share2, Shield, ShoppingCart, Smile, Speaker, Star, StickyNote, Sun, Swords,
  Table2, Tag, Tags, Target, Terminal, ThumbsUp, Timer, Trash2, TrendingUp, Trophy, Truck, Tv, Type,
  Umbrella, Upload, User, UserCheck, UserCircle, UserCog, UserPlus, Users,
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
    icons: ['Home', 'Star', 'Heart', 'Bookmark', 'Flag', 'Tag', 'Tags', 'Pin', 'Zap', 'Rocket', 'Award', 'Trophy', 'Gift', 'Smile', 'Target', 'Wand2', 'BadgeCheck', 'CircleDot', 'StickyNote', 'Type', 'Languages'],
  },
  {
    id: 'files',
    labelHe: 'קבצים',
    labelEn: 'Files',
    labelRu: 'Файлы',
    icons: ['File', 'FileText', 'FileCheck', 'FileSignature', 'FileStack', 'Folder', 'FolderOpen', 'Archive', 'Clipboard', 'Copy', 'Download', 'Upload', 'Inbox', 'Package', 'Box', 'Save'],
  },
  {
    id: 'communication',
    labelHe: 'תקשורת',
    labelEn: 'Communication',
    labelRu: 'Коммуникация',
    icons: ['Mail', 'MessageCircle', 'MessageSquare', 'Phone', 'PhoneCall', 'Send', 'Bell', 'Mic', 'Video', 'Share2', 'Radio', 'Speaker', 'Volume2', 'Megaphone'],
  },
  {
    id: 'people',
    labelHe: 'אנשים',
    labelEn: 'People',
    labelRu: 'Люди',
    icons: ['User', 'UserCircle', 'UserCog', 'Users', 'UserPlus', 'UserCheck', 'GraduationCap', 'HardHat', 'Briefcase'],
  },
  {
    id: 'data',
    labelHe: 'נתונים',
    labelEn: 'Data',
    labelRu: 'Данные',
    icons: ['Database', 'BarChart3', 'Table2', 'Grid3X3', 'Hash', 'List', 'ListChecks', 'Filter', 'Search', 'TrendingUp', 'Activity', 'Percent', 'Ruler'],
  },
  {
    id: 'development',
    labelHe: 'פיתוח',
    labelEn: 'Development',
    labelRu: 'Разработка',
    icons: ['Code', 'Terminal', 'Bug', 'Cog', 'Settings', 'Wrench', 'Command', 'Plug', 'Globe', 'Cloud', 'Wifi', 'Monitor', 'Server', 'GitBranch', 'GitPullRequest', 'Link'],
  },
  {
    id: 'business',
    labelHe: 'עסקים',
    labelEn: 'Business',
    labelRu: 'Бизнес',
    icons: ['Building', 'Building2', 'Factory', 'Landmark', 'Banknote', 'Coins', 'DollarSign', 'CreditCard', 'Receipt', 'Wallet', 'ShoppingCart', 'Truck', 'Scale', 'Shield', 'Key', 'Lock'],
  },
  {
    id: 'time',
    labelHe: 'זמן',
    labelEn: 'Time',
    labelRu: 'Время',
    icons: ['Calendar', 'CalendarCheck', 'CalendarDays', 'CalendarPlus', 'CalendarRange', 'CalendarX', 'Clock', 'Timer', 'RefreshCw', 'Repeat', 'Play', 'Palmtree', 'ArrowRightCircle', 'CheckSquare'],
  },
];

export const ALL_LUCIDE_NAMES = Object.keys(LUCIDE_MAP);
