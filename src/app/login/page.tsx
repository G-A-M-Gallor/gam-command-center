"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, Mail, Lock, Eye, EyeOff, Github, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getTranslations } from "@/lib/i18n";
import type { Language } from "@/contexts/SettingsContext";

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
          <span className="text-xs text-slate-600">{t.auth.or}</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* GitHub login */}
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "github",
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <Github className="h-4 w-4" />
          {t.auth.signInWithGithub}
        </button>

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
