# CLAUDE.md — Virtual Team App

**version: 1.0 | date: 04.04.2026 | status: בפיתוח**

---

## 📋 App Identity

**Virtual Team** = מערכת סוכנים וירטואליים לבצע משימות עבור גל. כל סוכן מתמחה בתחום ויכול לבצע פעולות אמיתיות במערכות השונות.

**ציוד:** 5 סוכנים + Scout (מנתב) + מנוע ביצוע + ממשק צ׳אט

---

## 🤖 הסוכנים

### **Scout** 🤖 (המנתב הראשי)
- **תפקיד:** מקבלת בקשה מגל → מזהה מטרה → בוחרת סוכן → מחזירה תוצאה
- **יכולות:** ניתוח שאלות, זיהוי intents, ניתוב חכם
- **טכנולוגיה:** Claude AI + intent classification

### **מילי** 📅 (מנהלת יומנים)
- **תפקיד:** כל מה שקשור ליומן Google Calendar
- **יכולות מומלצות:**
  - יצירת אירועים ביומן
  - הצגת לו״ז היום/שבוע
  - עדכון פגישות קיימות
  - תזכורות אוטומטיות
- **אישיות:** מקצועית, מסודרת, מדויקת עם זמנים
- **טכנולוגיה:** Google Calendar API + Google MCP

### **ברנדון** 📋 (מנהל משימות)
- **תפקיד:** ניהול משימות ב-pm_tasks + דוחות התקדמות
- **יכולות מומלצות:**
  - עדכון סטטוס משימות
  - הצגת משימות לפי מצב/בעלים
  - דוחות התקדמות פרויקטים
  - התראות על דדליינים
- **אישיות:** יעיל, מתודי, עוקב אחר פרטים
- **טכנולוגיה:** Supabase pm_* tables + Notion sync

### **סטיב** 💰 (אנליסט כלכלי)
- **תפקיד:** מידע כלכלי מ-iCount + ניתוחים פיננסיים
- **יכולות מומלצות:**
  - משיכת דוחות מ-iCount
  - הצגת מצב פיננסי נוכחי
  - ניתוח הכנסות/הוצאות
  - תחזיות כלכליות
- **אישיות:** מדויק, אנליטי, עובדתי
- **טכנולוגיה:** iCount API (להטמיע)

### **קלי** 👥 (מנהלת לקוחות)
- **תפקיד:** ניהול לידים ולקוחות באוריגמי
- **יכולות מומלצות:**
  - פתיחת לידים חדשים
  - עדכון פרטי לקוחות
  - מעקב אחר הזדמנויות
  - דוחות מכירות
- **אישיות:** יוצאת, מכירותית, ממוקדת יעדים
- **טכנולוגיה:** Origami MCP + CRM APIs

### **אנדריאה** 📄 (מנהלת מסמכים)
- **תפקיד:** ניהול חוזים + מסמכים + תהליכי אישור
- **יכולות מומלצות:**
  - סימון חוזים כ״נבדקו״
  - מעקב אחר מצב מסמכים
  - תזכורות חתימה
  - ניהול ארכיון מסמכים
- **אישיות:** מדויקת, משפטית, מקפדת על פרטים
- **טכנולוגיה:** Document Engine + DocuSign (להטמיע)

---

## 🏗️ ארכיטקטורה טכנית

### **Database Schema:**

```sql
-- טבלת סוכנים
vb_personas (
  id, name, display_name, personality, system_prompt,
  business_functions[], capabilities (jsonb),
  status, created_at, updated_at
)

-- כלים לכל סוכן
vb_persona_tools (
  persona_id, tool_name, display_name,
  allowed_params (jsonb), required_permissions[],
  enabled, max_executions_per_day
)

-- לוג ביצועים
vb_persona_executions (
  persona_id, tool_name, input_params (jsonb),
  status, result (jsonb), execution_time_ms,
  started_at, completed_at
)
```

### **Edge Functions:**

- **virtual-office-execute** → מנוע הביצוע הראשי
  - `POST { persona, tool, params, user_query }`
  - Validation → Execution → Logging
  - תומך בכל הסוכנים + כל הכלים

### **Frontend Components:**

- **VirtualOfficeChat** → ממשק הצ׳אט הראשי
- **AgentCards** → תצוגת הסוכנים הזמינים
- **ExecutionHistory** → היסטוריית פעולות

---

## 🔄 Workflow

```
1. גל שואל: "קבע לי פגישה מחר בבוקר"
   ↓
2. Scout מזהה: intent=calendar_management, agent=millie
   ↓
3. Scout קורא ל-virtual-office-execute:
   { persona: "millie", tool: "google_calendar_create_event", params: {...} }
   ↓
4. מילי מבצעת: Google Calendar API → יוצרת אירוע
   ↓
5. תוצאה חוזרת: "✅ האירוע נוצר בהצלחה"
```

---

## 🚀 Implementation Priority

### **Phase 1: מילי + יומנים (בביצוע)**
- ✅ Database schema
- ✅ virtual-office-execute function
- ✅ VirtualOfficeChat component
- ⏳ Google Calendar API integration
- ⏳ Intent classification שיפור

### **Phase 2: ברנדון + משימות**
- pm_tasks integration
- Status update workflows
- Progress reporting

### **Phase 3: סטיב + iCount**
- iCount API integration
- Financial data retrieval
- Report generation

### **Phase 4: קלי + אוריגמי**
- Origami CRM integration
- Lead management
- Sales pipeline

### **Phase 5: אנדריאה + מסמכים**
- Document Engine integration
- Contract workflow
- Approval processes

---

## 🔧 Development Guidelines

### **Adding New Agent:**
1. Insert into `vb_personas` table
2. Add tools to `vb_persona_tools`
3. Implement tool handlers in `virtual-office-execute`
4. Test via VirtualOfficeChat interface

### **Adding New Tool:**
1. Define in `vb_persona_tools` with validation rules
2. Implement handler function in Edge Function
3. Add to agent capabilities JSON
4. Test execution + error handling

### **Security Considerations:**
- כל ביצוע דרך validation chain
- Rate limiting per agent/tool
- Parameter sanitization
- Audit trail in executions table

---

## 📊 Monitoring & Analytics

### **Metrics to Track:**
- Execution success rate per agent
- Response times per tool
- User satisfaction scores
- Daily/weekly usage patterns

### **Health Checks:**
- Agent availability status
- API connectivity tests
- Tool validation checks
- Error rate monitoring

### **Business Intelligence:**
- Most used agents
- Common user intents
- Efficiency improvements
- ROI per virtual assistant

---

## 🔮 Future Enhancements

### **Advanced AI:**
- Context memory between sessions
- Learning from user feedback
- Proactive suggestions
- Multi-step task automation

### **Integration Expansion:**
- WhatsApp Business API
- Email automation (Gmail)
- Slack workflows
- Microsoft Office 365

### **User Experience:**
- Voice commands (speech-to-text)
- Mobile app version
- Slack/Teams bot integration
- Dashboard widgets

---

*Virtual Team v1.0 | 04.04.2026 | מערכת סוכנים וירטואליים לGAM Command Center*