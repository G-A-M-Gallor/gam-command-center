# 🚀 מדריך הפעלת מערכת אוטומציות חיות

## 🎯 סקירה
המדריך הזה מסביר איך להפוך את מערכת האוטומציות מנתוני Demo לנתונים חיים עם Supabase.

## 📋 שלבי ההטמעה

### שלב 1: הגדרת מסד נתונים

```bash
# הרץ את המיגרציה החדשה
npx supabase migration new automations_live_schema
```

העתק את התוכן מ-`supabase/migrations/20260330_automations_schema.sql` לקובץ המיגרציה החדש:

```bash
# הרץ את המיגרציה
npx supabase db push
```

### שלב 2: הגדרת Realtime

פעל את Realtime ב-Supabase Dashboard:

1. עבור ל-**Settings** → **API**
2. פעל את **Realtime** עבור הטבלאות:
   - `automations`
   - `automation_runs`
   - `automation_run_steps`
   - `workflow_nodes`
   - `workflow_connections`

### שלב 3: הגדרת משתני סביבה

הוסף ל-`.env.local`:

```env
# אם עדיין לא מוגדר
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### שלב 4: בדיקת המערכת

1. **התחל את השרת:**
   ```bash
   npm run dev
   ```

2. **עבור למערכת החיה:**
   ```
   http://localhost:3000/dashboard/automations-live
   ```

3. **צור אוטומציה ראשונה:**
   - לחץ על "יצירה" ברשימת האוטומציות
   - בחר אוטומציה ב-Workflow Builder
   - גרור רכיבים לקנבס
   - שמור אוטומטית

4. **הפעל ובדוק:**
   - עבור ל-"ניטור ביצועים"
   - לחץ "הפעל עכשיו"
   - ראה עדכונים בזמן אמת

### שלב 5: אינטגרציה עם מערכות חיצוניות

#### Webhook טריגרים

```typescript
// הוסף ל-src/app/api/webhooks/automation/route.ts
export async function POST(request: Request) {
  const { automationId, data } = await request.json()

  // טריגר אוטומציה
  const response = await fetch(`/api/automations-live/${automationId}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trigger_source: 'Webhook',
      trigger_data: data
    })
  })

  return Response.json({ success: true })
}
```

#### Cron Jobs

```typescript
// הוסף ל-src/lib/automation/scheduler.ts
import { CronJob } from 'cron'

export function setupAutomationScheduler() {
  // כל דקה - בדוק אוטומציות מתוזמנות
  const cronChecker = new CronJob('*/1 * * * *', async () => {
    const { data: automations } = await supabase
      .from('automations')
      .select('*')
      .eq('trigger_type', 'cron')
      .eq('status', 'active')

    for (const automation of automations || []) {
      const cronExpression = automation.trigger_config?.expression
      if (shouldRunNow(cronExpression)) {
        await triggerAutomation(automation.id)
      }
    }
  })

  cronChecker.start()
}
```

### שלב 6: מנוע ביצוע אוטומציות

```typescript
// src/lib/automation/executor.ts
export class AutomationExecutor {
  async execute(runId: string) {
    // 1. טען workflow nodes
    // 2. בצע בסדר הנכון
    // 3. עדכן סטטוס בזמן אמת
    // 4. טפל בשגיאות
  }

  async executeNode(nodeId: string, input: any) {
    switch (nodeType) {
      case 'trigger':
        return await this.executeTrigger(node, input)
      case 'action':
        return await this.executeAction(node, input)
      case 'condition':
        return await this.executeCondition(node, input)
      case 'delay':
        return await this.executeDelay(node, input)
    }
  }

  async executeAction(node: any, input: any) {
    const { template } = node.config

    switch (template) {
      case 'api-call':
        return await this.callAPI(node.config, input)
      case 'email-send':
        return await this.sendEmail(node.config, input)
      case 'database':
        return await this.queryDatabase(node.config, input)
    }
  }
}
```

## 🔧 התאמות נוספות

### 1. אבטחה

```typescript
// RLS Policies נוספים
CREATE POLICY "Admins can manage all automations" ON automations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
```

### 2. ניטור וביצועים

```typescript
// src/lib/monitoring/metrics.ts
export async function trackAutomationMetrics() {
  // מטריקות ביצועים
  // התראות על כישלונות
  // סטטיסטיקות שימוש
}
```

### 3. גיבויים

```sql
-- גיבוי יומי של אוטומציות
CREATE OR REPLACE FUNCTION backup_automations()
RETURNS void AS $$
BEGIN
  -- יצוא למחסן חיצוני
END;
$$ LANGUAGE plpgsql;
```

## 🎛 תכונות מתקדמות

### 1. תבניות אוטומציה
- שמירת workflows כתבניות
- שיתוף בין משתמשים
- שוק תבניות

### 2. A/B Testing
- הפעלה של גרסאות שונות
- מדידת ביצועים
- החלפה אוטומטית

### 3. AI Integration
- הצעות לאופטימיזציה
- זיהוי דפוסי כישלון
- חיזוי עומס

## 📊 דוחות וניתוחים

```sql
-- דוח ביצועים שבועי
SELECT
  a.name,
  COUNT(r.id) as runs,
  AVG(r.duration_ms) as avg_duration,
  COUNT(CASE WHEN r.status = 'success' THEN 1 END) * 100.0 / COUNT(r.id) as success_rate
FROM automations a
LEFT JOIN automation_runs r ON a.id = r.automation_id
WHERE r.started_at >= NOW() - INTERVAL '7 days'
GROUP BY a.id, a.name
ORDER BY runs DESC;
```

## 🔍 ניפוי שגיאות

### בעיות נפוצות:

1. **אוטומציה לא מופעלת:**
   - בדוק status = 'active'
   - בדוק הרשאות RLS
   - בדוק trigger config

2. **עדכונים לא מגיעים בזמן אמת:**
   - בדוק חיבור Realtime
   - בדוק subscriptions
   - בדוק network connection

3. **שמירת workflow נכשלת:**
   - בדוק הרשאות שינוי
   - בדוק תקינות JSON
   - בדוק foreign keys

## 🚀 הפעלה בייצור

```bash
# 1. בילד production
npm run build

# 2. הגדר ENV במסד הנתונים
export DATABASE_URL="postgresql://..."

# 3. הרץ migrations
npx prisma migrate deploy

# 4. הפעל שרת
npm start
```

---

## 📞 תמיכה

- **Issues:** GitHub Repository
- **Docs:** [Supabase Docs](https://supabase.com/docs)
- **Community:** Discord

**המערכת מוכנה לנתונים חיים!** 🎉