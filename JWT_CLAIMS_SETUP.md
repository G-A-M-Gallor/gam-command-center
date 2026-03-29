# 🔑 JWT Claims RLS Setup Guide

## מטרה
הוספת `workspace_id` ו-`role` לתוך JWT tokens כדי לאפשר RLS policies ביעילות גבוהה.

## שלב 1: הרצת המיגרציה

```bash
# הרץ את המיגרציה
cd gam-command-center
npx supabase migration up --file 20260330_jwt_claims_hook.sql
```

## שלב 2: הגדרה ב-Supabase Dashboard

1. **לך ל-Supabase Dashboard:**
   - https://supabase.com/dashboard/project/qdnreijwcptghwoaqlny

2. **נווט ל-Authentication → Hooks:**
   - לחץ על "Add Hook"
   - בחר "Custom Access Token"

3. **הגדר את הפונקציה:**
   ```
   Hook Name: JWT Claims Hook
   Function: public.custom_access_token_hook
   Enabled: ✓
   ```

4. **לחץ Save**

## שלב 3: בדיקת התקנה

### בדוק שהפונקציה קיימת:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'custom_access_token_hook';
```

### בדוק שההוק עובד:
```sql
SELECT public.test_jwt_claims();
```

### בדיקה עם login אמיתי:

1. **התחבר למערכת**
2. **בדוק JWT ב-Developer Tools:**
   ```javascript
   // ב-Console של הדפדפן
   const session = JSON.parse(localStorage.getItem('supabase.auth.token'));
   console.log('JWT Claims:', session);

   // או דרך קוד
   import { supabase } from '@/lib/supabase';
   const { data: { session } } = await supabase.auth.getSession();
   console.log('JWT Claims:', session?.access_token);
   ```

3. **פענח את ה-JWT:**
   - לך ל-https://jwt.io
   - הדבק את ה-access_token
   - בדוק שיש `workspace_id` ו-`role` ב-claims

## שלב 4: שימוש ב-RLS Policies

עכשיו אפשר לכתוב RLS policies עם הclaims:

```sql
-- דוגמה: RLS policy שמסתמכת על workspace_id
CREATE POLICY "workspace_isolation" ON some_table
FOR ALL USING (
  workspace_id = (auth.jwt() ->> 'workspace_id')::uuid
);

-- דוגמה: RLS policy שמסתמכת על role
CREATE POLICY "admin_access" ON some_table
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

## בעיות נפוצות

### ❌ Hook לא פועל:
- ודא שההוק Enabled ב-Dashboard
- בדוק שהפונקציה קיימת ב-DB
- רענן את הדפדפן וההתחבר מחדש

### ❌ workspace_id חסר:
- ודא שיש טבלת `vb_users` עם `auth_id` ו-`workspace_id`
- עד אז יוחזר default workspace

### ❌ role חסר:
- ודא שיש טבלת `vb_workspace_members`
- עד אז יוחזר role 'user'

## הצעד הבא
לאחר שה-JWT Claims פועל, אפשר להמשיך לשלב 2: Auth Layer.