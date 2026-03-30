"use client";

import {
  Mail, Shield, ExternalLink, KeyRound, UserPlus, Link2, Lock,
  Smartphone, ShieldCheck, ShieldOff, Fingerprint,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

const SUPABASE_TEMPLATES_URL =
  "https://supabase.com/dashboard/project/qdnreijwcptghwoaqlny/auth/templates";

interface TemplateInfo {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const AUTH_TEMPLATES: TemplateInfo[] = [
  { icon: <Mail className="h-4 w-4" />, titleKey: "confirmSignUp", descKey: "confirmSignUpDesc" },
  { icon: <UserPlus className="h-4 w-4" />, titleKey: "inviteUser", descKey: "inviteUserDesc" },
  { icon: <Link2 className="h-4 w-4" />, titleKey: "magicLink", descKey: "magicLinkDesc" },
  { icon: <Mail className="h-4 w-4" />, titleKey: "changeEmail", descKey: "changeEmailDesc" },
  { icon: <KeyRound className="h-4 w-4" />, titleKey: "resetPassword", descKey: "resetPasswordDesc" },
  { icon: <ShieldCheck className="h-4 w-4" />, titleKey: "reauthentication", descKey: "reauthenticationDesc" },
];

const SECURITY_TEMPLATES: TemplateInfo[] = [
  { icon: <Lock className="h-4 w-4" />, titleKey: "passwordChanged", descKey: "passwordChangedDesc" },
  { icon: <Mail className="h-4 w-4" />, titleKey: "emailChanged", descKey: "emailChangedDesc" },
  { icon: <Smartphone className="h-4 w-4" />, titleKey: "phoneChanged", descKey: "phoneChangedDesc" },
  { icon: <Link2 className="h-4 w-4" />, titleKey: "identityLinked", descKey: "identityLinkedDesc" },
  { icon: <ShieldOff className="h-4 w-4" />, titleKey: "identityUnlinked", descKey: "identityUnlinkedDesc" },
  { icon: <Fingerprint className="h-4 w-4" />, titleKey: "mfaAdded", descKey: "mfaAddedDesc" },
  { icon: <ShieldOff className="h-4 w-4" />, titleKey: "mfaRemoved", descKey: "mfaRemovedDesc" },
];

const TEMPLATE_VARIABLES = [
  { variable: "{{ .ConfirmationURL }}", descKey: "varConfirmationUrl" },
  { variable: "{{ .SiteURL }}", descKey: "varSiteUrl" },
  { variable: "{{ .Email }}", descKey: "varEmail" },
];

function TemplateCard({ template, t }: { template: TemplateInfo; t: ReturnType<typeof getTranslations> }) {
  const et = t.emailTemplates;
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
      <div className="mt-0.5 rounded-md bg-slate-700/50 p-2 text-slate-400">
        {template.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">
          {et[template.titleKey as keyof typeof et] ?? template.titleKey}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {et[template.descKey as keyof typeof et] ?? template.descKey}
        </p>
      </div>
    </div>
  );
}

export function EmailTemplatesTab() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const et = t.emailTemplates;
  const isRtl = language === "he";

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-[var(--cc-accent-600-20)] bg-[var(--cc-accent-600-20)] p-4">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cc-accent-400)]" />
        <div>
          <p className="text-sm font-medium text-slate-200">{et.infoBannerTitle}</p>
          <p className="mt-1 text-xs text-slate-400">{et.infoBannerDesc}</p>
        </div>
      </div>

      {/* Open Supabase Button */}
      <a
        href={SUPABASE_TEMPLATES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)]"
      >
        <ExternalLink className="h-4 w-4" />
        {et.openInSupabase}
      </a>

      {/* Authentication Emails */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--cc-accent-400)]" />
          <h3 className="text-sm font-semibold text-slate-200">{et.authEmailsTitle}</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {AUTH_TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.titleKey} template={tpl} t={t} />
          ))}
        </div>
      </div>

      {/* Security Emails */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">{et.securityEmailsTitle}</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {SECURITY_TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.titleKey} template={tpl} t={t} />
          ))}
        </div>
      </div>

      {/* Template Variables */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">{et.variablesTitle}</h3>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-4">
          <div className="space-y-2">
            {TEMPLATE_VARIABLES.map((v) => (
              <div key={v.variable} className="flex items-center gap-3 text-sm">
                <code className="rounded bg-slate-700 px-2 py-0.5 text-xs font-mono text-emerald-400">
                  {v.variable}
                </code>
                <span className="text-slate-400">
                  {et[v.descKey as keyof typeof et] ?? v.descKey}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customization Info */}
      <div className="rounded-lg bg-slate-800/50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">{et.customizationTitle}</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• {et.customSubject}</li>
          <li>• {et.customHtml}</li>
          <li>• {et.customLayout}</li>
          <li>• {et.customCta}</li>
          <li>• {et.customRtl}</li>
          <li>• {et.customBrand}</li>
        </ul>
      </div>
    </div>
  );
}
