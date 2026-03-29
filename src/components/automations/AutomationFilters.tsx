'use client'

interface AutomationFiltersProps {
  selectedFilters: {
    status: string[]
    triggerType: string[]
    tags: string[]
  }
  onFiltersChange: (filters: {
    status: string[]
    triggerType: string[]
    tags: string[]
  }) => void
}

const statusOptions = [
  { value: 'active', label: 'פעיל', count: 12 },
  { value: 'draft', label: 'טיוטה', count: 4 },
  { value: 'disabled', label: 'מושבת', count: 2 }
]

const triggerOptions = [
  { value: 'webhook', label: 'Webhook' },
  { value: 'cron', label: 'Schedule' },
  { value: 'email', label: 'Event' },
  { value: 'manual', label: 'Manual' }
]

const popularTags = [
  'CRM', 'הודעות', 'דוחות', 'גיבוי', 'שירות'
]

export function AutomationFilters({ selectedFilters, onFiltersChange }: AutomationFiltersProps) {
  const updateFilter = (type: keyof typeof selectedFilters, value: string) => {
    const current = selectedFilters[type]
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]

    onFiltersChange({
      ...selectedFilters,
      [type]: updated
    })
  }

  return (
    <div className="h-full bg-[#2A2A2A] border-l border-[#404040] p-4" dir="rtl">
      <h3 className="text-white font-medium mb-4">סינון</h3>

      {/* סטטוס */}
      <div className="mb-6">
        <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">סטטוס</h4>
        <div className="space-y-2">
          {statusOptions.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.status.includes(option.value)}
                onChange={() => updateFilter('status', option.value)}
                className="w-4 h-4 text-[#FF6B1A] bg-[#1A1A1A] border-[#404040] rounded focus:ring-[#FF6B1A]"
              />
              <span className="text-[#E5E5E5] text-sm flex-1">{option.label}</span>
              <span className="text-[#A1A1AA] text-xs">{option.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* סוג טריגר */}
      <div className="mb-6">
        <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">סוג טריגר</h4>
        <div className="space-y-2">
          {triggerOptions.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.triggerType.includes(option.value)}
                onChange={() => updateFilter('triggerType', option.value)}
                className="w-4 h-4 text-[#FF6B1A] bg-[#1A1A1A] border-[#404040] rounded focus:ring-[#FF6B1A]"
              />
              <span className="text-[#E5E5E5] text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* תגיות */}
      <div className="mb-6">
        <h4 className="text-[#E5E5E5] text-sm font-medium mb-2">תגיות</h4>
        <div className="flex flex-wrap gap-2">
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => updateFilter('tags', tag)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedFilters.tags.includes(tag)
                  ? 'bg-[#FF6B1A] text-white'
                  : 'bg-[#404040] text-[#A1A1AA] hover:bg-[#4A4A4A]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* פעילות אחרונה */}
      <div>
        <h4 className="text-[#E5E5E5] text-sm font-medium mb-3">פעילות אחרונה</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <div className="flex-1 min-w-0">
              <p className="text-[#E5E5E5] text-xs leading-tight">הועלק סנכרון לקוחות CRM</p>
              <p className="text-[#A1A1AA] text-xs">לפני 3 דקות</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <div className="flex-1 min-w-0">
              <p className="text-[#E5E5E5] text-xs leading-tight">הועלק שליחת הודעות WhatsApp</p>
              <p className="text-[#A1A1AA] text-xs">לפני 12 דקות</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-[#E5E5E5] text-xs leading-tight">נכשל יצוא דוחות — שגיאת נתון</p>
              <p className="text-[#A1A1AA] text-xs">לפני 3 שעות</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}