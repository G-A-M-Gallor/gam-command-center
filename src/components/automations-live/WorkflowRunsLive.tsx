'use client'

import { useState, useEffect } from 'react'
import { useAutomationsLive, useAutomationRuns } from '@/hooks/useAutomationsLive'
import { RunsKPIs } from '../automations/RunsKPIs'
import { RunsTable } from '../automations/RunsTable'

export function WorkflowRunsLive() {
  const [selectedAutomation, setSelectedAutomation] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState('24h')

  // Get list of automations for selection
  const { automations } = useAutomationsLive({ realtime: true })

  // Get runs for selected automation
  const {
    runs,
    loading: runsLoading,
    error: runsError,
    triggerRun
  } = useAutomationRuns(selectedAutomation)

  // Select first automation by default
  useEffect(() => {
    if (automations.length > 0 && !selectedAutomation) {
      setSelectedAutomation(automations[0].id)
    }
  }, [automations, selectedAutomation])

  // Filter runs based on search and status
  const filteredRuns = runs.filter(run => {
    if (searchQuery && !run.automationName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter.length > 0 && !statusFilter.includes(run.status)) {
      return false
    }
    return true
  })

  // Calculate live stats from all automations
  const stats = {
    totalRuns: automations.reduce((sum, a) => sum + a.total_runs, 0),
    successRate: automations.length > 0
      ? automations.reduce((sum, a) => sum + a.success_rate, 0) / automations.length
      : 0,
    avgDuration: automations.length > 0
      ? automations.reduce((sum, a) => sum + (a.avg_duration_ms / 1000), 0) / automations.length
      : 0,
    runningNow: automations.reduce((sum, a) => sum + a.running_now, 0),
    trend: {
      totalRuns: '+12%', // Mock trend - would calculate from historical data
      successRate: '+2.1%',
      avgDuration: '-0.4s'
    }
  }

  const handleTriggerRun = async () => {
    if (!selectedAutomation) return

    try {
      await triggerRun({
        triggeredBy: 'Manual Trigger',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error triggering run:', error)
    }
  }

  if (!automations.length) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-xl font-medium text-white mb-2">אין אוטומציות</h2>
          <p className="text-[#A1A1AA]">צור אוטומציה כדי לראות ביצועים</p>
        </div>
      </div>
    )
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
          <h1 className="text-[#E5E5E5] font-medium">ניטור ביצועים חי</h1>
          <p className="text-[#A1A1AA] text-xs">
            {runsLoading ? 'טוען...' : `${filteredRuns.length} ביצועים`}
          </p>
        </div>

        {/* Automation Selector */}
        <div className="mr-8">
          <select
            value={selectedAutomation}
            onChange={(e) => setSelectedAutomation(e.target.value)}
            className="bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A]"
          >
            <option value="">בחר אוטומציה</option>
            {automations.map((automation) => (
              <option key={automation.id} value={automation.id}>
                {automation.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="mr-auto flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-1 text-white text-sm"
          >
            <option value="1h">שעה אחרונה</option>
            <option value="24h">24 שעות</option>
            <option value="7d">7 ימים</option>
            <option value="30d">30 ימים</option>
          </select>

          <button
            onClick={handleTriggerRun}
            disabled={!selectedAutomation || runsLoading}
            className="px-3 py-2 bg-[#FF6B1A] text-white rounded-lg hover:bg-[#FF8547] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            🚀 הפעל עכשיו
          </button>

          <button className="p-2 text-[#A1A1AA] hover:text-white rounded transition-colors">
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
                placeholder="חיפוש ביצוע..."
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

          {/* Error State */}
          {runsError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-400">
                <span>⚠️</span>
                <span>שגיאה בטעינת הביצועים: {runsError}</span>
              </div>
            </div>
          )}

          {/* Runs Table */}
          <RunsTable
            runs={filteredRuns}
            loading={runsLoading}
          />

          {/* Real-time indicator */}
          {stats.runningNow > 0 && (
            <div className="fixed bottom-6 left-6 bg-[#2A2A2A] border border-[#404040] rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-[#FF6B1A] rounded-full animate-pulse"></div>
                <span className="text-white">{stats.runningNow} ביצועים פעילים</span>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Live Stats */}
        <div className="w-64 bg-[#2A2A2A] border-r border-[#404040] p-4">
          <h3 className="text-white font-medium mb-4">סטטיסטיקות חיות</h3>

          {/* Current Automation Stats */}
          {selectedAutomation && (
            <div className="mb-6">
              <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">אוטומציה נוכחית</h4>
              {(() => {
                const current = automations.find(a => a.id === selectedAutomation)
                if (!current) return null

                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">סה״כ ביצועים</span>
                      <span className="text-white">{current.total_runs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">אחוז הצלחה</span>
                      <span className="text-green-500">{current.success_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">זמן ממוצע</span>
                      <span className="text-blue-500">{(current.avg_duration_ms / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">ביצועים היום</span>
                      <span className="text-yellow-500">{current.runs_today}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* System-wide Stats */}
          <div className="mb-6">
            <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">כלל המערכת</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">אוטומציות פעילות</span>
                <span className="text-green-500">{automations.filter(a => a.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">בביצוע עכשיו</span>
                <span className="text-orange-500">{stats.runningNow}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">סה״כ ביצועים</span>
                <span className="text-white">{stats.totalRuns.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-[#E5E5E5] text-sm font-medium mb-3">פעילות אחרונה</h4>
            <div className="space-y-3 text-xs">
              {filteredRuns.slice(0, 5).map((run) => (
                <div key={run.id} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    run.status === 'success' ? 'bg-green-500' :
                    run.status === 'failed' ? 'bg-red-500' :
                    run.status === 'running' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[#E5E5E5] truncate">{run.automationName}</div>
                    <div className="text-[#A1A1AA]">
                      {run.startedAt.toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}