import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'
import type { AutomationRun, AutomationRunStep } from '@/types/automations'
import type { SupabaseClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Database record types (raw from Supabase)
interface DbAutomationRun {
  id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  trigger_source?: string;
  triggered_by?: string;
  automation_run_steps?: DbAutomationRunStep[];
}

interface DbAutomationRunStep {
  id: string;
  step_name: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  output_data?: unknown;
}

interface DbNode {
  id: string;
  node_id: string;
  title: string;
  type: string;
}

// GET /api/automations-live/[id]/runs - Get automation runs
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const { user, error: getAuthError } = await requireAuth(request)
    if (getAuthError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify automation ownership
    const { data: automation, error: authError } = await supabase
      .from('automations')
      .select('id, name')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (authError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('automation_runs')
      .select(`
        id,
        run_number,
        status,
        started_at,
        completed_at,
        duration_ms,
        trigger_source,
        triggered_by,
        trigger_data,
        error_message,
        automation_run_steps (
          id,
          node_id,
          step_name,
          status,
          started_at,
          completed_at,
          duration_ms,
          error_message,
          output_data
        )
      `)
      .eq('automation_id', id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: runs, error } = await query

    if (error) throw error

    // Transform data to match frontend interface
    const transformedRuns = runs?.map((run: DbAutomationRun) => ({
      id: run.id,
      automationName: automation.name,
      status: run.status,
      startedAt: new Date(run.started_at),
      completedAt: run.completed_at ? new Date(run.completed_at) : undefined,
      duration: run.duration_ms,
      triggerSource: run.trigger_source || 'Unknown',
      triggeredBy: run.triggered_by,
      steps: run.automation_run_steps?.map((step: DbAutomationRunStep) => ({
        id: step.id,
        name: step.step_name,
        status: step.status,
        startedAt: step.started_at ? new Date(step.started_at) : undefined,
        completedAt: step.completed_at ? new Date(step.completed_at) : undefined,
        duration: step.duration_ms,
        error: step.error_message,
        output: step.output_data ? JSON.stringify(step.output_data) : undefined
      })) || []
    })) || []

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('automation_runs')
      .select('*', { count: 'exact', head: true })
      .eq('automation_id', id)

    if (countError) throw countError

    return NextResponse.json({
      runs: transformedRuns,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    })

  } catch (error) {
    console.error('Error fetching runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    )
  }
}

// POST /api/automations-live/[id]/runs - Trigger automation run
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const { user, error: postAuthError } = await requireAuth(request)
    if (postAuthError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const body = await request.json()
    const { trigger_source = 'Manual', trigger_data = {} } = body

    // Verify automation ownership and that it's active
    const { data: automation, error: authError } = await supabase
      .from('automations')
      .select('id, name, status, trigger_type, trigger_config')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (authError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      )
    }

    if (automation.status !== 'active') {
      return NextResponse.json(
        { error: 'Automation is not active' },
        { status: 400 }
      )
    }

    // Create new run
    const { data: run, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: id,
        status: 'pending',
        trigger_source,
        triggered_by: user.id,
        trigger_data,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (runError) throw runError

    // Get workflow nodes to create steps
    const { data: nodes, error: nodesError } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('automation_id', id)
      .order('created_at')

    if (nodesError) throw nodesError

    // Create run steps for each node
    if (nodes && nodes.length > 0) {
      const steps = nodes.map((node: DbNode) => ({
        run_id: run.id,
        node_id: node.node_id,
        step_name: node.title,
        status: 'pending' as const
      }))

      const { error: stepsError } = await supabase
        .from('automation_run_steps')
        .insert(steps)

      if (stepsError) throw stepsError
    }

    // Here you would trigger the actual automation execution
    // For now, we'll simulate it by updating the run status
    setTimeout(async () => {
      try {
        // Simulate automation execution
        await simulateAutomationExecution(run.id, supabase)
      } catch (error) {
        console.error('Error in automation execution:', error)
      }
    }, 1000)

    return NextResponse.json(run, { status: 201 })

  } catch (error) {
    console.error('Error triggering automation:', error)
    return NextResponse.json(
      { error: 'Failed to trigger automation' },
      { status: 500 }
    )
  }
}

// Simulate automation execution (replace with real execution engine)
async function simulateAutomationExecution(runId: string, supabase: SupabaseClient) {
  try {
    // Update run status to running
    await supabase
      .from('automation_runs')
      .update({ status: 'running' })
      .eq('id', runId)

    // Get steps
    const { data: steps } = await supabase
      .from('automation_run_steps')
      .select('*')
      .eq('run_id', runId)
      .order('created_at')

    let totalDuration = 0

    // Execute each step
    for (const step of steps || []) {
      const stepStartTime = Date.now()

      // Update step to running
      await supabase
        .from('automation_run_steps')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', step.id)

      // Simulate step execution time
      const executionTime = Math.random() * 3000 + 500 // 0.5-3.5 seconds
      await new Promise(resolve => setTimeout(resolve, executionTime))

      const stepDuration = Date.now() - stepStartTime
      totalDuration += stepDuration

      // Randomly succeed or fail (90% success rate)
      const success = Math.random() > 0.1

      await supabase
        .from('automation_run_steps')
        .update({
          status: success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          duration_ms: stepDuration,
          error_message: success ? null : 'Simulated execution error',
          output_data: success ? { result: 'success', timestamp: Date.now() } : null
        })
        .eq('id', step.id)

      // If step failed, stop execution
      if (!success) {
        await supabase
          .from('automation_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: totalDuration,
            error_message: 'Step failed during execution'
          })
          .eq('id', runId)
        return
      }
    }

    // All steps completed successfully
    await supabase
      .from('automation_runs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        duration_ms: totalDuration
      })
      .eq('id', runId)

  } catch (error) {
    console.error('Error in simulated execution:', error)
    // Mark run as failed
    await supabase
      .from('automation_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: 'Execution engine error'
      })
      .eq('id', runId)
  }
}