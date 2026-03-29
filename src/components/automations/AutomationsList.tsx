'use client'

import { useState } from 'react'
import { AutomationCard } from './AutomationCard'
import { AutomationFilters } from './AutomationFilters'

interface Automation {
  id: string
  name: string
  status: 'active' | 'draft' | 'disabled'
  triggerType: 'webhook' | 'cron' | 'manual' | 'email'
  lastRun?: Date
  tags: string[]
  description?: string
}

// Demo data
const demoAutomations: Automation[] = [
  {
    id: '1',
    name: 'סנכרון לקוחות CRM',
    status: 'active',
    triggerType: 'webhook',
    lastRun: new Date('2024-03-29T10:30:00'),
    tags: ['CRM', 'לקוחות'],
    description: 'סנכרון אוטומטי של לקוחות מ-Origami לבסיסי נתונים מקומיים'
  },
  {
    id: '2',
    name: 'שליחת הודעות WhatsApp',
    status: 'active',
    triggerType: 'email',
    lastRun: new Date('2024-03-29T11:45:00'),
    tags: ['הודעות', 'שירות'],
    description: 'שליחת הודעות אוטומטיות בנתון סטטוס פרוייקט חדש'
  },
  {
    id: '3',
    name: 'יצוא דוחות אוטומטי',
    status: 'draft',
    triggerType: 'cron',
    tags: ['דוחות', 'אוטומציה'],
    description: 'יצוא דוחות שבועיים לניהול מעדכנים'
  },
  {
    id: '4',
    name: 'ניטוח קבצות פיתוח',
    status: 'active',
    triggerType: 'webhook',
    lastRun: new Date('2024-03-29T09:15:00'),
    tags: ['גיבוי', 'פיתוח'],
    description: 'ניטוח אוטומטי של קבצות לקוד ספרד בעבירת פיתוח'
  },
  {
    id: '5',
    name: 'ניהול יומי למכונכים',
    status: 'disabled',
    triggerType: 'cron',
    lastRun: new Date('2024-03-28T16:00:00'),
    tags: ['במכונכים', 'ניהול'],
    description: 'ישלוח נתונים יומיים על כל המכונכים'
  },
  {
    id: '6',
    name: 'עדכון מיוחן מכרזים',
    status: 'draft',
    triggerType: 'manual',
    tags: ['מכרזים', 'עדכון'],
    description: 'עדכון מיוחן של מכרזים מתוך Excel מירוב מתירים'
  }
]

export function AutomationsList() {
  const [automations] = useState<Automation[]>(demoAutomations)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    status: [] as string[],
    triggerType: [] as string[],
    tags: [] as string[]
  })

  // Filter automations based on search and filters
  const filteredAutomations = automations.filter(automation => {
    // Search filter
    if (searchQuery && !automation.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Status filter
    if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(automation.status)) {
      return false
    }

    // Trigger type filter
    if (selectedFilters.triggerType.length > 0 && !selectedFilters.triggerType.includes(automation.triggerType)) {
      return false
    }

    // Tags filter
    if (selectedFilters.tags.length > 0 && !selectedFilters.tags.some(tag => automation.tags.includes(tag))) {
      return false
    }

    return true
  })

  const stats = {
    active: automations.filter(a => a.status === 'active').length,
    draft: automations.filter(a => a.status === 'draft').length,
    disabled: automations.filter(a => a.status === 'disabled').length
  }

  return (
    <div className="h-screen bg-[#1A1A1A]" dir="rtl">
      {/* Top Bar */}
      <div className="h-14 bg-[#2A2A2A] border-b border-[#404040] flex items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#FF6B1A] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white">אוטומציות</span>
        </div>

        {/* Navigation */}
        <nav className="mr-8 flex gap-6">
          <a href="#" className="text-[#FF6B1A] text-sm font-medium">תהליכים</a>
          <a href="#" className="text-[#A1A1AA] hover:text-white text-sm">היסטוריה</a>
          <a href="#" className="text-[#A1A1AA] hover:text-white text-sm">חיבורים</a>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <input
            type="text"
            placeholder="חיפוש אוטומציות... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A]"
          />
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <button className="text-[#A1A1AA] hover:text-white">
            🔔
          </button>
          <button className="w-8 h-8 bg-[#FF6B1A] rounded-full flex items-center justify-center text-white text-sm">
            G
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">אוטומציות</h1>
            <p className="text-[#A1A1AA]">ניהול תהליכים אוטומטיים ואינטגרציות</p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-white">{stats.active} פעילים</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-white">{stats.draft} טיוטות</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-white">{stats.disabled} מושבתים</span>
            </div>
          </div>

          {/* Create button */}
          <div className="mb-6">
            <button className="bg-[#FF6B1A] hover:bg-[#FF8A3D] text-white px-4 py-2 rounded-lg transition-colors">
              + יצירת אוטומציה
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAutomations.map(automation => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>

          {/* Empty state */}
          {filteredAutomations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#A1A1AA] mb-4">לא נמצאו אוטומציות התואמות לחיפוש</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedFilters({ status: [], triggerType: [], tags: [] })
                }}
                className="text-[#FF6B1A] hover:underline"
              >
                נקה פילטרים
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar - Filters */}
        <div className="w-64">
          <AutomationFilters
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
          />
        </div>
      </div>
    </div>
  )
}