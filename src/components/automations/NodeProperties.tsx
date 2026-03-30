'use client'

import { useState } from 'react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  title: string
  x: number
  y: number
  width: number
  height: number
  config: Record<string, string | number | boolean>
  inputs: string[]
  outputs: string[]
}

interface NodePropertiesProps {
  node: WorkflowNode
  onUpdate: (nodeId: string, config: Record<string, string | number | boolean>) => void
  onClose: () => void
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  placeholder?: string
  options?: string[]
}

interface ConfigTemplate {
  fields: ConfigField[]
}

const configTemplates: Record<string, ConfigTemplate> = {
  // Triggers
  webhook: {
    fields: [
      { key: 'url', label: 'כתובת URL', type: 'text', placeholder: 'https://webhook.site/...' },
      { key: 'method', label: 'שיטה', type: 'select', options: ['POST', 'GET', 'PUT', 'DELETE'] },
      { key: 'headers', label: 'Headers', type: 'textarea', placeholder: 'Content-Type: application/json' }
    ]
  },
  schedule: {
    fields: [
      { key: 'cron', label: 'ביטוי Cron', type: 'text', placeholder: '0 9 * * 1-5' },
      { key: 'timezone', label: 'אזור זמן', type: 'select', options: ['Asia/Jerusalem', 'UTC', 'America/New_York'] },
      { key: 'description', label: 'תיאור', type: 'text', placeholder: 'כל יום חול ב-9:00' }
    ]
  },
  'file-watch': {
    fields: [
      { key: 'path', label: 'נתיב קובץ', type: 'text', placeholder: '/path/to/watch' },
      { key: 'pattern', label: 'תבנית קבצים', type: 'text', placeholder: '*.csv' },
      { key: 'action', label: 'פעולה', type: 'select', options: ['created', 'modified', 'deleted'] }
    ]
  },

  // Actions
  'api-call': {
    fields: [
      { key: 'url', label: 'כתובת API', type: 'text', placeholder: 'https://api.example.com/endpoint' },
      { key: 'method', label: 'שיטה', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      { key: 'headers', label: 'Headers', type: 'textarea', placeholder: 'Authorization: Bearer TOKEN' },
      { key: 'body', label: 'גוף הבקשה', type: 'textarea', placeholder: '{"key": "value"}' }
    ]
  },
  'email-send': {
    fields: [
      { key: 'to', label: 'נמען', type: 'text', placeholder: 'user@example.com' },
      { key: 'subject', label: 'נושא', type: 'text', placeholder: 'התראה מהמערכת' },
      { key: 'body', label: 'תוכן', type: 'textarea', placeholder: 'תוכן ההודעה...' },
      { key: 'template', label: 'תבנית', type: 'select', options: ['רגילה', 'התראה', 'דוח'] }
    ]
  },
  database: {
    fields: [
      { key: 'operation', label: 'פעולה', type: 'select', options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
      { key: 'table', label: 'טבלה', type: 'text', placeholder: 'users' },
      { key: 'query', label: 'שאילתה', type: 'textarea', placeholder: 'SELECT * FROM users WHERE...' }
    ]
  },

  // Conditions
  'if-then': {
    fields: [
      { key: 'condition', label: 'תנאי', type: 'text', placeholder: '{{data.status}} == "success"' },
      { key: 'operator', label: 'אופרטור', type: 'select', options: ['==', '!=', '>', '<', '>=', '<=', 'contains'] },
      { key: 'value', label: 'ערך', type: 'text', placeholder: 'success' }
    ]
  },
  filter: {
    fields: [
      { key: 'field', label: 'שדה לסינון', type: 'text', placeholder: 'email' },
      { key: 'condition', label: 'תנאי', type: 'select', options: ['contains', 'not_contains', 'equals', 'not_equals'] },
      { key: 'value', label: 'ערך', type: 'text', placeholder: '@gmail.com' }
    ]
  },

  // Delays
  wait: {
    fields: [
      { key: 'duration', label: 'משך זמן', type: 'number', placeholder: '30' },
      { key: 'unit', label: 'יחידת זמן', type: 'select', options: ['seconds', 'minutes', 'hours', 'days'] }
    ]
  },
  until: {
    fields: [
      { key: 'condition', label: 'תנאי המתנה', type: 'text', placeholder: '{{data.ready}} == true' },
      { key: 'timeout', label: 'זמן קצוב (דקות)', type: 'number', placeholder: '60' }
    ]
  }
}

export function NodeProperties({ node, onUpdate, onClose }: NodePropertiesProps) {
  type TabType = 'config' | 'data' | 'error'
  const [activeTab, setActiveTab] = useState<TabType>('config')

  const template = configTemplates[node.config.template as keyof typeof configTemplates]

  const handleFieldChange = (fieldKey: string, value: string) => {
    onUpdate(node.id, {
      [fieldKey]: value
    })
  }

  const nodeTypeConfig = {
    trigger: { icon: '⚡', color: 'bg-orange-500', title: 'טריגר' },
    action: { icon: '🎯', color: 'bg-blue-500', title: 'פעולה' },
    condition: { icon: '🔀', color: 'bg-purple-500', title: 'תנאי' },
    delay: { icon: '⏰', color: 'bg-green-500', title: 'השהיה' }
  }

  const nodeConfig = nodeTypeConfig[node.type]

  return (
    <div className="w-80 bg-[#2A2A2A] border-r border-[#404040] pt-14 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#404040]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded ${nodeConfig.color} flex items-center justify-center`}>
              <span className="text-white text-sm">{nodeConfig.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-medium">{node.title}</h3>
              <p className="text-[#A1A1AA] text-xs">{nodeConfig.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1A1A1A] rounded-lg p-1">
          {([
            { key: 'config' as const, label: 'הגדרות' },
            { key: 'data' as const, label: 'נתונים' },
            { key: 'error' as const, label: 'שגיאות' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#FF6B1A] text-white'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'config' && (
          <div className="space-y-4">
            {template ? template.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-[#E5E5E5] text-sm font-medium mb-2">
                  {field.label}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={String(node.config[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A] text-sm"
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={String(node.config[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A] text-sm"
                  />
                )}
                {field.type === 'select' && (
                  <select
                    value={String(node.config[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A] text-sm"
                  >
                    <option value="">בחר אפשרות</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === 'textarea' && (
                  <textarea
                    value={String(node.config[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A] text-sm resize-none"
                  />
                )}
              </div>
            )) : (
              <div className="text-center text-[#6B7280] py-8">
                <div className="text-4xl mb-2">⚙️</div>
                <p>אין הגדרות זמינות עבור רכיב זה</p>
              </div>
            )}

            {/* Test Button */}
            {template && (
              <div className="pt-4 border-t border-[#404040]">
                <button className="w-full bg-[#404040] text-[#E5E5E5] py-2 px-4 rounded-lg hover:bg-[#505050] transition-colors text-sm">
                  🧪 בדוק הגדרות
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <h4 className="text-[#E5E5E5] font-medium">נתוני קלט</h4>
            <div className="bg-[#1A1A1A] border border-[#404040] rounded-lg p-3">
              <pre className="text-[#A1A1AA] text-xs overflow-x-auto">
                {JSON.stringify({
                  nodeId: node.id,
                  type: node.type,
                  timestamp: new Date().toISOString(),
                  input: "{{previous.output}}"
                }, null, 2)}
              </pre>
            </div>

            <h4 className="text-[#E5E5E5] font-medium">נתוני פלט</h4>
            <div className="bg-[#1A1A1A] border border-[#404040] rounded-lg p-3">
              <pre className="text-[#A1A1AA] text-xs overflow-x-auto">
                {JSON.stringify({
                  status: "success",
                  data: "תוצאת הפעולה",
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'error' && (
          <div className="space-y-4">
            <div className="text-center text-[#6B7280] py-8">
              <div className="text-4xl mb-2">✅</div>
              <h4 className="font-medium mb-1">אין שגיאות</h4>
              <p className="text-sm">הרכיב פועל כראוי</p>
            </div>

            {/* Error Handling Configuration */}
            <div className="bg-[#1A1A1A] border border-[#404040] rounded-lg p-3">
              <h5 className="text-[#E5E5E5] font-medium mb-3">טיפול בשגיאות</h5>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-[#A1A1AA] text-sm">נסה שוב במקרה של כישלון</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-[#A1A1AA] text-sm">המשך בכל מקרה</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-[#A1A1AA] text-sm">שלח התראת שגיאה</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}