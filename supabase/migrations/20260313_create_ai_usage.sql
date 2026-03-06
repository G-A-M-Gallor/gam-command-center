-- =============================================
-- AI Usage Tracking (DECISION-004)
-- Server-side token budget enforcement
-- =============================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  request_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, date);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON ai_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own usage"
  ON ai_usage FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON ai_usage FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_daily_token_usage(p_user_id UUID)
RETURNS TABLE(total_tokens INT, remaining INT) AS $$
DECLARE
  daily_limit INT := 100000;
  used INT;
BEGIN
  SELECT COALESCE(tokens_input + tokens_output, 0) INTO used
  FROM ai_usage WHERE user_id = p_user_id AND date = CURRENT_DATE;
  IF NOT FOUND THEN used := 0; END IF;
  total_tokens := used;
  remaining := GREATEST(daily_limit - used, 0);
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
