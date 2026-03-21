"use client";

import type { NoteRecord } from "@/lib/entities/types";

interface Props {
  entity: NoteRecord;
}

export function VNoteEntityView({ entity }: Props) {
  const meta = entity.meta ?? {};
  const entries = Object.entries(meta).filter(
    ([key]) => !key.startsWith("__"),
  );

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-200">שדות ישות</h3>
        <span className="text-[10px] text-slate-500">
          {entity.entity_type ?? "ללא סוג"}
        </span>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-start gap-2 py-1.5 border-b border-slate-700/30 last:border-0"
            >
              <span className="text-[11px] text-slate-500 min-w-[80px] shrink-0 pt-0.5">
                {key}
              </span>
              <span className="text-xs text-slate-300 break-all">
                {value == null
                  ? "—"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-4">
          אין שדות להצגה
        </p>
      )}

      <p className="text-[10px] text-slate-600 mt-3 text-center">
        איפיון נפרד, יגיע בהמשך
      </p>
    </div>
  );
}
