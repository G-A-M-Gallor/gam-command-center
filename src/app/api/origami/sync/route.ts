import { _createClient } from "@supabase/supabase-js";
import { calculateHealthScore } from "@/lib/utils/health";
import { requireAuth } from "@/lib/api/auth";

const ORIGAMI_API_URL = "https://gallorgam.origami.ms/entities/api/instance_data/format/json";

// Map Origami status → Supabase status
function mapStatus(origamiStatus: string): string {
  if (origamiStatus.includes("פעיל")) return "active";
  if (origamiStatus.includes("לא פעיל")) return "inactive";
  return "active";
}

// Map Origami client type → layer
function mapLayer(clientType: string | string[]): string {
  const typeStr = Array.isArray(clientType) ? clientType.join(",") : String(clientType || "");
  if (typeStr.includes("קבלן")) return "client";
  if (typeStr.includes("ליד")) return "infrastructure";
  if (typeStr.includes("יזם")) return "product";
  return "client";
}

interface OrigamiField {
  field_data_name: string;
  value?: string | string[];
}

interface OrigamiFieldGroup {
  fields_data: OrigamiField[][];
}

interface OrigamiInstance {
  _id: string;
  lastModified: string;
  archived: boolean;
  field_groups: OrigamiFieldGroup[];
}

function extractField(instance: OrigamiInstance, fieldName: string): string {
  for (const fg of instance.field_groups) {
    for (const fdList of fg.fields_data) {
      for (const fd of fdList) {
        if (fd.field_data_name === fieldName) {
          const val = fd.value;
          if (Array.isArray(val)) return val.join(", ");
          return String(val || "");
        }
      }
    }
  }
  return "";
}

export async function POST(_request: Request) {
  // Authenticate the request
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return Response.json({ error: authError }, { status: 401 });
  }

  const username = process.env.ORIGAMI_USERNAME;
  const apiSecret = process.env.ORIGAMI_API_SECRET;

  if (!username || !apiSecret) {
    return Response.json(
      { error: "ORIGAMI_USERNAME or ORIGAMI_API_SECRET not configured" },
      { status: 503 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Fetch from Origami
  let origamiData: { data: { instance_data: OrigamiInstance }[] };
  try {
    const res = await fetch(ORIGAMI_API_URL, {
      method: "POST",
      _headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        api_secret: apiSecret,
        entity_data_name: "clients",
      }),
    });

    if (!res.ok) {
      return Response.json({ error: `Origami API error: ${res.status}` }, { status: 502 });
    }

    origamiData = await res.json();
  } catch (err) {
    return Response.json(
      { error: `Failed to fetch from Origami: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 }
    );
  }

  const items = origamiData?.data || [];
  if (items.length === 0) {
    return Response.json({ synced: 0, message: "No data from Origami" });
  }

  // Upsert into Supabase
  const supabase = createClient(supabaseUrl, serviceKey);
  let synced = 0;
  const errors: string[] = [];

  for (const item of items) {
    const inst = item.instance_data;
    if (inst.archived) continue;

    const name = extractField(inst, "fld_1296");
    const statusRaw = extractField(inst, "fld_619");
    const clientType = extractField(inst, "fld_1681");

    if (!name) continue;

    const status = mapStatus(statusRaw);
    const healthScore = calculateHealthScore({
      lastModified: inst.lastModified,
      status,
    });

    const project = {
      origami_id: inst._id,
      name,
      status,
      layer: mapLayer(clientType),
      source: "origami",
      health_score: healthScore,
    };

    const { error } = await supabase
      .from("projects")
      .upsert(project, { onConflict: "origami_id" });

    if (error) {
      errors.push(`${name}: ${error.message}`);
    } else {
      synced++;
    }
  }

  return Response.json({
    synced,
    total: items.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
