'use client'

import { useState } from 'react'
import { AutomationsListLive } from './AutomationsListLive'
import { WorkflowRunsLive } from './WorkflowRunsLive'
import { WorkflowBuilderLive } from './WorkflowBuilderLive'

type ViewMode = 'list' | 'runs' | 'builder'

export function AutomationsDashboardLive() {
  const [currentView, setCurrentView] = useState<ViewMode>('list')

  const views = {
    list: {
      component: AutomationsListLive,
      title: 'רשימת אוטומציות',
      icon: '📋',
      description: 'ניהול ועריכת אוטומציות עם נתונים חיים'
    },
    runs: {
      component: WorkflowRunsLive,
      title: 'ניטור ביצועים',
      icon: '📊',
      description: 'מעקב בזמן אמת אחר ביצוע וסטטוסים'
    },
    builder: {
      component: WorkflowBuilderLive,
      title: 'בונה אוטומציות',
      icon: '🔧',
      description: 'יצירת זרימות עבודה עם שמירה אוטומטית'
    }
  }

  const CurrentComponent = views[currentView].component

  return (
    <div className="h-screen bg-[#1A1A1A] overflow-hidden" dir="rtl">
      {/* Navigation Header */}
      <div className="h-16 bg-[#2A2A2A] border-b border-[#404040] flex items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#FF6B1A] flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">AUTOMATIONS LIVE</h1>
            <p className="text-[#A1A1AA] text-xs">מערכת אוטומציות עם נתונים חיים</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mr-auto flex items-center bg-[#1A1A1A] rounded-lg p-1">
          {(Object.entries(views) as [ViewMode, typeof views[ViewMode]][]).map(([viewKey, view]) => (
            <button
              key={viewKey}
              onClick={() => setCurrentView(viewKey)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                currentView === viewKey
                  ? 'bg-[#FF6B1A] text-white shadow-lg'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#333333]'
              }`}
            >
              <span>{view.icon}</span>
              <span className="font-medium text-sm">{view.title}</span>
            </button>
          ))}
        </div>

        {/* System Status */}
        <div className="mr-4 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[#E5E5E5] text-xs">חי</span>
          </div>

          <button className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#333333] rounded-lg transition-colors">
            ⚙️
          </button>
        </div>
      </div>

      {/* Current View Description */}
      <div className="h-12 bg-[#1A1A1A] border-b border-[#404040] flex items-center px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">{views[currentView].icon}</span>
          <span className="text-[#E5E5E5] font-medium">{views[currentView].title}</span>
          <span className="text-[#A1A1AA] text-sm">—</span>
          <span className="text-[#A1A1AA] text-sm">{views[currentView].description}</span>
        </div>

        {/* View-specific indicators */}
        <div className="mr-auto flex items-center gap-4">
          {currentView === 'list' && (
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Real-time Sync</span>
            </div>
          )}

          {currentView === 'runs' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[#A1A1AA] text-xs">Live Monitoring</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-[#A1A1AA] text-xs">Auto-refresh</span>
              </div>
            </div>
          )}

          {currentView === 'builder' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-[#A1A1AA] text-xs">Auto-save</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="text-[#A1A1AA] text-xs">Live Preview</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-7rem)] overflow-hidden">
        <CurrentComponent />
      </div>

      {/* Live Data Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg px-3 py-2 shadow-xl">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-[#FF6B1A] rounded-full animate-pulse"></div>
            <span className="text-[#E5E5E5] font-medium">Live Data</span>
            <span className="text-[#A1A1AA]">•</span>
            <span className="text-[#A1A1AA]">Supabase + Realtime</span>
          </div>
        </div>
      </div>
    </div>
  )
}