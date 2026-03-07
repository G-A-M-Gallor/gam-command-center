"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  ClipboardList,
  ShieldCheck,
  Users,
  RefreshCw,
} from "lucide-react";

// ─── Demo Data ──────────────────────────────────────────

interface DemoForm {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ElementType;
  status: "connected" | "pending";
  fields: number;
  submissions: number;
}

const DEMO_FORMS: DemoForm[] = [
  { id: "client-intake",    nameKey: "formClientIntake",    descKey: "formClientIntakeDesc",    icon: Users,          status: "pending", fields: 12, submissions: 0 },
  { id: "project-report",   nameKey: "formProjectReport",   descKey: "formProjectReportDesc",   icon: FileText,       status: "pending", fields: 8,  submissions: 0 },
  { id: "supplier-eval",    nameKey: "formSupplierEval",    descKey: "formSupplierEvalDesc",    icon: ClipboardList,  status: "pending", fields: 15, submissions: 0 },
  { id: "safety-checklist",  nameKey: "formSafetyChecklist",  descKey: "formSafetyChecklistDesc",  icon: ShieldCheck,    status: "pending", fields: 20, submissions: 0 },
  { id: "change-request",   nameKey: "formChangeRequest",   descKey: "formChangeRequestDesc",   icon: RefreshCw,      status: "pending", fields: 10, submissions: 0 },
];

// ─── Page ───────────────────────────────────────────────

export default function FormilyPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const fp = t.formilyPage;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="formily" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Info Banner */}
        <div
          data-cc-id="formily.banner"
          className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-amber-300 mb-1">{fp.bannerTitle}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{fp.bannerDescription}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs rounded px-2 py-1">
              <AlertCircle className="w-3 h-3" />
              {fp.noApiKey}
            </div>
          </div>
        </div>

        {/* Form Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_FORMS.map((form) => {
            const Icon = form.icon;
            const name = fp[form.nameKey as keyof typeof fp] as string;
            const desc = fp[form.descKey as keyof typeof fp] as string;
            return (
              <div
                key={form.id}
                data-cc-id="formily.card"
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3 hover:border-slate-600 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-200 truncate">{name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{desc}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{fp.fields}: <span className="text-slate-300">{form.fields}</span></span>
                  <span>{fp.submissions}: <span className="text-slate-300">{form.submissions}</span></span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className={`inline-flex items-center gap-1.5 text-xs rounded px-2 py-0.5 ${
                    form.status === "connected"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-slate-700/50 text-slate-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      form.status === "connected" ? "bg-emerald-500" : "bg-slate-600"
                    }`} />
                    {form.status === "connected" ? fp.connected : fp.pending}
                  </span>
                  <button
                    disabled
                    className="flex items-center gap-1.5 text-xs text-slate-600 cursor-not-allowed"
                    title={fp.noApiKey}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {fp.openInOrigami}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
