import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/workflow/executions/[id] - Get specific workflow execution
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        template:workflow_templates!inner(name, category, steps),
        step_executions:workflow_step_executions(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow execution not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching workflow execution:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({ execution: data });
  } catch (error) {
    console.error('Workflow execution GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workflow/executions/[id] - Update workflow execution status
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      tenant_id,
      status,
      result_data,
      error_message,
      current_step,
      execution_context
    } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;

      // Set timestamps based on status
      if (status === 'running' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      } else if (['completed', 'failed', 'cancelled'].includes(status)) {
        updateData.completed_at = new Date().toISOString();

        // Calculate duration if we have start time
        const { data: currentExecution } = await supabase
          .from('workflow_executions')
          .select('started_at')
          .eq('id', id)
          .eq('tenant_id', tenant_id)
          .single();

        if (currentExecution?.started_at) {
          const startTime = new Date(currentExecution.started_at);
          const endTime = new Date();
          updateData.duration_ms = endTime.getTime() - startTime.getTime();
        }
      }
    }

    if (result_data !== undefined) updateData.result_data = result_data;
    if (error_message !== undefined) updateData.error_message = error_message;
    if (current_step !== undefined) updateData.current_step = current_step;
    if (execution_context !== undefined) updateData.execution_context = execution_context;

    const { data, error } = await supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select(`
        *,
        template:workflow_templates!inner(name, category)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow execution not found' },
          { status: 404 }
        );
      }
      console.error('Error updating workflow execution:', error);
      return NextResponse.json(
        { error: 'Failed to update workflow execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({ execution: data });
  } catch (error) {
    console.error('Workflow execution PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflow/executions/[id] - Cancel workflow execution
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    // Update status to cancelled instead of deleting
    const { data, error } = await supabase
      .from('workflow_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow execution not found' },
          { status: 404 }
        );
      }
      console.error('Error cancelling workflow execution:', error);
      return NextResponse.json(
        { error: 'Failed to cancel workflow execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Workflow execution cancelled successfully',
      execution: data
    });
  } catch (error) {
    console.error('Workflow execution DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}