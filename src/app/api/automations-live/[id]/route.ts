import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/automations-live/[id] - Get single automation with workflow
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const { user, error: authError } = await requireAuth(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get automation with stats
    const { data: automation, error: automationError } = await supabase
      .rpc('get_automation_with_stats', { automation_uuid: id })
      .single()

    if (automationError) throw automationError
    if (!automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      )
    }

    // Get workflow nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('automation_id', id)
      .order('created_at')

    if (nodesError) throw nodesError

    // Get workflow connections
    const { data: connections, error: connectionsError } = await supabase
      .from('workflow_connections')
      .select('*')
      .eq('automation_id', id)
      .order('created_at')

    if (connectionsError) throw connectionsError

    return NextResponse.json({
      ...automation,
      workflow: {
        nodes: nodes || [],
        connections: connections || []
      }
    })

  } catch (error) {
    console.error('Error fetching automation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation' },
      { status: 500 }
    )
  }
}

// PUT /api/automations-live/[id] - Update automation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const { user, error: authError } = await requireAuth(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const body = await request.json()
    const {
      name,
      description,
      category,
      status,
      trigger_config,
      tags,
      folder_id,
      workflow
    } = body

    // Update automation
    const { data: automation, error: updateError } = await supabase
      .from('automations')
      .update({
        name,
        description,
        category,
        status,
        trigger_config,
        tags,
        folder_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Update workflow if provided
    if (workflow) {
      // Delete existing nodes and connections
      await supabase
        .from('workflow_connections')
        .delete()
        .eq('automation_id', id)

      await supabase
        .from('workflow_nodes')
        .delete()
        .eq('automation_id', id)

      // Insert new nodes
      if (workflow.nodes && workflow.nodes.length > 0) {
        const { error: nodesError } = await supabase
          .from('workflow_nodes')
          .insert(
            workflow.nodes.map((node: any) => ({
              automation_id: id,
              node_id: node.id,
              node_type: node.type,
              title: node.title,
              position_x: node.x,
              position_y: node.y,
              width: node.width,
              height: node.height,
              config: node.config,
              inputs: node.inputs,
              outputs: node.outputs
            }))
          )

        if (nodesError) throw nodesError
      }

      // Insert new connections
      if (workflow.connections && workflow.connections.length > 0) {
        const { error: connectionsError } = await supabase
          .from('workflow_connections')
          .insert(
            workflow.connections.map((conn: any) => ({
              automation_id: id,
              connection_id: conn.id,
              from_node_id: conn.from,
              to_node_id: conn.to,
              from_port: conn.fromPort,
              to_port: conn.toPort
            }))
          )

        if (connectionsError) throw connectionsError
      }
    }

    return NextResponse.json(automation)

  } catch (error) {
    console.error('Error updating automation:', error)
    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    )
  }
}

// DELETE /api/automations-live/[id] - Delete automation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const { user, error: authError } = await requireAuth(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting automation:', error)
    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    )
  }
}