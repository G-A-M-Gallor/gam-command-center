'use client'

import { useState } from 'react'
import { AutomationsList } from './AutomationsList'
import { WorkflowRuns } from './WorkflowRuns'
import { WorkflowBuilder } from './WorkflowBuilder'

type ViewMode = 'list' | 'runs' | 'builder'

export function AutomationsDashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('list')

  const views = {
    list: {
      component: AutomationsList,
      title: 'רשימת אוטומציות',
      icon: '📋',
      description: 'ניהול ועריכת אוטומציות קיימות'
    },
    runs: {
      component: WorkflowRuns,
      title: 'ניטור ביצועים',
      icon: '📊',
      description: 'מעקב אחר ביצוע וסטטוסים'
    },
    builder: {
      component: WorkflowBuilder,
      title: 'בונה אוטומציות',
      icon: '🔧',
      description: 'יצירת זרימות עבודה חדשות'
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
            <h1 className="text-white font-bold text-lg">AUTOMATIONS</h1>
            <p className="text-[#A1A1AA] text-xs">מערכת אוטומציות מתקדמת</p>
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
                  ? 'bg-[#FF6B1A] text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#333333]'
              }`}
            >
              <span>{view.icon}</span>
              <span className="font-medium text-sm">{view.title}</span>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mr-4 flex items-center gap-2">
          <button className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#333333] rounded-lg transition-colors">
            🔄
          </button>
          <button className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#333333] rounded-lg transition-colors">
            ⚙️
          </button>
          <button className="px-3 py-2 bg-[#FF6B1A] text-white rounded-lg hover:bg-[#FF8547] transition-colors text-sm font-medium">
            + יצירה
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
        {currentView === 'runs' && (
          <div className="mr-auto flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[#A1A1AA] text-xs">3 פעיל</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-[#A1A1AA] text-xs">עדכון אחרון: 14:32</span>
            </div>
          </div>
        )}

        {currentView === 'builder' && (
          <div className="mr-auto flex items-center gap-2">
            <span className="text-[#A1A1AA] text-xs">גרסה אוטומטית</span>
            <span className="px-2 py-1 bg-[#404040] text-[#E5E5E5] rounded text-xs">טיוטה</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-7rem)] overflow-hidden">
        <CurrentComponent />
      </div>
    </div>
  )
}