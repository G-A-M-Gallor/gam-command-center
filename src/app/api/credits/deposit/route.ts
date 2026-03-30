import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { depositCredits } from '@/lib/credits/ledger';
import { creditDepositSchema } from '@/lib/api/schemas';

/**
 * POST /api/credits/deposit
 * Auth: JWT required (admin only for grants/promotions)
 * Body: { amount, type?, workspaceId?, reason?, paymentRef?, idempotencyKey? }
 *
 * Adds credits to a wallet. Used for:
 * - Customer purchases (after payment confirmation)
 * - Admin grants (promotional credits)
 * - Refunds
 */
export async function POST(_request: Request) {
  const auth = await requireAuth(_request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const _user = auth.user!;

  const raw = await request.json();
  const parsed = creditDepositSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { amount, type, workspaceId, reason, paymentRef, idempotencyKey } = parsed.data;

  const supabase = createServiceClient();

  // Resolve workspace
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

  const result = await depositCredits(supabase, {
    workspaceId: wsId,
    amount,
    type,
    authorizedBy: _user.id,
    reason,
    paymentRef,
    idempotencyKey,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}
