'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, Loader2, Send, ChevronDown,
  Mail, } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  engine: string;
  variables: string[] | null;
}

interface EmailTenant {
  id: string;
  name: string;
  domain: string;
  from_name: string;
  from_email: string;
}

interface SendEmailModalProps {
  onClose: () => void;
  onSent?: () => void;
  /** Pre-fill entity context */
  entityId?: string;
  entityEmail?: string;
  entityName?: string;
}

export function SendEmailModal({ onClose, onSent, entityId, entityEmail, entityName }: SendEmailModalProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === 'he';
  const e = t.email as Record<string, string>;

  // Form state
  const [to, setTo] = useState(entityEmail || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [tenants, setTenants] = useState<EmailTenant[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load templates + tenants
  useEffect(() => {
    fetch('/api/email/templates')
      .then((r) => r.json())
      .then((d) => { if (d.templates) setTemplates(d.templates); })
      .catch(() => { /* no-op */ });

    fetch('/api/email/tenants')
      .then((r) => r.json())
      .then((d) => {
        if (d.tenants) {
          setTenants(d.tenants);
          if (d.tenants.length > 0) setTenantId(d.tenants[0].id);
        }
      })
      .catch(() => { /* no-op */ });
  }, []);

  // When template changes, update subject + variable fields
  useEffect(() => {
    if (!templateId) return;
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      if (tmpl.subject) setSubject(tmpl.subject);
      // Pre-fill variables with entity data if available
      const vars: Record<string, string> = {};
      if (tmpl.variables) {
        for (const v of tmpl.variables) {
          if (v === 'name' && entityName) vars[v] = entityName;
          else if (v === 'email' && entityEmail) vars[v] = entityEmail;
          else vars[v] = variables[v] || '';
        }
      }
      setVariables(vars);
    }
  }, [templateId, templates]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const templateVars = selectedTemplate?.variables || [];

  const handleSend = useCallback(async () => {
    setError('');
    if (!to.trim()) { setError(e.recipientRequired || 'Recipient required'); return; }
    if (!templateId && !subject.trim()) { setError(e.subjectRequired || 'Subject required'); return; }

    setSending(true);
    try {
      const toList = to.split(',').map((s) => s.trim()).filter(Boolean);
      const ccList = cc ? cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
      const bccList = bcc ? bcc.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

      const body: Record<string, unknown> = {
        to: toList.length === 1 ? toList[0] : toList,
        subject: subject || undefined,
        template_id: templateId || undefined,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
        tenant_id: tenantId || undefined,
        entity_id: entityId || undefined,
      };
      if (ccList?.length) body.cc = ccList;
      if (bccList?.length) body.bcc = bccList;

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send');
        setSending(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSent?.();
        onClose();
      }, 1500);
    } catch {
      setError('Network error');
    }
    setSending(false);
  }, [to, cc, bcc, subject, templateId, variables, tenantId, entityId, e, onSent, onClose]);

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
        <div className="rounded-xl border border-emerald-500/30 bg-slate-900 p-8 text-center shadow-2xl"
          onClick={(ev) => ev.stopPropagation()}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <Send className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-lg font-medium text-emerald-400">{e.sent || 'Email sent!'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(ev) => ev.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Mail className="h-5 w-5 text-amber-400" />
            {e.sendEmail || 'Send Email'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Tenant selector */}
          {tenants.length > 1 && (
            <div>
              <label className="mb-1 block text-sm text-slate-400">{e.sendFrom || 'Send from'}</label>
              <div className="relative">
                <select value={tenantId} onChange={(ev) => setTenantId(ev.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pe-8 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none">
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.from_name} &lt;{t.from_email}&gt;</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          )}

          {/* To */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-slate-400">{e.to || 'To'}</label>
              <button type="button" onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-[var(--cc-accent-400)] hover:underline">
                {showCcBcc ? (e.hideCcBcc || 'Hide CC/BCC') : (e.showCcBcc || 'CC/BCC')}
              </button>
            </div>
            <input type="text" value={to} onChange={(ev) => setTo(ev.target.value)}
              placeholder={e.toPlaceholder || 'email@example.com (comma-separated)'}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none" />
          </div>

          {/* CC / BCC */}
          {showCcBcc && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-400">CC</label>
                <input type="text" value={cc} onChange={(ev) => setCc(ev.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">BCC</label>
                <input type="text" value={bcc} onChange={(ev) => setBcc(ev.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none" />
              </div>
            </div>
          )}

          {/* Template */}
          <div>
            <label className="mb-1 block text-sm text-slate-400">{e.template || 'Template'}</label>
            <div className="relative">
              <select value={templateId} onChange={(ev) => setTemplateId(ev.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pe-8 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none">
                <option value="">{e.noTemplate || '— No template —'}</option>
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tmpl.category})</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1 block text-sm text-slate-400">{e.subject || 'Subject'}</label>
            <input type="text" value={subject} onChange={(ev) => setSubject(ev.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-[var(--cc-accent-500)] focus:outline-none" />
          </div>

          {/* Template variables */}
          {templateVars.length > 0 && (
            <div>
              <label className="mb-2 block text-sm text-slate-400">{e.variables || 'Variables'}</label>
              <div className="space-y-2 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                {templateVars.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 text-xs font-mono text-slate-500">{`{{${v}}}`}</span>
                    <input type="text" value={variables[v] || ''} onChange={(ev) => setVariables((prev) => ({ ...prev, [v]: ev.target.value }))}
                      className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-200 focus:border-[var(--cc-accent-500)] focus:outline-none" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-700/50 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              {e.cancel || 'Cancel'}
            </button>
            <button type="button" onClick={handleSend} disabled={sending || !to.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--cc-accent-500)] disabled:opacity-50 transition-colors">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {e.sendBtn || 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
