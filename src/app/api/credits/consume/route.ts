import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { consumeCredits } from '@/lib/credits/ledger';

/**
 * POST /api/credits/consume
 * Auth: JWT required
 * Body: { action, quantity?, workspaceId?, idempotencyKey? }
 *
 * Deducts credits for an action. Used by internal services and
 * external API consumers (metered billing).
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const user = auth.user!;

  const body = await request.json();
  const { action, quantity = 1, workspaceId, idempotencyKey } = body;

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Resolve workspace from user if not provided
  let wsId = workspaceId;
  if (!wsId) {
    const { data: wu } = await supabase
      .from('vb_workspace_users')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();
    wsId = wu?.workspace_id;
  }

  if (!wsId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const result = await consumeCredits(supabase, {
    workspaceId: wsId,
    action,
    quantity,
    userId: user.id,
    idempotencyKey,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 402 });
}
