'use client'

interface TimelineStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  duration?: number
  error?: string
  output?: string
}

interface RunTimelineProps {
  steps: TimelineStep[]
}

const statusConfig = {
  pending: { color: 'bg-[#6B7280]', icon: '⏸', textColor: 'text-[#6B7280]' },
  running: { color: 'bg-blue-500', icon: '🔄', textColor: 'text-blue-500' },
  completed: { color: 'bg-green-500', icon: '✓', textColor: 'text-green-500' },
  failed: { color: 'bg-red-500', icon: '✗', textColor: 'text-red-500' },
  skipped: { color: 'bg-[#6B7280]', icon: '↷', textColor: 'text-[#6B7280]' }
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`
}

export function RunTimeline({ steps }: RunTimelineProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-4 mt-2" dir="rtl">
      <h4 className="text-[#E5E5E5] font-medium mb-4">פירוט ביצוע</h4>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const config = statusConfig[step.status]
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex gap-3 relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute right-[11px] top-6 w-[2px] h-8 bg-[#404040]" />
              )}

              {/* Status icon */}
              <div className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center flex-shrink-0 text-white text-xs relative z-10`}>
                {config.icon}
              </div>

              {/* Step details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className={`font-medium ${config.textColor}`}>
                    {step.name}
                  </h5>
                  <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                    {step.duration && (
                      <span>{formatDuration(step.duration)}</span>
                    )}
                    {step.completedAt && (
                      <span>
                        {step.completedAt.toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status details */}
                <div className="mt-1">
                  {step.status === 'running' && (
                    <p className="text-blue-500 text-xs">בביצוע...</p>
                  )}

                  {step.status === 'completed' && step.output && (
                    <p className="text-[#A1A1AA] text-xs">
                      {step.output.length > 50
                        ? `${step.output.substring(0, 50)}...`
                        : step.output
                      }
                    </p>
                  )}

                  {step.status === 'failed' && step.error && (
                    <p className="text-red-400 text-xs bg-red-500/10 rounded px-2 py-1 mt-1">
                      ❌ {step.error}
                    </p>
                  )}

                  {step.status === 'pending' && (
                    <p className="text-[#6B7280] text-xs">ממתין לביצוע...</p>
                  )}

                  {step.status === 'skipped' && (
                    <p className="text-[#6B7280] text-xs">נדלג (תנאי לא התקיים)</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-[#404040] text-xs text-[#A1A1AA]">
        <div className="flex justify-between">
          <span>
            {steps.filter(s => s.status === 'completed').length} מתוך {steps.length} שלבים הושלמו
          </span>
          <span>
            סה״כ: {formatDuration(
              steps.reduce((total, step) => total + (step.duration || 0), 0)
            )}
          </span>
        </div>
      </div>
    </div>
  )
}