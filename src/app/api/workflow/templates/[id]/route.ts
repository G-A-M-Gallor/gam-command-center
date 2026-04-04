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

// GET /api/workflow/templates/[id] - Get specific workflow template
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
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow template not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching workflow template:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Workflow template GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workflow/templates/[id] - Update workflow template
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      tenant_id,
      name,
      description,
      category,
      trigger_type,
      trigger_config,
      steps,
      variables,
      is_active,
      updated_by
    } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_by };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
    if (trigger_config !== undefined) updateData.trigger_config = trigger_config;
    if (steps !== undefined) updateData.steps = steps;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('workflow_templates')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow template not found' },
          { status: 404 }
        );
      }
      console.error('Error updating workflow template:', error);
      return NextResponse.json(
        { error: 'Failed to update workflow template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Workflow template PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflow/templates/[id] - Delete workflow template
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

    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting workflow template:', error);
      return NextResponse.json(
        { error: 'Failed to delete workflow template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Workflow template deleted successfully' });
  } catch (error) {
    console.error('Workflow template DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}