"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers, Building2, FileCheck, Upload, MapPin, ClipboardCheck,
  ChevronLeft, ChevronRight, Check, AlertCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getTranslations } from "@/lib/i18n";
import type { Language } from "@/contexts/SettingsContext";

// ─── Types ─────────────────────────────────────────

interface WizardData {
  // Step 1: Business Details
  business_name: string;
  business_id: string;
  phone: string;
  email: string;
  address: string;
  // Step 2: License & Classification
  contractor_license_number: string;
  contractor_classification: string;
  classification_category: string[];
  // Step 3: Document Uploads
  insurance_file_url: string;
  license_file_url: string;
  // Step 4: Service Areas
  license_expiry_date: string;
  insurance_expiry_date: string;
  service_area: string[];
}

const STORAGE_KEY = "cc-contractor-wizard";

const INITIAL_DATA: WizardData = {
  business_name: "", business_id: "", phone: "", email: "", address: "",
  contractor_license_number: "", contractor_classification: "", classification_category: [],
  insurance_file_url: "", license_file_url: "",
  license_expiry_date: "", insurance_expiry_date: "", service_area: [],
};

const CLASSIFICATION_TIERS = [
  { value: "gimel_1", label: { he: "ג׳1", en: "C1" } },
  { value: "gimel_2", label: { he: "ג׳2", en: "C2" } },
  { value: "gimel_3", label: { he: "ג׳3", en: "C3" } },
  { value: "gimel_4", label: { he: "ג׳4", en: "C4" } },
  { value: "gimel_5", label: { he: "ג׳5", en: "C5" } },
  { value: "bet_1", label: { he: "ב׳1", en: "B1" } },
  { value: "bet_2", label: { he: "ב׳2", en: "B2" } },
  { value: "bet_3", label: { he: "ב׳3", en: "B3" } },
  { value: "bet_4", label: { he: "ב׳4", en: "B4" } },
  { value: "bet_5", label: { he: "ב׳5", en: "B5" } },
  { value: "alef_1", label: { he: "א׳1", en: "A1" } },
  { value: "alef_2", label: { he: "א׳2", en: "A2" } },
  { value: "alef_3", label: { he: "א׳3", en: "A3" } },
  { value: "alef_4", label: { he: "א׳4", en: "A4" } },
  { value: "alef_5", label: { he: "א׳5", en: "A5" } },
  { value: "unlimited", label: { he: "בלתי מוגבל", en: "Unlimited" } },
];

const CATEGORIES = [
  { value: "skeleton", label: { he: "שלד", en: "Structure" } },
  { value: "finishing", label: { he: "גמר", en: "Finishing" } },
  { value: "infrastructure", label: { he: "תשתיות", en: "Infrastructure" } },
  { value: "electrical", label: { he: "חשמל", en: "Electrical" } },
  { value: "plumbing", label: { he: "אינסטלציה", en: "Plumbing" } },
  { value: "hvac", label: { he: "מיזוג אוויר", en: "HVAC" } },
  { value: "elevators", label: { he: "מעליות", en: "Elevators" } },
  { value: "waterproofing", label: { he: "איטום", en: "Waterproofing" } },
  { value: "roads", label: { he: "כבישים", en: "Roads" } },
  { value: "landscaping", label: { he: "פיתוח סביבתי", en: "Landscaping" } },
  { value: "demolition", label: { he: "הריסות", en: "Demolition" } },
  { value: "special", label: { he: "עבודות מיוחדות", en: "Special Works" } },
];

const SERVICE_AREAS = [
  { value: "north", label: { he: "צפון", en: "North" } },
  { value: "haifa", label: { he: "חיפה והקריות", en: "Haifa Area" } },
  { value: "sharon", label: { he: "שרון", en: "Sharon" } },
  { value: "center", label: { he: "מרכז", en: "Center" } },
  { value: "tel_aviv", label: { he: "תל אביב", en: "Tel Aviv" } },
  { value: "jerusalem", label: { he: "ירושלים", en: "Jerusalem" } },
  { value: "south", label: { he: "דרום", en: "South" } },
  { value: "judea_samaria", label: { he: "יו״ש", en: "Judea & Samaria" } },
  { value: "nationwide", label: { he: "ארצי", en: "Nationwide" } },
];

// ─── Component ─────────────────────────────────────

export default function ContractorWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [language, setLanguage] = useState<Language>("he");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<"insurance" | "license" | null>(null);
  const [error, setError] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");

  const t = getTranslations(language);
  const ct = t.contractor;
  const isRtl = language === "he";
  const l = (obj: { he: string; en: string }) => obj[language === "he" ? "he" : "en"];

  // Load from sessionStorage
  useEffect(() => {
    const stored = localStorage.getItem("cc-language") as Language | null;
    if (stored) setLanguage(stored);

    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setData(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  function toggleMulti(field: "classification_category" | "service_area", value: string) {
    setData((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  async function handleFileUpload(type: "insurance" | "license", file: File) {
    setUploading(type);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/contractor/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Upload failed");
        setUploading(null);
        return;
      }

      update(type === "insurance" ? { insurance_file_url: json.url } : { license_file_url: json.url });
    } catch {
      setError("Upload failed");
    }
    setUploading(null);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/contractor/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.details) {
          const firstError = Object.values(json.details).flat()[0];
          setError(String(firstError));
        } else {
          setError(json.error || "Submission failed");
        }
        setLoading(false);
        return;
      }

      setConfirmationNumber(json.confirmation_number);
      sessionStorage.removeItem(STORAGE_KEY);
      setStep(5); // success step
    } catch {
      setError("Submission failed");
    }
    setLoading(false);
  }

  // Step validation
  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!(data.business_name && data.business_id && data.phone && data.email && data.address);
      case 1: return !!(data.contractor_license_number && data.contractor_classification && data.classification_category.length > 0);
      case 2: return true; // uploads optional
      case 3: return !!(data.license_expiry_date && data.insurance_expiry_date && data.service_area.length > 0);
      default: return true;
    }
  }

  const STEPS = [
    { icon: Building2, label: ct.stepBusiness },
    { icon: FileCheck, label: ct.stepLicense },
    { icon: Upload, label: ct.stepDocuments },
    { icon: MapPin, label: ct.stepServiceArea },
    { icon: ClipboardCheck, label: ct.stepReview },
  ];

  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;

  // Success screen
  if (step === 5) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">{ct.submissionSuccess}</h1>
          <p className="text-sm text-slate-400">{ct.submissionSuccessDesc}</p>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-xs text-slate-500">{ct.confirmationNumber}</p>
            <p className="mt-1 text-lg font-mono font-semibold text-[var(--cc-accent-400)]" dir="ltr">
              {confirmationNumber}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
            <Layers className="h-6 w-6 text-orange-400" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-100">{ct.wizardTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{ct.wizardSubtitle}</p>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setLanguage(language === "he" ? "en" : "he")}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            {language === "he" ? "English" : "עברית"}
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                    i === step
                      ? "bg-orange-500/20 text-orange-400"
                      : i < step
                      ? "bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20"
                      : "bg-slate-800/50 text-slate-600"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`h-px w-4 ${i < step ? "bg-emerald-500/40" : "bg-slate-800"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">

          {/* Step 0: Business Details */}
          {step === 0 && (
            <>
              <h2 className="text-sm font-semibold text-slate-200">{ct.stepBusiness}</h2>
              <FieldInput label={ct.businessName} value={data.business_name} onChange={(v) => update({ business_name: v })} required />
              <FieldInput label={ct.businessId} value={data.business_id} onChange={(v) => update({ business_id: v })} required dir="ltr" />
              <FieldInput label={ct.phone} value={data.phone} onChange={(v) => update({ phone: v })} type="tel" required dir="ltr" />
              <FieldInput label={ct.email} value={data.email} onChange={(v) => update({ email: v })} type="email" required dir="ltr" />
              <FieldInput label={ct.address} value={data.address} onChange={(v) => update({ address: v })} required />
            </>
          )}

          {/* Step 1: License & Classification */}
          {step === 1 && (
            <>
              <h2 className="text-sm font-semibold text-slate-200">{ct.stepLicense}</h2>
              <FieldInput label={ct.licenseNumber} value={data.contractor_license_number} onChange={(v) => update({ contractor_license_number: v })} required dir="ltr" />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">{ct.classificationTier} *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CLASSIFICATION_TIERS.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => update({ contractor_classification: tier.value })}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                        data.contractor_classification === tier.value
                          ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40"
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {l(tier.label)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">{ct.classificationCategory} *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleMulti("classification_category", cat.value)}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                        data.classification_category.includes(cat.value)
                          ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40"
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {l(cat.label)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Document Uploads */}
          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-slate-200">{ct.stepDocuments}</h2>
              <p className="text-xs text-slate-500">{ct.documentsDesc}</p>

              <FileUploadBox
                label={ct.insuranceCert}
                uploaded={!!data.insurance_file_url}
                loading={uploading === "insurance"}
                onFile={(f) => handleFileUpload("insurance", f)}
              />
              <FileUploadBox
                label={ct.licenseScan}
                uploaded={!!data.license_file_url}
                loading={uploading === "license"}
                onFile={(f) => handleFileUpload("license", f)}
              />
            </>
          )}

          {/* Step 3: Service Areas */}
          {step === 3 && (
            <>
              <h2 className="text-sm font-semibold text-slate-200">{ct.stepServiceArea}</h2>

              <FieldInput label={ct.licenseExpiry} value={data.license_expiry_date} onChange={(v) => update({ license_expiry_date: v })} type="date" required dir="ltr" />
              <FieldInput label={ct.insuranceExpiry} value={data.insurance_expiry_date} onChange={(v) => update({ insurance_expiry_date: v })} type="date" required dir="ltr" />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">{ct.serviceAreas} *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SERVICE_AREAS.map((area) => (
                    <button
                      key={area.value}
                      type="button"
                      onClick={() => toggleMulti("service_area", area.value)}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                        data.service_area.includes(area.value)
                          ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40"
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {l(area.label)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <>
              <h2 className="text-sm font-semibold text-slate-200">{ct.stepReview}</h2>
              <div className="space-y-3 text-sm">
                <ReviewSection title={ct.stepBusiness}>
                  <ReviewRow label={ct.businessName} value={data.business_name} />
                  <ReviewRow label={ct.businessId} value={data.business_id} />
                  <ReviewRow label={ct.phone} value={data.phone} />
                  <ReviewRow label={ct.email} value={data.email} />
                  <ReviewRow label={ct.address} value={data.address} />
                </ReviewSection>
                <ReviewSection title={ct.stepLicense}>
                  <ReviewRow label={ct.licenseNumber} value={data.contractor_license_number} />
                  <ReviewRow label={ct.classificationTier} value={CLASSIFICATION_TIERS.find((t) => t.value === data.contractor_classification)?.[language === "he" ? "label" : "label"]?.en || data.contractor_classification} />
                  <ReviewRow label={ct.classificationCategory} value={data.classification_category.map((c) => CATEGORIES.find((cat) => cat.value === c)?.[language === "he" ? "label" : "label"]?.en || c).join(", ")} />
                </ReviewSection>
                <ReviewSection title={ct.stepServiceArea}>
                  <ReviewRow label={ct.licenseExpiry} value={data.license_expiry_date} />
                  <ReviewRow label={ct.insuranceExpiry} value={data.insurance_expiry_date} />
                  <ReviewRow label={ct.serviceAreas} value={data.service_area.map((a) => SERVICE_AREAS.find((s) => s.value === a)?.[language === "he" ? "label" : "label"]?.en || a).join(", ")} />
                </ReviewSection>
                <ReviewSection title={ct.stepDocuments}>
                  <ReviewRow label={ct.insuranceCert} value={data.insurance_file_url ? "✓" : "—"} />
                  <ReviewRow label={ct.licenseScan} value={data.license_file_url ? "✓" : "—"} />
                </ReviewSection>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setStep(step - 1); setError(""); }}
            >
              <PrevIcon className="h-4 w-4 me-1" />
              {ct.back}
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => { setStep(step + 1); setError(""); }}
              disabled={!canAdvance()}
            >
              {ct.next}
              <NextIcon className="h-4 w-4 ms-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              loading={loading}
            >
              {ct.submit}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────

function FieldInput({
  label, value, onChange, type = "text", required, dir,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; dir?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">
        {label} {required && "*"}
      </label>
      <Input
        type={type}
        inputSize="md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
      />
    </div>
  );
}

function FileUploadBox({
  label, uploaded, loading: isLoading, onFile,
}: {
  label: string; uploaded: boolean; loading: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${
      uploaded ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/60"
    }`}>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : uploaded ? (
        <Check className="h-5 w-5 text-emerald-400" />
      ) : (
        <Upload className="h-5 w-5 text-slate-500" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${uploaded ? "text-emerald-400" : "text-slate-300"}`}>{label}</p>
        <p className="text-xs text-slate-500">PDF, JPEG, PNG — max 5MB</p>
      </div>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        disabled={isLoading}
      />
    </label>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-400">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-end text-xs font-medium text-slate-200">{value || "—"}</span>
    </div>
  );
}
