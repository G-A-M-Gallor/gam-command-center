"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { validateIsraeliID } from "@/lib/documents/validateIsraeliID";

// Lazy load signature canvas (heavy, only needed in step 3)
const SignatureCanvas = dynamic(
  () => import("react-signature-canvas").then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <div className="h-40 rounded-lg border border-slate-700 bg-slate-900 animate-pulse" />,
  },
) as any;

// ── Types ────────────────────────────────────────────────────

interface SubmissionProps {
  id: string;
  name: string;
  status: string;
  contentSnapshot: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
}

interface Submitter {
  id: string;
  role: string;
  sort_order: number;
  status: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  accepted_types: string[];
  max_size_mb: number;
}

type SignatureMode = "draw" | "type" | "upload";
type Step = 0 | 1 | 2 | 3;

const CONSENT_TEXT =
  'אני מאשר/ת בזאת כי: (1) קראתי את המסמך במלואו והבנתי את תוכנו, (2) אני חותם/ת מרצוני החופשי ללא כפייה, (3) הפרטים שמסרתי נכונים ומדויקים, (4) חתימתי האלקטרונית שווה בתוקפה לחתימת יד.';

// ── Main Component ───────────────────────────────────────────

export function SigningFlow({
  token,
  submission,
  submitters,
  checklistItems,
}: {
  token: string;
  submission: SubmissionProps;
  submitters: Submitter[];
  checklistItems: ChecklistItem[];
}) {
  const [step, setStep] = useState<Step>(0);
  const [selectedSubmitter, setSelectedSubmitter] = useState<string>(
    submitters.find((s) => s.status === "pending")?.id || submitters[0]?.id || ""
  );

  // Form state
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Signature state
  const [sigMode, setSigMode] = useState<SignatureMode>("draw");
  const [typedSig, setTypedSig] = useState("");
  const [uploadedSig, setUploadedSig] = useState<string | null>(null);
  const sigCanvasRef = useRef<any>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validation ─────────────────────────────────────────────

  const idValid = idNumber.length >= 5 ? validateIsraeliID(idNumber) : null;

  const hasSignature =
    sigMode === "draw"
      ? sigCanvasRef.current && !sigCanvasRef.current.isEmpty?.()
      : sigMode === "type"
        ? typedSig.trim().length >= 2
        : uploadedSig !== null;

  const canSubmit =
    fullName.trim().length >= 2 &&
    idValid === true &&
    consentChecked &&
    hasSignature &&
    selectedSubmitter;

  // ── Handlers ───────────────────────────────────────────────

  const clearSignature = useCallback(() => {
    if (sigMode === "draw" && sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    } else if (sigMode === "type") {
      setTypedSig("");
    } else {
      setUploadedSig(null);
    }
  }, [sigMode]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedSig(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const getSignatureData = useCallback((): string => {
    if (sigMode === "draw" && sigCanvasRef.current) {
      return sigCanvasRef.current.toDataURL("image/png");
    }
    if (sigMode === "type") return typedSig;
    if (sigMode === "upload" && uploadedSig) return uploadedSig;
    return "";
  }, [sigMode, typedSig, uploadedSig]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const signatureData = getSignatureData();
      const signatureType =
        sigMode === "draw" ? "drawn" : sigMode === "type" ? "typed" : "uploaded";

      const res = await fetch("/api/documents/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          submitter_id: selectedSubmitter,
          signature_type: signatureType,
          signature_data: signatureData,
          full_name: fullName.trim(),
          business_name: businessName.trim() || undefined,
          id_number: idNumber.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          consent_given: true,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "שגיאה בחתימה");
        return;
      }

      // Success → move to confirmation step
      setStep(3);
    } catch {
      setError("שגיאת תקשורת — נסה שוב");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit, isSubmitting, getSignatureData, sigMode, token,
    selectedSubmitter, fullName, businessName, idNumber, email, phone,
  ]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="text-xs text-slate-500">vBrain.io — חתימה מאובטחת 🔒</span>
          <StepIndicator current={step} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {step === 0 && (
          <StepIntro
            name={submission.name}
            submitters={submitters}
            selectedSubmitter={selectedSubmitter}
            onSelectSubmitter={setSelectedSubmitter}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <StepRead
            name={submission.name}
            contentSnapshot={submission.contentSnapshot}
            fieldValues={submission.fieldValues}
            checklistItems={checklistItems}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepSign
            fullName={fullName}
            setFullName={setFullName}
            idNumber={idNumber}
            setIdNumber={setIdNumber}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            businessName={businessName}
            setBusinessName={setBusinessName}
            idValid={idValid}
            consentChecked={consentChecked}
            setConsentChecked={setConsentChecked}
            sigMode={sigMode}
            setSigMode={setSigMode}
            typedSig={typedSig}
            setTypedSig={setTypedSig}
            uploadedSig={uploadedSig}
            onFileUpload={handleFileUpload}
            sigCanvasRef={sigCanvasRef}
            clearSignature={clearSignature}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            error={error}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}

        {step === 3 && <StepConfirmation name={submission.name} />}
      </main>
    </div>
  );
}

// ── Step Indicator ───────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const labels = ["מבוא", "קריאה", "חתימה", "אישור"];
  return (
    <div className="flex gap-1.5">
      {labels.map((label, i) => (
        <div
          key={label}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
            i === current
              ? "bg-purple-600/30 text-purple-300"
              : i < current
                ? "bg-emerald-600/20 text-emerald-400"
                : "bg-slate-800 text-slate-600"
          }`}
        >
          {i < current ? "✓" : i + 1}
          <span className="hidden sm:inline">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Step 0: Intro ────────────────────────────────────────────

function StepIntro({
  name,
  submitters,
  selectedSubmitter,
  onSelectSubmitter,
  onNext,
}: {
  name: string;
  submitters: Submitter[];
  selectedSubmitter: string;
  onSelectSubmitter: (id: string) => void;
  onNext: () => void;
}) {
  const pending = submitters.filter((s) => s.status === "pending");

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-4 text-5xl">📄</div>
        <h1 className="text-2xl font-bold text-slate-100">{name}</h1>
        <p className="mt-2 text-slate-400">
          קיבלת מסמך לחתימה מ-<strong className="text-slate-300">GAM</strong>
        </p>
      </div>

      {pending.length > 1 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-300">מי אתה מבין החותמים?</p>
          <div className="space-y-2">
            {pending.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedSubmitter === s.id
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="submitter"
                  value={s.id}
                  checked={selectedSubmitter === s.id}
                  onChange={() => onSelectSubmitter(s.id)}
                  className="accent-purple-500"
                />
                <span className="text-sm text-slate-200">
                  {s.full_name || s.email || `חותם ${s.sort_order + 1}`}
                </span>
                <span className="mr-auto text-xs text-slate-500">{s.role === "witness" ? "עד" : s.role === "approver" ? "מאשר" : "חותם"}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-2 text-sm font-medium text-slate-300">מה יקרה עכשיו?</h3>
        <ol className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2"><span className="text-purple-400">1.</span> תקרא את המסמך במלואו</li>
          <li className="flex gap-2"><span className="text-purple-400">2.</span> תמלא את פרטיך האישיים (שם + ת.ז)</li>
          <li className="flex gap-2"><span className="text-purple-400">3.</span> תחתום באחת מ-3 דרכים: ציור, הקלדה או העלאה</li>
          <li className="flex gap-2"><span className="text-purple-400">4.</span> תקבל אישור + עותק חתום במייל</li>
        </ol>
      </div>

      <button
        onClick={onNext}
        disabled={!selectedSubmitter}
        className="w-full rounded-xl bg-purple-600 py-3.5 text-center font-medium text-white transition-colors hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500"
      >
        להמשיך לקריאת המסמך →
      </button>
    </div>
  );
}

// ── Step 1: Read Document ────────────────────────────────────

function StepRead({
  name,
  contentSnapshot,
  fieldValues,
  checklistItems,
  onBack,
  onNext,
}: {
  name: string;
  contentSnapshot: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  checklistItems: ChecklistItem[];
  onBack: () => void;
  onNext: () => void;
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (atBottom) setScrolledToBottom(true);
  }, []);

  // Render Tiptap snapshot to simple HTML
  const html = renderSnapshotToHtml(contentSnapshot, fieldValues);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">{name}</h2>
        <p className="mt-1 text-sm text-slate-400">קרא את המסמך במלואו לפני החתימה</p>
      </div>

      {/* Document content — scrollable */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-6"
      >
        <article
          className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {!scrolledToBottom && (
        <p className="text-center text-xs text-amber-400/70">
          ↓ גלול עד סוף המסמך כדי להמשיך
        </p>
      )}

      {checklistItems.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">📋 מסמכים נדרשים</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {checklistItems.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className={item.is_required ? "text-red-400" : "text-slate-500"}>
                  {item.is_required ? "•" : "○"}
                </span>
                <div>
                  <span className="text-slate-300">{item.label}</span>
                  {item.is_required && <span className="mr-1 text-xs text-red-400">(חובה)</span>}
                  {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
        >
          ← חזור
        </button>
        <button
          onClick={onNext}
          disabled={!scrolledToBottom}
          className="flex-1 rounded-xl bg-purple-600 py-3 text-center font-medium text-white transition-colors hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500"
        >
          קראתי את המסמך — להמשיך לחתימה →
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Sign ─────────────────────────────────────────────

function StepSign({
  fullName, setFullName,
  idNumber, setIdNumber,
  email, setEmail,
  phone, setPhone,
  businessName, setBusinessName,
  idValid,
  consentChecked, setConsentChecked,
  sigMode, setSigMode,
  typedSig, setTypedSig,
  uploadedSig,
  onFileUpload,
  sigCanvasRef,
  clearSignature,
  canSubmit,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: {
  fullName: string; setFullName: (v: string) => void;
  idNumber: string; setIdNumber: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  businessName: string; setBusinessName: (v: string) => void;
  idValid: boolean | null;
  consentChecked: boolean; setConsentChecked: (v: boolean) => void;
  sigMode: SignatureMode; setSigMode: (v: SignatureMode) => void;
  typedSig: string; setTypedSig: (v: string) => void;
  uploadedSig: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sigCanvasRef: React.RefObject<any>;
  clearSignature: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">פרטים וחתימה</h2>
        <p className="mt-1 text-sm text-slate-400">מלא את הפרטים וחתום על המסמך</p>
      </div>

      {/* Identity fields */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="text-sm font-medium text-slate-300">👤 פרטי זיהוי</h3>

        <Field label="שם מלא *" value={fullName} onChange={setFullName} placeholder="ישראל ישראלי" />

        <div>
          <Field
            label="ת.ז / ח.פ *"
            value={idNumber}
            onChange={(v) => setIdNumber(v.replace(/\D/g, "").slice(0, 9))}
            placeholder="123456789"
            inputMode="numeric"
          />
          {idNumber.length >= 5 && idValid !== null && (
            <p className={`mt-1 text-xs ${idValid ? "text-emerald-400" : "text-red-400"}`}>
              {idValid ? "✓ מספר תקין" : "✗ מספר לא תקין — בדוק שוב"}
            </p>
          )}
        </div>

        <Field label="שם עסק (אם רלוונטי)" value={businessName} onChange={setBusinessName} placeholder="שם החברה" />
        <Field label="אימייל" value={email} onChange={setEmail} placeholder="name@example.com" type="email" />
        <Field label="טלפון" value={phone} onChange={setPhone} placeholder="050-1234567" type="tel" />
      </div>

      {/* Signature */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="text-sm font-medium text-slate-300">✍️ חתימה</h3>

        {/* Mode tabs */}
        <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
          {([
            { mode: "draw" as const, icon: "✍️", label: "ציור" },
            { mode: "type" as const, icon: "⌨️", label: "הקלדה" },
            { mode: "upload" as const, icon: "📁", label: "העלאה" },
          ]).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setSigMode(mode)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm transition-colors ${
                sigMode === mode
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:text-slate-400"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Draw mode */}
        {sigMode === "draw" && (
          <div>
            <div className="overflow-hidden rounded-lg border border-slate-700 bg-white">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="#1e293b"
                canvasProps={{
                  className: "w-full h-40",
                  style: { width: "100%", height: 160 },
                }}
              />
            </div>
            <button
              onClick={clearSignature}
              className="mt-2 text-xs text-slate-500 hover:text-slate-400"
            >
              🗑️ נקה חתימה
            </button>
          </div>
        )}

        {/* Type mode */}
        {sigMode === "type" && (
          <div>
            <input
              type="text"
              value={typedSig}
              onChange={(e) => setTypedSig(e.target.value)}
              placeholder="הקלד את שמך המלא"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-center font-serif text-2xl text-slate-200 placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
            />
            {typedSig && (
              <div className="mt-3 flex justify-center rounded-lg border border-slate-700 bg-white p-4">
                <span className="font-serif text-3xl text-slate-800">{typedSig}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload mode */}
        {sigMode === "upload" && (
          <div>
            {uploadedSig ? (
              <div className="space-y-2">
                <div className="flex justify-center rounded-lg border border-slate-700 bg-white p-4">
                  <img src={uploadedSig} alt="חתימה" className="max-h-32" />
                </div>
                <button
                  onClick={clearSignature}
                  className="text-xs text-slate-500 hover:text-slate-400"
                >
                  🗑️ החלף תמונה
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-700 py-8 transition-colors hover:border-slate-600">
                <span className="text-3xl">📁</span>
                <span className="text-sm text-slate-400">לחץ להעלאת תמונת חתימה</span>
                <span className="text-xs text-slate-600">PNG, JPG עד 5MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Consent */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1 h-5 w-5 accent-purple-500"
          />
          <span className="text-sm leading-relaxed text-slate-300">
            {CONSENT_TEXT}
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-700 px-6 py-3.5 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300 disabled:opacity-50"
        >
          ← חזור
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-medium text-white transition-colors hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              חותם...
            </>
          ) : (
            "חתום על המסמך ✍️"
          )}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Confirmation ─────────────────────────────────────

function StepConfirmation({ name }: { name: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mb-4 text-6xl">✅</div>
      <h2 className="text-2xl font-bold text-slate-100">נחתם בהצלחה!</h2>
      <p className="text-slate-400">
        המסמך <strong className="text-slate-300">&ldquo;{name}&rdquo;</strong> נחתם.
        <br />
        עותק חתום ישלח אליך במייל.
      </p>
      <div className="mx-auto max-w-sm rounded-xl border border-emerald-800/30 bg-emerald-900/10 p-4 text-sm text-emerald-300/80">
        🔒 החתימה שלך מאובטחת ומתועדת עם IP, חותמת זמן, וhash מסמך
      </div>
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
      />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function renderSnapshotToHtml(
  content: Record<string, unknown>,
  fieldValues: Record<string, unknown>,
): string {
  if (!content) return "<p>תוכן המסמך אינו זמין</p>";
  // Render Tiptap JSON snapshot with resolved field values
  return renderNode(content, fieldValues);
}

function renderNode(
  node: any,
  fieldValues: Record<string, unknown>,
): string {
  if (!node) return "";

  if (node.type === "text") {
    let text = escapeHtml(node.text || "");
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold": text = `<strong>${text}</strong>`; break;
          case "italic": text = `<em>${text}</em>`; break;
          case "underline": text = `<u>${text}</u>`; break;
          case "strike": text = `<s>${text}</s>`; break;
        }
      }
    }
    return text;
  }

  // Smart field node — resolve from field_values
  if (node.type === "smartField") {
    const fieldKey = node.attrs?.fieldKey || node.attrs?.key;
    const val = fieldKey && fieldValues[fieldKey];
    const display = val ? String(val) : node.attrs?.placeholder || `【${fieldKey}】`;
    return `<span class="rounded bg-purple-500/20 px-1 py-0.5 text-purple-300">${escapeHtml(display)}</span>`;
  }

  const children = (node.content || [])
    .map((child: unknown) => renderNode(child, fieldValues))
    .join("");

  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `<p>${children || "&nbsp;"}</p>`;
    case "heading": return `<h${node.attrs?.level || 2}>${children}</h${node.attrs?.level || 2}>`;
    case "bulletList": return `<ul>${children}</ul>`;
    case "orderedList": return `<ol>${children}</ol>`;
    case "listItem": return `<li>${children}</li>`;
    case "blockquote": return `<blockquote>${children}</blockquote>`;
    case "codeBlock": return `<pre><code>${children}</code></pre>`;
    case "hardBreak": return "<br>";
    case "horizontalRule": return "<hr>";
    default: return children;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
