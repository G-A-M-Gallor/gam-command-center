import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workflow/variables - List workflow variables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const scope = searchParams.get('scope');
    const includeSecrets = searchParams.get('include_secrets') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('workflow_variables')
      .select('id, name, description, value, is_secret, scope, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (scope) {
      query = query.eq('scope', scope);
    }

    // Filter out secret values unless explicitly requested
    if (!includeSecrets) {
      // We'll filter these in the response to avoid sending secret data
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workflow variables:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow variables' },
        { status: 500 }
      );
    }

    // Filter out secret values from response
    const filteredData = data?.map(variable => ({
      ...variable,
      value: variable.is_secret && !includeSecrets ? '***HIDDEN***' : variable.value
    }));

    return NextResponse.json({ variables: filteredData });
  } catch (error) {
    console.error('Workflow variables GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflow/variables - Create workflow variable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      name,
      description,
      value,
      is_secret = false,
      scope = 'tenant',
      created_by
    } = body;

    if (!tenant_id || !name || value === undefined) {
      return NextResponse.json(
        { error: 'tenant_id, name, and value are required' },
        { status: 400 }
      );
    }

    // Validate scope
    if (!['tenant', 'template', 'execution'].includes(scope)) {
      return NextResponse.json(
        { error: 'scope must be one of: tenant, template, execution' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workflow_variables')
      .insert({
        tenant_id,
        name,
        description,
        value,
        is_secret,
        scope,
        created_by
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A variable with this name already exists for this tenant' },
          { status: 409 }
        );
      }
      console.error('Error creating workflow variable:', error);
      return NextResponse.json(
        { error: 'Failed to create workflow variable' },
        { status: 500 }
      );
    }

    // Don't return secret values in the response
    const responseData = {
      ...data,
      value: data.is_secret ? '***HIDDEN***' : data.value
    };

    return NextResponse.json({ variable: responseData }, { status: 201 });
  } catch (error) {
    console.error('Workflow variables POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workflow/variables - Bulk update variables
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, variables } = body;

    if (!tenant_id || !Array.isArray(variables)) {
      return NextResponse.json(
        { error: 'tenant_id and variables array are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const variable of variables) {
      const { id, name, value, description, is_secret, scope } = variable;

      if (!id && !name) {
        continue; // Skip invalid entries
      }

      try {
        let query = supabase
          .from('workflow_variables')
          .update({
            ...(name && { name }),
            ...(value !== undefined && { value }),
            ...(description !== undefined && { description }),
            ...(is_secret !== undefined && { is_secret }),
            ...(scope && { scope })
          })
          .eq('tenant_id', tenant_id);

        if (id) {
          query = query.eq('id', id);
        } else {
          query = query.eq('name', name);
        }

        const { data, error } = await query.select().single();

        if (error) {
          results.push({ error: error.message, variable });
        } else {
          results.push({
            success: true,
            variable: {
              ...data,
              value: data.is_secret ? '***HIDDEN***' : data.value
            }
          });
        }
      } catch (err) {
        results.push({ error: 'Update failed', variable });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Workflow variables PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}