"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { EntityCardField } from "@/components/vBlock/blocks/EntityCardField";
import type { NoteRecord, GlobalField, EntityType, FieldCategory } from "@/lib/entities/types";
import type { FieldSlot, FieldDisplayType } from "@/components/vBlock/blocks/entityCard.types";

interface Props {
  entity: NoteRecord;
}

/* ─── category labels ─────────────────────────────── */
const CATEGORY_LABELS: Record<FieldCategory, { he: string; en: string; icon: string }> = {
  system:       { he: "מערכת",   en: "System",       icon: "⚙️" },
  general:      { he: "כללי",    en: "General",      icon: "📋" },
  contact:      { he: "קשר",     en: "Contact",      icon: "👤" },
  business:     { he: "עסקי",    en: "Business",     icon: "💼" },
  project:      { he: "פרויקט",  en: "Project",      icon: "🏗️" },
  hr:           { he: "משאבי אנוש", en: "HR",        icon: "🧑‍💼" },
  finance:      { he: "פיננסי",  en: "Finance",      icon: "💰" },
  construction: { he: "בנייה",   en: "Construction",  icon: "🏠" },
};

/* ─── map field_type → displayType ─────────────────── */
function fieldTypeToDisplayType(ft: string): FieldDisplayType {
  switch (ft) {
    case "phone": return "phone";
    case "email": return "email";
    case "url": return "link";
    case "date": case "datetime": return "date";
    case "currency": return "currency";
    case "rating": return "rating";
    case "select": case "multi-select": return "badge";
    default: return "text";
  }
}

/* ─── convert GlobalField → FieldSlot ─────────────── */
function toFieldSlot(gf: GlobalField, idx: number): FieldSlot {
  return {
    metaKey: gf.meta_key,
    label: gf.label,
    fieldType: gf.field_type,
    displayType: fieldTypeToDisplayType(gf.field_type),
    icon: gf.icon ?? undefined,
    priority: gf.sort_order || idx,
  };
}

/* ─── Collapsible Group ───────────────────────────── */
function FieldGroup({
  category,
  fields,
  meta,
}: {
  category: FieldCategory;
  fields: GlobalField[];
  meta: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(true);
  const cat = CATEGORY_LABELS[category] ?? CATEGORY_LABELS.general;

  // count how many fields have values
  const filledCount = fields.filter((f) => meta[f.meta_key] != null && meta[f.meta_key] !== "").length;

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-slate-800/80 hover:bg-slate-700/50 transition-colors text-start"
      >
        <span className="text-xs">{cat.icon}</span>
        <span className="text-xs font-medium text-slate-300 flex-1">{cat.he}</span>
        <span className="text-[10px] text-slate-500">{filledCount}/{fields.length}</span>
        {open ? (
          <ChevronDown className="w-3 h-3 text-slate-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-500" />
        )}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-0.5">
          {fields.map((gf, idx) => {
            const slot = toFieldSlot(gf, idx);
            const value = meta[gf.meta_key];
            // show empty fields as dashes so user sees the template shape
            return (
              <EntityCardField
                key={gf.meta_key}
                slot={slot}
                value={value ?? "—"}
                language="he"
                compact
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────── */
export function VNoteEntityView({ entity }: Props) {
  const meta = entity.meta ?? {};
  const entityType = entity.entity_type;

  // Fetch entity type definition (field_refs)
  const { data: typeDef } = useQuery({
    queryKey: ["vnote-entity-type", entityType],
    queryFn: async () => {
      if (!entityType) return null;
      const { data } = await supabase
        .from("entity_types")
        .select("*")
        .eq("slug", entityType)
        .single();
      return (data as EntityType) ?? null;
    },
    enabled: !!entityType,
    staleTime: 5 * 60_000,
  });

  // Fetch global fields (filtered by field_refs if available)
  const { data: globalFields, isLoading } = useQuery({
    queryKey: ["vnote-global-fields", entityType, typeDef?.field_refs],
    queryFn: async () => {
      let query = supabase
        .from("global_fields")
        .select("*")
        .order("sort_order", { ascending: true });

      if (typeDef?.field_refs && typeDef.field_refs.length > 0) {
        query = query.in("meta_key", typeDef.field_refs);
      }

      const { data } = await query;
      return (data as GlobalField[]) ?? [];
    },
    enabled: !!entityType,
    staleTime: 5 * 60_000,
  });

  // Fallback: no entity type or loading
  if (!entityType) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-xs text-slate-500 text-center py-4">אין סוג ישות מוגדר</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center justify-center py-6">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Group fields by category
  const grouped = new Map<FieldCategory, GlobalField[]>();
  if (globalFields && globalFields.length > 0) {
    for (const gf of globalFields) {
      const cat = (gf.category ?? "general") as FieldCategory;
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(gf);
    }
  }

  // If no global fields matched, fall back to raw meta display
  const hasFields = grouped.size > 0;

  // Determine display order: use typeDef sections if available
  const sections = typeDef?.template_config?.layout?.sections;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-200">שדות ישות</h3>
        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
          {typeDef?.icon ?? "📄"} {typeDef?.label?.he ?? entityType}
        </span>
      </div>

      {hasFields ? (
        <div className="space-y-2">
          {sections && sections.length > 0
            ? // Template sections defined — use them
              sections.map((sec) => {
                const secFields = globalFields!.filter((gf) =>
                  sec.field_refs.includes(gf.meta_key)
                );
                if (secFields.length === 0) return null;
                return (
                  <FieldGroupSection
                    key={sec.key}
                    label={sec.label?.he ?? sec.key}
                    icon="📂"
                    fields={secFields}
                    meta={meta}
                    defaultOpen={!sec.collapsed}
                  />
                );
              })
            : // No sections — group by category
              Array.from(grouped.entries())
                .sort(([a], [b]) => {
                  const order: FieldCategory[] = [
                    "general", "contact", "business", "project",
                    "finance", "construction", "hr", "system",
                  ];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([cat, fields]) => (
                  <FieldGroup key={cat} category={cat} fields={fields} meta={meta} />
                ))}
        </div>
      ) : (
        // Fallback: raw meta display
        <FallbackMetaDisplay meta={meta} />
      )}
    </div>
  );
}

/* ─── Template Section Group ──────────────────────── */
function FieldGroupSection({
  label,
  icon,
  fields,
  meta,
  defaultOpen = true,
}: {
  label: string;
  icon: string;
  fields: GlobalField[];
  meta: Record<string, unknown>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const filledCount = fields.filter((f) => meta[f.meta_key] != null && meta[f.meta_key] !== "").length;

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-slate-800/80 hover:bg-slate-700/50 transition-colors text-start"
      >
        <span className="text-xs">{icon}</span>
        <span className="text-xs font-medium text-slate-300 flex-1">{label}</span>
        <span className="text-[10px] text-slate-500">{filledCount}/{fields.length}</span>
        {open ? (
          <ChevronDown className="w-3 h-3 text-slate-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-500" />
        )}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-0.5">
          {fields.map((gf, idx) => (
            <EntityCardField
              key={gf.meta_key}
              slot={toFieldSlot(gf, idx)}
              value={meta[gf.meta_key] ?? "—"}
              language="he"
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Fallback for entities without global fields ── */
function FallbackMetaDisplay({ meta }: { meta: Record<string, unknown> }) {
  const entries = Object.entries(meta).filter(([key]) => !key.startsWith("__"));

  if (entries.length === 0) {
    return <p className="text-xs text-slate-500 text-center py-4">אין שדות להצגה</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 py-1.5 border-b border-slate-700/30 last:border-0">
          <span className="text-[11px] text-slate-500 min-w-[80px] shrink-0 pt-0.5">{key}</span>
          <span className="text-xs text-slate-300 break-all">
            {value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
