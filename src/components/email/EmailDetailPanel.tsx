'use client';

import { useState, useEffect } from 'react';
import {
  X, Clock, Eye, MousePointerClick, AlertTriangle,
  CheckCircle2, Send, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';

interface EmailSend {
  id: string;
  tenant_id: string | null;
  template_id: string | null;
  resend_id: string | null;
  from_email: string;
  to_email: string;
  cc: string[] | null;
  bcc: string[] | null;
  subject: string;
  html_body: string | null;
  variables: Record<string, string> | null;
  entity_id: string | null;
  status: string;
  opened_count: number;
  clicked_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  first_clicked_at: string | null;
  clicked_links: Array<{ url: string; count: number; first_at: string }> | null;
  bounce_reason: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  email_templates?: { name: string; category: string } | null;
}

interface EmailDetailPanelProps {
  emailSend: EmailSend;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: Record<string, string> }> = {
  queued: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10', label: { he: 'בתור', en: 'Queued', ru: 'В очереди' } },
  sent: { icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10', label: { he: 'נשלח', en: 'Sent', ru: 'Отправлено' } },
  delivered: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: { he: 'נמסר', en: 'Delivered', ru: 'Доставлено' } },
  opened: { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', label: { he: 'נפתח', en: 'Opened', ru: 'Открыто' } },
  clicked: { icon: MousePointerClick, color: 'text-purple-400', bg: 'bg-purple-500/10', label: { he: 'נלחץ', en: 'Clicked', ru: 'Клик' } },
  bounced: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: { he: 'חזר', en: 'Bounced', ru: 'Отклонено' } },
  complained: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', label: { he: 'תלונה', en: 'Complained', ru: 'Жалоба' } },
  failed: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: { he: 'נכשל', en: 'Failed', ru: 'Ошибка' } },
};

// Timeline order for the progress bar
const TIMELINE_ORDER = ['queued', 'sent', 'delivered', 'opened', 'clicked'];

function formatDate(dateStr: string | null | undefined, lang: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(
    lang === 'he' ? 'he-IL' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' },
  );
}

export function EmailDetailPanel({ emailSend, onClose }: EmailDetailPanelProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const e = t.email as Record<string, string>;
  const isRtl = language === 'he';

  const [, setEventsLoading] = useState(true);
  const [showHtml, setShowHtml] = useState(false);

  // Load events for this email
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setEventsLoading(true);
    fetch(`/api/email/sends?limit=1`) // We don't have a dedicated events endpoint, but events are embedded
      .catch(() => {});
    // For now, try fetching events from email_events via the webhook data we already have
    // This is a simplified approach — in production you'd add a /api/email/events?send_id= endpoint
    setEventsLoading(false);
  }, [emailSend.id]);

  const statusConf = STATUS_CONFIG[emailSend.status] || STATUS_CONFIG.queued;
  const StatusIcon = statusConf.icon;
  const currentIdx = TIMELINE_ORDER.indexOf(emailSend.status);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40" onClick={onClose}>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(ev) => ev.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto border-s border-slate-700 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statusConf.bg}`}>
              <StatusIcon className={`h-4 w-4 ${statusConf.color}`} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-100">{emailSend.subject}</h2>
              <span className="text-xs text-slate-500">{emailSend.to_email}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Status progress bar */}
          <div className="flex items-center gap-1">
            {TIMELINE_ORDER.map((step, i) => {
              const conf = STATUS_CONFIG[step];
              const reached = i <= currentIdx;
              return (
                <div key={step} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full transition-colors ${reached ? conf.bg.replace('/10', '/40') : 'bg-slate-800'}`} />
                  <span className={`text-[10px] ${reached ? conf.color : 'text-slate-600'}`}>
                    {conf.label[language] || conf.label.en}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Error / Bounce */}
          {emailSend.status === 'bounced' && emailSend.bounce_reason && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3">
              <span className="text-sm font-medium text-red-400">{e.bounceReason || 'Bounce reason'}:</span>
              <p className="mt-1 text-sm text-red-300">{emailSend.bounce_reason}</p>
            </div>
          )}
          {emailSend.status === 'failed' && emailSend.error_message && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3">
              <span className="text-sm font-medium text-red-400">{e.errorMessage || 'Error'}:</span>
              <p className="mt-1 text-sm text-red-300">{emailSend.error_message}</p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label={e.from || 'From'} value={emailSend.from_email} />
            <DetailItem label={e.to || 'To'} value={emailSend.to_email} />
            <DetailItem label={e.status || 'Status'} value={statusConf.label[language] || statusConf.label.en} />
            <DetailItem label={e.sentAt || 'Sent'} value={formatDate(emailSend.created_at, language)} />
            {emailSend.email_templates && (
              <DetailItem label={e.template || 'Template'} value={`${emailSend.email_templates.name} (${emailSend.email_templates.category})`} />
            )}
            {emailSend.resend_id && (
              <DetailItem label="Resend ID" value={emailSend.resend_id} mono />
            )}
          </div>

          {/* Tracking stats */}
          {(emailSend.opened_count > 0 || emailSend.clicked_count > 0) && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label={e.opens || 'Opens'} value={emailSend.opened_count} color="text-amber-400" bg="bg-amber-500/10" />
              <StatCard label={e.clicks || 'Clicks'} value={emailSend.clicked_count} color="text-purple-400" bg="bg-purple-500/10" />
              <StatCard label={e.firstOpened || 'First open'} value={emailSend.first_opened_at ? formatDate(emailSend.first_opened_at, language) : '—'} color="text-slate-400" bg="bg-slate-700/30" small />
            </div>
          )}

          {/* Clicked links */}
          {emailSend.clicked_links && emailSend.clicked_links.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-300">{e.clickedLinks || 'Clicked Links'}</h3>
              <div className="space-y-1.5">
                {emailSend.clicked_links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2">
                    <ExternalLink className="h-3 w-3 shrink-0 text-purple-400" />
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{link.url}</span>
                    <span className="shrink-0 rounded-full bg-purple-500/20 px-1.5 text-[10px] font-medium text-purple-400">
                      {link.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CC / BCC */}
          {(emailSend.cc?.length || emailSend.bcc?.length) ? (
            <div className="grid grid-cols-2 gap-3">
              {emailSend.cc?.length ? <DetailItem label="CC" value={emailSend.cc.join(', ')} /> : null}
              {emailSend.bcc?.length ? <DetailItem label="BCC" value={emailSend.bcc.join(', ')} /> : null}
            </div>
          ) : null}

          {/* Variables used */}
          {emailSend.variables && Object.keys(emailSend.variables).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-300">{e.variables || 'Variables'}</h3>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                {Object.entries(emailSend.variables).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 py-0.5">
                    <span className="text-xs font-mono text-slate-500">{`{{${k}}}`}</span>
                    <span className="text-xs text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HTML Preview toggle */}
          {emailSend.html_body && (
            <div>
              <button type="button" onClick={() => setShowHtml(!showHtml)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-slate-800/50">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" />
                  {e.htmlPreview || 'HTML Preview'}
                </span>
                {showHtml ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showHtml && (
                <div className="mt-2 max-h-96 overflow-auto rounded-lg border border-slate-700/50 bg-white p-4">
                  <div dangerouslySetInnerHTML={{ __html: emailSend.html_body }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-800/30 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`block truncate text-sm text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color, bg, small }: { label: string; value: string | number; color: string; bg: string; small?: boolean }) {
  return (
    <div className={`rounded-lg ${bg} px-3 py-3 text-center`}>
      <span className={`block ${small ? 'text-xs' : 'text-xl font-bold'} ${color}`}>{value}</span>
      <span className="block text-[10px] text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}
