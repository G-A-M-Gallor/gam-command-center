import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export interface LiveAutomation {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'inactive' | 'error'
  category?: string
  total_runs: number
  success_rate: number
  avg_duration_ms: number
  last_run_at?: string
  running_now: number
  runs_today: number
  trigger_type: string
  is_active: boolean
  created_at: string
  updated_at: string
  tags: string[]
}

interface UseAutomationsResult {
  automations: LiveAutomation[]
  loading: boolean
  error: string | null
  total: number
  refetch: () => Promise<void>
  createAutomation: (automation: Partial<LiveAutomation>) => Promise<void>
  updateAutomation: (id: string, automation: Partial<LiveAutomation>) => Promise<void>
  deleteAutomation: (id: string) => Promise<void>
}

interface UseAutomationsOptions {
  status?: string
  category?: string
  folder?: string
  realtime?: boolean
}

export function useAutomationsLive(options: UseAutomationsOptions = {}): UseAutomationsResult {
  const [automations, setAutomations] = useState<LiveAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const supabase = createBrowserClient()

  const fetchAutomations = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.status) params.append('status', options.status)
      if (options.category) params.append('category', options.category)
      if (options.folder) params.append('folder', options.folder)

      const response = await fetch(`/api/automations-live?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch automations: ${response.statusText}`)
      }

      const data = await response.json()

      setAutomations(data.automations || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Error fetching automations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch automations')
    } finally {
      setLoading(false)
    }
  }

  const createAutomation = async (automation: Partial<LiveAutomation>) => {
    try {
      const response = await fetch('/api/automations-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation)
      })

      if (!response.ok) {
        throw new Error('Failed to create automation')
      }

      await fetchAutomations() // Refresh list
    } catch (err) {
      console.error('Error creating automation:', err)
      throw err
    }
  }

  const updateAutomation = async (id: string, automation: Partial<LiveAutomation>) => {
    try {
      const response = await fetch(`/api/automations-live/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation)
      })

      if (!response.ok) {
        throw new Error('Failed to update automation')
      }

      await fetchAutomations() // Refresh list
    } catch (err) {
      console.error('Error updating automation:', err)
      throw err
    }
  }

  const deleteAutomation = async (id: string) => {
    try {
      const response = await fetch(`/api/automations-live/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete automation')
      }

      await fetchAutomations() // Refresh list
    } catch (err) {
      console.error('Error deleting automation:', err)
      throw err
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAutomations()
  }, [options.status, options.category, options.folder])

  // Real-time subscriptions
  useEffect(() => {
    if (!options.realtime) return

    // Subscribe to automation changes
    const automationsChannel = supabase
      .channel('automations-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automations'
        },
        (payload) => {
          console.log('Automation changed:', payload)
          fetchAutomations() // Refresh on any change
        }
      )
      .subscribe()

    // Subscribe to runs changes for live stats
    const runsChannel = supabase
      .channel('runs-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_runs'
        },
        (payload) => {
          console.log('Run changed:', payload)
          // Update stats in real-time
          fetchAutomations()
        }
      )
      .subscribe()

    return () => {
      automationsChannel.unsubscribe()
      runsChannel.unsubscribe()
    }
  }, [options.realtime, supabase])

  return {
    automations,
    loading,
    error,
    total,
    refetch: fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation
  }
}

// Hook for individual automation with workflow
export function useAutomationLive(id: string) {
  const [automation, setAutomation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAutomation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations-live/${id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch automation: ${response.statusText}`)
      }

      const data = await response.json()
      setAutomation(data)
    } catch (err) {
      console.error('Error fetching automation:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch automation')
    } finally {
      setLoading(false)
    }
  }

  const updateWorkflow = async (workflow: any) => {
    try {
      const response = await fetch(`/api/automations-live/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow })
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow')
      }

      await fetchAutomation() // Refresh
    } catch (err) {
      console.error('Error updating workflow:', err)
      throw err
    }
  }

  useEffect(() => {
    if (id) {
      fetchAutomation()
    }
  }, [id])

  return {
    automation,
    loading,
    error,
    refetch: fetchAutomation,
    updateWorkflow
  }
}

// Hook for automation runs
export function useAutomationRuns(automationId: string) {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const supabase = createBrowserClient()

  const fetchRuns = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations-live/${automationId}/runs`)

      if (!response.ok) {
        throw new Error(`Failed to fetch runs: ${response.statusText}`)
      }

      const data = await response.json()
      setRuns(data.runs || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Error fetching runs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch runs')
    } finally {
      setLoading(false)
    }
  }

  const triggerRun = async (triggerData = {}) => {
    try {
      const response = await fetch(`/api/automations-live/${automationId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_source: 'Manual',
          trigger_data: triggerData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger run')
      }

      await fetchRuns() // Refresh runs
    } catch (err) {
      console.error('Error triggering run:', err)
      throw err
    }
  }

  useEffect(() => {
    if (automationId) {
      fetchRuns()
    }
  }, [automationId])

  // Real-time updates for runs
  useEffect(() => {
    if (!automationId) return

    const channel = supabase
      .channel(`automation-runs-${automationId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_runs',
          filter: `automation_id=eq.${automationId}`
        },
        (payload) => {
          console.log('Run updated:', payload)
          fetchRuns()
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_run_steps'
        },
        (payload) => {
          console.log('Step updated:', payload)
          fetchRuns()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [automationId, supabase])

  return {
    runs,
    loading,
    error,
    total,
    refetch: fetchRuns,
    triggerRun
  }
}