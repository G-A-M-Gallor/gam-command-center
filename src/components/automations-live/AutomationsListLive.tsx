'use client'

import { useState } from 'react'
import { useAutomationsLive } from '@/hooks/useAutomationsLive'
import { AutomationFilters } from '../automations/AutomationFilters'

export function AutomationsListLive() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])

  const {
    automations,
    loading,
    error,
    total,
    refetch,
    createAutomation,
    updateAutomation,
    deleteAutomation
  } = useAutomationsLive({
    status: statusFilter.length > 0 ? statusFilter[0] : undefined,
    category: categoryFilter.length > 0 ? categoryFilter[0] : undefined,
    realtime: true // Enable real-time updates
  })

  // Filter locally by search query
  const filteredAutomations = automations.filter(automation => {
    if (searchQuery && !automation.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Calculate live stats
  const stats = {
    total: total,
    active: automations.filter(a => a.status === 'active').length,
    drafts: automations.filter(a => a.status === 'draft').length,
    errors: automations.filter(a => a.status === 'error').length,
    executions: automations.reduce((sum, a) => sum + a.total_runs, 0),
    successRate: automations.length > 0
      ? automations.reduce((sum, a) => sum + a.success_rate, 0) / automations.length
      : 0
  }

  const handleCreateAutomation = async () => {
    try {
      await createAutomation({
        name: 'אוטומציה חדשה',
        description: 'תיאור האוטומציה',
        category: 'כללי',
        trigger_type: 'manual',
        status: 'draft'
      })
    } catch (error) {
      console.error('Error creating automation:', error)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAutomation(id, { status: newStatus as any })
    } catch (error) {
      console.error('Error updating automation:', error)
    }
  }

  if (error) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium text-white mb-2">שגיאה בטעינת האוטומציות</h2>
          <p className="text-[#A1A1AA] mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[#FF6B1A] text-white rounded-lg hover:bg-[#FF8547] transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#1A1A1A]" dir="rtl">
      {/* Top Bar */}
      <div className="h-14 bg-[#2A2A2A] border-b border-[#404040] flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#FF6B1A] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white">AUTOMATIONS</span>
        </div>

        <div className="mr-8">
          <h1 className="text-[#E5E5E5] font-medium">רשימת אוטומציות חיות</h1>
          <p className="text-[#A1A1AA] text-xs">
            {loading ? 'טוען...' : `${total} אוטומציות | ${stats.active} פעילות`}
          </p>
        </div>

        <div className="mr-auto flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#333333] rounded-lg transition-colors"
            title="רענן"
          >
            🔄
          </button>
          <button
            onClick={handleCreateAutomation}
            className="px-3 py-2 bg-[#FF6B1A] text-white rounded-lg hover:bg-[#FF8547] transition-colors text-sm font-medium"
          >
            + יצירה
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar Filters */}
        <AutomationFilters
          selectedFilters={{
            status: statusFilter,
            triggerType: categoryFilter,
            tags: []
          }}
          onFiltersChange={(filters) => {
            setStatusFilter(filters.status)
            setCategoryFilter(filters.triggerType)
          }}
        />

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="חיפוש אוטומציה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md bg-[#2A2A2A] border border-[#404040] rounded-lg px-4 py-2 text-white placeholder:text-[#A1A1AA] focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A]"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-[#A1A1AA]">סה״כ אוטומציות</div>
            </div>
            <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
              <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              <div className="text-sm text-[#A1A1AA]">פעילות</div>
            </div>
            <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.drafts}</div>
              <div className="text-sm text-[#A1A1AA]">טיוטות</div>
            </div>
            <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
              <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
              <div className="text-sm text-[#A1A1AA]">שגיאות</div>
            </div>
            <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.executions.toLocaleString()}</div>
              <div className="text-sm text-[#A1A1AA]">ביצועים</div>
            </div>
            <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-500">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-[#A1A1AA]">הצלחה</div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-[#A1A1AA]">
                <div className="w-6 h-6 border-2 border-[#FF6B1A] border-_t-transparent rounded-full animate-spin" />
                טוען אוטומציות...
              </div>
            </div>
          )}

          {/* Automations Grid */}
          {!loading && (
            <>
              {filteredAutomations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-xl font-medium text-white mb-2">אין אוטומציות</h3>
                  <p className="text-[#A1A1AA] mb-4">
                    {searchQuery ? 'לא נמצאו תוצאות לחיפוש' : 'התחל ביצירת אוטומציה ראשונה'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={handleCreateAutomation}
                      className="px-4 py-2 bg-[#FF6B1A] text-white rounded-lg hover:bg-[#FF8547] transition-colors"
                    >
                      צור אוטומציה חדשה
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAutomations.map((automation) => (
                    <div
                      key={automation.id}
                      className="bg-[#2A2A2A] border border-[#404040] rounded-xl p-6 hover:border-[#606060] transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate mb-1">
                            {automation.name}
                          </h3>
                          {automation.description && (
                            <p className="text-sm text-[#A1A1AA] line-clamp-2">
                              {automation.description}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          automation.status === 'active' ? 'bg-green-500/10 text-green-500' :
                          automation.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                          automation.status === 'error' ? 'bg-red-500/10 text-red-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {automation.status === 'active' ? 'פעיל' :
                           automation.status === 'draft' ? 'טיוטה' :
                           automation.status === 'error' ? 'שגיאה' :
                           'לא פעיל'}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-[#A1A1AA]">ביצועים:</span>
                          <span className="text-white mr-1">{automation.total_runs}</span>
                        </div>
                        <div>
                          <span className="text-[#A1A1AA]">הצלחה:</span>
                          <span className="text-green-500 mr-1">{automation.success_rate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-[#A1A1AA]">זמן ממוצע:</span>
                          <span className="text-white mr-1">
                            {automation.avg_duration_ms > 0 ? `${(automation.avg_duration_ms / 1000).toFixed(1)}s` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A1A1AA]">היום:</span>
                          <span className="text-blue-500 mr-1">{automation.runs_today}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#404040]">
                        <div className="flex items-center gap-2">
                          {automation.category && (
                            <span className="px-2 py-1 bg-[#404040] text-[#A1A1AA] text-xs rounded">
                              {automation.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {automation.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(automation.id, 'active')}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                            >
                              הפעל
                            </button>
                          )}
                          {automation.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(automation.id, 'inactive')}
                              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                            >
                              השבת
                            </button>
                          )}
                          <button
                            onClick={() => deleteAutomation(automation.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            מחק
                          </button>
                        </div>
                      </div>

                      {/* Running indicator */}
                      {automation.running_now > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-orange-500">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          {automation.running_now} בביצוע עכשיו
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}