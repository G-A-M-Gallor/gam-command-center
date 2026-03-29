'use client'

import { useState } from 'react'

interface NodeTemplate {
  id: string
  title: string
  description: string
}


interface NodePanelProps {
  onAddNode: (type: keyof typeof nodeTypes, template: NodeTemplate, x: number, y: number) => void
}

const nodeTypes = {
  trigger: {
    icon: '⚡',
    color: 'bg-orange-500',
    title: 'טריגרים',
    templates: [
      { id: 'webhook', title: 'Webhook', description: 'קבלת בקשת HTTP מחיצונית' },
      { id: 'schedule', title: 'זמן קבוע', description: 'ביצוע מתוזמן - יומי/שבועי/חודשי' },
      { id: 'file-watch', title: 'עדכון קובץ', description: 'זיהוי שינוי בקובץ או תיקייה' },
      { id: 'email', title: 'הודעת דוא״ל', description: 'קבלת הודעה באימייל' },
      { id: 'form-submit', title: 'שליחת טופס', description: 'מילוי טופס באתר' }
    ]
  },
  action: {
    icon: '🎯',
    color: 'bg-blue-500',
    title: 'פעולות',
    templates: [
      { id: 'api-call', title: 'קריאת API', description: 'שליחת בקשה ל-API חיצוני' },
      { id: 'email-send', title: 'שליחת אימייל', description: 'שליחת הודעה או התראה' },
      { id: 'database', title: 'מסד נתונים', description: 'עדכון/הוספה/מחיקה של נתונים' },
      { id: 'notification', title: 'התראה', description: 'שליחת התראת push או SMS' },
      { id: 'file-create', title: 'יצירת קובץ', description: 'כתיבה או יצירת מסמך' }
    ]
  },
  condition: {
    icon: '🔀',
    color: 'bg-purple-500',
    title: 'תנאים',
    templates: [
      { id: 'if-then', title: 'אם אז', description: 'בדיקת תנאי בסיסי' },
      { id: 'filter', title: 'סינון', description: 'סינון נתונים לפי קריטריונים' },
      { id: 'switch', title: 'מתג', description: 'בחירה בין מספר אפשרויות' },
      { id: 'loop', title: 'לולאה', description: 'ביצוע חוזר על מערך נתונים' }
    ]
  },
  delay: {
    icon: '⏰',
    color: 'bg-green-500',
    title: 'השהיות',
    templates: [
      { id: 'wait', title: 'המתנה', description: 'השהיה זמן קבוע' },
      { id: 'until', title: 'עד אשר', description: 'המתנה עד התקיימות תנאי' },
      { id: 'schedule-until', title: 'עד מועד', description: 'המתנה עד תאריך מסוים' }
    ]
  }
} as const

export function NodePanel({ onAddNode }: NodePanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string>('trigger')
  const [searchQuery, setSearchQuery] = useState('')
  const [nodeCounter, setNodeCounter] = useState(0)

  const handleDragStart = (e: React.DragEvent, type: keyof typeof nodeTypes, template: NodeTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, template }))
  }

  const handleAddToCanvas = (type: keyof typeof nodeTypes, template: NodeTemplate) => {
    // Add to center of canvas with deterministic positioning based on counter
    const x = 300 + ((nodeCounter * 50) % 200)
    const y = 150 + ((nodeCounter * 30) % 200)
    setNodeCounter(prev => prev + 1)
    onAddNode(type, template, x, y)
  }

  const filteredNodeTypes = Object.entries(nodeTypes).map(([key, nodeType]) => ({
    key: key as keyof typeof nodeTypes,
    ...nodeType,
    templates: nodeType.templates.filter(template =>
      searchQuery === '' ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.includes(searchQuery)
    )
  })).filter(nodeType => nodeType.templates.length > 0)

  return (
    <div className="w-64 bg-[#2A2A2A] border-l border-[#404040] pt-14 overflow-y-auto">
      <div className="p-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="חיפוש רכיבים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A] text-sm"
          />
        </div>

        {/* Node Categories */}
        <div className="space-y-2">
          {filteredNodeTypes.map((nodeType) => (
            <div key={nodeType.key} className="border border-[#404040] rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === nodeType.key ? '' : nodeType.key)}
                className="w-full flex items-center justify-between p-3 bg-[#1A1A1A] hover:bg-[#333333] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{nodeType.icon}</span>
                  <span className="text-white font-medium text-sm">{nodeType.title}</span>
                </div>
                <span className="text-[#A1A1AA] text-sm">
                  {expandedCategory === nodeType.key ? '⌄' : '⌃'}
                </span>
              </button>

              {/* Templates */}
              {expandedCategory === nodeType.key && (
                <div className="border-t border-[#404040]">
                  {nodeType.templates.map((template) => (
                    <div
                      key={template.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, nodeType.key, template)}
                      onClick={() => handleAddToCanvas(nodeType.key, template)}
                      className="p-3 hover:bg-[#333333] cursor-pointer border-b border-[#404040] last:border-b-0 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[#E5E5E5] font-medium text-sm group-hover:text-white transition-colors">
                            {template.title}
                          </h4>
                          <p className="text-[#A1A1AA] text-xs mt-1 leading-relaxed">
                            {template.description}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${nodeType.color} flex-shrink-0 mt-0.5`} />
                      </div>

                      {/* Add indicator */}
                      <div className="text-[#A1A1AA] text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        👆 לחץ או גרור לקנבס
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-3 bg-[#1A1A1A] rounded-lg border border-[#404040]">
          <h4 className="text-[#E5E5E5] font-medium text-sm mb-2">💡 עצות</h4>
          <ul className="text-[#A1A1AA] text-xs space-y-1">
            <li>• התחל עם טריגר (⚡)</li>
            <li>• חבר רכיבים עם קווים</li>
            <li>• הגדר תנאים (🔀) לזרימה מורכבת</li>
            <li>• הוסף השהיות (⏰) למניעת עומס</li>
          </ul>
        </div>
      </div>
    </div>
  )
}