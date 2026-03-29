import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'

// GET /api/automations-live - List all automations with stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const folder = searchParams.get('folder')

    let query = supabase
      .from('automation_stats')
      .select(`
        id,
        name,
        automations!inner(
          description,
          status,
          category,
          folder_id,
          tags,
          created_at,
          updated_at,
          trigger_type,
          is_active
        ),
        total_runs,
        success_rate,
        avg_duration_ms,
        last_run_at,
        running_now,
        runs_today
      `)
      .eq('automations.created_by', user.id)

    // Apply filters
    if (status) {
      query = query.eq('automations.status', status)
    }
    if (category) {
      query = query.eq('automations.category', category)
    }
    if (folder) {
      query = query.eq('automations.folder_id', folder)
    }

    const { data: automations, error } = await query
      .order('automations.updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      automations: automations || [],
      total: automations?.length || 0
    })

  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automations' },
      { status: 500 }
    )
  }
}

// POST /api/automations-live - Create new automation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = createServerClient()

    const body = await request.json()
    const {
      name,
      description,
      category,
      trigger_type,
      trigger_config = {},
      tags = [],
      folder_id
    } = body

    // Validate required fields
    if (!name || !trigger_type) {
      return NextResponse.json(
        { error: 'Name and trigger type are required' },
        { status: 400 }
      )
    }

    const { data: automation, error } = await supabase
      .from('automations')
      .insert({
        name,
        description,
        category,
        trigger_type,
        trigger_config,
        tags,
        folder_id,
        created_by: user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(automation, { status: 201 })

  } catch (error) {
    console.error('Error creating automation:', error)
    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    )
  }
}