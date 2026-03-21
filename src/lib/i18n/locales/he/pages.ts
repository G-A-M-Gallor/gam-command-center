const pages = {
  dashboard: {
    title: "דשבורד",
    description: "מבט כללי על פרויקטים, מסמכים ופעילות אחרונה",
  },
  appLauncher: {
    title: "כל האפליקציות",
    description: "מסך בית — כל האפליקציות, הווידג׳טים והכלים במקום אחד",
  },
  layers: {
    title: "האב",
    description: "מרכז פיקוד — סטטיסטיקות, פעילות אחרונה, גרפים וגישה מהירה",
  },
  editor: {
    title: "עורך",
    description: "עורך מסמכים Tiptap — שלב 2",
  },
  storyMap: {
    title: "Story Map",
    description: "לוח מפת סיפור עם גרירה — שלב 3",
  },
  functionalMap: {
    title: "מפה פונקציונלית",
    description: "מפת התפקודים של GAM — 3 רמות × 5 פונקציות עם עריכה ישירה",
  },
  aiHub: {
    title: "מרכז AI",
    description: "עוזר AI עם 5 מצבי עבודה — צ'אט, ניתוח, כתיבה, פירוק ומנהל עבודה",
  },
  designSystem: {
    title: "מערכת עיצוב",
    description: "גלריית עיצובים — צפייה, עריכה והשראה",
  },
  architecture: {
    title: "ארכיטקטורה",
    description: "דיאגרמת Mermaid + טבלת כלים — מפת הארכיטקטורה של vBrain.io",
  },
  plan: {
    title: "תוכנית",
    description: "מפת דרכים ב-5 שלבים — ציר זמן עם סטטוס וראוטים",
  },
  settings: {
    title: "הגדרות",
    description: "שפה, עיצוב ופרופיל מותג",
  },
  automations: {
    title: "מרכז אוטומציות",
    description: "לוח בקרה לחיבורים, משימות מתוזמנות, webhooks ופעולות מהירות",
  },
  control: {
    title: "מרכז בקרה",
    description: "סקירה כללית — מפת דרכים, לוג פיתוח, ארכיטקטורה ועדכונים אחרונים",
  },
  admin: {
    title: "לוג פיתוח",
    description: "סקירת מערכת, קומפוננטות ומעקב גרסאות",
  },
  entities: {
    title: "ישויות",
    description: "מערכת ישויות ושדות גלובליים — הכל מתחיל מפתק",
  },
  entityFields: {
    title: "ספריית שדות",
    description: "שדות גלובליים לשימוש חוזר בכל ישות",
  },
  entityTypes: {
    title: "סוגי ישויות",
    description: "תבניות המגדירות אילו שדות להציג בכל סוג פתק",
  },
  wiki: {
    title: "ויקי",
    description: "בסיס ידע עסקי — מאגר שה-AI לומד ממנו להכיר את צרכי העסק",
  },
  grid: {
    title: "גיליון",
    description: "גיליון אלקטרוני עם נוסחאות, צביעה וייצוא CSV",
  },
  slides: {
    title: "מצגת",
    description: "בונה מצגות עם תמונות רקע, טקסט ואלמנטים גרפיים",
  },
  boardroom: {
    title: "חדר דיונים",
    description: "פאנל ייעוצי מרובה פרסונות — 8 יועצים מומחים ב-AI",
  },
  feeds: {
    title: "עדכוני RSS",
    description: "חדשות נדל\"ן ובנייה מהמקורות המובילים בישראל",
  },
  import: {
    title: "ייבוא",
    description: "ייבוא קבצי CSV/Excel למערכת הישויות",
  },
  matching: {
    title: "מנוע התאמות",
    description: "התאמות AI בין ישויות — עובדים, פרויקטים, קבלנים ולידים",
  },
  roadmap: {
    title: "מפת דרכים",
    description: "מבנה עסקי — יעדים, תיקים, פרויקטים, ספרינטים ומשימות",
  },
  comms: {
    title: "תקשורת",
    description: "כל ההודעות, השיחות וההתכתבויות במקום אחד",
  },
  documents: {
    title: "מסמכים",
    description: "הסכמים, חתימות דיגיטליות וארכיון מסמכים",
  },
  weeklyPlanner: {
    title: "סדר שבועי",
    description: "תכנון שבועי, משימות יומיות ותבניות חוזרות",
  },
  audit: {
    title: "יומן ביקורת",
    description: "מעקב אחר כל השינויים והפעולות במערכת — עדויות משפטיות",
  },
  emailTemplates: {
    title: "עיצוב תבניות מייל",
    description: "עורך תבניות מייל — עריכה, משתנים דינמיים ותצוגה מקדימה",
  },
  vcanvas: {
    title: "vCanvas",
    description: "לוח ציור חופשי — סקיצות, דיאגרמות ורעיונות ויזואליים",
  },
} as const;
export default pages;
