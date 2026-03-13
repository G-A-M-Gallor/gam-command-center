import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as jose from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret";

// Public route — no auth required (link from email)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(htmlPage("קישור לא תקין", "חסר טוקן בקישור."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const email = payload.email as string;
    const tenantId = payload.tenant_id as string;

    if (!email || !tenantId) {
      throw new Error("Invalid token payload");
    }

    const supabase = await createClient();

    await supabase.from("email_unsubscribes").upsert(
      { email, tenant_id: tenantId, reason: "link" },
      { onConflict: "email,tenant_id" }
    );

    return new Response(
      htmlPage("הוסרת בהצלחה", `הכתובת ${email} הוסרה מרשימת התפוצה. לא תקבל עוד מיילים שיווקיים.`),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch {
    return new Response(
      htmlPage("שגיאה", "הקישור אינו תקף או שפג תוקפו."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// POST — authenticated re-subscribe / manage
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, tenant_id, action } = body as { email?: string; tenant_id?: string; action?: string };
  if (!email || !tenant_id) {
    return NextResponse.json({ error: "email and tenant_id are required" }, { status: 400 });
  }

  if (action === "resubscribe") {
    await supabase
      .from("email_unsubscribes")
      .delete()
      .eq("email", email)
      .eq("tenant_id", tenant_id);
    return NextResponse.json({ ok: true, subscribed: true });
  }

  // Default: unsubscribe
  await supabase.from("email_unsubscribes").upsert(
    { email, tenant_id, reason: "manual" },
    { onConflict: "email,tenant_id" }
  );

  return NextResponse.json({ ok: true, subscribed: false });
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8fafc;margin:0}
.card{background:#fff;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
h1{color:#1e293b;font-size:24px}p{color:#64748b;font-size:16px}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
