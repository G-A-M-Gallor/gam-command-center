'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronRight, ChevronLeft, Circle, CheckCircle2, AlertCircle,
  Clock, Layers, FileEdit, Map, Grid3X3, Bot, Palette, FormInput,
  Network, Calendar, Zap, Settings, Search, X,
  LayoutDashboard, Component, Database, Globe, Code2, Shield,
  Eye, EyeOff, GitCommit, FileCode, Hash, ExternalLink, Tag,
  ClipboardCheck, Rocket, Loader2, RefreshCw, HelpCircle, BookOpen, Brain,
  Inbox, Star, ArrowRight, PauseCircle, AlertTriangle, Snowflake, XCircle,
  ArrowUpDown,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';
import { getOverallScore } from '@/lib/audit/checks';
import ChangelogToolbar from './ChangelogToolbar';

// ─── Types ───────────────────────────────────────────────
type Status = 'active' | 'placeholder' | 'coming-soon' | 'deprecated';
type Phase = 1 | 2 | 3 | 4 | 5;
type WorkflowStatus = 'inbox' | 'wishlist' | 'todo' | 'next' | 'inProgress' | 'hold' | 'stuck' | 'freeze' | 'complete' | 'cancelled';
type SortField = 'date' | 'name' | 'phase' | 'workflow' | 'fileCount';
type GroupField = 'none' | 'workflow' | 'phase' | 'date' | 'fileDir';

interface FieldEntry {
  name: string;
  type: string;
  source?: string;
}

interface ComponentEntry {
  id: string;
  name: string;
  file: string;
  status: Status;
  fields?: FieldEntry[];
}

interface RouteEntry {
  id: string;
  path: string;
  name: string;
  nameHe: string;
  icon: React.ElementType;
  phase: Phase;
  status: Status;
  version: string;
  addedDate: string;
  descriptionHe: string;
  descriptionEn: string;
  components: ComponentEntry[];
  contexts: string[];
  supabaseTables?: string[];
  visible: boolean;
  sidebarTab: boolean;
}

interface WidgetEntry {
  id: string;
  name: string;
  nameHe: string;
  file: string;
  defaultSize: string;
  panelMode: string;
  status: Status;
  version: string;
  addedDate: string;
}

interface ContextEntry {
  id: string;
  name: string;
  file: string;
  storageKeys: string[];
  status: Status;
  version: string;
}

// ─── Workflow Config ─────────────────────────────────────

const WORKFLOW_CONFIG: Record<WorkflowStatus, { color: string; bg: string; text: string; icon: React.ElementType; heLabel: string; enLabel: string; order: number }> = {
  inbox:      { color: '#94a3b8', bg: 'bg-slate-500/10',   text: 'text-slate-400',   icon: Inbox,          heLabel: 'נכנס',            enLabel: 'Inbox',       order: 0 },
  wishlist:   { color: '#c084fc', bg: 'bg-purple-500/10',  text: 'text-purple-400',  icon: Star,           heLabel: 'רשימת משאלות',    enLabel: 'Wishlist',    order: 1 },
  todo:       { color: '#60a5fa', bg: 'bg-blue-500/10',    text: 'text-blue-400',    icon: Circle,         heLabel: 'לביצוע',          enLabel: 'To Do',       order: 2 },
  next:       { color: '#818cf8', bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  icon: ArrowRight,     heLabel: 'הבא',             enLabel: 'Next',        order: 3 },
  inProgress: { color: '#f472b6', bg: 'bg-pink-500/10',    text: 'text-pink-400',    icon: Loader2,        heLabel: 'בביצוע',          enLabel: 'In Progress', order: 4 },
  hold:       { color: '#fbbf24', bg: 'bg-amber-500/10',   text: 'text-amber-400',   icon: PauseCircle,    heLabel: 'המתנה',           enLabel: 'On Hold',     order: 5 },
  stuck:      { color: '#fb923c', bg: 'bg-orange-500/10',  text: 'text-orange-400',  icon: AlertTriangle,  heLabel: 'תקוע',            enLabel: 'Stuck',       order: 6 },
  freeze:     { color: '#38bdf8', bg: 'bg-sky-500/10',     text: 'text-sky-400',     icon: Snowflake,      heLabel: 'קפוא',            enLabel: 'Frozen',      order: 7 },
  complete:   { color: '#34d399', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2,   heLabel: 'הושלם',           enLabel: 'Complete',    order: 8 },
  cancelled:  { color: '#ef4444', bg: 'bg-red-500/10',     text: 'text-red-400',     icon: XCircle,        heLabel: 'בוטל',            enLabel: 'Cancelled',   order: 9 },
};

const WORKFLOW_ORDER: WorkflowStatus[] = ['inbox', 'wishlist', 'todo', 'next', 'inProgress', 'hold', 'stuck', 'freeze', 'complete', 'cancelled'];

// ─── Data ────────────────────────────────────────────────

const routes: RouteEntry[] = [
  {
    id: 'layers', path: '/dashboard/layers', name: 'Layers', nameHe: 'שכבות', icon: Layers,
    phase: 1, status: 'active', version: '0.3.0', addedDate: '2026-02-15',
    descriptionHe: 'רשימת פרויקטים עם ציוני בריאות, סנכרון מ-Origami דרך n8n',
    descriptionEn: 'Projects list with health scores, synced from Origami via n8n',
    components: [
      { id: 'project-card', name: 'ProjectCard', file: 'components/command-center/ProjectCard.tsx', status: 'active', fields: [
        { name: 'name', type: 'text', source: 'supabase:projects.name' },
        { name: 'status', type: 'badge', source: 'supabase:projects.status' },
        { name: 'health_score', type: 'number', source: 'supabase:projects.health_score' },
        { name: 'layer', type: 'tag', source: 'supabase:projects.layer' },
      ]},
      { id: 'health-badge', name: 'HealthBadge', file: 'components/command-center/HealthBadge.tsx', status: 'active' },
      { id: 'page-header', name: 'PageHeader', file: 'components/command-center/PageHeader.tsx', status: 'active' },
    ],
    contexts: ['SettingsContext'], supabaseTables: ['projects'], visible: true, sidebarTab: true,
  },
  {
    id: 'editor', path: '/dashboard/editor', name: 'Editor', nameHe: 'עורך', icon: FileEdit,
    phase: 2, status: 'active', version: '0.5.0', addedDate: '2026-02-20',
    descriptionHe: 'רשימת מסמכים + עורך Canvas עם מערכת שדות',
    descriptionEn: 'Document list + Canvas block editor with field system',
    components: [
      { id: 'document-list', name: 'DocumentList', file: 'app/dashboard/editor/page.tsx (inline)', status: 'active', fields: [
        { name: 'title', type: 'text', source: 'supabase:vb_records.title' },
        { name: 'status', type: 'text', source: 'supabase:vb_records.status' },
        { name: 'last_edited_at', type: 'date', source: 'supabase:vb_records.last_edited_at' },
      ]},
      { id: 'canvas-editor', name: 'CanvasEditor', file: 'components/canvas/CanvasEditor.tsx', status: 'active', fields: [
        { name: 'content', type: 'jsonb', source: 'supabase:vb_records.content' },
        { name: 'record_type', type: 'text', source: 'supabase:vb_records.record_type' },
      ]},
      { id: 'field-library', name: 'FieldLibrary', file: 'components/command-center/fields/FieldLibrary.tsx', status: 'active' },
      { id: 'field-config', name: 'FieldConfigModal', file: 'components/command-center/fields/FieldConfigModal.tsx', status: 'active' },
      { id: 'edit-toolbar', name: 'EditToolbar', file: 'components/command-center/EditToolbar.tsx', status: 'active' },
    ],
    contexts: ['SettingsContext', 'CanvasContext'], supabaseTables: ['vb_records'], visible: true, sidebarTab: true,
  },
  {
    id: 'story-map', path: '/dashboard/story-map', name: 'Story Map', nameHe: 'מפת סיפורים', icon: Map,
    phase: 3, status: 'active', version: '0.4.0', addedDate: '2026-02-28',
    descriptionHe: 'לוח גרור-ושחרר בשלוש שכבות: אפיקים → פיצ׳רים → סיפורים',
    descriptionEn: '3-tier drag-and-drop story map: epics → features → stories',
    components: [
      { id: 'story-board', name: 'StoryBoard', file: 'components/command-center/StoryBoard.tsx', status: 'active' },
      { id: 'story-column', name: 'StoryColumn', file: 'components/command-center/StoryColumn.tsx', status: 'active' },
      { id: 'story-card', name: 'StoryCard', file: 'components/command-center/StoryCard.tsx', status: 'active', fields: [
        { name: 'text', type: 'text', source: 'supabase:story_cards.text' },
        { name: 'type', type: 'enum', source: 'supabase:story_cards.type' },
        { name: 'col', type: 'number', source: 'supabase:story_cards.col' },
        { name: 'row', type: 'number', source: 'supabase:story_cards.row' },
        { name: 'color', type: 'text', source: 'supabase:story_cards.color' },
        { name: 'subs', type: 'jsonb', source: 'supabase:story_cards.subs' },
      ]},
    ],
    contexts: ['SettingsContext'], supabaseTables: ['story_cards'], visible: true, sidebarTab: true,
  },
  {
    id: 'functional-map', path: '/dashboard/functional-map', name: 'Functional Map', nameHe: 'מפה פונקציונלית', icon: Grid3X3,
    phase: 5, status: 'placeholder', version: '0.0.1', addedDate: '2026-02-15',
    descriptionHe: 'רשת נעולה 3×5 — נתונים מ-Notion API. טרם מומש.',
    descriptionEn: 'Static 3×5 locked grid — data from Notion API. Not yet implemented.',
    components: [{ id: 'page-header-fm', name: 'PageHeader', file: 'components/command-center/PageHeader.tsx', status: 'active' }],
    contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'ai-hub', path: '/dashboard/ai-hub', name: 'AI Hub', nameHe: 'מרכז AI', icon: Bot,
    phase: 4, status: 'placeholder', version: '0.0.1', addedDate: '2026-02-15',
    descriptionHe: 'צ׳אט Claude עם מצבים (צ׳אט/ניתוח/כתיבה/פירוק). טרם מומש.',
    descriptionEn: 'Claude API chat with modes (chat/analyze/write/decompose). Not yet implemented.',
    components: [{ id: 'page-header-ai', name: 'PageHeader', file: 'components/command-center/PageHeader.tsx', status: 'active' }],
    contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'design-system', path: '/dashboard/design-system', name: 'Design System', nameHe: 'מערכת עיצוב', icon: Palette,
    phase: 5, status: 'active', version: '0.3.0', addedDate: '2026-03-05',
    descriptionHe: 'גלריית עיצובים עם תצוגה מקדימה, מבוססת registry. 2 עיצובים רשומים.',
    descriptionEn: 'Design gallery with iframe preview, registry-based. 2 designs registered.',
    components: [
      { id: 'design-card', name: 'DesignCard', file: 'app/dashboard/design-system/page.tsx (inline)', status: 'active' },
      { id: 'design-preview', name: 'DesignPreview', file: 'app/dashboard/design-system/page.tsx (inline)', status: 'active' },
    ],
    contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'formily', path: '/dashboard/formily', name: 'Formily', nameHe: 'טפסים', icon: FormInput,
    phase: 5, status: 'placeholder', version: '0.0.1', addedDate: '2026-02-15',
    descriptionHe: 'אינטגרציית טפסי Origami. טרם מומש.',
    descriptionEn: 'Origami native forms integration. Not yet implemented.',
    components: [], contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'architecture', path: '/dashboard/architecture', name: 'Architecture', nameHe: 'ארכיטקטורה', icon: Network,
    phase: 5, status: 'placeholder', version: '0.0.1', addedDate: '2026-02-15',
    descriptionHe: 'ויזואליזציית מפת כלים עם Mermaid מ-Notion. טרם מומש.',
    descriptionEn: 'Tool map visualization with Mermaid from Notion. Not yet implemented.',
    components: [], contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'plan', path: '/dashboard/plan', name: 'Plan', nameHe: 'תוכנית', icon: Calendar,
    phase: 5, status: 'placeholder', version: '0.0.1', addedDate: '2026-02-15',
    descriptionHe: 'תצוגת מפת דרכים מבוססת Notion. טרם מומש.',
    descriptionEn: 'Notion-powered roadmap view. Not yet implemented.',
    components: [], contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'automations', path: '/dashboard/automations', name: 'Automations', nameHe: 'אוטומציות', icon: Zap,
    phase: 1, status: 'active', version: '0.2.0', addedDate: '2026-03-01',
    descriptionHe: 'iframe של n8n + 3 סוגי אוטומציה של Supabase עם דוגמאות קוד',
    descriptionEn: 'n8n iframe + 3 Supabase automation types with code examples',
    components: [{ id: 'page-header-auto', name: 'PageHeader', file: 'components/command-center/PageHeader.tsx', status: 'active' }],
    contexts: ['SettingsContext'], visible: true, sidebarTab: true,
  },
  {
    id: 'settings', path: '/dashboard/settings', name: 'Settings', nameHe: 'הגדרות', icon: Settings,
    phase: 1, status: 'active', version: '0.6.0', addedDate: '2026-02-15',
    descriptionHe: 'צבעי מבטא, גופנים, סקינים, צפיפות, פרופיל מותג, עקיפות סגנון',
    descriptionEn: 'Accent colors, fonts, skins, density, brand profile, style overrides',
    components: [{ id: 'color-picker', name: 'ColorPicker', file: 'components/command-center/ColorPicker.tsx', status: 'active' }],
    contexts: ['SettingsContext', 'StyleOverrideContext'], visible: true, sidebarTab: false,
  },
];

const standalonePages: RouteEntry[] = [
  {
    id: 'gam-landing', path: '/designs/gam-landing', name: 'GAM Landing Page', nameHe: 'דף נחיתה GAM', icon: Globe,
    phase: 5, status: 'active', version: '1.0.0', addedDate: '2026-03-05',
    descriptionHe: 'דף נחיתה עם 5 סקינים, גלאסמורפיזם, סטטיסטיקות, טופס יצירת קשר',
    descriptionEn: '5-skin landing page with glassmorphism, stats, contact form',
    components: [], contexts: [], visible: true, sidebarTab: false,
  },
  {
    id: 'video-prompt', path: '/embeds/video-prompt', name: 'Video Prompt Generator', nameHe: 'מחולל פרומפטים לווידאו', icon: Code2,
    phase: 5, status: 'active', version: '1.0.0', addedDate: '2026-03-06',
    descriptionHe: 'בונה פרומפטים ל-Veo 3 — אווירה, סגנון, מצלמה, העתקה',
    descriptionEn: 'Veo 3 prompt builder — atmosphere, style, camera, copy-to-clipboard',
    components: [], contexts: [], visible: true, sidebarTab: false,
  },
];

const widgets: WidgetEntry[] = [
  { id: 'search', name: 'Search', nameHe: 'חיפוש', file: 'SearchWidget.tsx', defaultSize: '2x', panelMode: 'modal', status: 'active', version: '0.3.0', addedDate: '2026-02-20' },
  { id: 'ai-assistant', name: 'AI Assistant', nameHe: 'עוזר AI', file: 'AIWidget.tsx', defaultSize: '1x', panelMode: 'side-panel', status: 'active', version: '0.4.0', addedDate: '2026-02-22' },
  { id: 'quick-create', name: 'Quick Create', nameHe: 'יצירה מהירה', file: 'QuickCreateWidget.tsx', defaultSize: '2x', panelMode: 'dropdown', status: 'active', version: '0.2.0', addedDate: '2026-02-20' },
  { id: 'favorites', name: 'Favorites', nameHe: 'מועדפים', file: 'FavoritesWidget.tsx', defaultSize: '1x', panelMode: 'dropdown', status: 'active', version: '0.2.0', addedDate: '2026-02-20' },
  { id: 'today', name: 'Today', nameHe: 'היום', file: 'TodayWidget.tsx', defaultSize: '2x', panelMode: 'dropdown', status: 'active', version: '0.2.0', addedDate: '2026-02-20' },
  { id: 'notifications', name: 'Notifications', nameHe: 'התראות', file: 'NotificationsWidget.tsx', defaultSize: '1x', panelMode: 'dropdown', status: 'active', version: '0.2.0', addedDate: '2026-02-20' },
  { id: 'timer', name: 'Timer', nameHe: 'טיימר', file: 'TimerWidget.tsx', defaultSize: '2x', panelMode: 'dropdown', status: 'active', version: '0.2.0', addedDate: '2026-02-20' },
  { id: 'clipboard', name: 'Clipboard', nameHe: 'לוח העתקה', file: 'ClipboardWidget.tsx', defaultSize: '1x', panelMode: 'dropdown', status: 'active', version: '0.2.0', addedDate: '2026-02-20' },
  { id: 'settings', name: 'Settings', nameHe: 'הגדרות', file: 'SettingsWidget.tsx', defaultSize: '1x', panelMode: 'dropdown', status: 'active', version: '0.3.0', addedDate: '2026-02-20' },
  { id: 'keyboard-shortcuts', name: 'Shortcuts', nameHe: 'קיצורים', file: 'ShortcutsWidget.tsx', defaultSize: '1x', panelMode: 'modal', status: 'active', version: '0.3.0', addedDate: '2026-02-25' },
  { id: 'weekly-planner', name: 'Weekly Planner', nameHe: 'מתכנן שבועי', file: 'WeeklyPlannerWidget.tsx', defaultSize: '2x', panelMode: 'modal', status: 'active', version: '0.3.0', addedDate: '2026-02-28' },
];

const contexts: ContextEntry[] = [
  { id: 'settings', name: 'SettingsContext', file: 'contexts/SettingsContext.tsx', storageKeys: ['cc-language', 'cc-sidebar-position', 'cc-sidebar-visibility', 'cc-accent-color', 'cc-font-family', 'cc-border-radius', 'cc-density', 'cc-brand-profile', 'cc-custom-accent-hex', 'cc-saved-colors', 'cc-accent-effect', 'cc-skin'], status: 'active', version: '0.6.0' },
  { id: 'widget', name: 'WidgetContext', file: 'contexts/WidgetContext.tsx', storageKeys: ['cc-widget-positions', 'cc-widget-sizes', 'cc-widget-placements', 'cc-widget-hover-delay', 'cc-folders'], status: 'active', version: '0.4.0' },
  { id: 'style-override', name: 'StyleOverrideContext', file: 'contexts/StyleOverrideContext.tsx', storageKeys: ['cc-style-overrides-personal', 'cc-style-view-mode'], status: 'active', version: '0.2.0' },
  { id: 'dashboard-mode', name: 'DashboardModeContext', file: 'contexts/DashboardModeContext.tsx', storageKeys: [], status: 'active', version: '0.2.0' },
  { id: 'shortcuts', name: 'ShortcutsContext', file: 'contexts/ShortcutsContext.tsx', storageKeys: [], status: 'active', version: '0.3.0' },
  { id: 'weekly-planner', name: 'WeeklyPlannerContext', file: 'contexts/WeeklyPlannerContext.tsx', storageKeys: [], status: 'active', version: '0.3.0' },
  { id: 'canvas', name: 'CanvasContext', file: 'contexts/CanvasContext.tsx', storageKeys: [], status: 'active', version: '0.4.0' },
];

// ─── Changelog Data ─────────────────────────────────────

type FeatureStatus = 'working' | 'not-verified' | 'broken';
type CommitStatus = 'committed' | 'uncommitted';

interface ChangelogEntry {
  id: string;
  feature: string;
  featureHe: string;
  status: FeatureStatus;
  commitStatus: CommitStatus;
  workflowStatus: WorkflowStatus;
  commitHash?: string;
  date: string;
  phase?: Phase;
  files: string[];
  route?: string;
  notes: string;
  notesHe: string;
  purpose: string;
  purposeHe: string;
  connectedTo?: string[];
}

interface DataCcIdEntry {
  ccId: string;
  file: string;
  line: number;
  textEditable: boolean;
  description: string;
  descriptionHe: string;
}

interface GitStatusData {
  branch: string;
  modified: string[];
  untracked: string[];
  commits: { hash: string; message: string }[];
  isDirty: boolean;
}

// ─── Dev Checklist Types & Data ──────────────────────────

type DevChecklistKey = 'guideContent' | 'usageDoc' | 'diagram' | 'aiSourceOfTruth' | 'conflictReview';

interface DevChecklistItem {
  key: DevChecklistKey;
  done: boolean;
  note?: string;
  noteHe?: string;
}

interface DevChecklist {
  items: DevChecklistItem[];
  reviewedBy?: string;
  reviewedDate?: string;
}

const DEV_CHECKLIST_KEYS: { key: DevChecklistKey; icon: React.ElementType }[] = [
  { key: 'guideContent', icon: HelpCircle },
  { key: 'usageDoc', icon: BookOpen },
  { key: 'diagram', icon: Network },
  { key: 'aiSourceOfTruth', icon: Brain },
  { key: 'conflictReview', icon: Shield },
];

function makeChecklist(guide: boolean, usage: boolean, diagram: boolean, aiSot: boolean, conflict: boolean): DevChecklist {
  return {
    items: [
      { key: 'guideContent', done: guide },
      { key: 'usageDoc', done: usage },
      { key: 'diagram', done: diagram },
      { key: 'aiSourceOfTruth', done: aiSot },
      { key: 'conflictReview', done: conflict },
    ],
    reviewedBy: 'claude',
    reviewedDate: '2026-03-06',
  };
}

// Auto-assessed: guideContent=has data-cc-id, usageDoc=has purpose+notes, diagram=has connectedTo,
// aiSourceOfTruth=comprehensive purpose, conflictReview=complete workflow status
const CHANGELOG_CHECKLISTS: Record<string, DevChecklist> = {
  'nextjs-scaffold':         makeChecklist(false, true, false, true, true),
  'dashboard-shell':         makeChecklist(true,  true, true,  true, true),
  'sidebar':                 makeChecklist(true,  true, true,  true, true),
  'topbar-widgets':          makeChecklist(true,  true, true,  true, true),
  'settings-context':        makeChecklist(false, true, true,  true, true),
  'widget-context':          makeChecklist(false, true, true,  true, true),
  'style-override-context':  makeChecklist(false, true, true,  true, true),
  'data-cc-id-system':       makeChecklist(true,  true, true,  true, true),
  'i18n-system':             makeChecklist(false, true, true,  true, true),
  'layers-page':             makeChecklist(true,  true, true,  true, true),
  'settings-page':           makeChecklist(false, true, true,  true, true),
  'search-widget':           makeChecklist(false, true, true,  true, true),
  'ai-widget':               makeChecklist(false, true, true,  true, false),
  'favorites-widget':        makeChecklist(false, true, true,  true, true),
  'timer-widget':            makeChecklist(false, true, true,  true, true),
  'notifications-widget':    makeChecklist(false, true, true,  true, true),
  'shortcuts-context-widget': makeChecklist(false, true, true, true, true),
  'weekly-planner':          makeChecklist(false, true, true,  true, true),
  'other-widgets':           makeChecklist(false, true, true,  true, true),
  'dashboard-mode-context':  makeChecklist(false, true, true,  true, true),
  'placeholder-pages':       makeChecklist(false, true, true,  true, false),
  'context-memoization-fix': makeChecklist(false, true, true,  true, true),
  'tiptap-editor':           makeChecklist(false, true, true,  true, true),
  'tiptap-extensions':       makeChecklist(false, true, true,  true, true),
  'supabase-client':         makeChecklist(false, true, true,  true, true),
  'widget-store':            makeChecklist(false, true, true,  true, true),
  'editor-css-fix':          makeChecklist(false, true, true,  true, true),
  'document-list':           makeChecklist(false, true, true,  true, true),
  'story-map':               makeChecklist(false, true, true,  true, true),
  'canvas-editor':           makeChecklist(false, true, true,  true, true),
  'field-system':            makeChecklist(false, true, true,  true, true),
  'supabase-migrations':     makeChecklist(false, true, true,  true, true),
  'canvas-polish':           makeChecklist(false, true, true,  true, true),
  'automations-page':        makeChecklist(false, true, true,  true, true),
  'workspace-hub':           makeChecklist(false, true, true,  true, false),
  'admin-page':              makeChecklist(false, true, true,  true, false),
  'video-prompt':            makeChecklist(false, true, true,  true, false),
  'sidebar-nav-home':        makeChecklist(false, true, true,  true, false),
  'widget-context-fix':      makeChecklist(false, true, true,  true, false),
  'skins-system':            makeChecklist(false, true, true,  true, false),
  'design-gallery':          makeChecklist(false, true, true,  true, false),
  'i18n-extensions':         makeChecklist(false, true, true,  true, false),
};

function getChecklistScore(checklist?: DevChecklist): { done: number; total: number; pct: number } {
  if (!checklist) return { done: 0, total: 5, pct: 0 };
  const done = checklist.items.filter(i => i.done).length;
  return { done, total: 5, pct: Math.round((done / 5) * 100) };
}

function getOverallChecklistScoreFromEntries(entries: ChangelogEntry[]): { done: number; total: number; pct: number } {
  let done = 0;
  let total = 0;
  for (const entry of entries) {
    const cl = CHANGELOG_CHECKLISTS[entry.id];
    const score = getChecklistScore(cl);
    done += score.done;
    total += score.total;
  }
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

const dataCcIds: DataCcIdEntry[] = [
  { ccId: 'shell.root', file: 'DashboardShell.tsx', line: 105, textEditable: false, description: 'Root container for the dashboard shell', descriptionHe: 'מכולה ראשית של מעטפת הדשבורד' },
  { ccId: 'content.main', file: 'DashboardShell.tsx', line: 145, textEditable: false, description: 'Main content area', descriptionHe: 'אזור תוכן ראשי' },
  { ccId: 'topbar.root', file: 'TopBar.tsx', line: 451, textEditable: false, description: 'Top bar container', descriptionHe: 'מכולת הסרגל העליון' },
  { ccId: 'sidebar.root', file: 'Sidebar.tsx', line: 88, textEditable: false, description: 'Sidebar container', descriptionHe: 'מכולת הסיידבר' },
  { ccId: 'sidebar.header', file: 'Sidebar.tsx', line: 112, textEditable: false, description: 'Sidebar header with logo', descriptionHe: 'כותרת הסיידבר עם לוגו' },
  { ccId: 'sidebar.header.logo', file: 'Sidebar.tsx', line: 117, textEditable: false, description: 'Logo image/icon container', descriptionHe: 'מכולת לוגו/אייקון' },
  { ccId: 'sidebar.header.name', file: 'Sidebar.tsx', line: 137, textEditable: true, description: 'Company/workspace name text', descriptionHe: 'טקסט שם חברה/סביבת עבודה' },
  { ccId: 'sidebar.nav', file: 'Sidebar.tsx', line: 160, textEditable: false, description: 'Navigation links container', descriptionHe: 'מכולת קישורי ניווט' },
  { ccId: 'sidebar.nav.link', file: 'Sidebar.tsx', line: 199, textEditable: false, description: 'Individual nav link', descriptionHe: 'קישור ניווט בודד' },
  { ccId: 'sidebar.nav.link.label', file: 'Sidebar.tsx', line: 203, textEditable: true, description: 'Nav link label text', descriptionHe: 'טקסט תווית קישור ניווט' },
  { ccId: 'sidebar.footer', file: 'Sidebar.tsx', line: 269, textEditable: false, description: 'Sidebar footer section', descriptionHe: 'אזור תחתון של הסיידבר' },
  { ccId: 'sidebar.footer.tagline', file: 'Sidebar.tsx', line: 270, textEditable: true, description: 'Footer tagline text', descriptionHe: 'טקסט סלוגן תחתון' },
  { ccId: 'page.header', file: 'PageHeader.tsx', line: 71, textEditable: false, description: 'Page header container', descriptionHe: 'מכולת כותרת עמוד' },
  { ccId: 'page.header.title', file: 'PageHeader.tsx', line: 73, textEditable: true, description: 'Page title text', descriptionHe: 'טקסט כותרת עמוד' },
  { ccId: 'page.header.description', file: 'PageHeader.tsx', line: 90, textEditable: true, description: 'Page description text', descriptionHe: 'טקסט תיאור עמוד' },
  { ccId: 'card.project', file: 'ProjectCard.tsx', line: 40, textEditable: false, description: 'Project card container', descriptionHe: 'מכולת כרטיס פרויקט' },
  { ccId: 'card.project.name', file: 'ProjectCard.tsx', line: 47, textEditable: true, description: 'Project name text', descriptionHe: 'טקסט שם פרויקט' },
  { ccId: 'card.project.meta', file: 'ProjectCard.tsx', line: 49, textEditable: false, description: 'Project metadata section', descriptionHe: 'אזור מטא-דאטה של פרויקט' },
  { ccId: 'badge.health', file: 'HealthBadge.tsx', line: 54, textEditable: false, description: 'Health score badge', descriptionHe: 'תג ציון בריאות' },
];

const changelogEntries: ChangelogEntry[] = [
  // ── Phase 0: Foundation (013a198 + 7c562f4) ── 2026-02-28 / 2026-03-02

  {
    id: 'nextjs-scaffold',
    feature: 'Next.js 15 project scaffold',
    featureHe: 'הקמת פרויקט Next.js 15',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '013a198',
    date: '2026-02-28',
    files: ['package.json', 'tsconfig.json', 'next.config.ts', 'tailwind.config.ts'],
    notes: 'Initial Create Next App with TypeScript strict, Tailwind CSS, App Router.',
    notesHe: 'הקמה ראשונית של Next.js עם TypeScript strict, Tailwind CSS, App Router.',
    purpose: 'The foundation of the entire system. Next.js 15 App Router gives us file-based routing, server components, and Vercel deployment. Tailwind provides the dark theme utility classes used everywhere.',
    purposeHe: 'הבסיס של כל המערכת. Next.js 15 App Router נותן ניתוב מבוסס קבצים, Server Components ודפלוי ב-Vercel. Tailwind מספק את ה-utility classes לערכת הנושא הכהה.',
  },
  {
    id: 'dashboard-shell',
    feature: 'DashboardShell — main layout wrapper',
    featureHe: 'DashboardShell — מעטפת פריסה ראשית',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/DashboardShell.tsx', 'src/app/dashboard/layout.tsx'],
    route: '/dashboard',
    notes: 'The main wrapper: Sidebar (240px) + TopBar (48px) + scrollable content. Handles sidebar position (left/right), visibility modes (fixed/float/hidden), and responsive mobile menu.',
    notesHe: 'המעטפת הראשית: סיידבר (240px) + סרגל עליון (48px) + אזור תוכן נגלל. מנהל מיקום סיידבר (שמאל/ימין), מצבי נראות (קבוע/צף/מוסתר) ותפריט מובייל.',
    purpose: 'Every dashboard page is rendered inside DashboardShell. It creates the consistent layout — sidebar for navigation, top bar for widgets, content area for the page. Without it, each page would need its own navigation UI.',
    purposeHe: 'כל דף דשבורד מרונדר בתוך DashboardShell. הוא יוצר את הפריסה האחידה — סיידבר לניווט, סרגל עליון לווידג׳טים, אזור תוכן לעמוד. בלעדיו כל דף היה צריך ניווט משלו.',
    connectedTo: ['Sidebar.tsx', 'TopBar.tsx', 'SettingsContext (sidebar position/visibility)'],
  },
  {
    id: 'sidebar',
    feature: 'Sidebar — 11-tab navigation',
    featureHe: 'סיידבר — ניווט 11 לשוניות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/Sidebar.tsx'],
    notes: '11 nav tabs with icons (Lucide). 3 visibility modes: fixed (always visible), float (auto-collapse to 48px strip), hidden (slide out). RTL support flips position and active indicator.',
    notesHe: '11 לשוניות ניווט עם אייקונים (Lucide). 3 מצבי נראות: קבוע, צף (מתכווץ ל-48px), מוסתר (מחליק החוצה). תמיכת RTL הופכת מיקום ומדד פעיל.',
    purpose: 'The primary navigation for the dashboard. Each tab corresponds to a feature area (Layers, Editor, Story Map, etc.). Float mode saves screen space for content-heavy pages. Links to / (Workspace Hub) via the logo.',
    purposeHe: 'הניווט הראשי של הדשבורד. כל לשונית מתאימה לאזור פיצ׳ר (שכבות, עורך, מפת סיפורים וכו׳). מצב צף חוסך מקום מסך לעמודים עתירי תוכן. קישור ל-/ (מרכז סביבת העבודה) דרך הלוגו.',
    connectedTo: ['DashboardShell.tsx', 'SettingsContext (position, visibility)', 'i18n.ts (tab labels)'],
  },
  {
    id: 'topbar-widgets',
    feature: 'TopBar — drag-to-place widget grid',
    featureHe: 'סרגל עליון — רשת ווידג׳טים נגררת',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/TopBar.tsx', 'src/components/command-center/widgets/WidgetWrapper.tsx', 'src/components/command-center/widgets/WidgetRegistry.ts'],
    notes: '48px fixed bar divided into 48px grid columns. Widgets snap to grid, can be resized (1x-4x), dragged to reorder. Uses @dnd-kit. Purple/red highlights for valid/invalid drop targets.',
    notesHe: 'סרגל 48px קבוע מחולק לעמודות רשת של 48px. ווידג׳טים נצמדים לרשת, ניתנים לשינוי גודל (1x-4x), גרירה לסידור מחדש. משתמש ב-@dnd-kit. הדגשה סגולה/אדומה ליעדי הנחה.',
    purpose: 'Quick access to tools without leaving the current page. Search, AI assistant, timer, notifications — all available from any dashboard page. The drag system lets users customize their workflow layout.',
    purposeHe: 'גישה מהירה לכלים בלי לעזוב את הדף הנוכחי. חיפוש, עוזר AI, טיימר, התראות — הכל זמין מכל דף דשבורד. מערכת הגרירה מאפשרת למשתמשים להתאים את פריסת העבודה.',
    connectedTo: ['WidgetContext (positions, sizes)', 'WidgetRegistry.ts (widget definitions)', 'All widget components'],
  },
  {
    id: 'settings-context',
    feature: 'SettingsContext — centralized preferences',
    featureHe: 'SettingsContext — מרכז העדפות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/contexts/SettingsContext.tsx'],
    notes: 'Manages: language (he/en), sidebar position (left/right), visibility mode, accent color (7 presets + custom hex), font family, border radius, density, brand profile (logo, tagline), glow effects, skin presets. All persisted in localStorage (cc-* keys).',
    notesHe: 'מנהל: שפה (he/en), מיקום סיידבר (שמאל/ימין), מצב נראות, צבע מבטא (7 פריסטים + hex מותאם), משפחת גופנים, רדיוס גבול, צפיפות, פרופיל מותג (לוגו, סלוגן), אפקטי זוהר, פריסטי סקינים. נשמר ב-localStorage (מפתחות cc-*).',
    purpose: 'The single source of truth for all user preferences. Every component that needs to know the language, accent color, or sidebar position reads from this context. Without it, preferences would be scattered across localStorage reads.',
    purposeHe: 'מקור האמת היחיד לכל העדפות המשתמש. כל קומפוננטה שצריכה לדעת שפה, צבע מבטא או מיקום סיידבר קוראת מהקונטקסט הזה. בלעדיו ההעדפות היו מפוזרות בקריאות localStorage.',
    connectedTo: ['Every dashboard page', 'Sidebar.tsx', 'Settings page', 'i18n.ts'],
  },
  {
    id: 'widget-context',
    feature: 'WidgetContext — widget state management',
    featureHe: 'WidgetContext — ניהול מצב ווידג׳טים',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/contexts/WidgetContext.tsx'],
    notes: 'Stores widget positions (grid column), sizes (1x-4x), placements (toolbar/apps/disabled), hover delay, folder state. Persisted in localStorage. Used by TopBar for layout calculations.',
    notesHe: 'שומר מיקומי ווידג׳טים (עמודת רשת), גדלים (1x-4x), מיקומים (סרגל/אפליקציות/מושבת), השהיית ריחוף, מצב תיקיות. נשמר ב-localStorage. משמש את TopBar לחישובי פריסה.',
    purpose: 'Separates widget layout state from widget behavior. TopBar reads positions to render widgets in order. WidgetStore reads placements to show toolbar vs apps drawer. Each widget reads its own size/delay.',
    purposeHe: 'מפריד מצב פריסת ווידג׳טים מהתנהגות ווידג׳טים. TopBar קורא מיקומים לרינדור בסדר. WidgetStore קורא מיקומים להצגת סרגל מול מגירת אפליקציות. כל ווידג׳ט קורא את הגודל/השהייה שלו.',
    connectedTo: ['TopBar.tsx', 'WidgetWrapper.tsx', 'WidgetStore.tsx'],
  },
  {
    id: 'style-override-context',
    feature: 'StyleOverrideContext — dynamic CSS via data-cc-id',
    featureHe: 'StyleOverrideContext — CSS דינמי דרך data-cc-id',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/contexts/StyleOverrideContext.tsx'],
    notes: 'Injects a <style> tag with CSS rules targeting [data-cc-id] attributes. Users can override any element\'s style from Settings. Also supports text overrides for [data-cc-text="true"] elements.',
    notesHe: 'מזריק תג <style> עם כללי CSS שמכוונים לאטריביוטי [data-cc-id]. משתמשים יכולים לעקוף סגנון של כל אלמנט מההגדרות. תומך גם בעקיפות טקסט לאלמנטי [data-cc-text="true"].',
    purpose: 'Allows per-element visual customization without touching code. A user can change the sidebar background color, page header font size, or project card border — all from the Settings page. This is the backbone of the "white-label" capability.',
    purposeHe: 'מאפשר התאמה חזותית לכל אלמנט בלי לגעת בקוד. משתמש יכול לשנות צבע רקע סיידבר, גודל גופן כותרת עמוד, או גבול כרטיס פרויקט — הכל מדף ההגדרות. זה עמוד השדרה של יכולת ה-"white-label".',
    connectedTo: ['Settings page (override editor)', 'data-cc-id attributes on 19 elements', '7 component files'],
  },
  {
    id: 'data-cc-id-system',
    feature: 'data-cc-id attribute system',
    featureHe: 'מערכת מזהי data-cc-id',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/Sidebar.tsx', 'src/components/command-center/PageHeader.tsx', 'src/components/command-center/DashboardShell.tsx', 'src/components/command-center/TopBar.tsx', 'src/components/command-center/ProjectCard.tsx', 'src/components/command-center/HealthBadge.tsx'],
    notes: '19 unique IDs across 7 files. IDs like sidebar.root, page.header.title, card.project.name. data-cc-text="true" marks 6 elements as text-editable.',
    notesHe: '19 מזהים ייחודיים ב-7 קבצים. מזהים כמו sidebar.root, page.header.title, card.project.name. ל-data-cc-text="true" מסמן 6 אלמנטים כניתנים לעריכת טקסט.',
    purpose: 'These are the "hooks" that StyleOverrideContext targets. Each ID is a stable identifier for a UI element. Example: data-cc-id="sidebar.header.name" lets you override the company name styling. data-cc-text="true" lets you override the text content itself (e.g., change "GAM" to "My Company").',
    purposeHe: 'אלה ה-"hooks" שאליהם StyleOverrideContext מכוון. כל מזהה הוא זיהוי יציב של אלמנט ממשק. דוגמה: data-cc-id="sidebar.header.name" מאפשר לעקוף את עיצוב שם החברה. data-cc-text="true" מאפשר לעקוף את תוכן הטקסט עצמו (למשל, לשנות "GAM" ל-"החברה שלי").',
    connectedTo: ['StyleOverrideContext.tsx', 'Settings page → Style Overrides section'],
  },
  {
    id: 'i18n-system',
    feature: 'i18n translation system (Hebrew + English)',
    featureHe: 'מערכת תרגום i18n (עברית + אנגלית)',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/lib/i18n.ts'],
    notes: 'Complete Hebrew/English translations for all UI text. ~1100 lines. Tab names, page descriptions, widget labels, error messages, button text. getTranslations(language) returns the correct set.',
    notesHe: 'תרגומים מלאים לעברית/אנגלית לכל טקסט ממשק. ~1100 שורות. שמות לשוניות, תיאורי דפים, תוויות ווידג׳טים, הודעות שגיאה, טקסט כפתורים. getTranslations(language) מחזיר את הסט הנכון.',
    purpose: 'GAM is an Israeli company — Hebrew RTL is the primary UI language. But the codebase and external collaborators work in English. The i18n system lets the entire UI switch between Hebrew and English with one click.',
    purposeHe: 'GAM היא חברה ישראלית — עברית RTL היא שפת הממשק הראשית. אבל קוד הבסיס ושותפים חיצוניים עובדים באנגלית. מערכת ה-i18n מאפשרת לכל הממשק להחליף בין עברית לאנגלית בלחיצה אחת.',
    connectedTo: ['SettingsContext (language)', 'Every page and widget', 'Settings widget (language toggle)'],
  },
  {
    id: 'layers-page',
    feature: 'Layers page — project list with health scores',
    featureHe: 'דף שכבות — רשימת פרויקטים עם ציוני בריאות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/app/dashboard/layers/page.tsx', 'src/components/command-center/ProjectCard.tsx', 'src/components/command-center/HealthBadge.tsx'],
    route: '/dashboard/layers',
    notes: 'Projects list from Supabase (projects table). Health scores 0-100 with color badges (green/yellow/red). Falls back to demo data when Supabase is unavailable.',
    notesHe: 'רשימת פרויקטים מ-Supabase (טבלת projects). ציוני בריאות 0-100 עם תגי צבע (ירוק/צהוב/אדום). נופל לנתוני הדגמה כש-Supabase לא זמין.',
    purpose: 'The main operational view. GAM manages multiple construction projects — this page gives an at-a-glance view of project health. The health score will be calculated from Origami CRM data synced via n8n. It answers: "Which projects need attention right now?"',
    purposeHe: 'התצוגה התפעולית הראשית. GAM מנהלת פרויקטי בנייה מרובים — דף זה נותן תמונת מצב מהירה של בריאות הפרויקט. ציון הבריאות יחושב מנתוני Origami CRM שמסונכרנים דרך n8n. הוא עונה: "אילו פרויקטים דורשים תשומת לב עכשיו?"',
    connectedTo: ['Supabase projects table', 'n8n (future sync from Origami)', 'PageHeader (pin to favorites)'],
  },
  {
    id: 'settings-page',
    feature: 'Settings page — full customization hub',
    featureHe: 'דף הגדרות — מרכז התאמה אישית מלא',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/app/dashboard/settings/page.tsx', 'src/components/command-center/ColorPicker.tsx'],
    route: '/dashboard/settings',
    notes: '815 lines. Sections: Accent colors (7 presets + custom hex + saved palette), font family, border radius, density, sidebar position/visibility, brand profile (logo upload, company name, tagline), glow effects, skin presets, style overrides editor.',
    notesHe: '815 שורות. מקטעים: צבעי מבטא (7 פריסטים + hex מותאם + לוח שמור), משפחת גופנים, רדיוס גבול, צפיפות, מיקום/נראות סיידבר, פרופיל מותג (העלאת לוגו, שם חברה, סלוגן), אפקטי זוהר, פריסטי סקינים, עורך עקיפות סגנון.',
    purpose: 'The control center for visual identity. GAM needs the dashboard to feel "theirs" — brand colors, logo, company name. The style override system (via data-cc-id) lets them fine-tune any element. This is also where future clients would customize their own dashboard instance.',
    purposeHe: 'מרכז הבקרה לזהות חזותית. GAM צריכים שהדשבורד ירגיש "שלהם" — צבעי מותג, לוגו, שם חברה. מערכת עקיפות הסגנון (דרך data-cc-id) מאפשרת לכוונן כל אלמנט. זה גם המקום שבו לקוחות עתידיים יתאימו את מופע הדשבורד שלהם.',
    connectedTo: ['SettingsContext (all preferences)', 'StyleOverrideContext (overrides)', 'data-cc-id system', 'ColorPicker component'],
  },
  {
    id: 'search-widget',
    feature: 'Search widget — Cmd+K spotlight',
    featureHe: 'ווידג׳ט חיפוש — ספוטלייט Cmd+K',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/SearchWidget.tsx'],
    notes: 'Modal search (Cmd+K). Searches projects, documents, and AI conversations from Supabase. Recent searches. Quick actions (new project, new document, new task).',
    notesHe: 'חיפוש מודאלי (Cmd+K). מחפש פרויקטים, מסמכים ושיחות AI מ-Supabase. חיפושים אחרונים. פעולות מהירות (פרויקט חדש, מסמך חדש, משימה חדשה).',
    purpose: 'Fast navigation without clicking through menus. Like Notion\'s Quick Find or VS Code\'s Cmd+P. Wired to Supabase so it searches real data, not just page routes.',
    purposeHe: 'ניווט מהיר בלי ללחוץ דרך תפריטים. כמו Quick Find של Notion או Cmd+P של VS Code. מחובר ל-Supabase כך שמחפש נתונים אמיתיים, לא רק נתיבי דפים.',
    connectedTo: ['Supabase (projects, vb_records, ai_conversations)', 'TopBar.tsx (renders in toolbar)'],
  },
  {
    id: 'ai-widget',
    feature: 'AI Assistant widget — Claude chat panel',
    featureHe: 'ווידג׳ט עוזר AI — פאנל צ׳אט Claude',
    status: 'not-verified',
    commitStatus: 'committed',
    workflowStatus: 'hold',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/AIWidget.tsx'],
    notes: '3 view modes: side-panel (full height, opposite side of sidebar), dropdown, floating bubble. Page context injection. Suggestion chips. No Claude API key configured yet — UI works but API calls will fail.',
    notesHe: '3 מצבי תצוגה: פאנל צד (גובה מלא, צד הפוך מהסיידבר), תפריט נפתח, בועה צפה. הזרקת הקשר עמוד. צ׳יפים של הצעות. אין מפתח API של Claude מוגדר עדיין — הממשק עובד אבל קריאות API ייכשלו.',
    purpose: 'Quick AI assistance without leaving the dashboard. Will eventually be able to: summarize projects, analyze health scores, draft documents, decompose stories. The side-panel mode is designed to coexist with the main content.',
    purposeHe: 'עזרת AI מהירה בלי לעזוב את הדשבורד. בסופו של דבר יוכל: לסכם פרויקטים, לנתח ציוני בריאות, לנסח מסמכים, לפרק סיפורים. מצב הפאנל הצדי מעוצב לדו-קיום עם התוכן הראשי.',
    connectedTo: ['TopBar.tsx', 'DashboardShell (panel positioning)', 'Future: Claude API'],
  },
  {
    id: 'favorites-widget',
    feature: 'Favorites widget — pinned pages',
    featureHe: 'ווידג׳ט מועדפים — דפים מוצמדים',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/FavoritesWidget.tsx', 'src/components/command-center/PageHeader.tsx'],
    notes: 'Pin any page via the pin icon in PageHeader. Favorites stored in localStorage. Drag to reorder. Quick access from top bar.',
    notesHe: 'הצמדת כל דף דרך אייקון ההצמדה ב-PageHeader. מועדפים נשמרים ב-localStorage. גרירה לסידור מחדש. גישה מהירה מהסרגל העליון.',
    purpose: 'Personalized navigation. If you mainly use Layers and Story Map, pin them for one-click access. The PageHeader pin button makes it discoverable from every page.',
    purposeHe: 'ניווט מותאם אישית. אם בעיקר משתמשים בשכבות ומפת סיפורים, הצמידו אותם לגישה בלחיצה. כפתור ההצמדה ב-PageHeader הופך את זה לגלוי מכל דף.',
    connectedTo: ['PageHeader.tsx (pin toggle)', 'localStorage (cc-favorites)'],
  },
  {
    id: 'timer-widget',
    feature: 'Timer widget — Pomodoro',
    featureHe: 'ווידג׳ט טיימר — פומודורו',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/TimerWidget.tsx'],
    notes: 'Pomodoro timer with circular SVG progress. Work/Break/Long Break modes. Session counter. Audio notification. State persists via custom event timer-state-change.',
    notesHe: 'טיימר פומודורו עם התקדמות SVG מעגלי. מצבי עבודה/הפסקה/הפסקה ארוכה. מונה סשנים. התראה קולית. מצב נשמר דרך אירוע מותאם timer-state-change.',
    purpose: 'Time management directly in the dashboard. GAM team uses focused work sessions — the Pomodoro technique helps maintain productivity without switching to an external timer app.',
    purposeHe: 'ניהול זמן ישירות בדשבורד. צוות GAM משתמש בסשני עבודה ממוקדים — טכניקת הפומודורו עוזרת לשמור על פרודוקטיביות בלי לעבור לאפליקציית טיימר חיצונית.',
    connectedTo: ['TopBar.tsx', 'Custom event: timer-state-change'],
  },
  {
    id: 'notifications-widget',
    feature: 'Notifications widget',
    featureHe: 'ווידג׳ט התראות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/NotificationsWidget.tsx'],
    notes: 'Notification list with read/unread state. Red dot badge on icon. Mark all as read. Currently no real data source — placeholder for Supabase Realtime notifications.',
    notesHe: 'רשימת התראות עם מצב נקרא/לא נקרא. נקודה אדומה על האייקון. סמן הכל כנקרא. כרגע אין מקור נתונים אמיתי — placeholder להתראות Supabase Realtime.',
    purpose: 'Will surface system events: project health drops, new documents shared, automation failures, team mentions. The badge creates urgency without being intrusive.',
    purposeHe: 'יציף אירועי מערכת: ירידת בריאות פרויקט, מסמכים חדשים ששותפו, כשלי אוטומציה, אזכורי צוות. התג יוצר דחיפות בלי להיות פולשני.',
    connectedTo: ['TopBar.tsx', 'Future: Supabase Realtime', 'Custom event: notifications-change'],
  },
  {
    id: 'shortcuts-context-widget',
    feature: 'Keyboard Shortcuts system',
    featureHe: 'מערכת קיצורי מקלדת',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/contexts/ShortcutsContext.tsx', 'src/components/command-center/widgets/ShortcutsWidget.tsx', 'src/lib/shortcuts/shortcutEngine.ts', 'src/lib/shortcuts/shortcutRegistry.ts'],
    notes: 'Extensible shortcut engine with action registry. Built-in shortcuts for search (Cmd+K), new document (Cmd+N), etc. Custom shortcuts with scope (global/editor/table). ShortcutsWidget shows all shortcuts, allows editing.',
    notesHe: 'מנוע קיצורים ניתן להרחבה עם רישום פעולות. קיצורים מובנים לחיפוש (Cmd+K), מסמך חדש (Cmd+N) וכו׳. קיצורים מותאמים עם תחום (גלובלי/עורך/טבלה). ווידג׳ט קיצורים מציג את כולם, מאפשר עריכה.',
    purpose: 'Power-user productivity. Instead of clicking through menus, keyboard shortcuts let experienced users work faster. The registry pattern means new pages can register their own shortcuts.',
    purposeHe: 'פרודוקטיביות למשתמשי כוח. במקום ללחוץ דרך תפריטים, קיצורי מקלדת מאפשרים למשתמשים מנוסים לעבוד מהר יותר. דפוס הרישום מאפשר לדפים חדשים לרשום קיצורים משלהם.',
    connectedTo: ['ShortcutsContext (global listener)', 'ShortcutsWidget (UI)', 'SearchWidget (Cmd+K)'],
  },
  {
    id: 'weekly-planner',
    feature: 'Weekly Planner widget',
    featureHe: 'ווידג׳ט מתכנן שבועי',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/WeeklyPlannerWidget.tsx', 'src/contexts/WeeklyPlannerContext.tsx', 'src/lib/weeklyPlanner/types.ts', 'src/lib/weeklyPlanner/utils.ts'],
    notes: 'Calendar-based planner. Daily tasks with checkboxes. Recurring templates (morning routine, weekly review). Move-to-tomorrow. Team view. Urgent markers. Personal/Team filter.',
    notesHe: 'מתכנן מבוסס לוח שנה. משימות יומיות עם תיבות סימון. תבניות חוזרות (שגרת בוקר, סיכום שבועי). העבר למחר. תצוגת צוות. סימוני דחיפות. מסנן אישי/צוות.',
    purpose: 'GAM team needs daily structure. This gives a bird\'s-eye view of the week — what\'s done, what\'s pending, what\'s urgent. Templates reduce repetitive planning (e.g., "every Monday: team standup, review tickets").',
    purposeHe: 'צוות GAM צריך מבנה יומי. זה נותן תצוגה מלמעלה של השבוע — מה בוצע, מה ממתין, מה דחוף. תבניות מפחיתות תכנון חוזר (למשל, "כל יום שני: סטנדאפ צוות, סקירת טיקטים").',
    connectedTo: ['WeeklyPlannerContext (state)', 'TopBar.tsx (2x modal widget)'],
  },
  {
    id: 'other-widgets',
    feature: 'Quick Create, Today, Clipboard, Settings widgets',
    featureHe: 'ווידג׳טים: יצירה מהירה, היום, לוח הדבקות, הגדרות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/components/command-center/widgets/QuickCreateWidget.tsx', 'src/components/command-center/widgets/TodayWidget.tsx', 'src/components/command-center/widgets/ClipboardWidget.tsx', 'src/components/command-center/widgets/SettingsWidget.tsx'],
    notes: 'Quick Create: Create document/project/task from anywhere. Today: meetings + deadlines + reminders. Clipboard: copy history within dashboard. Settings: language + sidebar controls.',
    notesHe: 'יצירה מהירה: צור מסמך/פרויקט/משימה מכל מקום. היום: פגישות + דדליינים + תזכורות. לוח הדבקות: היסטוריית העתקות בדשבורד. הגדרות: שפה + בקרות סיידבר.',
    purpose: 'Reduce friction for common actions. Quick Create eliminates navigation to create something. Today surfaces time-sensitive items. Clipboard prevents losing copied text. Settings widget is the quick-access version of the full settings page.',
    purposeHe: 'הפחתת חיכוך לפעולות נפוצות. יצירה מהירה מבטלת ניווט ליצירת משהו. היום מעלה פריטים תלויי-זמן. לוח הדבקות מונע אובדן טקסט שהועתק. ווידג׳ט הגדרות הוא גרסת הגישה המהירה של דף ההגדרות המלא.',
    connectedTo: ['TopBar.tsx', 'SettingsContext', 'Supabase (future data)'],
  },
  {
    id: 'dashboard-mode-context',
    feature: 'DashboardModeContext — edit/guide modes',
    featureHe: 'DashboardModeContext — מצבי עריכה/מדריך',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 1,
    files: ['src/contexts/DashboardModeContext.tsx', 'src/components/command-center/GuideOverlay.tsx'],
    notes: 'Toggle between normal, edit, and guide modes. Edit mode enables widget dragging and configuration. Guide mode shows tutorial overlays explaining each feature.',
    notesHe: 'מעבר בין מצב רגיל, עריכה ומדריך. מצב עריכה מאפשר גרירת ווידג׳טים והגדרה. מצב מדריך מציג שכבות-על של מדריך המסבירות כל פיצ׳ר.',
    purpose: 'Edit mode prevents accidental widget rearrangement during normal use. Guide mode helps new users understand the dashboard — especially useful for GAM team onboarding.',
    purposeHe: 'מצב עריכה מונע סידור מחדש בטעות של ווידג׳טים בשימוש רגיל. מצב מדריך עוזר למשתמשים חדשים להבין את הדשבורד — שימושי במיוחד לקליטת צוות GAM.',
    connectedTo: ['TopBar.tsx (edit mode toggle)', 'GuideOverlay.tsx'],
  },
  {
    id: 'placeholder-pages',
    feature: '6 placeholder pages (Functional Map, AI Hub, Formily, Architecture, Plan, Design System)',
    featureHe: '6 דפים ריקים (מפה פונקציונלית, מרכז AI, טפסים, ארכיטקטורה, תוכנית, מערכת עיצוב)',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'todo',
    commitHash: '7c562f4',
    date: '2026-03-02',
    phase: 5,
    files: ['src/app/dashboard/functional-map/page.tsx', 'src/app/dashboard/ai-hub/page.tsx', 'src/app/dashboard/formily/page.tsx', 'src/app/dashboard/architecture/page.tsx', 'src/app/dashboard/plan/page.tsx', 'src/app/dashboard/design-system/page.tsx'],
    notes: 'Each has PageHeader with title/description. No functional content yet — reserved routes for Phase 4-5 features.',
    notesHe: 'לכל אחד PageHeader עם כותרת/תיאור. אין תוכן פונקציונלי עדיין — נתיבים שמורים לפיצ׳רים של שלב 4-5.',
    purpose: 'All 11 tabs appear in the sidebar from day one. This prevents routing confusion and shows the full product vision. Users can see what\'s coming even before it\'s built.',
    purposeHe: 'כל 11 הלשוניות מופיעות בסיידבר מיום ראשון. זה מונע בלבול ניתוב ומראה את חזון המוצר המלא. משתמשים יכולים לראות מה בדרך גם לפני שנבנה.',
    connectedTo: ['Sidebar.tsx (tab routes)', 'PageHeader.tsx'],
  },

  // ── Fix: Context Memoization (2f3e2b4) ── 2026-03-02

  {
    id: 'context-memoization-fix',
    feature: 'Fix: Context Provider memoization (React #310)',
    featureHe: 'תיקון: מימואיזציית Provider של Context (React #310)',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '2f3e2b4',
    date: '2026-03-02',
    files: ['src/contexts/SettingsContext.tsx', 'src/contexts/WidgetContext.tsx', 'src/contexts/DashboardModeContext.tsx', 'src/contexts/WeeklyPlannerContext.tsx'],
    notes: 'Added useMemo to Provider values in all 4 contexts. Without this, every render created new object references, causing all consumers to re-render. Fixed "Too many re-renders" error.',
    notesHe: 'הוספת useMemo לערכי Provider בכל 4 הקונטקסטים. בלי זה, כל רינדור יצר הפניות אובייקט חדשות, וגרם לכל הצרכנים לרנדר מחדש. תיקון שגיאת "Too many re-renders".',
    purpose: 'Critical performance fix. Without memoization, changing ANY state in a context would re-render EVERY component that reads from it — causing a cascade of re-renders that crashed the app.',
    purposeHe: 'תיקון ביצועים קריטי. בלי מימואיזציה, שינוי של כל state בקונטקסט היה מרנדר מחדש כל קומפוננטה שקוראת ממנו — גורם למפל של רינדורים מחדש שהקריס את האפליקציה.',
    connectedTo: ['All 4 context files', 'Every component using useSettings/useWidget/etc.'],
  },

  // ── Phase 2: Tiptap Editor (4ed4482 + 32d63ca + 662b1ef) ── 2026-03-02

  {
    id: 'tiptap-editor',
    feature: 'Tiptap block editor — 18 block types, 9 extensions',
    featureHe: 'עורך בלוקים Tiptap — 18 סוגי בלוק, 9 הרחבות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '4ed4482',
    date: '2026-03-02',
    phase: 2,
    files: ['src/components/editor/TiptapEditor.tsx', 'src/components/editor/FloatingToolbar.tsx', 'src/components/editor/BlockHandle.tsx', 'src/components/editor/SlashCommandMenu.tsx', 'src/components/editor/ColorMenu.tsx', 'styles/editor.css'],
    route: '/dashboard/editor',
    notes: '18 block types: headings, paragraphs, lists (bullet/numbered/task), code blocks, tables, images, files, embeds (YouTube/Vimeo), callouts, toggles, field blocks. 9 custom Tiptap extensions. Slash commands (/), floating toolbar, block handles, auto-save with 1s debounce.',
    notesHe: '18 סוגי בלוק: כותרות, פסקאות, רשימות (תבליט/ממוספרות/משימות), בלוקי קוד, טבלאות, תמונות, קבצים, הטמעות (YouTube/Vimeo), הדגשות, מתגים, בלוקי שדות. 9 הרחבות Tiptap מותאמות. פקודות סלאש (/), סרגל כלים צף, ידיות בלוק, שמירה אוטומטית עם דיבאונס 1 שנייה.',
    purpose: 'GAM documents everything — contracts, procedures, project specs, meeting notes. This editor replaces Google Docs/Notion with an in-house solution. The slash command system makes it fast to create structured documents. Auto-save means no lost work.',
    purposeHe: 'GAM מתעדת הכל — חוזים, נהלים, מפרטי פרויקט, סיכומי פגישות. העורך הזה מחליף Google Docs/Notion בפתרון פנימי. מערכת פקודות הסלאש הופכת את יצירת מסמכים מובנים למהירה. שמירה אוטומטית פירושה אין עבודה אבודה.',
    connectedTo: ['Supabase vb_records table', 'CanvasEditor (field integration)', 'editor.css (861 lines of styling)'],
  },
  {
    id: 'tiptap-extensions',
    feature: '9 custom Tiptap extensions',
    featureHe: '9 הרחבות Tiptap מותאמות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '4ed4482',
    date: '2026-03-02',
    phase: 2,
    files: ['src/components/editor/extensions/ImageBlock.ts', 'src/components/editor/extensions/FileBlock.ts', 'src/components/editor/extensions/EmbedBlock.ts', 'src/components/editor/extensions/CalloutBlock.ts', 'src/components/editor/extensions/CodeBlockGam.ts', 'src/components/editor/extensions/Toggle.ts', 'src/components/editor/extensions/FieldBlock.ts', 'src/components/editor/extensions/TableSetup.ts', 'src/components/editor/extensions/SlashCommands.ts'],
    notes: 'ImageBlock (upload+resize), FileBlock (upload+download), EmbedBlock (iframes), CalloutBlock (icon+color), CodeBlockGam (language selection), Toggle (collapsible), FieldBlock (canvas integration), TableSetup (full tables), SlashCommands (/ command menu).',
    notesHe: 'ImageBlock (העלאה+שינוי גודל), FileBlock (העלאה+הורדה), EmbedBlock (iframes), CalloutBlock (אייקון+צבע), CodeBlockGam (בחירת שפה), Toggle (מתכווץ), FieldBlock (אינטגרציית canvas), TableSetup (טבלאות מלאות), SlashCommands (תפריט פקודות /).',
    purpose: 'Each extension adds a specific capability that GAM needs. CalloutBlock: highlight warnings in procedures. Toggle: hide details in long docs. FieldBlock: connect documents to the Canvas form system. Tables: structured data in documents.',
    purposeHe: 'כל הרחבה מוסיפה יכולת ספציפית ש-GAM צריכה. CalloutBlock: הדגשת אזהרות בנהלים. Toggle: הסתרת פרטים במסמכים ארוכים. FieldBlock: חיבור מסמכים למערכת טפסי Canvas. טבלאות: נתונים מובנים במסמכים.',
    connectedTo: ['TiptapEditor.tsx (registers extensions)', 'SlashCommandMenu.tsx (adds to / menu)'],
  },
  {
    id: 'supabase-client',
    feature: 'Supabase client setup',
    featureHe: 'הקמת לקוח Supabase',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '4ed4482',
    date: '2026-03-02',
    phase: 2,
    files: ['src/lib/supabaseClient.ts'],
    notes: 'Supabase JS client initialization with anon key. Used by all query functions.',
    notesHe: 'אתחול לקוח Supabase JS עם מפתח anon. משמש את כל פונקציות השאילתות.',
    purpose: 'The connection to our database. Every read/write to projects, documents, story cards, and field definitions goes through this client. Supabase provides the API layer so we don\'t need custom backend endpoints.',
    purposeHe: 'החיבור לבסיס הנתונים שלנו. כל קריאה/כתיבה לפרויקטים, מסמכים, כרטיסי סיפור והגדרות שדות עוברת דרך הלקוח הזה. Supabase מספק את שכבת ה-API כך שלא צריך endpoints backend מותאמים.',
    connectedTo: ['All query files', 'SearchWidget', 'Layers page', 'Editor page', 'Story Map'],
  },
  {
    id: 'widget-store',
    feature: 'Widget Store — install/uninstall/configure',
    featureHe: 'חנות ווידג׳טים — התקנה/הסרה/הגדרה',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '4ed4482',
    date: '2026-03-02',
    phase: 2,
    files: ['src/components/command-center/widgets/WidgetStore.tsx', 'src/components/command-center/widgets/AppsDrawer.tsx'],
    notes: '932-line widget management system. Tabs: Installed, Available, Coming Soon. Widget placement: Toolbar (top bar), Apps (drawer), Disabled. Search, detail view, categories.',
    notesHe: 'מערכת ניהול ווידג׳טים של 932 שורות. לשוניות: מותקנים, זמינים, בקרוב. מיקום ווידג׳ט: סרגל (סרגל עליון), אפליקציות (מגירה), מושבת. חיפוש, תצוגת פרטים, קטגוריות.',
    purpose: 'Users should control which widgets they see. Not everyone needs the Timer or Weekly Planner in the top bar. The Apps Drawer is a secondary location for widgets you use less frequently.',
    purposeHe: 'משתמשים צריכים לשלוט באילו ווידג׳טים הם רואים. לא כולם צריכים את הטיימר או המתכנן השבועי בסרגל העליון. מגירת האפליקציות היא מיקום משני לווידג׳טים שמשתמשים בהם פחות.',
    connectedTo: ['WidgetContext (placements)', 'TopBar.tsx', 'AppsDrawer.tsx', 'WidgetRegistry.ts'],
  },
  {
    id: 'editor-css-fix',
    feature: 'Fix: editor.css import + TiptapEditor update',
    featureHe: 'תיקון: ייבוא editor.css + עדכון TiptapEditor',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '32d63ca',
    date: '2026-03-02',
    phase: 2,
    files: ['styles/editor.css', 'src/components/editor/TiptapEditor.tsx'],
    notes: 'Fixed missing CSS import that caused unstyled editor blocks. Updated TiptapEditor component.',
    notesHe: 'תוקן ייבוא CSS חסר שגרם לבלוקי עורך ללא עיצוב. עודכנה קומפוננטת TiptapEditor.',
    purpose: 'Bug fix — the editor worked but looked broken without its 861 lines of custom CSS (block spacing, code highlighting, table borders, placeholder text, etc.).',
    purposeHe: 'תיקון באג — העורך עבד אבל נראה שבור בלי 861 שורות ה-CSS המותאם שלו (מרווחי בלוקים, הדגשת קוד, גבולות טבלה, טקסט placeholder וכו׳).',
    connectedTo: ['TiptapEditor.tsx', 'All editor block extensions'],
  },
  {
    id: 'document-list',
    feature: 'Editor document list page',
    featureHe: 'דף רשימת מסמכים בעורך',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '662b1ef',
    date: '2026-03-02',
    phase: 2,
    files: ['src/app/dashboard/editor/page.tsx'],
    route: '/dashboard/editor',
    notes: 'Document list from Supabase (vb_records table). Create new document, filtering, sorting, status indicators, last-edited tracking, navigation to document editor.',
    notesHe: 'רשימת מסמכים מ-Supabase (טבלת vb_records). יצירת מסמך חדש, סינון, מיון, מחווני סטטוס, מעקב עריכה אחרונה, ניווט לעורך מסמכים.',
    purpose: 'Before this, you could only edit a document if you knew its URL. The document list gives users a central place to see all their documents, create new ones, and navigate to the editor.',
    purposeHe: 'לפני זה, אפשר היה לערוך מסמך רק אם ידעת את ה-URL שלו. רשימת המסמכים נותנת למשתמשים מקום מרכזי לראות את כל המסמכים שלהם, ליצור חדשים ולנווט לעורך.',
    connectedTo: ['Supabase vb_records table', 'Editor /[id] route', 'TiptapEditor.tsx'],
  },

  // ── Phase 3: Story Map + Canvas + Fields (17907a2) ── 2026-03-05

  {
    id: 'story-map',
    feature: 'Story Map — 3-tier drag-and-drop board',
    featureHe: 'מפת סיפורים — לוח גרור-ושחרר 3 שכבות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '17907a2',
    date: '2026-03-05',
    phase: 3,
    files: ['src/app/dashboard/story-map/page.tsx', 'src/components/command-center/StoryBoard.tsx', 'src/components/command-center/StoryColumn.tsx', 'src/components/command-center/StoryCard.tsx', 'src/components/command-center/StoryCardOverlay.tsx', 'src/lib/supabase/storyCardQueries.ts'],
    route: '/dashboard/story-map',
    notes: '3-tier structure: Epics (column 0, colored) → Features (expandable groupers) → Stories (sub-items with checkboxes). @dnd-kit drag-and-drop within/across columns. Inline editing, color picker per card, delete with confirmation. Demo mode with 4 columns when no project. Supabase CRUD with batch position updates.',
    notesHe: 'מבנה 3 שכבות: אפיקים (עמודה 0, צבעוניים) → פיצ׳רים (מקבצים מתרחבים) → סיפורים (תתי-פריטים עם תיבות סימון). גרור-ושחרר @dnd-kit בתוך/בין עמודות. עריכה inline, בורר צבע לכרטיס, מחיקה עם אישור. מצב הדגמה עם 4 עמודות ללא פרויקט. CRUD ב-Supabase עם עדכון מיקומים באצווה.',
    purpose: 'User story mapping is how GAM breaks down large projects into manageable pieces. The 3-tier hierarchy (Epic → Feature → Story) follows agile methodology. Drag-and-drop lets the team reprioritize during planning sessions. This replaces a physical whiteboard with sticky notes.',
    purposeHe: 'מיפוי סיפורי משתמש הוא הדרך שבה GAM מפרקת פרויקטים גדולים לחלקים ניתנים לניהול. ההיררכיה ב-3 שכבות (אפיק → פיצ׳ר → סיפור) עוקבת אחרי מתודולוגיית Agile. גרור-ושחרר מאפשר לצוות לתעדף מחדש במהלך סשני תכנון. זה מחליף לוח לבן פיזי עם פתקים דביקים.',
    connectedTo: ['Supabase story_cards table', '@dnd-kit (drag library)', 'PageHeader (pin to favorites)'],
  },
  {
    id: 'canvas-editor',
    feature: 'Canvas grid editor — visual form builder',
    featureHe: 'עורך רשת Canvas — בונה טפסים ויזואלי',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '17907a2',
    date: '2026-03-05',
    phase: 3,
    files: ['src/components/canvas/CanvasEditor.tsx', 'src/components/canvas/CanvasGrid.tsx', 'src/components/canvas/CanvasFieldItem.tsx', 'src/components/canvas/CanvasToolbar.tsx', 'src/components/canvas/EditorZone.tsx', 'src/contexts/CanvasContext.tsx', 'src/lib/canvas/useCanvasGrid.ts'],
    route: '/dashboard/editor',
    notes: 'Infinite grid with configurable cell size (48px). Drag-to-place fields. Zoom 0.5x-2x. WYSIWYG editor zone on the right for selected field. Pixel-to-cell conversion with bounds checking and overlap validation. Supabase persistence (canvas_layouts + canvas_placements tables).',
    notesHe: 'רשת אינסופית עם גודל תא מוגדר (48px). גרירה והנחת שדות. זום 0.5x-2x. אזור עורך WYSIWYG בצד ימין לשדה נבחר. המרת פיקסל-לתא עם בדיקת גבולות ואימות חפיפה. שמירה ב-Supabase (טבלאות canvas_layouts + canvas_placements).',
    purpose: 'Documents sometimes need structured data, not just text. The canvas lets users place form fields (text, number, date, select, checkbox) on a grid and attach them to documents. Think of it as a visual form builder inside the document editor.',
    purposeHe: 'מסמכים לפעמים צריכים נתונים מובנים, לא רק טקסט. הקנבס מאפשר למשתמשים למקם שדות טפסים (טקסט, מספר, תאריך, בחירה, תיבת סימון) על רשת ולצרף אותם למסמכים. חשבו על זה כבונה טפסים ויזואלי בתוך עורך המסמכים.',
    connectedTo: ['CanvasContext (state)', 'Field system (FieldLibrary, FieldConfigModal)', 'Editor page', 'Supabase canvas tables'],
  },
  {
    id: 'field-system',
    feature: 'Field system — library, config, queries',
    featureHe: 'מערכת שדות — ספרייה, הגדרה, שאילתות',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '17907a2',
    date: '2026-03-05',
    phase: 3,
    files: ['src/components/command-center/fields/FieldLibrary.tsx', 'src/components/command-center/fields/FieldConfigModal.tsx', 'src/components/command-center/fields/fieldTypes.ts', 'src/lib/supabase/fieldQueries.ts', 'src/lib/supabase/canvasQueries.ts'],
    notes: 'Field type library (text, number, date, select, checkbox, etc.). Configuration modal for each field. Supabase CRUD for field definitions. Canvas placement persistence.',
    notesHe: 'ספריית סוגי שדות (טקסט, מספר, תאריך, בחירה, תיבת סימון וכו׳). מודאל הגדרה לכל שדה. CRUD ב-Supabase להגדרות שדות. שמירת מיקומי canvas.',
    purpose: 'Fields are the bridge between free-form documents and structured data. When GAM creates a "project spec" document, they need fields like "client name", "budget", "deadline" — the field system provides these as draggable components.',
    purposeHe: 'שדות הם הגשר בין מסמכים חופשיים לנתונים מובנים. כש-GAM יוצרת מסמך "מפרט פרויקט", הם צריכים שדות כמו "שם לקוח", "תקציב", "דדליין" — מערכת השדות מספקת אותם כרכיבים נגררים.',
    connectedTo: ['CanvasEditor (field placement)', 'Supabase field_definitions table', 'TiptapEditor FieldBlock extension'],
  },
  {
    id: 'supabase-migrations',
    feature: '6 Supabase migrations (database tables)',
    featureHe: '6 מיגרציות Supabase (טבלאות בסיס נתונים)',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '17907a2',
    date: '2026-03-05',
    phase: 3,
    files: ['supabase/migrations/20260300_create_projects.sql', 'supabase/migrations/20260301_create_vb_records.sql', 'supabase/migrations/20260304_create_field_definitions.sql', 'supabase/migrations/20260305_create_canvas_tables.sql', 'supabase/migrations/20260306_create_story_cards.sql'],
    notes: 'Tables: projects (from Origami), vb_records (documents), field_definitions, canvas_layouts, canvas_placements, story_cards. All with UUID PKs, timestamps, and RLS.',
    notesHe: 'טבלאות: projects (מ-Origami), vb_records (מסמכים), field_definitions, canvas_layouts, canvas_placements, story_cards. כולם עם UUID PKs, timestamps ו-RLS.',
    purpose: 'The database schema defines what data the system can store. Projects come from Origami CRM (synced via n8n). Documents, fields, and story cards are created directly in the dashboard. This is the mirror database — Origami remains the source of truth for operations.',
    purposeHe: 'סכמת בסיס הנתונים מגדירה אילו נתונים המערכת יכולה לאחסן. פרויקטים באים מ-Origami CRM (מסונכרנים דרך n8n). מסמכים, שדות וכרטיסי סיפור נוצרים ישירות בדשבורד. זה בסיס הנתונים המשקף — Origami נשאר מקור האמת לתפעול.',
    connectedTo: ['All query files', 'Layers page', 'Editor', 'Story Map', 'Canvas', 'n8n (sync)'],
  },

  // ── Fix: Canvas Polish (db6c188) ── 2026-03-05

  {
    id: 'canvas-polish',
    feature: 'Fix: Canvas system — 8 bug fixes',
    featureHe: 'תיקון: מערכת Canvas — 8 תיקוני באגים',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: 'db6c188',
    date: '2026-03-05',
    files: ['src/components/canvas/CanvasEditor.tsx', 'src/components/canvas/CanvasFieldItem.tsx', 'src/components/canvas/CanvasGrid.tsx', 'src/components/canvas/EditorZone.tsx', 'src/contexts/CanvasContext.tsx', 'src/lib/canvas/useCanvasGrid.ts'],
    notes: '8 fixes: loading spinner (was blank), auto-clear save errors (3s), onChange sync, row bounds check, zoom-aware cell calculation, useMemo deps fix, null safety for field_type/label, drop target sizing alignment.',
    notesHe: '8 תיקונים: ספינר טעינה (היה ריק), ניקוי אוטומטי של שגיאות שמירה (3 שניות), סנכרון onChange, בדיקת גבולות שורה, חישוב תא מודע-זום, תיקון תלויות useMemo, בטיחות null לfield_type/label, יישור גודל יעד הנחה.',
    purpose: 'Quality pass — the Canvas worked but had rough edges. Users saw blank screens during load, got stuck save errors, and zoom behavior was inconsistent. These 8 fixes made it production-ready.',
    purposeHe: 'מעבר איכות — הקנבס עבד אבל היו קצוות מחוספסים. משתמשים ראו מסכים ריקים בטעינה, קיבלו שגיאות שמירה תקועות, וזום היה לא עקבי. 8 התיקונים האלה הפכו אותו למוכן לייצור.',
    connectedTo: ['Canvas system files', 'useCanvasGrid hook'],
  },

  // ── Automations Page (37def02) ── 2026-03-05

  {
    id: 'automations-page',
    feature: 'Automations page — n8n + 3 Supabase types',
    featureHe: 'דף אוטומציות — n8n + 3 סוגי Supabase',
    status: 'working',
    commitStatus: 'committed',
    workflowStatus: 'complete',
    commitHash: '37def02',
    date: '2026-03-05',
    phase: 1,
    files: ['src/app/dashboard/automations/page.tsx'],
    route: '/dashboard/automations',
    notes: 'n8n iframe for visual workflow builder. 3 automation types explained with code examples: DB Triggers (auto-update timestamps, status change notifications), Edge Functions (Origami webhook sync, WATI WhatsApp), pg_cron (recurring tasks). Comparison table.',
    notesHe: 'iframe של n8n לבונה זרימות עבודה ויזואלי. 3 סוגי אוטומציה עם דוגמאות קוד: DB Triggers (עדכון timestamps אוטומטי, התראות שינוי סטטוס), Edge Functions (webhook סנכרון Origami, WhatsApp WATI), pg_cron (משימות חוזרות). טבלת השוואה.',
    purpose: 'GAM\'s architecture relies on automation: Origami→Supabase sync, WhatsApp notifications, health score updates. This page documents the 3 available automation approaches and embeds n8n for visual workflow building. It\'s both a tool AND a reference guide.',
    purposeHe: 'הארכיטקטורה של GAM מסתמכת על אוטומציה: סנכרון Origami→Supabase, התראות WhatsApp, עדכוני ציוני בריאות. דף זה מתעד את 3 גישות האוטומציה הזמינות ומטמיע n8n לבניית זרימות ויזואלית. הוא גם כלי וגם מדריך עזר.',
    connectedTo: ['n8n (Docker)', 'Supabase (triggers, edge functions, pg_cron)', 'Origami CRM (webhooks)', 'WATI (WhatsApp)'],
  },

  // ── Uncommitted: Session 2 (2026-03-06) ──

  {
    id: 'workspace-hub',
    feature: 'Workspace Hub — root page with zone cards',
    featureHe: 'מרכז סביבת עבודה — דף ראשי עם כרטיסי אזורים',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/app/page.tsx'],
    route: '/',
    notes: '3 zone cards: Dev Dashboard (→/dashboard, active), Client Management (placeholder, coming soon), Admin Dev Log (→/dashboard/admin, active). Language toggle. Version footer.',
    notesHe: '3 כרטיסי אזורים: דשבורד פיתוח (→/dashboard, פעיל), ניהול לקוחות (placeholder, בקרוב), לוג פיתוח ואדמין (→/dashboard/admin, פעיל). מתג שפה. פוטר גרסה.',
    purpose: 'The entry point for the entire GAM account. When GAM eventually has multiple workspaces (dev dashboard, client portals, admin tools), this is where you choose which one to enter. The "Client Management" placeholder shows the future vision.',
    purposeHe: 'נקודת הכניסה לחשבון GAM כולו. כש-GAM בסופו של דבר תהיה עם סביבות עבודה מרובות (דשבורד פיתוח, פורטלי לקוחות, כלי ניהול), כאן בוחרים לאיזה להיכנס. ה-placeholder של "ניהול לקוחות" מציג את החזון העתידי.',
    connectedTo: ['Sidebar logo (link back)', '/dashboard (dev dashboard)', '/dashboard/admin (admin)'],
  },
  {
    id: 'admin-page',
    feature: 'Admin Dev Log page — full system registry',
    featureHe: 'עמוד לוג פיתוח ואדמין — רישום מערכת מלא',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/app/dashboard/admin/page.tsx'],
    route: '/dashboard/admin',
    notes: '4 tabs: Routes (13 dashboard + 2 standalone with filters), Widgets (11 entries), Contexts (7 entries), Changelog (this section). Stats row, phase progress bars, architecture summary. Full Hebrew/English.',
    notesHe: '4 לשוניות: נתיבים (13 דשבורד + 2 עצמאיים עם מסננים), ווידג׳טים (11 רשומות), קונטקסטים (7 רשומות), יומן שינויים (מקטע זה). שורת סטטיסטיקות, פסי התקדמות שלבים, סיכום ארכיטקטורה. עברית/אנגלית מלאה.',
    purpose: 'Visibility into what\'s actually built. Without this page, the only way to know what exists is to read the codebase. This gives GAM team a complete inventory: what works, what\'s placeholder, what phase each feature belongs to, and now — a complete changelog.',
    purposeHe: 'נראות למה שבאמת נבנה. בלי דף זה, הדרך היחידה לדעת מה קיים היא לקרוא את הקוד. זה נותן לצוות GAM מלאי מלא: מה עובד, מה placeholder, לאיזה שלב כל פיצ׳ר שייך, ועכשיו — יומן שינויים מלא.',
    connectedTo: ['Sidebar (Shield icon)', 'PageHeader', 'Workspace Hub (zone card link)'],
  },
  {
    id: 'video-prompt',
    feature: 'Veo 3 Video Prompt Generator',
    featureHe: 'מחולל פרומפטים לווידאו Veo 3',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/app/embeds/video-prompt/page.tsx'],
    route: '/embeds/video-prompt',
    notes: '20 atmospheres, 12 styles, camera controls (movement, angle, lens), copy-to-clipboard, variation randomizer. Standalone embed page with custom fonts (Bebas Neue + DM Sans).',
    notesHe: '20 אווירות, 12 סגנונות, בקרת מצלמה (תנועה, זווית, עדשה), העתקה ללוח, מרנדמר וריאציות. דף embed עצמאי עם גופנים מותאמים (Bebas Neue + DM Sans).',
    purpose: 'GAM creates marketing videos using Veo 3 (Google\'s video AI). Writing good prompts requires knowing what parameters are available. This tool makes prompt creation fast and consistent — pick atmosphere + style + camera, get a polished prompt.',
    purposeHe: 'GAM יוצרת סרטוני שיווק באמצעות Veo 3 (ה-AI לווידאו של Google). כתיבת פרומפטים טובים דורשת ידיעה אילו פרמטרים זמינים. הכלי הזה הופך יצירת פרומפטים למהירה ועקבית — בחר אווירה + סגנון + מצלמה, קבל פרומפט מלוטש.',
    connectedTo: ['Design System gallery (registered)', '/designs/registry.ts'],
  },
  {
    id: 'sidebar-nav-home',
    feature: 'Sidebar logo → Workspace Hub link',
    featureHe: 'לוגו סיידבר → קישור למרכז סביבת העבודה',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/components/command-center/Sidebar.tsx'],
    notes: 'Logo and company name in sidebar header wrapped in <Link href="/">. Provides navigation back to Workspace Hub from any dashboard page.',
    notesHe: 'לוגו ושם חברה בכותרת הסיידבר עטופים ב-<Link href="/">. מספק ניווט חזרה למרכז סביבת העבודה מכל דף דשבורד.',
    purpose: 'Users need a way to get back to the workspace hub from inside the dashboard. The logo is the natural "home" element — clicking it takes you back to the top-level workspace view.',
    purposeHe: 'משתמשים צריכים דרך לחזור למרכז סביבת העבודה מתוך הדשבורד. הלוגו הוא אלמנט ה-"בית" הטבעי — לחיצה עליו מחזירה לתצוגת סביבת העבודה העליונה.',
    connectedTo: ['Workspace Hub (/)', 'Sidebar.tsx'],
  },
  {
    id: 'widget-context-fix',
    feature: 'Fix: WidgetContext infinite re-render loop',
    featureHe: 'תיקון: לולאה אינסופית ב-WidgetContext',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/contexts/WidgetContext.tsx'],
    notes: 'Added shallow equality check in setWidgetPositions callback. Two useEffects in TopBar (auto-init + clamp-overflow) both watched widgetPositions and called setWidgetPositions, creating infinite loop when new object references were created.',
    notesHe: 'הוספת בדיקת שוויון רדודה ב-callback של setWidgetPositions. שני useEffects ב-TopBar (אתחול אוטומטי + חיתוך גלישה) שניהם צפו ב-widgetPositions וקראו ל-setWidgetPositions, יצרו לולאה אינסופית כשנוצרו הפניות אובייקט חדשות.',
    purpose: 'Crash fix. The app would freeze with "Maximum update depth exceeded" error when navigating to any dashboard page. Root cause: two TopBar effects fighting over widget positions.',
    purposeHe: 'תיקון קריסה. האפליקציה קפאה עם שגיאת "Maximum update depth exceeded" בניווט לכל דף דשבורד. סיבת שורש: שני effects של TopBar נלחמו על מיקומי ווידג׳טים.',
    connectedTo: ['TopBar.tsx (two useEffects)', 'WidgetContext.tsx'],
  },
  {
    id: 'skins-system',
    feature: 'Skins system — one-click theme presets',
    featureHe: 'מערכת סקינים — פריסטי ערכת נושא בלחיצה',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/lib/skins.ts', 'src/app/dashboard/settings/page.tsx', 'src/contexts/SettingsContext.tsx'],
    route: '/dashboard/settings',
    notes: 'Pre-defined skin presets that set accent color + density + effects in one click. Defined in skins.ts, applied via Settings page, stored via SettingsContext.',
    notesHe: 'פריסטי סקינים מוגדרים מראש שקובעים צבע מבטא + צפיפות + אפקטים בלחיצה אחת. מוגדרים ב-skins.ts, מוחלים דרך דף ההגדרות, נשמרים דרך SettingsContext.',
    purpose: 'Instead of manually tweaking 5 settings to get a "corporate blue" or "vibrant purple" look, skins apply a coordinated set of values in one click. Makes it easy to switch the entire dashboard mood.',
    purposeHe: 'במקום לכוונן ידנית 5 הגדרות כדי לקבל מראה "כחול תאגידי" או "סגול תוסס", סקינים מחילים סט מתואם של ערכים בלחיצה אחת. מקל על החלפת מצב הרוח של הדשבורד כולו.',
    connectedTo: ['SettingsContext (applies values)', 'Settings page (skin selector)', 'skins.ts (preset definitions)'],
  },
  {
    id: 'design-gallery',
    feature: 'Design System gallery — registry-based',
    featureHe: 'גלריית מערכת עיצוב — מבוססת רישום',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/app/dashboard/design-system/page.tsx', 'src/app/designs/registry.ts'],
    route: '/dashboard/design-system',
    notes: 'Design gallery with cards. Each design has: title, description, route, tags, preview (iframe). Registry pattern — add designs by adding an entry to registry.ts. Currently registered: GAM Landing Page, Video Prompt Generator.',
    notesHe: 'גלריית עיצוב עם כרטיסים. לכל עיצוב: כותרת, תיאור, נתיב, תגיות, תצוגה מקדימה (iframe). דפוס רישום — הוספת עיצובים ע״י הוספת רשומה ל-registry.ts. רשומים כעת: דף נחיתה GAM, מחולל פרומפטים לווידאו.',
    purpose: 'A showcase of standalone designs and embeds built for GAM. The registry pattern means adding new designs is as simple as adding one object to an array — no code changes to the gallery page itself.',
    purposeHe: 'תצוגה של עיצובים עצמאיים ו-embeds שנבנו עבור GAM. דפוס הרישום אומר שהוספת עיצובים חדשים פשוטה כמו הוספת אובייקט אחד למערך — אין שינויי קוד בדף הגלריה עצמו.',
    connectedTo: ['registry.ts (design definitions)', 'Landing page (/designs/gam-landing)', 'Video Prompt (/embeds/video-prompt)'],
  },
  {
    id: 'i18n-extensions',
    feature: 'i18n extensions — admin + home + changelog',
    featureHe: 'הרחבות i18n — אדמין + בית + יומן שינויים',
    status: 'working',
    commitStatus: 'uncommitted',
    workflowStatus: 'inProgress',
    date: '2026-03-06',
    files: ['src/lib/i18n.ts'],
    notes: 'Added ~80 new translation keys: home section (workspace hub labels), admin section (35 keys for dev log), changelog section (25 keys). Both Hebrew and English.',
    notesHe: 'הוספת ~80 מפתחות תרגום חדשים: מקטע בית (תוויות מרכז סביבת עבודה), מקטע אדמין (35 מפתחות ללוג פיתוח), מקטע יומן שינויים (25 מפתחות). עברית ואנגלית.',
    purpose: 'Every new feature needs translations. These keys ensure the Workspace Hub, Admin page, and Changelog tab all work correctly in both Hebrew and English.',
    purposeHe: 'כל פיצ׳ר חדש צריך תרגומים. המפתחות האלה מבטיחים שמרכז סביבת העבודה, דף האדמין ולשונית יומן השינויים עובדים נכון בעברית ובאנגלית.',
    connectedTo: ['i18n.ts', 'Admin page', 'Workspace Hub', 'SettingsContext (language)'],
  },
];

// ─── Sub-components ──────────────────────────────────────

function StatusBadge({ status, isHe }: { status: Status; isHe: boolean }) {
  const cfg: Record<Status, { en: string; he: string; color: string; icon: React.ElementType }> = {
    active: { en: 'Active', he: 'פעיל', color: '#34d399', icon: CheckCircle2 },
    placeholder: { en: 'Placeholder', he: 'ריק', color: '#fbbf24', icon: AlertCircle },
    'coming-soon': { en: 'Coming Soon', he: 'בקרוב', color: '#818cf8', icon: Clock },
    deprecated: { en: 'Deprecated', he: 'הוסר', color: '#ef4444', icon: Circle },
  };
  const c = cfg[status];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: c.color, background: `${c.color}15` }}>
      <Icon size={12} />
      {isHe ? c.he : c.en}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  const colors: Record<Phase, string> = { 1: '#34d399', 2: '#60a5fa', 3: '#c084fc', 4: '#f472b6', 5: '#94a3b8' };
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ color: colors[phase], background: `${colors[phase]}15` }}>
      P{phase}
    </span>
  );
}

function CollapsibleRow({ title, defaultOpen = false, count, children, isHe }: {
  title: React.ReactNode; defaultOpen?: boolean; count?: number; children: React.ReactNode; isHe: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Arrow = open ? ChevronDown : (isHe ? ChevronLeft : ChevronRight);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
        <Arrow size={14} />
        {title}
        {count !== undefined && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{count}</span>}
      </button>
      {open && <div className={isHe ? 'pl-5 pb-2' : 'pr-5 pb-2'}>{children}</div>}
    </div>
  );
}

function RouteCard({ route, isHe }: { route: RouteEntry; isHe: boolean }) {
  const Icon = route.icon;
  const description = isHe ? route.descriptionHe : route.descriptionEn;
  const displayName = isHe ? route.nameHe : route.name;
  const secondaryName = isHe ? route.name : route.nameHe;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
            <Icon size={18} className="text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-100">{displayName}</span>
              <span className="text-xs text-slate-500">{secondaryName}</span>
              <PhaseBadge phase={route.phase} />
              <StatusBadge status={route.status} isHe={isHe} />
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
              <code className="rounded bg-white/5 px-1.5 py-0.5" dir="ltr">{route.path}</code>
              <span>v{route.version}</span>
              <span>{route.addedDate}</span>
              {route.visible ? (
                <span className="flex items-center gap-1 text-emerald-400"><Eye size={10} /> {isHe ? 'נראה' : 'Visible'}</span>
              ) : (
                <span className="flex items-center gap-1 text-slate-600"><EyeOff size={10} /> {isHe ? 'מוסתר' : 'Hidden'}</span>
              )}
              {route.sidebarTab && <span className="text-blue-400">{isHe ? 'סיידבר' : 'Sidebar'}</span>}
            </div>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">{description}</p>

      {route.components.length > 0 && (
        <CollapsibleRow isHe={isHe} title={<span className="flex items-center gap-1.5"><Component size={13} className="text-slate-500" /> {isHe ? 'קומפוננטות' : 'Components'}</span>} count={route.components.length}>
          <div className="mt-1 space-y-2">
            {route.components.map(comp => (
              <div key={comp.id} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={comp.status} isHe={isHe} />
                  <span className="text-sm font-medium text-slate-200">{comp.name}</span>
                  <code className="text-[10px] text-slate-600" dir="ltr">{comp.file}</code>
                </div>
                {comp.fields && comp.fields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comp.fields.map(f => (
                      <span key={f.name} className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400" dir="ltr">
                        <Database size={9} className="text-slate-600" />
                        {f.name} <span className="text-slate-600">({f.type})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleRow>
      )}

      {route.contexts.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] flex-wrap">
          <span className="text-slate-600">{isHe ? 'קונטקסטים:' : 'Contexts:'}</span>
          {route.contexts.map(c => (
            <span key={c} className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">{c}</span>
          ))}
        </div>
      )}

      {route.supabaseTables && route.supabaseTables.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] flex-wrap">
          <Database size={10} className="text-slate-600" />
          <span className="text-slate-600">{isHe ? 'טבלאות:' : 'Tables:'}</span>
          {route.supabaseTables.map(t => (
            <code key={t} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">{t}</code>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value}{suffix}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

// ─── Mermaid Diagram ─────────────────────────────────────

function generateMermaidDiagram(entries: ChangelogEntry[], routeData: RouteEntry[]): string {
  const lines: string[] = ['graph TD'];

  // Group entries by phase
  const phaseNames: Record<number, string> = {
    0: 'Foundation', 1: 'Phase 1 — Foundation', 2: 'Phase 2 — Editor',
    3: 'Phase 3 — Story Map', 4: 'Phase 4 — AI Hub', 5: 'Phase 5 — Extras',
  };

  // Collect entries by phase
  const byPhase: Record<number, ChangelogEntry[]> = {};
  entries.forEach(e => {
    const p = e.phase || 0;
    if (!byPhase[p]) byPhase[p] = [];
    byPhase[p].push(e);
  });

  // Status → style class mapping
  const statusStyle: Record<FeatureStatus, string> = {
    working: ':::working',
    'not-verified': ':::notverified',
    broken: ':::broken',
  };

  // Safe node ID
  const nodeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');

  // Build subgraphs per phase
  const sortedPhases = Object.keys(byPhase).map(Number).sort((a, b) => a - b);
  for (const phase of sortedPhases) {
    const phaseEntries = byPhase[phase];
    const label = phaseNames[phase] || `Phase ${phase}`;
    lines.push(`  subgraph ${nodeId(`phase_${phase}`)}["${label}"]`);

    for (const entry of phaseEntries) {
      const nid = nodeId(entry.id);
      const displayName = entry.feature.length > 40
        ? entry.feature.substring(0, 37) + '...'
        : entry.feature;
      const escapedName = displayName.replace(/"/g, "'");

      if (entry.route) {
        lines.push(`    ${nid}["${escapedName}"]${statusStyle[entry.status]}`);
      } else {
        lines.push(`    ${nid}("${escapedName}")${statusStyle[entry.status]}`);
      }
    }
    lines.push('  end');
  }

  // Add route nodes for any routes not in changelog
  const changelogRouteIds = new Set(entries.map(e => e.id));
  const routesNotInChangelog = routeData.filter(r => !changelogRouteIds.has(r.id));
  if (routesNotInChangelog.length > 0) {
    lines.push(`  subgraph routes_extra["Routes"]`);
    for (const r of routesNotInChangelog) {
      lines.push(`    ${nodeId(r.id)}["${r.name}"]${r.status === 'active' ? ':::working' : ':::notverified'}`);
    }
    lines.push('  end');
  }

  // Build edges from connectedTo
  const allIds = new Set([...entries.map(e => e.id), ...routeData.map(r => r.id)]);
  const fileToEntry: Record<string, string> = {};
  entries.forEach(e => {
    e.files.forEach(f => {
      const basename = f.split('/').pop()?.toLowerCase() || '';
      fileToEntry[basename] = e.id;
    });
  });

  for (const entry of entries) {
    if (!entry.connectedTo) continue;
    for (const conn of entry.connectedTo) {
      const connLower = conn.toLowerCase();
      // Try direct ID match
      let targetId: string | undefined;
      for (const id of allIds) {
        if (id === connLower || connLower.includes(id)) {
          targetId = id;
          break;
        }
      }
      // Try file match
      if (!targetId) {
        const connFile = conn.split('(')[0].trim().toLowerCase();
        for (const fname of Object.keys(fileToEntry)) {
          if (connFile.includes(fname) || fname.includes(connFile)) {
            if (fileToEntry[fname] !== entry.id) { targetId = fileToEntry[fname]; break; }
          }
        }
      }
      if (targetId && targetId !== entry.id) {
        lines.push(`  ${nodeId(entry.id)} -.-> ${nodeId(targetId)}`);
      }
    }
  }

  // Style definitions
  lines.push('  classDef working fill:#065f46,stroke:#34d399,color:#d1fae5');
  lines.push('  classDef notverified fill:#78350f,stroke:#fbbf24,color:#fef3c7');
  lines.push('  classDef broken fill:#7f1d1d,stroke:#ef4444,color:#fecaca');

  return lines.join('\n');
}

function MermaidDiagram({ definition, ta }: { definition: string; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#1e293b',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#475569',
            lineColor: '#64748b',
            secondaryColor: '#0f172a',
            tertiaryColor: '#1e1b4b',
            fontSize: '12px',
          },
          flowchart: { curve: 'basis', padding: 12 },
          securityLevel: 'loose',
        });
        if (cancelled || !containerRef.current) return;
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, definition);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setRendered(true);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [definition]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-xs text-red-400">Diagram error: {error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-[10px] text-slate-600">Source</summary>
          <pre className="mt-1 max-h-40 overflow-auto text-[10px] text-slate-600">{definition}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="relative">
      {!rendered && (
        <div className="flex items-center justify-center py-12 text-sm text-slate-600">{ta.diagramLoading}</div>
      )}
      <div ref={containerRef} className="overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full" />
    </div>
  );
}

function ChecklistDots({ entryId, isHe, ta }: { entryId: string; isHe: boolean; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const [expanded, setExpanded] = useState(false);
  const checklist = CHANGELOG_CHECKLISTS[entryId];
  const score = getChecklistScore(checklist);

  const clLabels: Record<DevChecklistKey, string> = {
    guideContent: ta.clGuideContent,
    usageDoc: ta.clUsageDoc,
    diagram: ta.clDiagram,
    aiSourceOfTruth: ta.clAiSourceOfTruth,
    conflictReview: ta.clConflictReview,
  };

  if (!checklist) {
    return <span className="text-[10px] text-slate-600">{ta.noChecklist}</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-white/5"
      >
        <span className="flex items-center gap-0.5">
          {checklist.items.map(item => (
            <span
              key={item.key}
              className={`inline-block h-2 w-2 rounded-full ${item.done ? 'bg-emerald-400' : 'bg-slate-700'}`}
            />
          ))}
        </span>
        <span className={`font-medium ${score.pct === 100 ? 'text-emerald-400' : score.pct >= 60 ? 'text-slate-400' : 'text-amber-400'}`}>
          {score.done}/{score.total}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
          {checklist.items.map(item => {
            const cfg = DEV_CHECKLIST_KEYS.find(c => c.key === item.key)!;
            const Icon = cfg.icon;
            return (
              <div key={item.key} className="flex items-center gap-2 text-[11px]">
                <Icon size={12} className={item.done ? 'text-emerald-400' : 'text-slate-600'} />
                <span className={item.done ? 'text-slate-300' : 'text-slate-600'}>
                  {clLabels[item.key]}
                </span>
                {item.done ? (
                  <CheckCircle2 size={10} className="text-emerald-400" />
                ) : (
                  <Circle size={10} className="text-slate-700" />
                )}
              </div>
            );
          })}
          {checklist.reviewedBy && (
            <div className="mt-1.5 border-t border-white/[0.04] pt-1.5 text-[10px] text-slate-600">
              {ta.reviewedBy} {checklist.reviewedBy} · {checklist.reviewedDate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistSummary({ isHe, ta }: { isHe: boolean; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const [open, setOpen] = useState(false);
  const overall = getOverallChecklistScoreFromEntries(changelogEntries);

  const clLabels: Record<DevChecklistKey, string> = {
    guideContent: ta.clGuideContent,
    usageDoc: ta.clUsageDoc,
    diagram: ta.clDiagram,
    aiSourceOfTruth: ta.clAiSourceOfTruth,
    conflictReview: ta.clConflictReview,
  };

  const perItem = DEV_CHECKLIST_KEYS.map(cfg => {
    const done = changelogEntries.filter(e => {
      const cl = CHANGELOG_CHECKLISTS[e.id];
      return cl?.items.find(i => i.key === cfg.key)?.done;
    }).length;
    return { ...cfg, done, total: changelogEntries.length, label: clLabels[cfg.key] };
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ClipboardCheck size={16} className="text-purple-400" />
          <span className="text-sm font-medium text-slate-200">{ta.devChecklistTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${overall.pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {overall.pct}%
          </span>
          {open ? <ChevronDown size={14} className="text-slate-500" /> : (isHe ? <ChevronLeft size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />)}
        </div>
      </button>
      {open && (
        <div className="mt-4 space-y-2.5">
          {perItem.map(item => {
            const Icon = item.icon;
            const pct = Math.round((item.done / item.total) * 100);
            return (
              <div key={item.key} className="flex items-center gap-3">
                <Icon size={14} className="shrink-0 text-slate-500" />
                <span className="w-32 shrink-0 text-xs text-slate-400">{item.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: pct === 100 ? '#34d399' : pct >= 70 ? '#60a5fa' : '#fbbf24' }}
                  />
                </div>
                <span className="w-16 shrink-0 text-[11px] text-slate-500" dir="ltr" style={{ textAlign: isHe ? 'left' : 'right' }}>
                  {item.done}/{item.total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChangelogCard({ entry, isHe, ta }: { entry: ChangelogEntry; isHe: boolean; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const statusColors: Record<FeatureStatus, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    working: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: ta.working, icon: CheckCircle2 },
    'not-verified': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: ta.notVerified, icon: AlertCircle },
    broken: { bg: 'bg-red-500/10', text: 'text-red-400', label: ta.broken, icon: Circle },
  };
  const sc = statusColors[entry.status];
  const StatusIcon = sc.icon;
  const commitLabel = entry.commitStatus === 'committed' ? ta.committed : ta.uncommitted;
  const commitColor = entry.commitStatus === 'committed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10';
  const wf = WORKFLOW_CONFIG[entry.workflowStatus];
  const WfIcon = wf.icon;

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-200">{isHe ? entry.featureHe : entry.feature}</span>
          {entry.phase && <PhaseBadge phase={entry.phase} />}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${wf.bg} ${wf.text}`}>
            <WfIcon size={10} />
            {isHe ? wf.heLabel : wf.enLabel}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.text}`}>
            <StatusIcon size={10} />
            {sc.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${commitColor}`}>
            <GitCommit size={10} />
            {commitLabel}
          </span>
          <span className="text-[10px] text-slate-600">{entry.date}</span>
        </div>
        {entry.route && (
          <a href={entry.route} className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200" dir="ltr">
            <ExternalLink size={10} />
            {entry.route}
          </a>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">{isHe ? entry.notesHe : entry.notes}</p>
      <div className="mt-2 rounded-lg bg-purple-500/5 border border-purple-500/10 px-3 py-2">
        <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">{isHe ? 'למה נבנה' : 'Why it was built'}</span>
        <p className="mt-1 text-xs text-slate-400">{isHe ? entry.purposeHe : entry.purpose}</p>
      </div>
      {entry.connectedTo && entry.connectedTo.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-slate-600">{isHe ? 'מחובר ל:' : 'Connected to:'}</span>
          {entry.connectedTo.map(c => (
            <span key={c} className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">{c}</span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {entry.commitHash && (
          <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400" dir="ltr">
            {entry.commitHash}
          </code>
        )}
        {entry.files.slice(0, 4).map(f => (
          <code key={f} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-600" dir="ltr">{f}</code>
        ))}
        {entry.files.length > 4 && (
          <span className="text-[10px] text-slate-600">+{entry.files.length - 4} {isHe ? 'קבצים' : 'files'}</span>
        )}
      </div>
      <div className="mt-2 border-t border-white/[0.04] pt-2">
        <ChecklistDots entryId={entry.id} isHe={isHe} ta={ta} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function AdminDevLogPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const ta = t.admin;

  const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [activeSection, setActiveSection] = useState<'routes' | 'widgets' | 'contexts' | 'changelog'>('routes');
  const [changelogSearch, setChangelogSearch] = useState('');

  // Changelog sort/group/filter state
  const [clSortBy, setClSortBy] = useState<SortField>('date');
  const [clSortDir, setClSortDir] = useState<'asc' | 'desc'>('desc');
  const [clGroupBy, setClGroupBy] = useState<GroupField>('none');
  const [clFilterWorkflow, setClFilterWorkflow] = useState<WorkflowStatus[]>([]);
  const [clFilterPhase, setClFilterPhase] = useState<Phase | 'all'>('all');
  const [clFilterTechStatus, setClFilterTechStatus] = useState<FeatureStatus | 'all'>('all');

  // Live git state
  const [gitData, setGitData] = useState<GitStatusData | null>(null);
  const [gitLoading, setGitLoading] = useState(true);
  const [gitError, setGitError] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchGitStatus = useCallback(async () => {
    try {
      setGitLoading(true);
      setGitError('');
      const res = await fetch('/api/git/status');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGitData(data);
    } catch {
      setGitError(ta.gitError);
    } finally {
      setGitLoading(false);
    }
  }, [ta.gitError]);

  useEffect(() => { fetchGitStatus(); }, [fetchGitStatus]);

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    setCommitLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({ type: 'success', message: `${ta.commitSuccess} — ${data.hash}` });
        setCommitMsg('');
        fetchGitStatus();
      } else {
        setActionFeedback({ type: 'error', message: data.error || ta.commitError });
      }
    } catch {
      setActionFeedback({ type: 'error', message: ta.commitError });
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!confirm(ta.confirmDeploy)) return;
    setDeployLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/git/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({ type: 'success', message: `${ta.deploySuccess} — ${data.commitHash}` });
        setCommitMsg('');
        fetchGitStatus();
      } else {
        setActionFeedback({ type: 'error', message: data.error || ta.deployError });
      }
    } catch {
      setActionFeedback({ type: 'error', message: ta.deployError });
    } finally {
      setDeployLoading(false);
    }
  };

  const allRoutes = [...routes, ...standalonePages];

  // Filter → Sort → Search pipeline for changelog
  const filteredSortedEntries = useMemo(() => {
    // Step 1: Filter
    let entries = changelogEntries.filter(entry => {
      if (clFilterWorkflow.length > 0 && !clFilterWorkflow.includes(entry.workflowStatus)) return false;
      if (clFilterPhase !== 'all' && entry.phase !== clFilterPhase) return false;
      if (clFilterTechStatus !== 'all' && entry.status !== clFilterTechStatus) return false;
      return true;
    });

    // Step 2: Sort
    entries = [...entries].sort((a, b) => {
      let cmp = 0;
      switch (clSortBy) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'name': cmp = a.feature.localeCompare(b.feature); break;
        case 'phase': cmp = (a.phase || 0) - (b.phase || 0); break;
        case 'workflow': cmp = WORKFLOW_CONFIG[a.workflowStatus].order - WORKFLOW_CONFIG[b.workflowStatus].order; break;
        case 'fileCount': cmp = a.files.length - b.files.length; break;
      }
      return clSortDir === 'desc' ? -cmp : cmp;
    });

    return entries;
  }, [clFilterWorkflow, clFilterPhase, clFilterTechStatus, clSortBy, clSortDir]);

  // 2-layer changelog search (operates on filtered+sorted set)
  const { directMatches, relatedMatches } = useMemo(() => {
    const q = changelogSearch.trim().toLowerCase();
    if (!q) return { directMatches: filteredSortedEntries, relatedMatches: [] as ChangelogEntry[] };

    // Layer 1: direct keyword matches across all text fields
    const layer1 = filteredSortedEntries.filter(entry => {
      const searchable = [
        entry.feature, entry.featureHe, entry.notes, entry.notesHe,
        entry.purpose, entry.purposeHe, entry.id, entry.workflowStatus,
        entry.route || '', entry.commitHash || '', entry.date,
        ...entry.files, ...(entry.connectedTo || []),
      ].join(' ').toLowerCase();
      return searchable.includes(q);
    });

    const layer1Ids = new Set(layer1.map(e => e.id));

    // Layer 2: entries connected to Layer 1 via connectedTo graph
    const layer2 = filteredSortedEntries.filter(entry => {
      if (layer1Ids.has(entry.id)) return false;
      const connected = (entry.connectedTo || []).some(c =>
        layer1.some(l1 =>
          l1.id === c.toLowerCase() ||
          l1.files.some(f => c.toLowerCase().includes(f.split('/').pop()?.toLowerCase() || '___')) ||
          l1.feature.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(l1.id)
        )
      );
      const referencedBy = layer1.some(l1 =>
        (l1.connectedTo || []).some(c =>
          entry.id === c.toLowerCase() ||
          entry.files.some(f => c.toLowerCase().includes(f.split('/').pop()?.toLowerCase() || '___')) ||
          c.toLowerCase().includes(entry.id)
        )
      );
      return connected || referencedBy;
    });

    return { directMatches: layer1, relatedMatches: layer2 };
  }, [changelogSearch, filteredSortedEntries]);

  // Group entries helper
  const groupedEntries = useMemo(() => {
    if (clGroupBy === 'none' || changelogSearch.trim()) return null;
    const entries = directMatches;
    const groups: { label: string; color: string; entries: ChangelogEntry[] }[] = [];
    const groupMap: Record<string, { label: string; color: string; entries: ChangelogEntry[] }> = {};

    for (const entry of entries) {
      let key: string;
      let label: string;
      let color = '#94a3b8';

      switch (clGroupBy) {
        case 'workflow': {
          key = entry.workflowStatus;
          const wf = WORKFLOW_CONFIG[entry.workflowStatus];
          label = isHe ? wf.heLabel : wf.enLabel;
          color = wf.color;
          break;
        }
        case 'phase': {
          key = entry.phase ? `P${entry.phase}` : 'none';
          label = entry.phase ? `${isHe ? 'שלב' : 'Phase'} ${entry.phase}` : (isHe ? 'ללא שלב' : 'No Phase');
          const phaseColors: Record<string, string> = { P1: '#34d399', P2: '#60a5fa', P3: '#c084fc', P4: '#f472b6', P5: '#94a3b8', none: '#64748b' };
          color = phaseColors[key] || '#64748b';
          break;
        }
        case 'date': {
          key = entry.date;
          label = entry.date;
          color = '#60a5fa';
          break;
        }
        case 'fileDir': {
          const firstFile = entry.files[0] || '';
          const parts = firstFile.split('/');
          key = parts.length > 2 ? parts.slice(0, -1).join('/') : parts[0] || 'root';
          label = key;
          color = '#c084fc';
          break;
        }
      }

      if (!groupMap[key]) {
        const group = { label, color, entries: [] as ChangelogEntry[] };
        groupMap[key] = group;
        groups.push(group);
      }
      groupMap[key].entries.push(entry);
    }

    return groups;
  }, [clGroupBy, directMatches, changelogSearch, isHe]);

  const filteredRoutes = useMemo(() => {
    return allRoutes.filter(r => {
      if (filterPhase !== 'all' && r.phase !== filterPhase) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [filterPhase, filterStatus, allRoutes]);

  const stats = useMemo(() => {
    const activeRoutes = allRoutes.filter(r => r.status === 'active').length;
    const placeholderRoutes = allRoutes.filter(r => r.status === 'placeholder').length;
    const totalComponents = allRoutes.reduce((sum, r) => sum + r.components.length, 0);
    const totalFields = allRoutes.reduce((sum, r) => sum + r.components.reduce((s, c) => s + (c.fields?.length || 0), 0), 0);
    const clScore = getOverallChecklistScoreFromEntries(changelogEntries);
    return { activeRoutes, placeholderRoutes, totalComponents, totalFields, totalWidgets: widgets.length, totalContexts: contexts.length, checklistPct: clScore.pct };
  }, [allRoutes]);

  const phaseProgress = useMemo(() => {
    const phases: Phase[] = [1, 2, 3, 4, 5];
    return phases.map(p => {
      const all = allRoutes.filter(r => r.phase === p);
      const active = all.filter(r => r.status === 'active');
      return { phase: p, total: all.length, active: active.length, pct: all.length > 0 ? Math.round((active.length / all.length) * 100) : 0 };
    });
  }, [allRoutes]);

  const mermaidDiagram = useMemo(() => generateMermaidDiagram(changelogEntries, allRoutes), [allRoutes]);

  const phaseLabelsMap: Record<Phase, string> = {
    1: ta.phase1, 2: ta.phase2, 3: ta.phase3, 4: ta.phase4, 5: ta.phase5,
  };

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="admin" />

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          <StatCard label={ta.activePages} value={stats.activeRoutes} color="#34d399" />
          <StatCard label={ta.placeholderPages} value={stats.placeholderRoutes} color="#fbbf24" />
          <StatCard label={ta.components} value={stats.totalComponents} color="#60a5fa" />
          <StatCard label={ta.fieldsMapped} value={stats.totalFields} color="#c084fc" />
          <StatCard label={ta.widgetsLabel} value={stats.totalWidgets} color="#f472b6" />
          <StatCard label={ta.contextsLabel} value={stats.totalContexts} color="#fb923c" />
          <StatCard label={ta.checklistDone} value={stats.checklistPct} color={stats.checklistPct >= 80 ? '#34d399' : '#fbbf24'} suffix="%" />
        </div>

        {/* Audit Link */}
        <Link
          href="/dashboard/admin/audit"
          className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 px-5 py-3 transition-colors hover:bg-purple-500/10"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck size={18} className="text-purple-400" />
            <div>
              <span className="text-sm font-medium text-slate-200">{isHe ? 'ביקורת קוד — סקירה רב-כובעית' : 'Code Audit — Multi-Hat Review'}</span>
              <p className="text-[11px] text-slate-500">{isHe ? '4 כובעים · תוכנית · מציאות · איכות · שלמות' : '4 hats · plan · reality · quality · integrity'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              getOverallScore() >= 80 ? 'text-emerald-400' : getOverallScore() >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {getOverallScore()}%
            </span>
            <ExternalLink size={14} className="text-slate-600" />
          </div>
        </Link>

        {/* Phase Progress */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">{ta.phaseProgress}</h3>
          <div className="space-y-2">
            {phaseProgress.map(p => (
              <div key={p.phase} className="flex items-center gap-3">
                <span className="w-44 text-xs text-slate-500">{phaseLabelsMap[p.phase]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#34d399' : p.pct > 0 ? '#60a5fa' : '#374151' }} />
                </div>
                <span className="w-20 text-[11px] text-slate-500" dir="ltr" style={{ textAlign: isHe ? 'left' : 'right' }}>
                  {p.active}/{p.total} ({p.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] pb-px">
          {(['routes', 'widgets', 'contexts', 'changelog'] as const).map(section => (
            <button key={section} onClick={() => setActiveSection(section)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeSection === section ? 'bg-white/5 text-white border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {section === 'routes' ? `${ta.tabRoutes} (${allRoutes.length})` :
               section === 'widgets' ? `${ta.tabWidgets} (${widgets.length})` :
               section === 'contexts' ? `${ta.tabContexts} (${contexts.length})` :
               `${ta.tabChangelog} (${changelogEntries.length})`}
            </button>
          ))}
        </div>

        {/* ROUTES TAB */}
        {activeSection === 'routes' && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-600">{ta.filterPhase}:</span>
              {(['all', 1, 2, 3, 4, 5] as const).map(p => (
                <button key={p} onClick={() => setFilterPhase(p)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    filterPhase === p ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}>
                  {p === 'all' ? ta.filterAll : `P${p}`}
                </button>
              ))}
              <span className="h-4 w-px bg-white/10" />
              <span className="text-xs text-slate-600">{ta.filterStatus}:</span>
              {(['all', 'active', 'placeholder', 'coming-soon'] as const).map(s => {
                const labels: Record<string, string> = { all: ta.filterAll, active: ta.statusActive, placeholder: ta.statusPlaceholder, 'coming-soon': ta.statusComingSoon };
                return (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      filterStatus === s ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500 hover:text-slate-300'
                    }`}>
                    {labels[s]}
                  </button>
                );
              })}
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-400">
                <LayoutDashboard size={14} /> {ta.dashboardRoutes}
              </h3>
              <div className="space-y-3">
                {filteredRoutes.filter(r => r.path.startsWith('/dashboard')).map(route => (
                  <RouteCard key={route.id} route={route} isHe={isHe} />
                ))}
              </div>
            </div>

            {filteredRoutes.some(r => !r.path.startsWith('/dashboard')) && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-400">
                  <Globe size={14} /> {ta.standalonePages}
                </h3>
                <div className="space-y-3">
                  {filteredRoutes.filter(r => !r.path.startsWith('/dashboard')).map(route => (
                    <RouteCard key={route.id} route={route} isHe={isHe} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* WIDGETS TAB */}
        {activeSection === 'widgets' && (
          <div className="space-y-2">
            {widgets.map(w => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <StatusBadge status={w.status} isHe={isHe} />
                  <div>
                    <span className="text-sm font-medium text-slate-200">{isHe ? w.nameHe : w.name}</span>
                    <span className="mx-2 text-xs text-slate-600">{isHe ? w.name : w.nameHe}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                  <code className="rounded bg-white/5 px-1.5 py-0.5" dir="ltr">{w.file}</code>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">{w.defaultSize}</span>
                  <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">{w.panelMode}</span>
                  <span>v{w.version}</span>
                  <span>{w.addedDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTEXTS TAB */}
        {activeSection === 'contexts' && (
          <div className="space-y-3">
            {contexts.map(ctx => (
              <div key={ctx.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={ctx.status} isHe={isHe} />
                    <span className="text-sm font-medium text-slate-200">{ctx.name}</span>
                    <code className="text-[10px] text-slate-600" dir="ltr">{ctx.file}</code>
                  </div>
                  <span className="text-[11px] text-slate-500">v{ctx.version}</span>
                </div>
                {ctx.storageKeys.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ctx.storageKeys.map(k => (
                      <code key={k} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400" dir="ltr">{k}</code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHANGELOG TAB */}
        {activeSection === 'changelog' && (
          <div className="space-y-6">
            {/* Checklist Summary */}
            <ChecklistSummary isHe={isHe} ta={ta} />

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-slate-500" style={{ [isHe ? 'right' : 'left']: 12 }} />
              <input
                type="text"
                value={changelogSearch}
                onChange={e => setChangelogSearch(e.target.value)}
                placeholder={ta.searchPlaceholder}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-purple-500/30 focus:bg-white/[0.03]"
                style={{ [isHe ? 'paddingRight' : 'paddingLeft']: 40, [isHe ? 'paddingLeft' : 'paddingRight']: changelogSearch ? 36 : 16 }}
                dir={isHe ? 'rtl' : 'ltr'}
              />
              {changelogSearch && (
                <button onClick={() => setChangelogSearch('')}
                  className="absolute top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-300"
                  style={{ [isHe ? 'left' : 'right']: 8 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort / Group / Filter Toolbar */}
            <ChangelogToolbar
              sortBy={clSortBy}
              sortDir={clSortDir}
              groupBy={clGroupBy}
              clFilterWorkflow={clFilterWorkflow}
              clFilterPhase={clFilterPhase}
              clFilterTechStatus={clFilterTechStatus}
              onSortChange={(field) => { setClSortBy(field); setClSortDir(field === 'name' ? 'asc' : 'desc'); }}
              onSortDirToggle={() => setClSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              onGroupChange={setClGroupBy}
              onWorkflowToggle={(ws) => setClFilterWorkflow(prev =>
                prev.includes(ws) ? prev.filter(s => s !== ws) : [...prev, ws]
              )}
              onPhaseChange={setClFilterPhase}
              onTechStatusChange={setClFilterTechStatus}
              isHe={isHe}
              ta={ta}
            />

            {/* data-cc-id System */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Hash size={15} className="text-purple-400" />
                {ta.dataCcIdSystem}
              </h3>
              <p className="mb-3 text-xs text-slate-500">{ta.dataCcIdExplanation}</p>
              <p className="mb-4 text-xs text-slate-600">{ta.dataCcIdTextExplanation}</p>

              {/* Stats */}
              <div className="mb-4 flex gap-3">
                <div className="rounded-lg bg-purple-500/10 px-3 py-2 text-center">
                  <div className="text-lg font-bold text-purple-400">{dataCcIds.length}</div>
                  <div className="text-[10px] text-slate-500">{ta.totalIds}</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-center">
                  <div className="text-lg font-bold text-blue-400">{dataCcIds.filter(d => d.textEditable).length}</div>
                  <div className="text-[10px] text-slate-500">{ta.textEditableIds}</div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center">
                  <div className="text-lg font-bold text-emerald-400">{new Set(dataCcIds.map(d => d.file)).size}</div>
                  <div className="text-[10px] text-slate-500">{ta.filesWithIds}</div>
                </div>
              </div>

              {/* ID Table */}
              <div className="space-y-1">
                {dataCcIds.map(entry => (
                  <div key={`${entry.ccId}-${entry.line}`} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs hover:bg-white/[0.03] flex-wrap">
                    <code className="min-w-[180px] rounded bg-purple-500/10 px-1.5 py-0.5 font-mono text-purple-300" dir="ltr">{entry.ccId}</code>
                    {entry.textEditable && (
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">text</span>
                    )}
                    <code className="text-[10px] text-slate-600" dir="ltr">{entry.file}:{entry.line}</code>
                    <span className="text-slate-500">{isHe ? entry.descriptionHe : entry.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Changelog */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FileCode size={15} className="text-blue-400" />
                {ta.featureStatus}
                <span className="text-xs font-normal text-slate-500">
                  — {changelogSearch
                    ? `${directMatches.length + relatedMatches.length} ${isHe ? 'תוצאות' : 'results'}`
                    : `${directMatches.length} / ${changelogEntries.length}`
                  }
                </span>
              </h3>

              {directMatches.length === 0 && relatedMatches.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-600">{ta.noSearchResults}</div>
              )}

              {/* Grouped view (no search active) */}
              {groupedEntries && !changelogSearch.trim() ? (
                <div className="space-y-4">
                  {groupedEntries.map(group => (
                    <CollapsibleRow
                      key={group.label}
                      isHe={isHe}
                      defaultOpen
                      count={group.entries.length}
                      title={
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: group.color }} />
                          <span>{group.label}</span>
                        </span>
                      }
                    >
                      <div className="space-y-3">
                        {group.entries.map(entry => (
                          <ChangelogCard key={entry.id} entry={entry} isHe={isHe} ta={ta} />
                        ))}
                      </div>
                    </CollapsibleRow>
                  ))}
                </div>
              ) : (
                <>
                  {/* Layer 1: Direct Matches */}
                  {changelogSearch && directMatches.length > 0 && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <CheckCircle2 size={12} />
                      {ta.directMatches} ({directMatches.length})
                    </div>
                  )}

                  <div className="space-y-3">
                    {directMatches.map(entry => (
                      <ChangelogCard key={entry.id} entry={entry} isHe={isHe} ta={ta} />
                    ))}
                  </div>

                  {/* Layer 2: Related & Connected */}
                  {changelogSearch && relatedMatches.length > 0 && (
                    <>
                      <div className="my-4 border-t border-white/[0.06]" />
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-400">
                        <Network size={12} />
                        {ta.relatedConnected} ({relatedMatches.length})
                      </div>
                      <div className="space-y-3">
                        {relatedMatches.map(entry => (
                          <ChangelogCard key={entry.id} entry={entry} isHe={isHe} ta={ta} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Architecture Diagram */}
            {!changelogSearch && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Network size={15} className="text-purple-400" />
                  {ta.architectureDiagram}
                </h3>
                <MermaidDiagram definition={mermaidDiagram} ta={ta} />
                <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#065f46', border: '1px solid #34d399' }} /> {ta.working}</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#78350f', border: '1px solid #fbbf24' }} /> {ta.notVerified}</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#7f1d1d', border: '1px solid #ef4444' }} /> {ta.broken}</span>
                  <span className="text-slate-700">|</span>
                  <span>[ ] = {isHe ? 'עם נתיב' : 'has route'}</span>
                  <span>( ) = {isHe ? 'ללא נתיב' : 'no route'}</span>
                  <span>-.- = {isHe ? 'מחובר ל' : 'connected to'}</span>
                </div>
              </div>
            )}

            {/* Git Status — Live */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <GitCommit size={15} className="text-emerald-400" />
                  Git Status
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">{ta.liveStatus}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">{ta.devOnly}</span>
                  <button onClick={fetchGitStatus} className="rounded p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
                    <RefreshCw size={14} className={gitLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Feedback message */}
              {actionFeedback && (
                <div className={`mb-4 rounded-lg px-3 py-2 text-xs ${actionFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {actionFeedback.message}
                </div>
              )}

              {gitLoading && !gitData ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  {ta.loadingGit}
                </div>
              ) : gitError ? (
                <div className="py-6 text-center text-sm text-red-400">{gitError}</div>
              ) : gitData ? (
                <>
                  {/* Commit + Deploy actions */}
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={commitMsg}
                      onChange={e => setCommitMsg(e.target.value)}
                      placeholder={ta.commitPlaceholder}
                      className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-purple-500/30"
                      dir={isHe ? 'rtl' : 'ltr'}
                      onKeyDown={e => { if (e.key === 'Enter' && commitMsg.trim()) handleCommit(); }}
                    />
                    <button
                      onClick={handleCommit}
                      disabled={commitLoading || !commitMsg.trim()}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {commitLoading ? <Loader2 size={14} className="animate-spin" /> : <GitCommit size={14} />}
                      {commitLoading ? ta.committing : ta.commitButton}
                    </button>
                    <button
                      onClick={handleDeploy}
                      disabled={deployLoading}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deployLoading ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                      {deployLoading ? ta.pushing : ta.deployButton}
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Commits */}
                    <div>
                      <div className="mb-2 text-[11px] font-medium text-slate-500">
                        {ta.committedChanges} ({gitData.commits.length})
                      </div>
                      <div className="space-y-1.5">
                        {gitData.commits.map(c => (
                          <div key={c.hash} className="flex items-start gap-2 text-xs">
                            <code className="mt-0.5 shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-emerald-400" dir="ltr">{c.hash}</code>
                            <span className="text-slate-400" dir="ltr">{c.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Uncommitted */}
                    <div>
                      <div className="mb-2 text-[11px] font-medium text-slate-500">
                        {ta.uncommittedChanges} ({gitData.modified.length + gitData.untracked.length})
                      </div>

                      {gitData.modified.length > 0 && (
                        <div className="mb-2">
                          <div className="mb-1 text-[10px] text-slate-600">{ta.modifiedFiles} ({gitData.modified.length})</div>
                          <div className="space-y-0.5">
                            {gitData.modified.map(f => (
                              <div key={f} className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-amber-400">M</span>
                                <code className="text-slate-500" dir="ltr">{f}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gitData.untracked.length > 0 && (
                        <div>
                          <div className="mb-1 text-[10px] text-slate-600">{ta.untrackedFiles} ({gitData.untracked.length})</div>
                          <div className="space-y-0.5">
                            {gitData.untracked.map(f => (
                              <div key={f} className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-emerald-400">+</span>
                                <code className="text-slate-500" dir="ltr">{f}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!gitData.isDirty && (
                        <div className="py-3 text-center text-xs text-slate-600">{ta.nothingToCommit}</div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Architecture Summary */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">{ta.architectureStack}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 md:grid-cols-6">
            {[
              { layer: 'UI', tool: 'Next.js 15', color: '#60a5fa' },
              { layer: 'DB + API', tool: 'Supabase', color: '#34d399' },
              { layer: 'SOT', tool: 'Origami CRM', color: '#f472b6' },
              { layer: isHe ? 'ידע' : 'Knowledge', tool: 'Notion', color: '#fbbf24' },
              { layer: isHe ? 'אוטומציה' : 'Automation', tool: 'n8n', color: '#fb923c' },
              { layer: isHe ? 'הודעות' : 'Messaging', tool: 'WATI', color: '#a78bfa' },
            ].map(s => (
              <div key={s.layer} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-center">
                <div className="text-[10px] text-slate-600">{s.layer}</div>
                <div className="font-semibold" style={{ color: s.color }}>{s.tool}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
