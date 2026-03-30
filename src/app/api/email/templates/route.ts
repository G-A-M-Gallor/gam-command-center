import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { emailTemplateSchema } from "@/lib/api/schemas";

export async function GET(_request: Request) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(_request.url);
  const category = url.searchParams.get("category");
  const engine = url.searchParams.get("engine");
  const tenant_id = url.searchParams.get("tenant_id");

  let query = supabase
    .from("email_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (engine) query = query.eq("engine", engine);
  if (tenant_id) query = query.eq("tenant_id", tenant_id);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }

  return NextResponse.json({ templates: data || [] });
}

export async function POST(_request: Request) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = emailTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}

export async function PUT(_request: Request) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
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

  // Bump version on update
  const { data: current } = await supabase
    .from("email_templates")
    .select("version")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("email_templates")
    .update({ ...rest, version: (current?.version || 1) + 1 })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to _update template" }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(_request: Request) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(_request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Soft delete
  const { error } = await supabase
    .from("email_templates")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
