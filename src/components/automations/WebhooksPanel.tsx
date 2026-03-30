'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface WebhooksPanelProps {
  t: Record<string, string>;
}

interface WebhookDef {
  path: string;
  method: 'POST';
  source: string;
  purposeKey: string;
  payload?: string;
}

const WEBHOOKS: WebhookDef[] = [
  {
    path: '/api/origami/sync',
    method: 'POST',
    source: 'Origami CRM',
    purposeKey: 'origamiSyncPurpose',
    payload: `{
  // No body needed — server fetches from Origami
  // Auth: Bearer JWT required
}`,
  },
  {
    path: '/api/origami/entities',
    method: 'POST',
    source: 'Origami CRM',
    purposeKey: 'origamiEntitiesPurpose',
    payload: `{
  "entities": [
    { "id": "...", "name": "...", "type": "..." }
  ]
}`,
  },
  {
    path: '/api/push/subscribe',
    method: 'POST',
    source: 'Browser (PWA)',
    purposeKey: 'pushSubscribePurpose',
    payload: `{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}`,
  },
  {
    path: '/api/contractor/submit',
    method: 'POST',
    source: 'External Form',
    purposeKey: 'contractorSubmitPurpose',
    payload: `{
  "business_name": "...",
  "business_id": "...",
  "phone": "...",
  "email": "...",
  "contractor_license_number": "...",
  "contractor_classification": "...",
  ...
}`,
  },
];

export function WebhooksPanel({ _t }: WebhooksPanelProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedPayload, setExpandedPayload] = useState<string | null>(null);

  const handleCopy = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div data-cc-id="automations.webhooks">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">{t.webhooks}</h3>
        <p className="text-xs text-slate-500">{_t.webhooksDesc}</p>
      </div>

      <div className="space-y-3">
        {WEBHOOKS.map((wh) => (
          <div key={wh.path} className="rounded-xl border border-slate-700/50 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                    {wh.method}
                  </span>
                  <code className="text-xs font-medium text-slate-200">{wh.path}</code>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{t.source}: <span className="text-slate-400">{wh.source}</span></span>
                  <span>{t.purpose}: <span className="text-slate-400">{_t[wh.purposeKey]}</span></span>
                </div>
              </div>

              <button
                onClick={() => handleCopy(wh.path)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700/50 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              >
                {copiedPath === wh.path ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    {_t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    {_t.copyUrl}
                  </>
                )}
              </button>
            </div>

            {wh.payload && (
              <div className="mt-2">
                <button
                  onClick={() => setExpandedPayload(expandedPayload === wh.path ? null : wh.path)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-slate-300"
                >
                  {expandedPayload === wh.path ? (
                    <><ChevronUp className="h-3 w-3" /> {_t.hidePayload}</>
                  ) : (
                    <><ChevronDown className="h-3 w-3" /> {_t.showPayload}</>
                  )}
                </button>

                {expandedPayload === wh.path && (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-700/50 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400" dir="ltr">
                    <code>{wh.payload}</code>
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
