import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailTenantSchema } from "@/lib/api/schemas";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("email_tenants")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }

  return NextResponse.json({ tenants: data || [] });
}

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

  const parsed = emailTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_tenants")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }

  return NextResponse.json({ tenant: data }, { status: 201 });
}

export async function PUT(request: Request) {
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

  const { id, ...rest } = body as { id?: string } & Record<string, unknown>;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_tenants")
    .update(rest)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }

  return NextResponse.json({ tenant: data });
}
