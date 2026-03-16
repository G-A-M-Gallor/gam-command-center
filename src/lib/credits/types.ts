// ── Credit System v2 — Type Definitions ──────────────────────────────

export type TransactionType = 'topup' | 'charge' | 'refund' | 'bonus' | 'expire' | 'consumption' | 'purchase' | 'grant' | 'promotion' | 'adjustment';
export type WalletStatus = 'active' | 'frozen' | 'suspended';
export type AlertType = 'rapid_consumption' | 'unusual_pattern' | 'low_balance' | 'unauthorized_grant' | 'balance_mismatch' | 'large_transaction' | 'frozen_attempt' | 'api_abuse';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type PricingCategory = 'ai' | 'sync' | 'api' | 'page_view' | 'storage' | 'communication' | 'custom' | 'general';

export interface CreditWallet {
  id: string;
  workspace_id: string;
  balance: number;
  currency: string;
  is_unlimited: boolean;
  low_balance_threshold: number;
  lifetime_purchased: number;
  lifetime_consumed: number;
  lifetime_granted: number;
  lifetime_refunded: number;
  last_purchase_at: string | null;
  last_consumption_at: string | null;
  status: WalletStatus;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  balance_after: number;
  authorized_by: string | null;
  authorization_reason: string | null;
  ip_address: string | null;
  is_suspicious: boolean;
  idempotency_key: string | null;
  created_at: string;
}

export interface CreditProduct {
  id: string;
  action: string;
  cost: number;
  name: string | null;
  name_he: string | null;
  category: PricingCategory;
  unit_name: string;
  unit_name_he: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  name_he: string;
  credits_amount: number;
  price_ils: number;
  bonus_credits: number;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CreditAlert {
  id: number;
  workspace_id: string;
  wallet_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  details: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolve_notes: string | null;
  created_at: string;
}

export interface DailyUsage {
  workspace_id: string;
  date: string;
  ai_credits: number;
  sync_credits: number;
  api_credits: number;
  page_credits: number;
  comm_credits: number;
  other_credits: number;
  total_credits: number;
  total_actions: number;
}

export interface MonthlyUsage {
  workspace_id: string;
  month: string;
  ai_credits: number;
  sync_credits: number;
  api_credits: number;
  page_credits: number;
  comm_credits: number;
  other_credits: number;
  total_credits: number;
  total_actions: number;
  credits_purchased: number;
  credits_granted: number;
  credits_refunded: number;
  revenue_ils: number;
}

// ── RPC Result Types ────────────────────────────────────────────────

export interface ConsumeResult {
  success: boolean;
  credits_used?: number;
  balance?: number;
  is_unlimited?: boolean;
  error?: string;
  required?: number;
  idempotent?: boolean;
}

export interface DepositResult {
  success: boolean;
  amount?: number;
  balance?: number;
  type?: string;
  error?: string;
  idempotent?: boolean;
}

export interface ReconcileResult {
  success: boolean;
  stored_balance?: number;
  computed_balance?: number;
  match?: boolean;
  difference?: number;
  error?: string;
}
