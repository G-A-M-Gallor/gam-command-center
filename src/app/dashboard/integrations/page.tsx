"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Plug, Plus, Trash2, ExternalLink, CheckCircle2, XCircle, RefreshCw,
  Globe,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────

interface Connection {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  url?: string;
}

const CONNECTIONS_KEY = "cc-integrations-connections";

// ─── Built-in connection types ──────────────────────────

const CONNECTION_TYPES = [
  { type: "webhook", icon: "🔗", label: { he: "Webhook", en: "Webhook", ru: "Webhook" } },
  { type: "api", icon: "🌐", label: { he: "API חיצוני", en: "External API", ru: "Внешний API" } },
  { type: "database", icon: "🗃️", label: { he: "מסד נתונים", en: "Database", ru: "База данных" } },
  { type: "email", icon: "📧", label: { he: "שירות מייל", en: "Email Service", ru: "Почтовый сервис" } },
  { type: "messaging", icon: "💬", label: { he: "הודעות", en: "Messaging", ru: "Сообщения" } },
  { type: "calendar", icon: "📅", label: { he: "יומן", en: "Calendar", ru: "Календарь" } },
  { type: "storage", icon: "📁", label: { he: "אחסון", en: "Storage", ru: "Хранилище" } },
  { type: "custom", icon: "⚡", label: { he: "מותאם אישית", en: "Custom", ru: "Пользовательский" } },
];

// ─── Helpers ────────────────────────────────────────────

function loadConnections(): Connection[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConnections(connections: Connection[]) {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

// ─── Component ──────────────────────────────────────────

export default function IntegrationsPage() {
  const { language } = useSettings();
  const isRtl = language === "he";

  const [connections, setConnections] = useState<Connection[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("webhook");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    // Defer to avoid cascading setState
    const timer = setTimeout(() => {
      setConnections(loadConnections());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const addConnection = () => {
    if (!newName.trim()) return;
    const conn: Connection = {
      id: `conn-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      icon: CONNECTION_TYPES.find((c) => c.type === newType)?.icon || "⚡",
      status: "disconnected",
      url: newUrl.trim() || undefined,
    };
    const next = [...connections, conn];
    setConnections(next);
    saveConnections(next);
    setNewName("");
    setNewUrl("");
    setShowAdd(false);
  };

  const removeConnection = (id: string) => {
    const next = connections.filter((c) => c.id !== id);
    setConnections(next);
    saveConnections(next);
  };

  const toggleStatus = (id: string) => {
    const next = connections.map((c) =>
      c.id === id
        ? { ...c, status: (c.status === "connected" ? "disconnected" : "connected") as Connection["status"], lastSync: c.status !== "connected" ? new Date().toISOString() : c.lastSync }
        : c
    );
    setConnections(next);
    saveConnections(next);
  };

  const statusIcon = (status: Connection["status"]) => {
    switch (status) {
      case "connected": return <CheckCircle2 size={16} className="text-emerald-400" />;
      case "error": return <XCircle size={16} className="text-red-400" />;
      default: return <XCircle size={16} className="text-slate-500" />;
    }
  };

  const labels = {
    he: {
      title: "החיבורים שלי",
      subtitle: "ניהול חיבורים לשירותים חיצוניים",
      addNew: "חיבור חדש",
      name: "שם החיבור",
      type: "סוג",
      url: "כתובת (אופציונלי)",
      add: "הוסף",
      cancel: "ביטול",
      noConnections: "אין חיבורים עדיין",
      noConnectionsDesc: "הוסף חיבור ראשון לשירות חיצוני",
      connected: "מחובר",
      disconnected: "מנותק",
      error: "שגיאה",
      remove: "הסר",
      toggle: "החלף סטטוס",
    },
    en: {
      title: "My Connections",
      subtitle: "Manage connections to external services",
      addNew: "New Connection",
      name: "Connection Name",
      type: "Type",
      url: "URL (optional)",
      add: "Add",
      cancel: "Cancel",
      noConnections: "No connections yet",
      noConnectionsDesc: "Add your first connection to an external service",
      connected: "Connected",
      disconnected: "Disconnected",
      error: "Error",
      remove: "Remove",
      toggle: "Toggle status",
    },
    ru: {
      title: "Мои подключения",
      subtitle: "Управление подключениями к внешним сервисам",
      addNew: "Новое подключение",
      name: "Название",
      type: "Тип",
      url: "URL (необязательно)",
      add: "Добавить",
      cancel: "Отмена",
      noConnections: "Нет подключений",
      noConnectionsDesc: "Добавьте первое подключение к внешнему сервису",
      connected: "Подключено",
      disconnected: "Отключено",
      error: "Ошибка",
      remove: "Удалить",
      toggle: "Переключить статус",
    },
  };
  const l = labels[language];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Plug size={28} className="text-[var(--cc-accent-400)]" />
            {l.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{l.subtitle}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--cc-accent-500)] transition-colors"
        >
          <Plus size={16} />
          {l.addNew}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: l.connected, count: connections.filter((c) => c.status === "connected").length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: l.disconnected, count: connections.filter((c) => c.status === "disconnected").length, color: "text-slate-400", bg: "bg-slate-500/10" },
          { label: l.error, count: connections.filter((c) => c.status === "error").length, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-slate-700/50 ${stat.bg} p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
            <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Add Connection Form */}
      {showAdd && (
        <div className="rounded-xl border border-[var(--cc-accent-500)]/30 bg-slate-800/50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={l.name}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
              autoFocus
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-[var(--cc-accent-500)]"
            >
              {CONNECTION_TYPES.map((ct) => (
                <option key={ct.type} value={ct.type}>
                  {ct.icon} {ct.label[language]}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={l.url}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
            onKeyDown={(e) => e.key === "Enter" && addConnection()}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowAdd(false); setNewName(""); setNewUrl(""); }}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              {l.cancel}
            </button>
            <button
              onClick={addConnection}
              disabled={!newName.trim()}
              className="rounded-lg bg-[var(--cc-accent-600)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--cc-accent-500)] transition-colors disabled:opacity-40"
            >
              {l.add}
            </button>
          </div>
        </div>
      )}

      {/* Connections List */}
      {connections.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mb-4">
            <Plug size={32} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300">{l.noConnections}</h3>
          <p className="mt-1 text-sm text-slate-500">{l.noConnectionsDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-xl">{conn.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">{conn.name}</span>
                  <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400">
                    {CONNECTION_TYPES.find((ct) => ct.type === conn.type)?.label[language] || conn.type}
                  </span>
                </div>
                {conn.url && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Globe size={10} className="text-slate-500" />
                    <span className="text-[11px] text-slate-500 truncate">{conn.url}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {statusIcon(conn.status)}
                <button
                  onClick={() => toggleStatus(conn.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                  title={l.toggle}
                >
                  <RefreshCw size={14} />
                </button>
                {conn.url && (
                  <a
                    href={conn.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => removeConnection(conn.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title={l.remove}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
