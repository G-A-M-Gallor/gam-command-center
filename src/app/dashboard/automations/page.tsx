'use client';

import { useState } from 'react';
import {
  Zap,
  Database,
  Cloud,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  Copy,
  Check,
  AlertCircle,
  Play,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';

// ─── Code examples ───────────────────────────────────
const DB_TRIGGER_EXAMPLE = `-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();`;

const DB_TRIGGER_EXAMPLE_2 = `-- Notify on status change
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (title, body, type)
    VALUES (
      'Project status changed',
      NEW.name || ': ' || OLD.status || ' → ' || NEW.status,
      'status_change'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_status_change
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_change();`;

const EDGE_FUNCTION_EXAMPLE = `// supabase/functions/origami-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { project_id, name, status } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("projects")
    .upsert({
      origami_id: project_id,
      name,
      status,
    }, { onConflict: "origami_id" });

  return new Response(
    JSON.stringify({ ok: !error }),
    { headers: { "Content-Type": "application/json" } }
  );
});`;

const EDGE_FUNCTION_EXAMPLE_2 = `// supabase/functions/send-whatsapp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const { phone, template, params } = await req.json();

  const res = await fetch("https://live-mt-server.wati.io/api/v1/sendTemplateMessage", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${Deno.env.get("WATI_API_KEY")}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      broadcast_name: "cc-automation",
      template_name: template,
      receivers: [{ whatsappNumber: phone, customParams: params }],
    }),
  });

  return new Response(JSON.stringify(await res.json()));
});`;

const PG_CRON_EXAMPLE = `-- Clean notifications older than 30 days — daily at midnight
SELECT cron.schedule(
  'clean-old-notifications',
  '0 0 * * *',
  $$DELETE FROM notifications
    WHERE created_at < now() - interval '30 days'$$
);`;

const PG_CRON_EXAMPLE_2 = `-- Create recurring tasks — every Sunday at 08:00
SELECT cron.schedule(
  'weekly-recurring-tasks',
  '0 8 * * 0',
  $$INSERT INTO tasks (title, status, due_date, is_recurring)
    SELECT title, 'pending', now() + interval '7 days', true
    FROM task_templates
    WHERE recurrence = 'weekly'
      AND is_active = true$$
);`;

const PG_CRON_EXAMPLE_3 = `-- Sync from Origami — every hour
SELECT cron.schedule(
  'origami-sync',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/origami-sync',
    headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb,
    body := '{}'::jsonb
  )$$
);`;

// ─── Activation SQL templates ────────────────────────
const ACTIVATE_TRIGGER = `-- Step 1: Create the function
CREATE OR REPLACE FUNCTION my_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Your logic here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Attach to table
CREATE TRIGGER my_trigger
  AFTER INSERT OR UPDATE ON my_table
  FOR EACH ROW
  EXECUTE FUNCTION my_trigger_fn();`;

const ACTIVATE_EDGE = `# Step 1: Create function
supabase functions new my-function

# Step 2: Write code in supabase/functions/my-function/index.ts

# Step 3: Deploy
supabase functions deploy my-function

# Step 4: Set secrets (optional)
supabase secrets set MY_API_KEY=xxx`;

const ACTIVATE_CRON = `-- Step 1: Enable pg_cron (one-time, in Supabase Dashboard → Extensions)

-- Step 2: Schedule a job
SELECT cron.schedule(
  'job-name',           -- unique name
  '*/5 * * * *',        -- cron expression (every 5 min)
  $$YOUR SQL HERE$$     -- the SQL to run
);

-- Useful cron patterns:
-- '* * * * *'       Every minute
-- '*/5 * * * *'     Every 5 minutes
-- '0 * * * *'       Every hour
-- '0 0 * * *'       Daily at midnight
-- '0 8 * * 1-5'     Weekdays at 08:00
-- '0 8 * * 0'       Every Sunday at 08:00
-- '0 0 1 * *'       First of every month`;

// ─── Component ───────────────────────────────────────
export default function AutomationsPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const a = t.automations;
  const isHe = language === 'he';

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="automations" />

      <div className="mt-8 space-y-10">
        {/* ── n8n Section ──────────────────────── */}
        <N8nSection a={a} isHe={isHe} />

        {/* ── Supabase Automations Header ─────── */}
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
            <Zap className="h-5 w-5 text-amber-400" />
            {a.sectionTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{a.sectionDescription}</p>
        </div>

        {/* ── Three Automation Cards ──────────── */}
        <div className="grid gap-6 lg:grid-cols-3" data-cc-id="automations.cards">
          <AutomationCard
            icon={<Database className="h-6 w-6" />}
            iconColor="text-blue-400"
            borderColor="border-blue-500/30"
            bgColor="bg-blue-500/5"
            accentBg="bg-blue-500/10"
            title={a.dbTriggers}
            description={a.dbTriggersDesc}
            speedLabel={a.dbTriggersSpeed}
            speedValue={a.dbTriggersSpeedValue}
            speedIcon={<Zap className="h-3.5 w-3.5 text-yellow-400" />}
            whenLabel={a.dbTriggersWhen}
            useCases={[a.dbTriggersUse1, a.dbTriggersUse2, a.dbTriggersUse3, a.dbTriggersUse4]}
            examples={[
              { label: 'updated_at trigger', code: DB_TRIGGER_EXAMPLE },
              { label: 'Status change notification', code: DB_TRIGGER_EXAMPLE_2 },
            ]}
            activationCode={ACTIVATE_TRIGGER}
            activateLabel={a.howToActivate}
            exampleLabel={a.example}
            isHe={isHe}
          />

          <AutomationCard
            icon={<Cloud className="h-6 w-6" />}
            iconColor="text-emerald-400"
            borderColor="border-emerald-500/30"
            bgColor="bg-emerald-500/5"
            accentBg="bg-emerald-500/10"
            title={a.edgeFunctions}
            description={a.edgeFunctionsDesc}
            speedLabel={a.edgeFunctionsSpeed}
            speedValue={a.edgeFunctionsSpeedValue}
            speedIcon={<Play className="h-3.5 w-3.5 text-emerald-400" />}
            whenLabel={a.edgeFunctionsWhen}
            useCases={[a.edgeFunctionsUse1, a.edgeFunctionsUse2, a.edgeFunctionsUse3, a.edgeFunctionsUse4]}
            examples={[
              { label: 'Origami webhook', code: EDGE_FUNCTION_EXAMPLE },
              { label: 'WATI WhatsApp', code: EDGE_FUNCTION_EXAMPLE_2 },
            ]}
            activationCode={ACTIVATE_EDGE}
            activateLabel={a.howToActivate}
            exampleLabel={a.example}
            isHe={isHe}
          />

          <AutomationCard
            icon={<Clock className="h-6 w-6" />}
            iconColor="text-purple-400"
            borderColor="border-purple-500/30"
            bgColor="bg-purple-500/5"
            accentBg="bg-purple-500/10"
            title={a.pgCron}
            description={a.pgCronDesc}
            speedLabel={a.pgCronSpeed}
            speedValue={a.pgCronSpeedValue}
            speedIcon={<Timer className="h-3.5 w-3.5 text-purple-400" />}
            whenLabel={a.pgCronWhen}
            useCases={[a.pgCronUse1, a.pgCronUse2, a.pgCronUse3, a.pgCronUse4]}
            examples={[
              { label: 'Clean notifications', code: PG_CRON_EXAMPLE },
              { label: 'Recurring tasks (ClickUp)', code: PG_CRON_EXAMPLE_2 },
              { label: 'Origami sync hourly', code: PG_CRON_EXAMPLE_3 },
            ]}
            activationCode={ACTIVATE_CRON}
            activateLabel={a.howToActivate}
            exampleLabel={a.example}
            highlighted
            highlightLabel={a.pgCronBest}
            isHe={isHe}
          />
        </div>

        {/* ── Comparison Table ────────────────── */}
        <ComparisonTable a={a} isHe={isHe} />
      </div>
    </div>
  );
}

// ─── n8n Section ─────────────────────────────────────
function N8nSection({ a, isHe }: { a: ReturnType<typeof getTranslations>['automations']; isHe: boolean }) {
  const [showIframe, setShowIframe] = useState(false);

  return (
    <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-6" data-cc-id="automations.n8n">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
            <RefreshCw className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{a.n8nTitle}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{a.n8nDescription}</p>
          </div>
        </div>
        <button
          onClick={() => setShowIframe(!showIframe)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition-colors hover:bg-orange-500/20"
        >
          <ExternalLink className="h-4 w-4" />
          {a.openN8n}
        </button>
      </div>

      {/* Docker note */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="text-xs text-slate-500">{a.n8nNote}</p>
      </div>

      {/* iframe */}
      {showIframe && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/80 px-4 py-2">
            <span className="text-xs font-medium text-slate-400">n8n Workflow Editor</span>
            <button
              onClick={() => setShowIframe(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <div className="relative bg-slate-900" style={{ height: '600px' }}>
            {/* Replace YOUR_N8N_URL with actual n8n instance URL */}
            <iframe
              src="about:blank"
              className="h-full w-full border-0"
              title="n8n"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95">
              <RefreshCw className="h-10 w-10 text-orange-400/50" />
              <p className="text-sm text-slate-500">
                {isHe
                  ? 'הגדר כתובת n8n ב-environment variables'
                  : 'Configure n8n URL in environment variables'}
              </p>
              <code className="rounded bg-slate-800 px-3 py-1.5 text-xs text-orange-300">
                NEXT_PUBLIC_N8N_URL=https://your-n8n.example.com
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Automation Card ─────────────────────────────────
interface AutomationCardProps {
  icon: React.ReactNode;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  accentBg: string;
  title: string;
  description: string;
  speedLabel: string;
  speedValue: string;
  speedIcon: React.ReactNode;
  whenLabel: string;
  useCases: string[];
  examples: { label: string; code: string }[];
  activationCode: string;
  activateLabel: string;
  exampleLabel: string;
  highlighted?: boolean;
  highlightLabel?: string;
  isHe: boolean;
}

function AutomationCard({
  icon,
  iconColor,
  borderColor,
  bgColor,
  accentBg,
  title,
  description,
  speedLabel,
  speedValue,
  speedIcon,
  whenLabel,
  useCases,
  examples,
  activationCode,
  activateLabel,
  exampleLabel,
  highlighted,
  highlightLabel,
  isHe,
}: AutomationCardProps) {
  const [expandedExample, setExpandedExample] = useState<number | null>(null);
  const [showActivation, setShowActivation] = useState(false);

  return (
    <div
      className={`relative flex flex-col rounded-xl border ${borderColor} ${bgColor} p-5 transition-shadow hover:shadow-lg`}
    >
      {/* Highlight badge */}
      {highlighted && highlightLabel && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
            <Star className="h-3 w-3 fill-purple-400 text-purple-400" />
            {highlightLabel}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentBg} ${iconColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
      </div>

      {/* Speed badge */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-2">
        {speedIcon}
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{speedLabel}</span>
          <p className="text-xs text-slate-300">{speedValue}</p>
        </div>
      </div>

      {/* Use cases */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{whenLabel}</h4>
        <ul className="space-y-1.5">
          {useCases.map((uc, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
              {uc}
            </li>
          ))}
        </ul>
      </div>

      {/* Examples */}
      <div className="mt-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{exampleLabel}</h4>
        {examples.map((ex, i) => (
          <div key={i}>
            <button
              onClick={() => setExpandedExample(expandedExample === i ? null : i)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800/60"
            >
              <span>{ex.label}</span>
              {expandedExample === i ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              )}
            </button>
            {expandedExample === i && (
              <CodeBlock code={ex.code} />
            )}
          </div>
        ))}
      </div>

      {/* Activation */}
      <div className="mt-auto pt-4">
        <button
          onClick={() => setShowActivation(!showActivation)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border ${borderColor} ${accentBg} px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:brightness-125`}
        >
          <Play className="h-4 w-4" />
          {activateLabel}
        </button>
        {showActivation && (
          <CodeBlock code={activationCode} />
        )}
      </div>
    </div>
  );
}

// ─── CodeBlock ───────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2 overflow-hidden rounded-lg border border-slate-700/50 bg-slate-950">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        data-cc-id="automations.copyCode"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-slate-300" dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Comparison Table ────────────────────────────────
function ComparisonTable({ a, isHe }: { a: ReturnType<typeof getTranslations>['automations']; isHe: boolean }) {
  const rows = [
    {
      feature: isHe ? 'סוג' : 'Type',
      trigger: isHe ? 'פונקציה ב-DB' : 'DB Function',
      edge: isHe ? 'קוד TypeScript בענן' : 'Cloud TypeScript',
      cron: isHe ? 'משימה מתוזמנת' : 'Scheduled Job',
    },
    {
      feature: isHe ? 'מה מפעיל?' : 'Trigger',
      trigger: 'INSERT / UPDATE / DELETE',
      edge: 'HTTP Request / Webhook',
      cron: isHe ? 'לוח זמנים (cron)' : 'Schedule (cron)',
    },
    {
      feature: isHe ? 'מהירות' : 'Speed',
      trigger: isHe ? 'מיידי (בתוך טרנזקציה)' : 'Instant (in transaction)',
      edge: isHe ? 'מהיר (~200ms cold)' : 'Fast (~200ms cold)',
      cron: isHe ? 'לפי לוח זמנים' : 'By schedule',
    },
    {
      feature: isHe ? 'שפה' : 'Language',
      trigger: 'PL/pgSQL (SQL)',
      edge: 'TypeScript / Deno',
      cron: 'SQL',
    },
    {
      feature: isHe ? 'מתאים ל...' : 'Best for',
      trigger: isHe ? 'שמירת שלמות נתונים' : 'Data integrity',
      edge: isHe ? 'אינטגרציות חיצוניות' : 'External integrations',
      cron: isHe ? 'חזרתיות ותחזוקה' : 'Recurrence & maintenance',
    },
    {
      feature: isHe ? 'דוגמה' : 'Example',
      trigger: isHe ? 'עדכון updated_at' : 'Update updated_at',
      edge: isHe ? 'Webhook מ-Origami' : 'Origami webhook',
      cron: isHe ? 'משימות חוזרות' : 'Recurring tasks',
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50" data-cc-id="automations.comparison">
      <div className="border-b border-slate-700/50 bg-slate-800/50 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-200">
          {isHe ? 'השוואה — מתי להשתמש במה?' : 'Comparison — When to use what?'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" dir="ltr">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/30">
              <th className="px-4 py-3 text-left font-medium text-slate-500" />
              <th className="px-4 py-3 text-left">
                <span className="flex items-center gap-1.5 font-medium text-blue-400">
                  <Database className="h-3.5 w-3.5" />
                  DB Triggers
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <Cloud className="h-3.5 w-3.5" />
                  Edge Functions
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="flex items-center gap-1.5 font-medium text-purple-400">
                  <Clock className="h-3.5 w-3.5" />
                  pg_cron
                  <Star className="h-3 w-3 fill-purple-400 text-purple-400" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-slate-700/30 ${i % 2 === 0 ? 'bg-slate-800/10' : ''}`}
              >
                <td className="px-4 py-2.5 font-medium text-slate-400">{row.feature}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.trigger}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.edge}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.cron}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
