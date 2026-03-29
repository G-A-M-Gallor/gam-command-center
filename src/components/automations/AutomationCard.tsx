'use client'

interface AutomationCardProps {
  automation: {
    id: string
    name: string
    status: 'active' | 'draft' | 'disabled'
    triggerType: 'webhook' | 'cron' | 'manual' | 'email'
    lastRun?: Date
    tags: string[]
    description?: string
  }
}

const statusConfig = {
  active: {
    label: 'פעיל',
    color: 'bg-green-500',
    textColor: 'text-green-500'
  },
  draft: {
    label: 'טיוטה',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500'
  },
  disabled: {
    label: 'מושבת',
    color: 'bg-red-500',
    textColor: 'text-red-500'
  }
}

const triggerIcons = {
  webhook: '⚡',
  cron: '⏰',
  manual: '👆',
  email: '📧'
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const status = statusConfig[automation.status]

  return (
    <div
      className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4 hover:bg-[#333333] transition-colors cursor-pointer"
      dir="rtl"
    >
      {/* Header עם status ו-trigger */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${status.color}`} />
          <span className={`text-xs ${status.textColor} font-medium`}>
            {status.label}
          </span>
        </div>

        <span className="text-lg" title={automation.triggerType}>
          {triggerIcons[automation.triggerType]}
        </span>
      </div>

      {/* שם האוטומציה */}
      <h3 className="font-medium text-white mb-2 line-clamp-2 text-start">
        {automation.name}
      </h3>

      {/* תיאור אם קיים */}
      {automation.description && (
        <p className="text-[#A1A1AA] text-sm mb-3 line-clamp-2 text-start">
          {automation.description}
        </p>
      )}

      {/* ריצה אחרונה */}
      <p className="text-[#A1A1AA] text-sm mb-3">
        {automation.lastRun
          ? `ריצה אחרונה: ${automation.lastRun.toLocaleDateString('he-IL')}`
          : 'עדיין לא הופעל'
        }
      </p>

      {/* Tags */}
      {automation.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {automation.tags.map(tag => (
            <span
              key={tag}
              className="bg-[#404040] text-[#A1A1AA] text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}