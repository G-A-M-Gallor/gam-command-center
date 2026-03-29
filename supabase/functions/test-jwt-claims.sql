-- Test JWT Claims RLS Functions
-- Run this after setting up the JWT Claims Hook

-- 1. בדוק שהפונקציה הותקנה
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'custom_access_token_hook'
  AND routine_schema = 'public';

-- 2. בדוק שההוק פועל עם נתונים מזויפים
SELECT public.test_jwt_claims() as test_result;

-- 3. צור דוגמת RLS policy שמשתמשת ב-JWT Claims
-- (זה רק דוגמה - תמחק לאחר הבדיקה)

CREATE TABLE IF NOT EXISTS test_workspace_table (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

-- הפעל RLS על הטבלה
ALTER TABLE test_workspace_table ENABLE ROW LEVEL SECURITY;

-- צור policy שמסתמך על JWT claims
CREATE POLICY "workspace_isolation_test" ON test_workspace_table
FOR ALL USING (
  workspace_id = (auth.jwt() ->> 'workspace_id')::uuid
);

-- הוסף נתוני בדיקה
INSERT INTO test_workspace_table (workspace_id, content) VALUES
('default-workspace', 'Test content for default workspace'),
(gen_random_uuid(), 'Test content for other workspace');

-- 4. בדוק גישה לנתונים (צריך לראות רק default workspace)
SELECT * FROM test_workspace_table;

-- 5. בדוק את ה-JWT claims הנוכחיים
SELECT auth.jwt();

-- 6. בדוק את workspace_id הנוכחי
SELECT auth.jwt() ->> 'workspace_id' as current_workspace_id;

-- 7. נקה לאחר הבדיקה
-- DROP TABLE test_workspace_table;