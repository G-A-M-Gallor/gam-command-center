import { Suspense } from "react";
import { ServerHealthDashboard } from "@/components/server/ServerHealthDashboard";
import { Monitor, RefreshCw } from "lucide-react";

export default function ServerHealthPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-200">מצב השרת</h1>
          </div>
          <p className="text-slate-400 text-lg">
            ניטור מצב השרת בזמן אמת - משאבי מערכת, Docker containers ושירותים
          </p>
        </div>

        {/* Dashboard */}
        <Suspense
          fallback={
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">טוען נתוני שרת...</p>
              </div>
            </div>
          }
        >
          <ServerHealthDashboard className="w-full" />
        </Suspense>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              ניטור מערכת
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• CPU - שימוש, ליבות, עומסים</li>
              <li>• זיכרון - שימוש, זמין, סה״כ</li>
              <li>• אחסון - מקום פנוי, שימוש</li>
              <li>• Uptime - זמן פעילות</li>
            </ul>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-purple-400" />
              Docker
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Container status ו-stats</li>
              <li>• שימוש CPU ו-זיכרון</li>
              <li>• רשת I/O</li>
              <li>• Images, Volumes, Networks</li>
            </ul>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-emerald-400" />
              שירותים
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Next.js App - פורט 3000</li>
              <li>• PostgreSQL - פורט 5432</li>
              <li>• Redis - פורט 6379</li>
              <li>• בדיקות health אוטומטיות</li>
            </ul>
          </div>
        </div>

        {/* Technical Notes */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">הערות טכניות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <h4 className="font-medium text-slate-300 mb-2">רענון אוטומטי</h4>
              <p>הנתונים מתעדכנים אוטומטיט כל 30 שניות. ניתן לרענן ידנית בכל עת.</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-300 mb-2">תאימות פלטפורמות</h4>
              <p>תומך במערכות macOS ו-Linux. זיהוי אוטומטי של פלטפורמה.</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-300 mb-2">Docker Optional</h4>
              <p>אם Docker לא זמין, המערכת תמשיך לעבוד עם נתוני המערכת בלבד.</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-300 mb-2">אבטחה</h4>
              <p>הגישה מוגבלת למשתמשים מורשים בלבד. Rate limiting פעיל.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}