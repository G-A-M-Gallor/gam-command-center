'use client'

import { useState } from 'react'
import { RunTimeline } from './RunTimeline'

interface WorkflowRun {
  id: string
  automationName: string
  status: 'success' | 'failed' | 'running' | 'cancelled' | 'paused'
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

interface RunsTableProps {
  runs: WorkflowRun[]
  loading?: boolean
}

const statusConfig = {
  success: { color: 'bg-green-500', textColor: 'text-green-500', label: 'הצליח' },
  failed: { color: 'bg-red-500', textColor: 'text-red-500', label: 'נכשל' },
  running: { color: 'bg-blue-500', textColor: 'text-blue-500', label: 'בביצוע' },
  cancelled: { color: 'bg-[#6B7280]', textColor: 'text-[#6B7280]', label: 'בוטל' },
  paused: { color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'מושהה' }
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`
}

export function RunsTable({ runs, loading = false }: RunsTableProps) {
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set())

  const toggleExpanded = (runId: string) => {
    const newExpanded = new Set(expandedRuns)
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId)
    } else {
      newExpanded.add(runId)
    }
    setExpandedRuns(newExpanded)
  }

  if (loading) {
    return (
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-8 text-center">
        <div className="inline-flex items-center gap-2 text-[#A1A1AA]">
          <div className="w-4 h-4 border-2 border-[#FF6B1A] border-_t-transparent rounded-full animate-spin" />
          טוען ריצות...
        </div>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-8 text-center">
        <div className="text-[#A1A1AA] mb-2">🏃‍♂️</div>
        <p className="text-[#E5E5E5] font-medium mb-1">אין ריצות עדיין</p>
        <p className="text-[#A1A1AA] text-sm">ריצות אוטומציה יופיעו כאן כשיתחילו</p>
      </div>
    )
  }

  return (
    <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#404040] bg-[#1A1A1A] text-sm font-medium text-[#E5E5E5]">
        <div className="col-span-1" />
        <div className="col-span-1 text-center">סטטוס</div>
        <div className="col-span-3">שם אוטומציה</div>
        <div className="col-span-2 text-center">מקור הפעלה</div>
        <div className="col-span-2 text-center">משך</div>
        <div className="col-span-2 text-center">שעה</div>
        <div className="col-span-1" />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#404040]">
        {runs.map((run) => {
          const isExpanded = expandedRuns.has(run.id)
          const config = statusConfig[run.status]

          return (
            <div key={run.id}>
              {/* Main Row */}
              <div
                className={`grid grid-cols-12 gap-4 p-4 hover:bg-[#333333] cursor-pointer transition-colors ${
                  isExpanded ? 'bg-[#333333]' : ''
                }`}
                onClick={() => toggleExpanded(run.id)}
              >
                {/* Expand/Collapse Icon */}
                <div className="col-span-1 flex items-center justify-center">
                  <button className="text-[#A1A1AA] hover:text-white transition-colors">
                    {isExpanded ? '⌄' : '⌃'}
                  </button>
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${config.color}`} />
                    {run.status === 'running' && (
                      <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse opacity-50 absolute`} />
                    )}
                  </div>
                </div>

                {/* Automation Name */}
                <div className="col-span-3 flex items-center">
                  <div className="min-w-0">
                    <p className="text-[#E5E5E5] font-medium truncate">
                      {run.automationName}
                    </p>
                    <p className={`text-xs ${config.textColor}`}>
                      {config.label}
                    </p>
                  </div>
                </div>

                {/* Trigger Source */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[#E5E5E5] text-sm">{run.triggerSource}</p>
                    {run.triggeredBy && (
                      <p className="text-[#A1A1AA] text-xs">{run.triggeredBy}</p>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-[#E5E5E5] text-sm">
                    {run.duration ? formatDuration(run.duration) :
                     run.status === 'running' ? '...' : '-'}
                  </span>
                </div>

                {/* Time */}
                <div className="col-span-2 flex items-center justify-center text-center">
                  <div>
                    <p className="text-[#E5E5E5] text-sm">
                      {run.startedAt.toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-[#A1A1AA] text-xs">
                      {run.startedAt.toLocaleDateString('he-IL', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Menu */}
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    className="text-[#A1A1AA] hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle menu actions
                    }}
                  >
                    ⋮
                  </button>
                </div>
              </div>

              {/* Expanded Timeline */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <RunTimeline steps={run.steps} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}