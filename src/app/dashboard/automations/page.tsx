'use client';

import { useState } from 'react';
import { Network, _Clock, Webhook, Lightbulb, Activity, History, Rss } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';
import { ConnectionCards } from '@/components/automations/ConnectionCards';
import { QuickActionsBar } from '@/components/automations/QuickActionsBar';
import { ApiEndpointsPanel } from '@/components/automations/ApiEndpointsPanel';
import { ScheduledJobsPanel } from '@/components/automations/ScheduledJobsPanel';
import { WebhooksPanel } from '@/components/automations/WebhooksPanel';
import { AutomationSuggestionsPanel } from '@/components/automations/AutomationSuggestionsPanel';
import { ActivityFeedPanel } from '@/components/automations/ActivityFeedPanel';
import { RunHistoryPanel } from '@/components/automations/RunHistoryPanel';
import { RssFeedsPanel } from '@/components/automations/RssFeedsPanel';

type TabKey = 'endpoints' | 'jobs' | 'webhooks' | 'suggestions' | 'activity' | 'runHistory' | 'rssFeeds';

const TAB_LABELS: Record<TabKey, 'tabEndpoints' | 'tabJobs' | 'tabWebhooks' | 'tabSuggestions' | 'tabActivity' | 'tabRunHistory' | 'tabRssFeeds'> = {
  endpoints: 'tabEndpoints',
  jobs: 'tabJobs',
  webhooks: 'tabWebhooks',
  suggestions: 'tabSuggestions',
  activity: 'tabActivity',
  runHistory: 'tabRunHistory',
  rssFeeds: 'tabRssFeeds',
};

const TAB_ICONS: Record<TabKey, typeof Network> = {
  endpoints: Network,
  jobs: _Clock,
  webhooks: Webhook,
  suggestions: Lightbulb,
  activity: Activity,
  runHistory: History,
  rssFeeds: Rss,
};

const TAB_KEYS: TabKey[] = ['endpoints', 'jobs', 'webhooks', 'suggestions', 'activity', 'runHistory', 'rssFeeds'];

export default function AutomationsPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const a = t.automations;
  const [activeTab, setActiveTab] = useState<TabKey>('endpoints');

  return (
    <div className="min-h-screen" data-cc-id="automations.hub">
      <PageHeader pageKey="automations" />

      <div className="mt-6 space-y-6">
        {/* ── Quick Actions Bar ──────────────────── */}
        <QuickActionsBar t={a} />

        {/* ── Connection Status Cards ───────────── */}
        <ConnectionCards _t={a} />

        {/* ── Tabs ──────────────────────────────── */}
        <div className="border-b border-slate-700/50">
          <nav className="flex gap-1" data-cc-id="automations.tabs">
            {TAB_KEYS.map((key) => {
              const Icon = TAB_ICONS[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-[var(--cc-accent-500)] bg-white/[0.03] text-slate-100'
                      : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {a[TAB_LABELS[key]]}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Tab Content ───────────────────────── */}
        <div>
          {activeTab === 'endpoints' && <ApiEndpointsPanel t={a} />}
          {activeTab === 'jobs' && <ScheduledJobsPanel t={a} />}
          {activeTab === 'webhooks' && <WebhooksPanel t={a} />}
          {activeTab === 'suggestions' && <AutomationSuggestionsPanel t={a} />}
          {activeTab === 'activity' && <ActivityFeedPanel t={a} />}
          {activeTab === 'runHistory' && <RunHistoryPanel t={a} />}
          {activeTab === 'rssFeeds' && <RssFeedsPanel t={a} rssT={t.rss as Record<string, string>} />}
        </div>
      </div>
    </div>
  );
}
