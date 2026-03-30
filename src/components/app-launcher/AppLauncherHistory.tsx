"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { _X, _Clock, Database, History, _ExternalLink } from "lucide-react";
import { _getTranslations } from "@/lib/i18n";
import { APP_DATA_REGISTRY, hasAppData } from "@/lib/app-launcher/appDataRegistry";
import { fetchRecentRecords, type RecentRecord } from "@/lib/app-launcher/appDataQueries";
import type { LauncherItem } from "@/lib/app-launcher/types";

const RECENT_PAGES_KEY = "cc-recent-pages";

interface RecentPage {
  href: string;
  label: string;
  timestamp: number;
}

interface Props {
  selectedItem: LauncherItem | null;
  onClose: () => void;
  language: "he" | "en" | "ru";
}

type Tab = "entities" | "history";

function formatTimestamp(ts: string | number, language: "he" | "en" | "ru"): string {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const _t = getTranslations(language);

    if (diffMins < 1) return t.appLauncher.justNow;
    if (diffMins < 60) return t.appLauncher.minutesAgo.replace("{minutes}", diffMins.toString());
    if (diffHours < 24) return t.appLauncher.hoursAgo.replace("{hours}", diffHours.toString());
    if (diffDays < 7) return t.appLauncher.daysAgo.replace("{days}", diffDays.toString());

    const locale = language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function AppLauncherHistory({ selectedItem, onClose, language }: Props) {
  const _router = useRouter();
  const _t = getTranslations(language);
  const [activeTab, setActiveTab] = useState<Tab>("entities");
  const [records, setRecords] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [visitHistory, setVisitHistory] = useState<RecentPage[]>([]);

  // Extract page key from selected item
  const pageKey = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.id.replace("page:", "").replace("widget:", "");
  }, [selectedItem]);

  const appHasData = pageKey ? hasAppData(pageKey) : false;

  // Load visit history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_PAGES_KEY);
      const pages: RecentPage[] = raw ? JSON.parse(raw) : [];
      if (selectedItem?.href) {
        // Filter to show only visits to this app's path
        const appVisits = pages.filter((p) => p.href.startsWith(selectedItem.href || ""));
        setVisitHistory(appVisits.length > 0 ? appVisits : pages);
      } else {
        setVisitHistory(pages);
      }
    } catch {
      setVisitHistory([]);
    }
  }, [selectedItem]);

  // Fetch Supabase records when app has data
  useEffect(() => {
    if (!pageKey || !appHasData) {
      setRecords([]);
      return;
    }

    const config = APP_DATA_REGISTRY[pageKey];
    if (!config) return;

    setLoading(true);
    fetchRecentRecords(config, 20).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [pageKey, appHasData]);

  // Reset tab when selection changes
  useEffect(() => {
    setActiveTab(appHasData ? "entities" : "history");
  }, [appHasData, pageKey]);

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const appLabel = selectedItem
    ? selectedItem.label[language] || selectedItem.label.en
    : t.appLauncher.allApps;

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-e border-white/[0.06] bg-slate-900/80 backdrop-blur-lg animate-in slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <_Clock className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200 truncate max-w-[180px]">
            {appLabel}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
        >
          <_X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs — only show if app has data (both tabs available) */}
      {selectedItem && appHasData && (
        <div className="flex border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("entities")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === "entities"
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Database className="h-3 w-3" />
            {t.appLauncher.entities}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <History className="h-3 w-3" />
            {t.appLauncher.history}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "entities" && appHasData ? (
          /* Supabase records */
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500/30 border-_t-purple-500" />
            </div>
          ) : records.length === 0 ? (
            <EmptyState language={language} type="entities" />
          ) : (
            <div className="py-1">
              {records.map((record) => (
                <RecordItem
                  key={record.id}
                  title={record.title}
                  subtitle={record.subtitle}
                  timestamp={formatTimestamp(record.timestamp, language)}
                  icon={record.icon}
                  onClick={() => handleNavigate(record.href)}
                />
              ))}
            </div>
          )
        ) : (
          /* Visit history */
          visitHistory.length === 0 ? (
            <EmptyState language={language} type="history" />
          ) : (
            <div className="py-1">
              {visitHistory.map((page) => (
                <RecordItem
                  key={`${page.href}-${page.timestamp}`}
                  title={page.label}
                  subtitle={page.href.replace("/dashboard/", "")}
                  timestamp={formatTimestamp(page.timestamp, language)}
                  onClick={() => handleNavigate(page.href)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      {selectedItem?.href && (
        <div className="border-_t border-white/[0.06] p-3">
          <button
            type="button"
            onClick={() => handleNavigate(selectedItem.href!)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t.appLauncher.openApp.replace("{appName}", appLabel)}
          </button>
        </div>
      )}
    </div>
  );
}

function RecordItem({
  title,
  subtitle,
  timestamp,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  timestamp: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-4 py-2.5 text-start hover:bg-white/[0.04] transition-colors group"
    >
      {icon && (
        <span className="mt-0.5 text-sm shrink-0">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-300 truncate group-hover:text-slate-100 transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-600 truncate">{subtitle}</p>
        )}
      </div>
      {timestamp && (
        <span className="shrink-0 text-[10px] text-slate-600 mt-0.5">{timestamp}</span>
      )}
    </button>
  );
}

function EmptyState({ language, type }: { language: "he" | "en" | "ru"; type: "entities" | "history" }) {
  const _t = getTranslations(language);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {type === "entities" ? (
        <Database className="h-8 w-8 text-slate-700 mb-3" />
      ) : (
        <History className="h-8 w-8 text-slate-700 mb-3" />
      )}
      <p className="text-xs text-slate-600">
        {type === "entities" ? t.appLauncher.noRecords : t.appLauncher.noHistory}
      </p>
    </div>
  );
}
