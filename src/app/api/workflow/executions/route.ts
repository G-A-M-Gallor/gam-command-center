import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workflow/executions - List workflow executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const templateId = searchParams.get('template_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('workflow_executions')
      .select(`
        *,
        template:workflow_templates!inner(name, category)
      `)
      .eq('tenant_id', tenantId)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workflow executions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow executions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ executions: data });
  } catch (error) {
    console.error('Workflow executions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflow/executions - Create/Start workflow execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      template_id,
      trigger_data = {},
      execution_context = {},
      created_by
    } = body;

    if (!tenant_id || !template_id) {
      return NextResponse.json(
        { error: 'tenant_id and template_id are required' },
        { status: 400 }
      );
    }

    // First, verify the template exists and belongs to the tenant
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('id, name, steps, is_active')
      .eq('id', template_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Workflow template not found or access denied' },
        { status: 404 }
      );
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'Workflow template is inactive' },
        { status: 400 }
      );
    }

    // Create the execution
    const { data: execution, error } = await supabase
      .from('workflow_executions')
      .insert({
        tenant_id,
        template_id,
        status: 'pending',
        trigger_data,
        execution_context,
        step_count: Array.isArray(template.steps) ? template.steps.length : 0,
        current_step: 0,
        created_by
      })
      .select(`
        *,
        template:workflow_templates!inner(name, category, steps)
      `)
      .single();

    if (error) {
      console.error('Error creating workflow execution:', error);
      return NextResponse.json(
        { error: 'Failed to create workflow execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({ execution }, { status: 201 });
  } catch (error) {
    console.error('Workflow executions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}