"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, Mail, Lock, Eye, EyeOff, Github, KeyRound, type LucideProps } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getTranslations } from "@/lib/i18n";
import type { Language } from "@/contexts/SettingsContext";

// ─── Brand SVG Icons ──────────────────────────────────────

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function MicrosoftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
    </svg>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

type OAuthProvider = {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> | LucideProps>;
  tKey: "signInWithGithub" | "signInWithFacebook" | "signInWithMicrosoft" | "signInWithApple" | "signInWithLinkedIn";
  brandColor: string;
};

const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: "github", icon: Github, tKey: "signInWithGithub", brandColor: "#333" },
  { id: "facebook", icon: FacebookIcon, tKey: "signInWithFacebook", brandColor: "#1877F2" },
  { id: "azure", icon: MicrosoftIcon, tKey: "signInWithMicrosoft", brandColor: "#00A4EF" },
  { id: "apple", icon: AppleIcon, tKey: "signInWithApple", brandColor: "#555" },
  { id: "linkedin_oidc", icon: LinkedInIcon, tKey: "signInWithLinkedIn", brandColor: "#0A66C2" },
];

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

type AuthTab = "password" | "otp";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  // Prevent open redirect — only allow relative paths starting with /
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/dashboard";

  const [tab, setTab] = useState<AuthTab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [language, setLanguage] = useState<Language>("he");

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const t = getTranslations(language);
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem("cc-language") as Language | null;
    if (stored) setLanguage(stored);
  }, []);

  // Show error from URL params (e.g., ?error=unauthorized from middleware)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError(t.auth.unauthorized);
    }
  }, [searchParams, t.auth.unauthorized]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError(t.auth.email);
      return;
    }
    setError("");
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    setOtpSent(true);
    setLoading(false);
  }

  async function handleVerifyOtp() {
    const token = otpCode.join("");
    if (token.length !== 6) return;

    setError("");
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (verifyError) {
      setError(t.auth.invalidCode);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  function handleOtpInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpCode];
    next[index] = value.slice(-1);
    setOtpCode(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && next.every((d) => d)) {
      setTimeout(() => handleVerifyOtp(), 50);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError(t.auth.email);
      return;
    }
    setError("");
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setResetSent(true);
    setLoading(false);
  }

  function toggleLanguage() {
    const next = language === "he" ? "en" : "he";
    setLanguage(next);
    localStorage.setItem("cc-language", next);
    document.documentElement.lang = next === "he" ? "he" : "en";
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cc-accent-600-20)]">
            <Layers className="h-6 w-6 text-[var(--cc-accent-400)]" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-100">
              {t.auth.welcomeBack}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t.auth.signInToCommand}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => { setTab("password"); setError(""); setOtpSent(false); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "password"
                ? "bg-slate-800 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Lock className="me-1.5 inline h-3 w-3" />
            {t.auth.password}
          </button>
          <button
            type="button"
            onClick={() => { setTab("otp"); setError(""); setResetSent(false); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "otp"
                ? "bg-slate-800 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <KeyRound className="me-1.5 inline h-3 w-3" />
            {t.auth.otpCode}
          </button>
        </div>

        {/* Password Tab */}
        {tab === "password" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {t.auth.email}
              </label>
              <Input
                type="email"
                inputSize="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                iconStart={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {t.auth.password}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  inputSize="lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  iconStart={<Lock className="h-4 w-4" />}
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {resetSent && (
              <p className="text-xs text-emerald-400">{t.auth.resetSent}</p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {t.auth.signIn}
            </Button>
          </form>
        )}

        {/* OTP Tab */}
        {tab === "otp" && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {t.auth.email}
              </label>
              <Input
                type="email"
                inputSize="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                iconStart={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
                dir="ltr"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {t.auth.sendCode}
            </Button>
          </form>
        )}

        {tab === "otp" && otpSent && (
          <div className="space-y-4">
            <p className="text-center text-sm text-emerald-400">
              {t.auth.codeSent}
            </p>
            <p className="text-center text-xs text-slate-500">{email}</p>

            {/* 6-digit OTP input */}
            <div className="flex justify-center gap-2" dir="ltr">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-10 rounded-lg border border-slate-700 bg-slate-800/50 text-center text-lg font-semibold text-slate-100 outline-none transition-colors focus:border-[var(--cc-accent-500)] focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-xs text-red-400">{error}</p>
            )}

            <Button
              type="button"
              size="lg"
              loading={loading}
              className="w-full"
              onClick={handleVerifyOtp}
            >
              {t.auth.verifyCode}
            </Button>

            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtpCode(["", "", "", "", "", ""]); setError(""); }}
              className="w-full text-center text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              {t.auth.resendCode}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-600">{t.auth.continueWith}</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* OAuth provider grid */}
        <div className="grid grid-cols-2 gap-2">
          {OAUTH_PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: provider.id as "github" | "facebook" | "azure" | "apple" | "linkedin_oidc",
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                  });
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
              >
                <Icon className="h-4 w-4" />
                {t.auth[provider.tKey]}
              </button>
            );
          })}
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            {t.auth.forgotPassword}
          </button>

          <Link
            href="/register"
            className="text-xs text-[var(--cc-accent-400)] transition-colors hover:text-[var(--cc-accent-300)]"
          >
            {t.auth.createAccount}
          </Link>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            {language === "he" ? "English" : "עברית"}
          </button>
        </div>
      </div>
    </div>
  );
}
