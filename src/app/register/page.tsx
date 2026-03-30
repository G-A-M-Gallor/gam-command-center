"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { _Layers, Mail, User, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { _createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { _getTranslations } from "@/lib/i18n";
import type { _Language } from "@/contexts/SettingsContext";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

type Step = "email" | "verify" | "profile";

function RegisterForm() {
  const _router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<Language>("he");

  // OTP state
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const _t = getTranslations(language);
  const supabase = createClient();
  const isRtl = language === "he";

  useEffect(() => {
    const stored = localStorage.getItem("cc-language") as Language | null;
    if (stored) setLanguage(stored);
  }, []);

  // Step 1: Send OTP to email
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setStep("verify");
    setLoading(false);
  }

  // Step 2: Verify OTP
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
      setError(_t.auth.invalidCode);
      setLoading(false);
      return;
    }

    setStep("_profile");
    setLoading(false);
  }

  // Step 3: Set up profile (server-side role assignment)
  async function handleProfileSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
    } catch {
      setError("Network error");
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

    if (value && index === 5 && next.every((d) => d)) {
      setTimeout(() => handleVerifyOtp(), 50);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const steps: { key: Step; label: string }[] = [
    { key: "email", label: t.auth.email },
    { key: "verify", label: t.auth.verifyCode },
    { key: "profile", label: t.auth.profileSetup },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cc-accent-600-20)]">
            <Layers className="h-6 w-6 text-[var(--cc-accent-400)]" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-100">
              {t.auth.createAccount}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t.auth.registerSubtitle}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < stepIndex
                    ? "bg-emerald-500/20 text-emerald-400"
                    : i === stepIndex
                    ? "bg-[var(--cc-accent-500)] text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 ${i < stepIndex ? "bg-emerald-500/40" : "bg-slate-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {_t.auth.email}
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
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {t.auth.sendCode}
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-center text-sm text-emerald-400">
              {_t.auth.codeSent}
            </p>
            <p className="text-center text-xs text-slate-500">{email}</p>

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

            {error && <p className="text-center text-xs text-red-400">{error}</p>}

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
              onClick={() => { setStep("email"); setOtpCode(["", "", "", "", "", ""]); setError(""); }}
              className="flex w-full items-center justify-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <BackIcon className="h-3 w-3" />
              {t.auth.changeEmail}
            </button>
          </div>
        )}

        {/* Step 3: Profile Setup */}
        {step === "profile" && (
          <form onSubmit={handleProfileSetup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {_t.auth.displayName}
              </label>
              <Input
                type="text"
                inputSize="lg"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.auth.displayNamePlaceholder}
                iconStart={<User className="h-4 w-4" />}
                required
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {t.auth.completeRegistration}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            {t.auth.alreadyHaveAccount}
          </Link>
        </div>
      </div>
    </div>
  );
}
