'use client'

import { useState, useEffect } from 'react'
import { RunsKPIs } from './RunsKPIs'
import { RunsTable } from './RunsTable'

interface WorkflowRun {
  id: string
  automationName: string
  status: 'success' | 'failed' | 'running' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  duration?: number
  triggerSource: string
  triggeredBy?: string
  steps: Array<{
    id: string
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    startedAt?: Date
    completedAt?: Date
    duration?: number
    error?: string
    output?: string
  }>
}

// Demo data
const generateDemoRuns = (): WorkflowRun[] => [
  {
    id: '1',
    automationName: 'סנכרון לקוחות CRM — Origami ↔ Supabase',
    status: 'success',
    startedAt: new Date('2024-03-29T14:32:00'),
    completedAt: new Date('2024-03-29T14:34:24'),
    duration: 2400,
    triggerSource: 'Cron',
    steps: [
      {
        id: '1-1',
        name: 'עירוב התחברות',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:32:00'),
        completedAt: new Date('2024-03-29T14:32:02'),
        duration: 200,
        output: 'התחברות לOrigami הצליחה'
      },
      {
        id: '1-2',
        name: 'שליפת נתונים 847 — נתונים חיצוניים',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:32:02'),
        completedAt: new Date('2024-03-29T14:33:47'),
        duration: 950,
        output: '847 רשומות נמצאו'
      },
      {
        id: '1-3',
        name: 'בינת נתונים — עובד PDF 0.7s...',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:33:47'),
        completedAt: new Date('2024-03-29T14:34:24'),
        duration: 750,
        output: 'עיבוד הושלם בהצלחה'
      },
      {
        id: '1-4',
        name: 'ביטון — שליחת הוצאות — הרצאת דואר 847-7 התצוגות',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:34:24'),
        completedAt: new Date('2024-03-29T14:34:24'),
        duration: 500,
        output: 'סנכרון הושלם בהצלחה'
      }
    ]
  },
  {
    id: '2',
    automationName: 'עדכון מידרון — Google Sheets → DB',
    status: 'failed',
    startedAt: new Date('2024-03-29T14:28:00'),
    completedAt: new Date('2024-03-29T14:29:15'),
    duration: 8100,
    triggerSource: 'Webhook',
    steps: [
      {
        id: '2-1',
        name: 'עירוב התחברות',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:28:00'),
        completedAt: new Date('2024-03-29T14:28:02'),
        duration: 200,
        output: 'התחברות לGoogle Sheets הצליחה'
      },
      {
        id: '2-2',
        name: 'שליפת נתונים — Excel מיקרון מתוריים',
        status: 'failed',
        startedAt: new Date('2024-03-29T14:28:02'),
        completedAt: new Date('2024-03-29T14:29:15'),
        duration: 7900,
        error: 'שגיאת רשת - חיבור נכשל אחרי 3 ניסיונות'
      }
    ]
  },
  {
    id: '3',
    automationName: 'שליחת דוחות שבועיים — Email',
    status: 'running',
    startedAt: new Date('2024-03-29T14:31:00'),
    triggerSource: 'ידני',
    triggeredBy: 'גל מילר',
    steps: [
      {
        id: '3-1',
        name: 'עירוב התחברות',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:31:00'),
        completedAt: new Date('2024-03-29T14:31:02'),
        duration: 200,
        output: 'התחברות הצליחה'
      },
      {
        id: '3-2',
        name: 'שליחת תוכנים שבועיים',
        status: 'completed',
        startedAt: new Date('2024-03-29T14:31:02'),
        completedAt: new Date('2024-03-29T14:31:47'),
        duration: 950,
        output: 'דוחות נוצרו בהצלחה'
      },
      {
        id: '3-3',
        name: 'בציעת רובות PDF',
        status: 'running',
        startedAt: new Date('2024-03-29T14:31:47'),
        duration: undefined
      },
      {
        id: '3-4',
        name: 'רובים — שליחת ימינו למכונכים',
        status: 'pending'
      }
    ]
  }
]

export function WorkflowRuns() {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setRuns(generateDemoRuns())
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Filter runs
  const filteredRuns = runs.filter(run => {
    if (searchQuery && !run.automationName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter.length > 0 && !statusFilter.includes(run.status)) {
      return false
    }
    return true
  })

  // Calculate stats
  const stats = {
    totalRuns: 1247,
    successRate: 94.2,
    avgDuration: 3.2,
    runningNow: filteredRuns.filter(r => r.status === 'running').length,
    trend: {
      totalRuns: '+12%',
      successRate: '+2.1%',
      avgDuration: '-0.4s'
    }
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
          <span className="font-semibold text-white">AUTOMATIONS</span>
        </div>

        {/* Page Title */}
        <div className="mr-8">
          <h1 className="text-[#E5E5E5] font-medium">ניטור אוטומציות</h1>
        </div>

        {/* Time Range Selector */}
        <div className="mr-auto flex items-center gap-2">
          {['24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeRange === range
                  ? 'bg-[#FF6B1A] text-white'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              {range === '24h' ? 'שעות 24' :
               range === '7d' ? 'ימים 7' :
               'ימים 30'}
            </button>
          ))}
          <button className="p-1 text-[#A1A1AA] hover:text-white rounded transition-colors">
            🔄
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main content */}
        <div className="flex-1 p-6">
          {/* KPI Cards */}
          <RunsKPIs stats={stats} />

          {/* Filters & Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="חיפוש אוטומציה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-[#404040] rounded-lg px-4 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A]"
              />
            </div>

            {/* Status Filters */}
            <div className="flex gap-2">
              {[
                { key: 'success', label: 'הצליח', color: 'green' },
                { key: 'failed', label: 'נכשל', color: 'red' },
                { key: 'running', label: 'בביצוע', color: 'blue' },
                { key: 'cancelled', label: 'בוטל', color: 'gray' }
              ].map(status => (
                <button
                  key={status.key}
                  onClick={() => {
                    if (statusFilter.includes(status.key)) {
                      setStatusFilter(statusFilter.filter(s => s !== status.key))
                    } else {
                      setStatusFilter([...statusFilter, status.key])
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    statusFilter.includes(status.key)
                      ? 'bg-[#FF6B1A] text-white'
                      : 'bg-[#2A2A2A] text-[#A1A1AA] hover:text-white border border-[#404040]'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Runs Table */}
          <RunsTable runs={filteredRuns} loading={loading} />
        </div>

        {/* Right sidebar - Filters */}
        <div className="w-64 bg-[#2A2A2A] border-r border-[#404040] p-4">
          <h3 className="text-white font-medium mb-4">קצר דפי</h3>

          {/* Status Filter */}
          <div className="mb-6">
            <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">סטטוס</h4>
            <div className="space-y-1">
              {[
                { value: '', label: 'הכל', count: 1247 },
                { value: 'success', label: 'הצליח', count: 1174 },
                { value: 'failed', label: 'נכשל', count: 55 },
                { value: 'running', label: 'רץ', count: 18 }
              ].map(option => (
                <div key={option.value} className="flex items-center justify-between text-sm">
                  <span className="text-[#E5E5E5]">{option.label}</span>
                  <span className="text-[#A1A1AA]">{option.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Automations Filter */}
          <div className="mb-6">
            <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">אוטומציה</h4>
            <div className="space-y-1">
              {[
                'סנכרון לקוחות CRM',
                'עדכון מירוג',
                'דוחות שבועיים',
                'ניבוי יומי',
                'עדכון RSS'
              ].map(automation => (
                <div key={automation} className="text-[#E5E5E5] text-sm hover:text-white cursor-pointer">
                  • {automation}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-[#E5E5E5] text-sm font-medium mb-3">סוג האירועים</h4>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-[#E5E5E5]">29/03/2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}