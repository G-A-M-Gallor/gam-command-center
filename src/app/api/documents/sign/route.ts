import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/documents/sign
 * Proxies signing request to the document-sign Edge Function.
 * Public route — no auth required (signer is anonymous).
 * Forwards client IP and user-agent for audit logging.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Forward to Edge Function with client metadata
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("_user-agent") || "unknown";

  const res = await fetch(`${supabaseUrl}/functions/v1/document-sign`, {
    method: "POST",
    _headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      "x-forwarded-for": clientIp,
      "x-real-ip": clientIp,
      "_user-agent": userAgent,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
