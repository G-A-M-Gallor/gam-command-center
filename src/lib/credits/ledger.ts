// ── Credit System v2 — Ledger Operations ─────────────────────────────
// All credit operations go through atomic RPCs. This file is the
// TypeScript interface to those RPCs.

import { SupabaseClient } from '@supabase/supabase-js';
import type { ConsumeResult, DepositResult, ReconcileResult } from './types';

/**
 * Consume credits for an action. Atomic: checks balance, deducts,
 * records transaction, updates daily rollup, triggers alerts.
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    action: string;
    quantity?: number;
    userId?: string;
    idempotencyKey?: string;
    meta?: Record<string, unknown>;
  },
): Promise<ConsumeResult> {
  const { data, error } = await supabase.rpc('consume_credits', {
    p_workspace_id: params.workspaceId,
    p_action: params.action,
    p_quantity: params.quantity ?? 1,
    p_user_id: params.userId ?? null,
    p_idempotency_key: params.idempotencyKey ?? null,
    p_meta: params.meta ?? {},
  });

  if (error) {
    console.error('[credits] consume_credits failed:', error.message);
    return { success: false, error: error.message };
  }

  return data as ConsumeResult;
}

/**
 * Deposit credits: purchase, grant, promotion, or refund.
 * Grants/promotions require admin authorization.
 */
export async function depositCredits(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    amount: number;
    type?: 'purchase' | 'grant' | 'promotion' | 'refund';
    authorizedBy?: string;
    reason?: string;
    paymentRef?: string;
    idempotencyKey?: string;
  },
): Promise<DepositResult> {
  const { data, error } = await supabase.rpc('deposit_credits', {
    p_workspace_id: params.workspaceId,
    p_amount: params.amount,
    p_type: params.type ?? 'purchase',
    p_authorized_by: params.authorizedBy ?? null,
    p_reason: params.reason ?? null,
    p_payment_ref: params.paymentRef ?? null,
    p_idempotency_key: params.idempotencyKey ?? null,
  });

  if (error) {
    console.error('[credits] deposit_credits failed:', error.message);
    return { success: false, error: error.message };
  }

  return data as DepositResult;
}

/**
 * Reconcile wallet: verify stored balance matches transaction ledger sum.
 * Triggers a critical alert if mismatch is found.
 */
export async function reconcileWallet(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ReconcileResult> {
  const { data, error } = await supabase.rpc('reconcile_wallet', {
    p_workspace_id: workspaceId,
  });

  if (error) {
    console.error('[credits] reconcile_wallet failed:', error.message);
    return { success: false, error: error.message };
  }

  return data as ReconcileResult;
}

/**
 * Freeze or unfreeze a wallet. Requires admin authorization.
 */
export async function setWalletStatus(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    status: 'active' | 'frozen' | 'suspended';
    authorizedBy: string;
    reason?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('set_wallet_status', {
    p_workspace_id: params.workspaceId,
    p_status: params.status,
    p_authorized_by: params.authorizedBy,
    p_reason: params.reason ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as { success: boolean; error?: string };
}
