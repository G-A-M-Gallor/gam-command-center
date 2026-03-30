'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ApiEndpointsPanelProps {
  t: Record<string, string>;
}

interface EndpointDef {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  auth: 'public' | 'auth' | 'admin';
  testable?: boolean;
}

const ENDPOINTS: EndpointDef[] = [
  // Health & Automations
  { method: 'GET', path: '/api/health', auth: 'public', testable: true },
  { method: 'GET', path: '/api/automations/status', auth: 'public', testable: true },
  { method: 'POST', path: '/api/automations/run-job', auth: 'auth' },
  // AI
  { method: 'POST', path: '/api/ai/chat', auth: 'auth' },
  { method: 'POST', path: '/api/ai/boardroom', auth: 'auth' },
  { method: 'POST', path: '/api/ai/fetch-url', auth: 'auth' },
  // Embeddings
  { method: 'POST', path: '/api/embeddings/generate', auth: 'auth' },
  { method: 'POST', path: '/api/embeddings/search', auth: 'auth' },
  // Entities
  { method: 'GET', path: '/api/entities/[type]', auth: 'auth' },
  { method: 'POST', path: '/api/entities/[type]', auth: 'auth' },
  { method: 'PATCH', path: '/api/entities/[type]', auth: 'auth' },
  { method: 'DELETE', path: '/api/entities/[type]', auth: 'auth' },
  { method: 'GET', path: '/api/entities/[type]/[id]', auth: 'auth' },
  { method: 'PATCH', path: '/api/entities/[type]/[id]', auth: 'auth' },
  { method: 'DELETE', path: '/api/entities/[type]/[id]', auth: 'auth' },
  { method: 'GET', path: '/api/entities/[type]/[id]/comments', auth: 'auth' },
  { method: 'POST', path: '/api/entities/[type]/[id]/comments', auth: 'auth' },
  { method: 'PATCH', path: '/api/entities/[type]/[id]/comments', auth: 'auth' },
  { method: 'DELETE', path: '/api/entities/[type]/[id]/comments', auth: 'auth' },
  // Events
  { method: 'GET', path: '/api/events/today', auth: 'auth' },
  // Git
  { method: 'POST', path: '/api/git/commit', auth: 'public' },
  { method: 'POST', path: '/api/git/deploy', auth: 'public' },
  { method: 'GET', path: '/api/git/status', auth: 'public', testable: true },
  // Installed Components
  { method: 'GET', path: '/api/installed-components', auth: 'public', testable: true },
  // Notifications
  { method: 'GET', path: '/api/notifications', auth: 'auth' },
  { method: 'POST', path: '/api/notifications', auth: 'auth' },
  { method: 'PATCH', path: '/api/notifications', auth: 'auth' },
  // Notion
  { method: 'GET', path: '/api/notion/tasks', auth: 'public', testable: true },
  // Origami
  { method: 'POST', path: '/api/origami/sync', auth: 'auth' },
  { method: 'GET', path: '/api/origami/entities', auth: 'auth' },
  // Contractor
  { method: 'POST', path: '/api/contractor/submit', auth: 'public' },
  { method: 'POST', path: '/api/contractor/upload', auth: 'public' },
  // Push
  { method: 'POST', path: '/api/push/subscribe', auth: 'auth' },
  { method: 'DELETE', path: '/api/push/subscribe', auth: 'auth' },
  { method: 'POST', path: '/api/push/send', auth: 'auth' },
  { method: 'GET', path: '/api/push/subscribers', auth: 'auth' },
  { method: 'DELETE', path: '/api/push/subscribers', auth: 'auth' },
  // System
  { method: 'GET', path: '/api/system/snapshot', auth: 'admin', testable: true },
  // Weekly Planner
  { method: 'GET', path: '/api/weekly-planner', auth: 'auth' },
  { method: 'PUT', path: '/api/weekly-planner', auth: 'auth' },
  // Work Manager
  { method: 'POST', path: '/api/work-manager', auth: 'auth' },
  { method: 'POST', path: '/api/work-manager/execute', auth: 'auth' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  PATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const authLabels: Record<string, { label: string; key: 'authPublic' | 'authRequired' | 'authAdmin'; color: string }> = {
  public: { label: '', key: 'authPublic', color: 'text-slate-500' },
  auth: { label: '', key: 'authRequired', color: 'text-amber-400' },
  admin: { label: '', key: 'authAdmin', color: 'text-red-400' },
};

export function ApiEndpointsPanel({ _t }: ApiEndpointsPanelProps) {
  const [testResults, setTestResults] = useState<Record<string, 'ok' | 'fail' | 'loading'>>({});

  const handleTry = async (path: string) => {
    setTestResults((prev) => ({ ...prev, [path]: 'loading' }));
    try {
      const res = await fetch(path);
      setTestResults((prev) => ({ ...prev, [path]: res.ok ? 'ok' : 'fail' }));
    } catch {
      setTestResults((prev) => ({ ...prev, [path]: 'fail' }));
    }
    setTimeout(() => {
      setTestResults((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    }, 3000);
  };

  return (
    <div data-cc-id="automations.apiEndpoints">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">{t.apiEndpoints}</h3>
        <p className="text-xs text-slate-500">{t.apiEndpointsDesc}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" dir="ltr">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.method}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.path}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{_t.auth}</th>
                <th className="w-16 px-4 py-2.5 text-left font-medium text-slate-500" />
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((ep, i) => {
                const testState = testResults[ep.path];
                const authInfo = authLabels[ep.auth];
                return (
                  <tr
                    key={`${ep.method}-${ep.path}-${i}`}
                    className={`border-b border-slate-700/20 ${i % 2 === 0 ? 'bg-slate-800/10' : ''}`}
                  >
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-300">{ep.path}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] font-medium ${authInfo.color}`}>
                        {_t[authInfo.key]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {ep.testable && (
                        <button
                          onClick={() => handleTry(ep.path)}
                          disabled={testState === 'loading'}
                          className="rounded px-2 py-0.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
                        >
                          {testState === 'loading' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : testState === 'ok' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : testState === 'fail' ? (
                            <XCircle className="h-3 w-3 text-red-400" />
                          ) : (
                            _t.tryIt
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
