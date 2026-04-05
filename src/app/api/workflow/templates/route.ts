import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workflow/templates - List workflow templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workflow templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('Workflow templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflow/templates - Create workflow template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      name,
      description,
      category,
      trigger_type,
      trigger_config = {},
      steps = [],
      variables = {},
      is_active = true,
      created_by
    } = body;

    if (!tenant_id || !name || !trigger_type) {
      return NextResponse.json(
        { error: 'tenant_id, name, and trigger_type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workflow_templates')
      .insert({
        tenant_id,
        name,
        description,
        category,
        trigger_type,
        trigger_config,
        steps,
        variables,
        is_active,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow template:', error);
      return NextResponse.json(
        { error: 'Failed to create workflow template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error('Workflow templates POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}