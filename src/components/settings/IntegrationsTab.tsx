"use client";

import { useState, useEffect, useCallback } from "react";
import {
  _Shield, MessageSquare, Globe, CreditCard, Link2, Power, Loader2,
  Copy, Check, KeyRound,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { _createClient } from "@/lib/supabase/client";
import type { IntegrationStatus } from "@/app/api/integrations/status/route";

// ─── Google Account Types (moved from settings page) ──────

interface GoogleAccountSafe {
  id: string;
  google_email: string;
  display_name: string | null;
  avatar_url: string | null;
  scopes: string[];
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}

// ─── Copy Button Helper ────────────────────────────────────

function CopyButton({ text, _t }: { text: string; _t: ReturnType<typeof _getTranslations> }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? t.settings.copied : _t.settings.copyUrl}
    </button>
  );
}

// ─── Status Badge ──────────────────────────────────────────

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      active
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-slate-500/10 text-slate-500"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-slate-500"}`} />
      {label}
    </span>
  );
}

// ─── Section Header ────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
    </div>
  );
}

// ─── Service Card ──────────────────────────────────────────

function ServiceCard({
  name, configured, webhookUrl, comingSoon, _t,
}: {
  name: string;
  configured: boolean;
  webhookUrl?: string;
  comingSoon?: boolean;
  _t: ReturnType<typeof _getTranslations>;
}) {
  if (comingSoon) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700/50 p-4 opacity-60">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{name}</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
            {_t.settings.comingSoon}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{name}</span>
        <StatusBadge
          active={configured}
          label={configured ? t.settings.configured : t.settings.notConfigured}
        />
      </div>
      {webhookUrl && (
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-slate-900 px-2 py-1 text-xs text-slate-400">
            {webhookUrl}
          </code>
          <CopyButton text={webhookUrl} _t={_t} />
        </div>
      )}
    </div>
  );
}

// ─── Provider Name Helper ──────────────────────────────────

function getProviderLabel(provider: string, _t: ReturnType<typeof _getTranslations>): string {
  const map: Record<string, string> = {
    email: t.settings.providerEmail,
    github: t.settings.providerGithub,
    facebook: t.settings.providerFacebook,
    azure: t.settings.providerMicrosoft,
    apple: t.settings.providerApple,
    linkedin_oidc: t.settings.providerLinkedin,
    google: t.settings.providerGoogle,
  };
  return map[provider] ?? provider;
}

// ─── Main Component ────────────────────────────────────────

export function IntegrationsTab() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const supabase = createClient();

  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccountSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, accountsRes] = await Promise.all([
        fetch("/api/integrations/status"),
        fetch("/api/google/accounts"),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setGoogleAccounts(data.accounts ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLinkProvider = async (provider: string) => {
    setLinkingProvider(provider);
    try {
      await supabase.auth.linkIdentity({
        provider: provider as "github" | "facebook" | "azure" | "apple" | "linkedin_oidc",
        options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard/settings?tab=accounts` },
      });
    } catch {
      // silent — redirect happens
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlinkProvider = async (identityId: string) => {
    setUnlinkingId(identityId);
    try {
      await supabase.auth.unlinkIdentity({ id: identityId } as Parameters<typeof supabase.auth.unlinkIdentity>[0]);
      // Refresh status
      const res = await fetch("/api/integrations/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // silent
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleToggleGoogle = async (id: string, isActive: boolean) => {
    setToggling(id);
    try {
      const res = await fetch("/api/google/accounts/toggle", {
        method: "PATCH",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: id, isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleAccounts((prev) => prev.map((a) => (a.id === id ? data.account : a)));
      }
    } catch {
      // silent
    } finally {
      setToggling(null);
    }
  };

  const handleDisconnectGoogle = async (id: string) => {
    try {
      const res = await fetch(`/api/google/accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoogleAccounts((prev) => prev.filter((a) => a.id !== id));
        setConfirmDisconnect(null);
      }
    } catch {
      // silent
    }
  };

  const hasGmail = (scopes: string[]) => scopes.some((s) => s.includes("gmail"));
  const hasCalendar = (scopes: string[]) => scopes.some((s) => s.includes("calendar"));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // Linkable providers not yet connected
  const connectedProviderIds = new Set(status?.providers.map((p) => p.provider) ?? []);
  const linkableProviders = ["github", "facebook", "azure", "apple", "linkedin_oidc"]
    .filter((p) => !connectedProviderIds.has(p));

  return (
    <div className="mx-auto max-w-2xl space-y-8" data-cc-id="settings.integrations">
      {/* ── Section A: Auth & Security ── */}
      <div className="space-y-4">
        <SectionHeader icon={_Shield} title={t.settings.sectionAuthSecurity} />

        {/* Current login method */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.settings.currentLoginMethod}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-200">
                {getProviderLabel(status?.currentProvider ?? "email", _t)}
              </p>
            </div>
            <KeyRound className="h-5 w-5 text-slate-500" />
          </div>
        </div>

        {/* Connected identity providers */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">{t.settings.connectedProviders}</p>
          {status?.providers && status.providers.length > 0 ? (
            <div className="space-y-2">
              {status.providers.map((p) => (
                <div key={p.uid} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{getProviderLabel(p.provider, _t)}</p>
                    {p.email && <p className="text-xs text-slate-500">{p.email}</p>}
                  </div>
                  {/* Don't allow unlinking the last provider */}
                  {status.providers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleUnlinkProvider(p.uid)}
                      disabled={unlinkingId === p.uid}
                      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {unlinkingId === p.uid ? <Loader2 className="h-3 w-3 animate-spin" /> : t.settings.unlinkProvider}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{_t.settings.noProviders}</p>
          )}
        </div>

        {/* Link additional providers */}
        {linkableProviders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {linkableProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleLinkProvider(provider)}
                disabled={linkingProvider === provider}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                {linkingProvider === provider ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                {t.settings.linkProvider} {getProviderLabel(provider, _t)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Section B: Communication Services ── */}
      <div className="space-y-4">
        <SectionHeader icon={MessageSquare} title={t.settings.sectionCommunication} />
        <div className="space-y-3">
          <ServiceCard
            name={t.settings.watiWhatsapp}
            configured={status?.services.wati ?? false}
            t={_t}
          />
          <ServiceCard
            name={t.settings.voicenterPbx}
            configured={status?.services.voicenter ?? false}
            t={_t}
          />
        </div>
      </div>

      {/* ── Section C: External Services ── */}
      <div className="space-y-4">
        <SectionHeader icon={Globe} title={t.settings.sectionExternalServices} />

        {/* Google accounts — moved from old AccountsTab */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.settings.googleSection}</h5>
            <a
              href="/api/google/connect"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)]"
            >
              <Link2 className="h-3 w-3" />
              {t.settings.connectGoogle}
            </a>
          </div>

          {googleAccounts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 py-6 text-center">
              <p className="text-sm text-slate-400">{t.settings.noAccounts}</p>
              <p className="mt-1 text-xs text-slate-500">{_t.settings.noAccountsHint}</p>
            </div>
          ) : (
            googleAccounts.map((account) => (
              <div
                key={account.id}
                className={`rounded-lg border p-4 transition-colors ${
                  account.is_active ? "border-slate-700 bg-slate-800/50" : "border-slate-800 bg-slate-900/50 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  {account.avatar_url ? (
                    <img src={account.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-slate-300 text-sm font-medium">
                      {(account.display_name || account.google_email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {account.display_name || account.google_email}
                    </p>
                    <p className="truncate text-xs text-slate-400">{account.google_email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {hasGmail(account.scopes) && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">{_t.settings.scopeGmail}</span>
                      )}
                      {hasCalendar(account.scopes) && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">{_t.settings.scopeCalendar}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleGoogle(account.id, !account.is_active)}
                      disabled={toggling === account.id}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none"
                      style={{ backgroundColor: account.is_active ? "var(--cc-accent-500)" : "#475569" }}
                      title={account.is_active ? t.settings.active : t.settings.inactive}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          account.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    {confirmDisconnect === account.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDisconnectGoogle(account.id)}
                          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          {t.common.confirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDisconnect(null)}
                          className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDisconnect(account.id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        title={t.settings.disconnect}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Other external services */}
        <div className="space-y-3">
          <ServiceCard
            name={t.settings.origamiCrm}
            configured={status?.services.origami ?? false}
            t={_t}
          />
          <ServiceCard
            name={t.settings.notionIntegration}
            configured={status?.services.notion ?? false}
            t={_t}
          />
          <ServiceCard
            name={t.settings.n8nAutomation}
            configured={status?.services.n8n ?? false}
            t={_t}
          />
          <ServiceCard
            name={t.settings.zapierIntegration}
            configured={false}
            t={_t}
          />
          <ServiceCard
            name={t.settings.makeIntegration}
            configured={false}
            t={_t}
          />
        </div>
      </div>

      {/* ── Section D: Messaging Credits (coming soon) ── */}
      <div className="space-y-4">
        <SectionHeader icon={CreditCard} title={t.settings.sectionMessaging} />
        <div className="space-y-3">
          <ServiceCard name={t.settings.smsCredits} configured={false} comingSoon t={_t} />
          <ServiceCard name={t.settings.emailCredits} configured={false} comingSoon t={_t} />
        </div>
      </div>
    </div>
  );
}
