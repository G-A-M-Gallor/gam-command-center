import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportSchema } from "@/lib/api/schemas";

const EXPORT_LIMIT = 10_000;

type SupportedTable = "document_submissions" | "vb_records" | "document_audit_log";

const COLUMN_HEADERS: Record<SupportedTable, Record<string, string>> = {
  document_submissions: {
    id: "מזהה",
    name: "שם מסמך",
    status: "סטטוס",
    created_at: "תאריך יצירה",
    sent_at: "תאריך שליחה",
    signed_at: "תאריך חתימה",
    expires_at: "תוקף",
    created_by: "נוצר על ידי",
    origami_entity_type: "סוג ישות",
  },
  vb_records: {
    id: "מזהה",
    title: "כותרת",
    record_type: "סוג",
    status: "סטטוס",
    created_at: "תאריך יצירה",
    updated_at: "תאריך עדכון",
    workspace_id: "מרחב עבודה",
  },
  document_audit_log: {
    id: "מזהה",
    submission_id: "מזהה מסמך",
    action: "פעולה",
    actor_type: "סוג שחקן",
    actor_id: "מזהה שחקן",
    created_at: "תאריך",
    details: "פרטים",
  },
};

const STATUS_TRANSLATIONS: Record<string, string> = {
  draft: "טיוטה",
  sent: "נשלח",
  viewed: "נצפה",
  partially_signed: "חתום חלקי",
  signed: "חתום",
  archived: "ארכיון",
  expired: "פג תוקף",
  cancelled: "בוטל",
  active: "פעיל",
  inactive: "לא פעיל",
};

function formatDate(val: string | null): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return val;
  }
}

function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function translateStatus(val: unknown): string {
  if (typeof val !== "string") return String(val ?? "");
  return STATUS_TRANSLATIONS[val] || val;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl;
  const raw = {
    table: url.searchParams.get("table"),
    format: url.searchParams.get("format") || "csv",
    filters: url.searchParams.get("filters") || undefined,
  };

  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { table, filters } = parsed.data;
  const columns = COLUMN_HEADERS[table as SupportedTable];
  if (!columns) {
    return NextResponse.json({ error: "Unsupported table" }, { status: 400 });
  }

  const selectColumns = Object.keys(columns).join(", ");

  let query = supabase
    .from(table)
    .select(selectColumns)
    .order("created_at", { ascending: false })
    .limit(EXPORT_LIMIT);

  if (filters) {
    try {
      const filterObj = JSON.parse(filters) as Record<string, string>;
      for (const [key, value] of Object.entries(filterObj)) {
        if (key && value && Object.keys(columns).includes(key)) {
          query = query.eq(key, value);
        }
      }
    } catch {
      return NextResponse.json({ error: "Invalid filters JSON" }, { status: 400 });
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 404 });
  }

  const dateColumns = new Set(
    Object.keys(columns).filter((k) => k.endsWith("_at") || k.endsWith("_date")),
  );
  const statusColumns = new Set(["status"]);

  const headerRow = Object.values(columns).map(escapeCsvValue).join(",");
  const keys = Object.keys(columns);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).map((row: Record<string, unknown>) =>
    keys
      .map((key) => {
        let val = row[key];
        if (dateColumns.has(key)) val = formatDate(val as string | null);
        if (statusColumns.has(key)) val = translateStatus(val);
        return escapeCsvValue(val);
      })
      .join(","),
  );

  const BOM = "\uFEFF";
  const csv = BOM + headerRow + "\n" + rows.join("\n");

  const filename = `${table}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
