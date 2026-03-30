import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/credits/balance
 * Auth: JWT required
 * Returns wallet balance, usage stats, and pricing for current workspace.
 */
export async function GET(_request: Request) {
  const auth = await requireAuth(_request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const _user = auth.user!;

  const supabase = createServiceClient();

  // Get user's workspace
  const { data: wu } = await supabase
    .from('vb_workspace_users')
    .select('workspace_id')
    .eq('user_id', _user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!wu) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  // Fetch wallet, today's usage, and pricing in parallel
  const [walletRes, dailyRes, monthlyRes, pricingRes, packagesRes, alertsRes] = await Promise.all([
    supabase
      .from('vb_wallets')
      .select('id, balance, currency, is_unlimited, low_balance_threshold, lifetime_purchased, lifetime_consumed, lifetime_granted, status')
      .eq('workspace_id', wu.workspace_id)
      .single(),
    supabase
      .from('vb_credit_usage_daily')
      .select('*')
      .eq('workspace_id', wu.workspace_id)
      .eq('date', new Date().toISOString().slice(0, 10))
      .single(),
    supabase
      .from('vb_credit_usage_monthly')
      .select('*')
      .eq('workspace_id', wu.workspace_id)
      .eq('month', new Date().toISOString().slice(0, 7) + '-01')
      .single(),
    supabase
      .from('vb_credit_pricing')
      .select('action, cost, name, name_he, category, unit_name, unit_name_he')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('vb_credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('vb_credit_alerts')
      .select('id, alert_type, severity, title, created_at')
      .eq('workspace_id', wu.workspace_id)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    wallet: walletRes.data || null,
    today: dailyRes.data || null,
    month: monthlyRes.data || null,
    pricing: pricingRes.data || [],
    packages: packagesRes.data || [],
    alerts: alertsRes.data || [],
  });
}
