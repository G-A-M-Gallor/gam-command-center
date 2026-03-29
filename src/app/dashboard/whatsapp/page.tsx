import { WATIEmbedWidget } from '@/components/integrations/WATIEmbedWidget';
import { WATIChatInterface } from '@/components/integrations/WATIChatInterface';

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-200">
          WhatsApp Command Center
        </h1>
        <p className="text-slate-400 mt-1">
          נהל את כל התקשורת WhatsApp במקום אחד
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WATI Dashboard Embed */}
        <div className="lg:col-span-1">
          <WATIEmbedWidget className="h-[600px]" />
        </div>

        {/* Quick Chat + Stats */}
        <div className="space-y-6">
          {/* Quick Chat */}
          <div>
            <h2 className="text-lg font-medium text-slate-200 mb-3">
              צ'אט מהיר
            </h2>
            <WATIChatInterface className="h-[400px]" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">145</div>
              <div className="text-xs text-slate-400">הודעות היום</div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-xs text-slate-400">שיחות פעילות</div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">8</div>
              <div className="text-xs text-slate-400">templates</div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">98%</div>
              <div className="text-xs text-slate-400">delivery rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-200 mb-3">פעולות מהירות</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-500">
            Broadcast לכולם
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-500">
            תבנית חדשה
          </button>
          <button className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-500">
            n8n Workflow
          </button>
          <button className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded text-xs hover:bg-slate-600">
            Export דוח
          </button>
        </div>
      </div>
    </div>
  );
}