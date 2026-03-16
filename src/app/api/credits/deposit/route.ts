import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { depositCredits } from '@/lib/credits/ledger';

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
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const user = auth.user!;

  const body = await request.json();
  const { amount, type = 'purchase', workspaceId, reason, paymentRef, idempotencyKey } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Resolve workspace
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

  const result = await depositCredits(supabase, {
    workspaceId: wsId,
    amount,
    type,
    authorizedBy: user.id,
    reason,
    paymentRef,
    idempotencyKey,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}
