import { createClient } from './client';

export interface AiUsage {
  id: string;
  user_id: string;
  date: string;
  tokens_input: number;
  tokens_output: number;
  request_count: number;
  updated_at: string;
}

export interface DailyTokenUsage {
  total_tokens: number;
  remaining: number;
}

// ─── Get today's usage for the current user ──────
export async function getDailyUsage(): Promise<DailyTokenUsage> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total_tokens: 0, remaining: 100000 };

  const { data, error } = await supabase.rpc('get_daily_token_usage', {
    p_user_id: user.id,
  });

  if (error || !data?.[0]) return { total_tokens: 0, remaining: 100000 };
  return data[0] as DailyTokenUsage;
}

// ─── Track usage — upsert today's row ────────────
export async function trackUsage(tokensInput: number, tokensOutput: number): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('ai_usage')
    .upsert(
      {
        user_id: user.id,
        date: today,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        request_count: 1,
      },
      { onConflict: 'user_id,date' }
    );

  if (error) {
    // Fallback: increment existing row
    const { error: rpcErr } = await supabase.rpc('increment_ai_usage' as string, {
      p_user_id: user.id,
      p_tokens_input: tokensInput,
      p_tokens_output: tokensOutput,
    });
    return !rpcErr;
  }

  return true;
}
