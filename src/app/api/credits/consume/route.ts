import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { consumeCredits } from '@/lib/credits/ledger';
import { creditConsumeSchema } from '@/lib/api/schemas';

/**
 * POST /api/credits/consume
 * Auth: JWT required
 * Body: { action, quantity?, workspaceId?, idempotencyKey? }
 *
 * Deducts credits for an action. Used by internal services and
 * external API consumers (metered billing).
 */
export async function POST(_request: Request) {
  const auth = await requireAuth(_request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const _user = auth.user!;

  const raw = await request.json();
  const parsed = creditConsumeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { action, quantity, workspaceId, idempotencyKey } = parsed.data;

  const supabase = createServiceClient();

  // Resolve workspace from user if not provided
  let wsId = workspaceId;
  if (!wsId) {
    const { data: wu } = await supabase
      .from('vb_workspace_users')
      .select('workspace_id')
      .eq('user_id', _user.id)
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
    userId: _user.id,
    idempotencyKey,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 402 });
}
