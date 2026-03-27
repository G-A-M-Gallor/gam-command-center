"use client";

import * as React from "react";
import { useState } from "react";
import "./globals-light.css";
import {
  Button,
  Input,
  SearchInput,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Tabs,
  Badge,
  Card,
  CardHeader,
  Alert,
  Pagination,
  EmptyState,
  ActionMenu,
  Tooltip,
  DataTable,
  FiltersBar,
  BulkActionsBar,
  StatusChip,
  EntityProfileHeader,
  KpiCard,
  Timeline,
  SummaryCard,
  FileRow,
  FilterPanel,
  Form,
  FormSection,
  FormRow,
  SingleColumnForm,
  FormActions,
  StepForm,
  KpiRow,
  RecentActivity,
  ActivityFeed,
  QuickActions,
  TablePreview,
  StatusOverview,
  TasksWidget,
  DashboardSection,
  DashboardGrid,
  WelcomeBanner,
} from "./components";
import {
  Users,
  FolderOpen,
  Plus,
  Download,
  Trash2,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  FileText,
  Settings,
  Bell,
  Search,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Briefcase,
  CreditCard,
  Target,
  Layers,
  Palette,
  Type,
  Grid3X3,
  LayoutGrid,
  FormInput,
  Table,
  PanelLeft,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM SHOWCASE PAGE
   Complete demonstration of the GAM Light Theme Design System
   ═══════════════════════════════════════════════════════════════ */

type SectionId = 
  | "colors" 
  | "typography" 
  | "layout" 
  | "buttons" 
  | "inputs" 
  | "feedback" 
  | "tables" 
  | "cards" 
  | "forms" 
  | "dashboard"
  | "rules";

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "colors", label: "צבעים", icon: <Palette className="h-4 w-4" /> },
  { id: "typography", label: "טיפוגרפיה", icon: <Type className="h-4 w-4" /> },
  { id: "layout", label: "מבנה", icon: <Grid3X3 className="h-4 w-4" /> },
  { id: "buttons", label: "כפתורים", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "inputs", label: "שדות", icon: <FormInput className="h-4 w-4" /> },
  { id: "feedback", label: "משוב", icon: <Bell className="h-4 w-4" /> },
  { id: "tables", label: "טבלאות", icon: <Table className="h-4 w-4" /> },
  { id: "cards", label: "כרטיסים", icon: <Layers className="h-4 w-4" /> },
  { id: "forms", label: "טפסים", icon: <FileText className="h-4 w-4" /> },
  { id: "dashboard", label: "לוח בקרה", icon: <PanelLeft className="h-4 w-4" /> },
  { id: "rules", label: "חוקי עיצוב", icon: <Settings className="h-4 w-4" /> },
];

export default function DesignSystemShowcase() {
  const [activeSection, setActiveSection] = useState<SectionId>("colors");

  return (
    <div dir="rtl" lang="he" data-theme="light" className="min-h-screen bg-[var(--bg-subtle)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-base)] bg-[var(--surface-base)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white font-bold text-sm">
              G
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">GAM Design System</h1>
              <p className="text-xs text-[var(--text-muted)]">Light Theme — Hebrew RTL</p>
            </div>
          </div>
          <Badge variant="primary">v1.0</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-48 shrink-0 sticky top-20 self-start space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${activeSection === section.id
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeSection === "colors" && <ColorsSection />}
            {activeSection === "typography" && <TypographySection />}
            {activeSection === "layout" && <LayoutSection />}
            {activeSection === "buttons" && <ButtonsSection />}
            {activeSection === "inputs" && <InputsSection />}
            {activeSection === "feedback" && <FeedbackSection />}
            {activeSection === "tables" && <TablesSection />}
            {activeSection === "cards" && <CardsSection />}
            {activeSection === "forms" && <FormsSection />}
            {activeSection === "dashboard" && <DashboardSectionDemo />}
            {activeSection === "rules" && <RulesSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: COLORS
   ═══════════════════════════════════════════════════════════════ */

function ColorsSection() {
  const colorGroups = [
    {
      title: "Primary — כחול עמוק",
      description: "צבע ראשי לפעולות, קישורים וגורמי מיקוד",
      colors: [
        { name: "50", value: "#EFF6FF", textDark: true },
        { name: "100", value: "#DBEAFE", textDark: true },
        { name: "200", value: "#BFDBFE", textDark: true },
        { name: "300", value: "#93C5FD", textDark: true },
        { name: "400", value: "#60A5FA", textDark: true },
        { name: "500", value: "#3B82F6", textDark: false },
        { name: "600", value: "#2563EB", textDark: false },
        { name: "700", value: "#1D4ED8", textDark: false },
        { name: "800", value: "#1E40AF", textDark: false },
        { name: "900", value: "#1E3A8A", textDark: false },
      ],
    },
    {
      title: "Secondary — אפור",
      description: "ניטרלים לרקע, משטחים וטקסט",
      colors: [
        { name: "50", value: "#F8FAFC", textDark: true },
        { name: "100", value: "#F1F5F9", textDark: true },
        { name: "200", value: "#E2E8F0", textDark: true },
        { name: "300", value: "#CBD5E1", textDark: true },
        { name: "400", value: "#94A3B8", textDark: true },
        { name: "500", value: "#64748B", textDark: false },
        { name: "600", value: "#475569", textDark: false },
        { name: "700", value: "#334155", textDark: false },
        { name: "800", value: "#1E293B", textDark: false },
        { name: "900", value: "#0F172A", textDark: false },
      ],
    },
  ];

  const statusColors = [
    { name: "Success", color: "#059669", bg: "#ECFDF5", use: "הצלחה, פעיל, אישור" },
    { name: "Warning", color: "#D97706", bg: "#FFFBEB", use: "אזהרה, ממתין, תשומת לב" },
    { name: "Error", color: "#DC2626", bg: "#FEF2F2", use: "שגיאה, ביטול, סכנה" },
    { name: "Info", color: "#0284C7", bg: "#F0F9FF", use: "מידע, עזרה, הודעה" },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="מערכת צבעים"
        description="פלטת צבעים מקצועית לממשק SaaS עסקי — שליטה, בהירות, אמון"
      />

      {colorGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{group.title}</h3>
            <p className="text-sm text-[var(--text-muted)]">{group.description}</p>
          </div>
          <div className="flex gap-1 overflow-hidden rounded-xl">
            {group.colors.map((color) => (
              <div
                key={color.name}
                className="flex-1 py-6 flex flex-col items-center gap-1"
                style={{ backgroundColor: color.value }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: color.textDark ? "#0F172A" : "#FFFFFF" }}
                >
                  {color.name}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: color.textDark ? "#64748B" : "rgba(255,255,255,0.7)" }}
                >
                  {color.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">צבעי סטטוס</h3>
        <div className="grid grid-cols-4 gap-4">
          {statusColors.map((status) => (
            <div
              key={status.name}
              className="rounded-lg border border-[var(--border-base)] overflow-hidden"
            >
              <div className="h-16" style={{ backgroundColor: status.color }} />
              <div className="p-3" style={{ backgroundColor: status.bg }}>
                <p className="font-medium text-sm" style={{ color: status.color }}>
                  {status.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{status.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: TYPOGRAPHY
   ═══════════════════════════════════════════════════════════════ */

function TypographySection() {
  const typeScale = [
    { name: "Page Title", className: "text-page-title", sample: "כותרת עמוד ראשית", size: "24px / Bold" },
    { name: "Section Title", className: "text-section-title", sample: "כותרת מקטע", size: "18px / SemiBold" },
    { name: "Card Title", className: "text-card-title", sample: "כותרת כרטיס", size: "15px / SemiBold" },
    { name: "Body Text", className: "text-sm text-[var(--text-primary)]", sample: "טקסט גוף רגיל לתוכן ופסקאות", size: "14px / Regular" },
    { name: "Table Text", className: "text-table", sample: "טקסט לשורות טבלה ונתונים", size: "13px / Regular" },
    { name: "Label", className: "text-label", sample: "תווית שדה בטופס", size: "13px / Medium" },
    { name: "Helper Text", className: "text-helper", sample: "טקסט עזרה והסבר נוסף", size: "12px / Regular" },
    { name: "Status Text", className: "text-status", sample: "פעיל", size: "12px / Medium / Uppercase" },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="מערכת טיפוגרפיה"
        description="היררכיה ברורה, קריאות גבוהה — מותאם לעברית RTL"
      />

      <Card>
        <div className="divide-y divide-[var(--border-subtle)]">
          {typeScale.map((type) => (
            <div key={type.name} className="flex items-center justify-between py-4 px-4">
              <div className="flex-1">
                <p className={type.className}>{type.sample}</p>
              </div>
              <div className="text-end">
                <p className="text-sm font-medium text-[var(--text-primary)]">{type.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{type.size}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title="גופנים" subtitle="Inter + Heebo לתמיכה מלאה בעברית" />
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[var(--text-primary)]" style={{ fontFamily: "Inter, sans-serif" }}>
              Inter — Primary sans-serif font
            </p>
            <p className="text-sm text-[var(--text-primary)]" style={{ fontFamily: "Heebo, sans-serif" }}>
              Heebo — תמיכה מלאה בעברית
            </p>
            <p className="text-sm text-[var(--text-muted)] font-mono">
              JetBrains Mono — קוד ומונו
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="משקלים" subtitle="4 משקלים בשימוש" />
          <div className="mt-4 space-y-3">
            <p className="text-sm font-normal">Regular (400) — טקסט גוף</p>
            <p className="text-sm font-medium">Medium (500) — תוויות</p>
            <p className="text-sm font-semibold">SemiBold (600) — כותרות</p>
            <p className="text-sm font-bold">Bold (700) — כותרות ראשיות</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: LAYOUT
   ═══════════════════════════════════════════════════════════════ */

function LayoutSection() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="מערכת מבנה"
        description="RTL כברירת מחדל, סרגל צד מימין, רשת 8px"
      />

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Spacing Scale" subtitle="מבוסס רשת 8px" />
          <div className="mt-4 space-y-2">
            {[
              { name: "spacing-1", value: "4px", px: 4 },
              { name: "spacing-2", value: "8px", px: 8 },
              { name: "spacing-3", value: "12px", px: 12 },
              { name: "spacing-4", value: "16px", px: 16 },
              { name: "spacing-6", value: "24px", px: 24 },
              { name: "spacing-8", value: "32px", px: 32 },
            ].map((space) => (
              <div key={space.name} className="flex items-center gap-3">
                <div
                  className="bg-[var(--color-primary)] h-4"
                  style={{ width: space.px * 2 }}
                />
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {space.name} = {space.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Border Radius" subtitle="פינות מעוגלות בינוניות" />
          <div className="mt-4 flex flex-wrap gap-4">
            {[
              { name: "sm", value: "4px" },
              { name: "md", value: "6px" },
              { name: "lg", value: "8px" },
              { name: "xl", value: "12px" },
              { name: "2xl", value: "16px" },
              { name: "full", value: "9999px" },
            ].map((radius) => (
              <div key={radius.name} className="text-center">
                <div
                  className="h-12 w-12 bg-[var(--color-primary-100)] border border-[var(--color-primary-300)]"
                  style={{ borderRadius: radius.value }}
                />
                <p className="mt-2 text-xs font-mono text-[var(--text-muted)]">{radius.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="מבנה עמוד RTL" subtitle="סרגל צד מימין, תוכן משמאל" />
        <div className="mt-4 rounded-lg border border-[var(--border-base)] overflow-hidden">
          <div className="flex h-64">
            {/* Content Area */}
            <div className="flex-1 bg-[var(--bg-subtle)] p-4">
              <div className="h-8 w-full rounded bg-[var(--color-secondary-200)] mb-4" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 rounded bg-[var(--surface-base)] border border-[var(--border-base)]" />
                <div className="h-20 rounded bg-[var(--surface-base)] border border-[var(--border-base)]" />
                <div className="h-20 rounded bg-[var(--surface-base)] border border-[var(--border-base)]" />
              </div>
            </div>
            {/* Sidebar */}
            <div className="w-48 bg-[var(--surface-base)] border-s border-[var(--border-base)] p-3">
              <div className="h-6 w-full rounded bg-[var(--color-primary-100)] mb-4" />
              <div className="space-y-2">
                <div className="h-8 rounded bg-[var(--color-primary-50)]" />
                <div className="h-8 rounded bg-[var(--surface-hover)]" />
                <div className="h-8 rounded bg-[var(--surface-hover)]" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: BUTTONS
   ═══════════════════════════════════════════════════════════════ */

function ButtonsSection() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="כפתורים"
        description="6 וריאנטים, 3 גדלים — עקבי בכל המערכת"
      />

      <Card>
        <CardHeader title="וריאנטים" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="גדלים" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="עם אייקונים" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
            הוסף חדש
          </Button>
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            הורדה
          </Button>
          <Button variant="ghost" icon={<Settings className="h-4 w-4" />}>
            הגדרות
          </Button>
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />}>
            מחק
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="מצבים" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" loading>טוען...</Button>
          <Button variant="primary" disabled>מושבת</Button>
          <Button variant="outline" disabled>מושבת</Button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: INPUTS
   ═══════════════════════════════════════════════════════════════ */

function InputsSection() {
  const [searchValue, setSearchValue] = useState("");
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState("");

  return (
    <div className="space-y-10">
      <SectionHeader
        title="שדות קלט"
        description="שדות רציניים, ברורים וללא חיכוך"
      />

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Input" />
          <div className="mt-4 space-y-4">
            <Input label="שם מלא" placeholder="הכנס שם" required />
            <Input label="אימייל" type="email" placeholder="example@email.com" />
            <Input label="עם שגיאה" error helperText="שדה חובה" />
            <Input label="מושבת" disabled value="ערך מושבת" />
          </div>
        </Card>

        <Card>
          <CardHeader title="חיפוש" />
          <div className="mt-4 space-y-4">
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue("")}
              placeholder="חיפוש..."
            />
            <Textarea label="תיאור" placeholder="הכנס תיאור..." rows={3} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Select" />
          <div className="mt-4">
            <Select
              label="בחר אפשרות"
              placeholder="בחר..."
              options={[
                { value: "1", label: "אפשרות 1" },
                { value: "2", label: "אפשרות 2" },
                { value: "3", label: "אפשרות 3" },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Checkbox & Radio" />
          <div className="mt-4 space-y-4">
            <Checkbox
              checked={checkboxValue}
              onChange={setCheckboxValue}
              label="אני מסכים לתנאים"
              description="יש לקרוא את התנאים לפני האישור"
            />
            <RadioGroup
              label="בחר סוג"
              options={[
                { value: "a", label: "אפשרות א" },
                { value: "b", label: "אפשרות ב" },
              ]}
              value={radioValue}
              onChange={setRadioValue}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: FEEDBACK
   ═══════════════════════════════════════════════════════════════ */

function FeedbackSection() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-10">
      <SectionHeader
        title="משוב ומצבים"
        description="Badges, Alerts, Status Chips, Tabs"
      />

      <Card>
        <CardHeader title="Badges" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="default">ברירת מחדל</Badge>
          <Badge variant="primary">ראשי</Badge>
          <Badge variant="success">הצלחה</Badge>
          <Badge variant="warning">אזהרה</Badge>
          <Badge variant="error">שגיאה</Badge>
          <Badge variant="info">מידע</Badge>
          <Badge variant="success" dot>עם נקודה</Badge>
          <Badge variant="primary" removable onRemove={() => {}}>ניתן להסרה</Badge>
        </div>
      </Card>

      <Card>
        <CardHeader title="Status Chips" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusChip status="active" />
          <StatusChip status="pending" />
          <StatusChip status="completed" />
          <StatusChip status="paused" />
          <StatusChip status="cancelled" />
          <StatusChip status="error" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Alerts" />
        <div className="mt-4 space-y-3">
          <Alert variant="info" title="הודעה">זוהי הודעת מידע כללית.</Alert>
          <Alert variant="success" title="הצלחה">הפעולה הושלמה בהצלחה.</Alert>
          <Alert variant="warning" title="אזהרה">יש לשים לב לפרטים הבאים.</Alert>
          <Alert variant="error" title="שגיאה" dismissible>אירעה שגיאה בעת ביצוע הפעולה.</Alert>
        </div>
      </Card>

      <Card>
        <CardHeader title="Tabs" />
        <div className="mt-4 space-y-6">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">Underline</p>
            <Tabs
              tabs={[
                { id: "all", label: "הכל", count: 24 },
                { id: "active", label: "פעילים", count: 12 },
                { id: "pending", label: "ממתינים", count: 8 },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">Pills</p>
            <Tabs
              tabs={[
                { id: "all", label: "הכל" },
                { id: "active", label: "פעילים" },
                { id: "pending", label: "ממתינים" },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: TABLES
   ═══════════════════════════════════════════════════════════════ */

function TablesSection() {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [searchValue, setSearchValue] = useState("");

  const sampleData = [
    { id: 1, name: "ישראל ישראלי", email: "israel@example.com", status: "active", role: "מנהל" },
    { id: 2, name: "שרה כהן", email: "sarah@example.com", status: "pending", role: "עובד" },
    { id: 3, name: "דוד לוי", email: "david@example.com", status: "active", role: "עובד" },
  ];

  const columns = [
    { id: "name", header: "שם", accessor: (row: typeof sampleData[0]) => row.name, sortable: true },
    { id: "email", header: "אימייל", accessor: (row: typeof sampleData[0]) => row.email },
    { 
      id: "status", 
      header: "סטטוס", 
      accessor: (row: typeof sampleData[0]) => <StatusChip status={row.status as "active" | "pending"} size="sm" /> 
    },
    { id: "role", header: "תפקיד", accessor: (row: typeof sampleData[0]) => row.role },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="טבלאות נתונים"
        description="טבלאות פרימיום וקלות לסריקה לנתוני CRM"
      />

      <FiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="חיפוש אנשי קשר..."
        filters={[
          {
            id: "status",
            label: "סטטוס",
            options: [
              { id: "active", label: "פעיל", count: 12 },
              { id: "pending", label: "ממתין", count: 5 },
            ],
            onChange: () => {},
          },
        ]}
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} size="sm">
            הוסף איש קשר
          </Button>
        }
      />

      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            { id: "export", label: "ייצא", icon: <Download className="h-4 w-4" />, onClick: () => {} },
            { id: "delete", label: "מחק", icon: <Trash2 className="h-4 w-4" />, variant: "danger", onClick: () => {} },
          ]}
        />
      )}

      <DataTable
        columns={columns}
        data={sampleData}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => console.log("Clicked:", row)}
      />

      <Card className="mt-8">
        <CardHeader title="Entity Profile Header" />
        <div className="mt-4">
          <EntityProfileHeader
            avatar={<User className="h-8 w-8 text-[var(--text-muted)]" />}
            title="ישראל ישראלי"
            subtitle="מנהל פרויקטים | חברת ABC"
            status="active"
            metadata={[
              { icon: <Mail className="h-4 w-4" />, label: "israel@example.com" },
              { icon: <Phone className="h-4 w-4" />, label: "050-1234567" },
              { icon: <MapPin className="h-4 w-4" />, label: "תל אביב" },
            ]}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<Edit3 className="h-4 w-4" />}>עריכה</Button>
                <Button variant="primary" size="sm" icon={<Mail className="h-4 w-4" />}>שלח מייל</Button>
              </div>
            }
          />
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: CARDS
   ═══════════════════════════════════════════════════════════════ */

function CardsSection() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="כרטיסים ומידע"
        description="כרטיסים מובנים ופעילותיים"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader title="כרטיס בסיסי" subtitle="עם כותרת ותיאור" />
          <p className="mt-3 text-sm text-[var(--text-muted)]">תוכן הכרטיס נמצא כאן.</p>
        </Card>
        <Card variant="bordered">
          <CardHeader title="Bordered" subtitle="עם גבול כפול" />
          <p className="mt-3 text-sm text-[var(--text-muted)]">תוכן הכרטיס נמצא כאן.</p>
        </Card>
        <Card variant="elevated">
          <CardHeader title="Elevated" subtitle="עם צל" />
          <p className="mt-3 text-sm text-[var(--text-muted)]">תוכן הכרטיס נמצא כאן.</p>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="לקוחות"
          value="1,234"
          change={{ value: 12, label: "מהחודש שעבר" }}
          trend="up"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="הכנסות"
          value="₪45,200"
          change={{ value: -3 }}
          trend="down"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <KpiCard
          title="פרויקטים"
          value="28"
          change={{ value: 0 }}
          trend="neutral"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <KpiCard
          title="משימות"
          value="156"
          icon={<Target className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <SummaryCard
          title="פרטי איש קשר"
          items={[
            { icon: <User className="h-4 w-4" />, label: "שם", value: "ישראל ישראלי" },
            { icon: <Mail className="h-4 w-4" />, label: "אימייל", value: "israel@example.com" },
            { icon: <Phone className="h-4 w-4" />, label: "טלפון", value: "050-1234567" },
            { icon: <Building2 className="h-4 w-4" />, label: "חברה", value: "חברת ABC בע״מ" },
          ]}
          action={<Button variant="ghost" size="sm" icon={<Edit3 className="h-4 w-4" />}>עריכה</Button>}
        />

        <Card>
          <CardHeader title="קבצים" />
          <div className="mt-4 space-y-2">
            <FileRow
              name="הסכם שירות.pdf"
              type="pdf"
              size="2.4 MB"
              date="15/01/2024"
              status="completed"
              actions={[
                { id: "download", label: "הורד", icon: <Download className="h-4 w-4" />, onClick: () => {} },
                { id: "delete", label: "מחק", icon: <Trash2 className="h-4 w-4" />, onClick: () => {} },
              ]}
            />
            <FileRow
              name="הצעת מחיר.docx"
              type="doc"
              size="1.1 MB"
              date="12/01/2024"
              status="pending"
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="ציר זמן" />
        <div className="mt-4">
          <Timeline
            items={[
              {
                id: "1",
                title: "נוצר איש קשר חדש",
                description: "ישראל ישראלי נוסף למערכת",
                timestamp: "לפני 2 שעות",
                user: { name: "שרה כהן" },
                icon: <User className="h-4 w-4" />,
              },
              {
                id: "2",
                title: "נשלח מייל",
                description: "מייל ברוכים הבאים נשלח ללקוח",
                timestamp: "לפני 1 שעה",
                user: { name: "מערכת" },
                icon: <Mail className="h-4 w-4" />,
                iconBg: "bg-[var(--color-info-light)] text-[var(--color-info)]",
              },
              {
                id: "3",
                title: "עודכן סטטוס",
                description: "סטטוס שונה ל״פעיל״",
                timestamp: "לפני 30 דקות",
                user: { name: "דוד לוי" },
                icon: <CheckCircle2 className="h-4 w-4" />,
                iconBg: "bg-[var(--color-success-light)] text-[var(--color-success)]",
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: FORMS
   ═══════════════════════════════════════════════════════════════ */

function FormsSection() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="דפוסי טפסים"
        description="טפסים רציניים, ברורים וללא חיכוך"
      />

      <Card>
        <CardHeader title="טופס עמודה אחת" />
        <div className="mt-4">
          <SingleColumnForm
            actions={
              <>
                <Button variant="outline">ביטול</Button>
                <Button variant="primary">שמור</Button>
              </>
            }
          >
            <Input label="שם מלא" required placeholder="הכנס שם" />
            <Input label="אימייל" type="email" placeholder="example@email.com" />
            <Select
              label="סוג"
              options={[
                { value: "customer", label: "לקוח" },
                { value: "lead", label: "ליד" },
              ]}
            />
            <Textarea label="הערות" placeholder="הכנס הערות..." />
          </SingleColumnForm>
        </div>
      </Card>

      <Card>
        <CardHeader title="טופס שתי עמודות" />
        <div className="mt-4">
          <FormRow columns={2}>
            <Input label="שם פרטי" required />
            <Input label="שם משפחה" required />
          </FormRow>
          <FormRow columns={2}>
            <Input label="אימייל" type="email" />
            <Input label="טלפון" type="tel" />
          </FormRow>
          <FormRow columns={2}>
            <Select
              label="עיר"
              options={[
                { value: "tlv", label: "תל אביב" },
                { value: "jlm", label: "ירושלים" },
              ]}
            />
            <Input label="כתובת" />
          </FormRow>
        </div>
      </Card>

      <Card>
        <CardHeader title="טופס צעדים" />
        <div className="mt-4">
          <StepForm
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            steps={[
              {
                id: "basic",
                title: "פרטים בסיסיים",
                content: (
                  <div className="space-y-4">
                    <Input label="שם מלא" required />
                    <Input label="אימייל" type="email" required />
                  </div>
                ),
              },
              {
                id: "contact",
                title: "פרטי קשר",
                content: (
                  <div className="space-y-4">
                    <Input label="טלפון" type="tel" />
                    <Input label="כתובת" />
                  </div>
                ),
              },
              {
                id: "confirm",
                title: "אישור",
                content: (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-[var(--color-success)] mx-auto mb-3" />
                    <p className="text-[var(--text-primary)]">בדוק את הפרטים ואשר</p>
                  </div>
                ),
              },
            ]}
            onComplete={() => alert("Completed!")}
          />
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

function DashboardSectionDemo() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="דפוסי לוח בקרה"
        description="רכיבים לבניית דשבורדים"
      />

      <WelcomeBanner
        greeting="בוקר טוב"
        userName="ישראל"
        subtitle="יש לך 5 משימות לביצוע היום"
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
            פעולה חדשה
          </Button>
        }
      />

      <KpiRow
        items={[
          { id: "1", title: "לקוחות פעילים", value: 1234, change: { value: 12 }, trend: "up", icon: <Users className="h-5 w-5" /> },
          { id: "2", title: "הכנסות החודש", value: "₪125K", change: { value: 8 }, trend: "up", icon: <TrendingUp className="h-5 w-5" /> },
          { id: "3", title: "פרויקטים פתוחים", value: 28, change: { value: -2 }, trend: "down", icon: <Briefcase className="h-5 w-5" /> },
          { id: "4", title: "משימות לביצוע", value: 15, icon: <Target className="h-5 w-5" /> },
        ]}
      />

      <DashboardGrid columns={2}>
        <RecentActivity
          items={[
            { id: "1", title: "נוסף לקוח חדש", description: "ישראל ישראלי", timestamp: "לפני 5 דקות", user: { name: "שרה" }, icon: <User className="h-4 w-4" /> },
            { id: "2", title: "נשלח מסמך לחתימה", timestamp: "לפני 15 דקות", user: { name: "דוד" }, icon: <FileText className="h-4 w-4" /> },
            { id: "3", title: "הושלמה משימה", timestamp: "לפני 1 שעה", user: { name: "מיכל" }, icon: <CheckCircle2 className="h-4 w-4" />, iconBg: "bg-[var(--color-success-light)] text-[var(--color-success)]" },
          ]}
          onViewAll={() => {}}
        />

        <TasksWidget
          tasks={[
            { id: "1", title: "להתקשר ללקוח ABC", dueDate: "היום", priority: "high" },
            { id: "2", title: "לשלוח הצעת מחיר", dueDate: "מחר", priority: "medium", assignee: "שרה" },
            { id: "3", title: "לעדכן דוחות", priority: "low", completed: true },
          ]}
          onAddTask={() => {}}
          onViewAll={() => {}}
        />
      </DashboardGrid>

      <DashboardGrid columns={2}>
        <StatusOverview
          items={[
            { status: "active", count: 45 },
            { status: "pending", count: 12 },
            { status: "completed", count: 89 },
            { status: "cancelled", count: 3 },
          ]}
        />

        <QuickActions
          actions={[
            { id: "1", icon: <Plus className="h-6 w-6" />, label: "לקוח חדש", onClick: () => {}, variant: "primary" },
            { id: "2", icon: <FileText className="h-6 w-6" />, label: "מסמך חדש", onClick: () => {} },
            { id: "3", icon: <Mail className="h-6 w-6" />, label: "שלח מייל", onClick: () => {} },
            { id: "4", icon: <Calendar className="h-6 w-6" />, label: "קבע פגישה", onClick: () => {} },
          ]}
          columns={4}
        />
      </DashboardGrid>

      {/* Activity Feed - Compact Status-Based Activity */}
      <Card>
        <CardHeader title="Activity Feed (קומפקטי)" />
        <div className="mt-4">
          <ActivityFeed
            activities={[
              { id: "1", title: "הוזמנה חבילה #12345", description: "נשלח אימייל אישור ללקוח", time: "לפני 2 דק׳", status: "success" },
              { id: "2", title: "ממתין לאישור תשלום", description: "עסקה בסך ₪1,500", time: "לפני 10 דק׳", status: "pending" },
              { id: "3", title: "שגיאה בסנכרון נתונים", description: "נכשל חיבור ל-API", time: "לפני 25 דק׳", status: "error" },
              { id: "4", title: "עודכן פרופיל משתמש", description: "שרה כהן עדכנה פרטים", time: "לפני 1 שעה", status: "info" },
              { id: "5", title: "נוספה משימה חדשה", description: "התקשרות ללקוח חדש", time: "לפני 2 שעות", status: "success" },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: DESIGN RULES
   ═══════════════════════════════════════════════════════════════ */

function RulesSection() {
  const rules = [
    {
      category: "עקרונות יסוד",
      items: [
        "השתמש רק ברכיבים קיימים מתוך מערכת העיצוב",
        "אל תמציא סגנונות חדשים לכל מסך",
        "שמור על אותו לוגיקת ריווח בכל המסכים",
        "שמור על אותו לוגיקת פינות מעוגלות",
        "שמור על אותה משמעות צבעי סטטוס",
      ],
    },
    {
      category: "מבנה עמוד",
      items: [
        "RTL כברירת מחדל — סרגל צד מימין",
        "Header קבוע בגובה 56px",
        "שמור על מבנה כותרת ועמוד אחיד",
        "השתמש ברשת 8px לכל הריווחים",
        "מקסימום רוחב תוכן: 1400px",
      ],
    },
    {
      category: "צבעים",
      items: [
        "Primary (כחול) — פעולות ראשיות, קישורים, מיקוד",
        "Success (ירוק) — פעיל, הושלם, אישור",
        "Warning (כתום) — אזהרה, ממתין, תשומת לב",
        "Error (אדום) — שגיאה, ביטול, סכנה",
        "Info (תכלת) — מידע, עזרה, הודעה",
      ],
    },
    {
      category: "טיפוגרפיה",
      items: [
        "Page Title: 24px / Bold — כותרת עמוד",
        "Section Title: 18px / SemiBold — כותרת מקטע",
        "Card Title: 15px / SemiBold — כותרת כרטיס",
        "Body: 14px / Regular — טקסט גוף",
        "Helper: 12px / Regular — טקסט עזרה",
      ],
    },
    {
      category: "רכיבים",
      items: [
        "כפתורים: Primary לפעולות עיקריות, Outline למשניות",
        "טפסים: תווית מעל השדה, שגיאות באדום מתחת",
        "טבלאות: Header אפור, שורות עם hover, checkbox לבחירה",
        "כרטיסים: גבול דק, צל עדין, padding 16-24px",
        "Modals: צל גדול, רקע כהה מעומעם",
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="חוקי עיצוב"
        description="כללים למסכים עתידיים — שמור על עקביות"
      />

      <div className="grid grid-cols-2 gap-6">
        {rules.map((rule) => (
          <Card key={rule.category}>
            <CardHeader title={rule.category} />
            <ul className="mt-4 space-y-2">
              {rule.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[var(--color-success)]" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Alert variant="info" title="עקרון מנחה">
        <strong>עקביות מעל ניסוי.</strong> השתמש תמיד ברכיבים הקיימים במערכת העיצוב. 
        אל תצור סגנונות חדשים לכל מסך — שמור על שפה ויזואלית אחידה בכל המערכת.
      </Alert>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-page-title">{title}</h2>
      <p className="mt-2 text-base text-[var(--text-muted)]">{description}</p>
    </div>
  );
}
