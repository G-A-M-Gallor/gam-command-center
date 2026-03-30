"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { QuickStats } from "@/components/hub/QuickStats";
import { ActivityFeed } from "@/components/hub/ActivityFeed";
import { QuickAccessGrid } from "@/components/hub/QuickAccessGrid";
import {
  RowContextMenu,
  ColorRuleDialog,
  loadColorRules,
  saveColorRules,
  type ColorRule,
} from "@/components/hub/RowContextMenu";
import {
  getActiveEntityCount,
  getRecentDocumentCount,
  getOpenStoryCount,
  getTodayAIConversationCount,
  getRecentActivity,
  getStatusDistribution,
  getActivityTimeline,
  getEntityTypeBreakdown,
  type HubActivityItem,
  type StatusCount,
  type TimelinePoint,
  type EntityTypeCount,
} from "@/lib/supabase/hubQueries";

const BiCharts = dynamic(() => import("@/components/hub/BiCharts").then((m) => m.BiCharts), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center text-sm text-slate-600">
      Loading charts...
    </div>
  ),
});

// ─── Types ──────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  href?: string;
  label?: string;
  activityItem?: HubActivityItem;
}

// ─── Page ───────────────────────────────────────────

export default function HubPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const hub = t.hub as Record<string, string>;

  // Quick stats
  const [totalEntities, setTotalEntities] = useState(0);
  const [docsThisWeek, setDocsThisWeek] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [aiConversations, setAiConversations] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Activity
  const [activity, setActivity] = useState<HubActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // BI Charts
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [timelineData, setTimelineData] = useState<TimelinePoint[]>([]);
  const [entityData, setEntityData] = useState<EntityTypeCount[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [colorRuleDialog, setColorRuleDialog] = useState(false);
  const [colorRules, setColorRules] = useState<ColorRule[]>([]);

  // Load all data
  useEffect(() => {
    Promise.all([
      getActiveEntityCount(),
      getRecentDocumentCount(7),
      getOpenStoryCount(),
      getTodayAIConversationCount(),
    ]).then(([entities, docs, tasks, ai]) => {
      setTotalEntities(entities);
      setDocsThisWeek(docs);
      setOpenTasks(tasks);
      setAiConversations(ai);
      setStatsLoading(false);
    });

    getRecentActivity(30).then((data) => {
      setActivity(data);
      setActivityLoading(false);
    });

    Promise.all([
      getStatusDistribution(),
      getEntityTypeBreakdown(),
    ]).then(([status, entity]) => {
      setStatusData(status);
      setEntityData(entity);
    });
    setColorRules(loadColorRules());
  }, []);

  // Load timeline when range changes
  useEffect(() => {
    getActivityTimeline(timeRange).then(setTimelineData);
  }, [timeRange]);

  // Context menu handlers
  const handleActivityContextMenu = useCallback(
    (e: React.MouseEvent, item: HubActivityItem) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        href: `/dashboard/editor?doc=${item.noteId}`,
        label: item.noteTitle,
        activityItem: item,
      });
    },
    []
  );

  const handleQuickAccessContextMenu = useCallback(
    (e: React.MouseEvent, href: string, label: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, href, label });
    },
    []
  );

  const handleCopyLink = useCallback(() => {
    if (contextMenu?.href) {
      navigator.clipboard.writeText(window.location.origin + contextMenu.href);
      window.dispatchEvent(
        new CustomEvent("cc-notify", {
          detail: { message: hub.linkCopied, type: "success" },
        })
      );
    }
  }, [contextMenu, hub.linkCopied]);

  const handleColorRuleSave = useCallback(
    (rule: ColorRule) => {
      const updated = [...colorRules.filter(
        (r) => !(r.field === rule.field && r.value === rule.value)
      ), rule];
      setColorRules(updated);
      saveColorRules(updated);
      setColorRuleDialog(false);
    },
    [colorRules]
  );

  const handleColorRuleRemove = useCallback(() => {
    // Remove rules matching current context — for now just close
    setColorRuleDialog(false);
  }, []);

  const isRtl = language === "he";

  return (
    <div className="flex min-h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="layers" />

      <div className="flex flex-1 flex-col gap-6 pt-6">
        {/* Quick Stats */}
        <QuickStats
          totalEntities={totalEntities}
          docsThisWeek={docsThisWeek}
          openTasks={openTasks}
          aiConversations={aiConversations}
          loading={statsLoading}
          t={hub}
        />

        {/* Activity Feed + BI Charts */}
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Activity Feed */}
          <div className="gam-card rounded-[var(--cc-radius-lg)] border border-white/[0.06] p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-300">
              {hub.recentActivity}
            </h2>
            <ActivityFeed
              items={activity}
              loading={activityLoading}
              noActivityLabel={hub.noActivity}
              onContextMenu={handleActivityContextMenu}
            />
          </div>

          {/* BI Charts */}
          <div className="gam-card rounded-[var(--cc-radius-lg)] border border-white/[0.06] p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-300">
              {hub.biCharts}
            </h2>
            <BiCharts
              statusData={statusData}
              timelineData={timelineData}
              entityData={entityData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              t={hub}
            />
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-slate-300">
            {hub.quickAccess}
          </h2>
          <QuickAccessGrid
            tabLabels={t.tabs as Record<string, string>}
            onContextMenu={handleQuickAccessContextMenu}
          />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpen={
            contextMenu.href
              ? () => window.open(contextMenu.href, "_blank")
              : undefined
          }
          onCopyLink={contextMenu.href ? handleCopyLink : undefined}
          onToggleFavorite={() => {
            if (contextMenu.href && contextMenu.label) {
              window.dispatchEvent(
                new CustomEvent("cc-favorites-toggle", {
                  detail: { href: contextMenu.href, label: contextMenu.label },
                })
              );
            }
          }}
          onColorRule={() => {
            setColorRuleDialog(true);
            setContextMenu(null);
          }}
          t={hub}
        />
      )}

      {/* Color Rule Dialog */}
      {colorRuleDialog && (
        <ColorRuleDialog
          onClose={() => setColorRuleDialog(false)}
          onSave={handleColorRuleSave}
          onRemove={handleColorRuleRemove}
          t={hub}
        />
      )}
    </div>
  );
}
