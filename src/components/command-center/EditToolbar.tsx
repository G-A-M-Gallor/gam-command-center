'use client';

import { useState } from 'react';
import { FormInput, Palette, Layout } from 'lucide-react';
import { useDashboardMode } from '@/contexts/DashboardModeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { FieldLibrary } from './fields/FieldLibrary';

type LibraryTab = 'fields' | 'templates' | 'styles';

export function EditToolbar() {
  const { editMode } = useDashboardMode();
  const { language, sidebarPosition } = useSettings();
  const t = getTranslations(language);
  const [activeTab, setActiveTab] = useState<LibraryTab | null>(null);

  if (!editMode) return null;

  const tabs: { id: LibraryTab; icon: typeof FormInput; label: { he: string; en: string }; enabled: boolean }[] = [
    { id: 'fields', icon: FormInput, label: t.fieldLibrary?.fields ? { he: t.fieldLibrary.fields, en: 'Fields' } : { he: 'שדות', en: 'Fields' }, enabled: true },
    { id: 'templates', icon: Layout, label: { he: 'תבניות', en: 'Templates' }, enabled: false },
    { id: 'styles', icon: Palette, label: { he: 'סגנונות', en: 'Styles' }, enabled: false },
  ];

  return (
    <>
      {/* Toolbar bar */}
      <div
        className="fixed left-0 right-0 z-20 flex h-10 items-center gap-1 border-b border-slate-700/50 bg-slate-800/95 backdrop-blur-sm"
        style={{ top: 48 }}
      >
        <div className="flex items-center gap-1 px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!tab.enabled) return;
                  setActiveTab(isActive ? null : tab.id);
                }}
                disabled={!tab.enabled}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-300'
                    : tab.enabled
                      ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                      : 'cursor-not-allowed text-slate-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label[language]}</span>
                {!tab.enabled && (
                  <span className="rounded bg-slate-700 px-1 py-0.5 text-[10px] text-slate-500">
                    {language === 'he' ? 'בקרוב' : 'Soon'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Field Library panel */}
      {activeTab === 'fields' && (
        <FieldLibrary
          onClose={() => setActiveTab(null)}
          sidebarPosition={sidebarPosition}
        />
      )}
    </>
  );
}
