import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailSendSchema } from "@/lib/api/schemas";
import { sendEmail, getTenant, isUnsubscribed, renderTemplate } from "@/lib/email/resend";
import { getTemplateElement } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

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

  const parsed = emailSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { to, subject, template_id, template_name, variables, tenant_id, entity_id, cc, bcc } = parsed.data;

  // Resolve tenant
  const tenant = await getTenant(supabase, tenant_id);

  // Check unsubscribe for marketing templates
  const toArray = Array.isArray(to) ? to : [to];
  if (tenant) {
    const unsubscribed = await Promise.all(
      toArray.map((email) => isUnsubscribed(supabase, email, tenant.id))
    );
    const filteredTo = toArray.filter((_, i) => !unsubscribed[i]);
    if (filteredTo.length === 0) {
      return NextResponse.json({ error: "All recipients are unsubscribed" }, { status: 400 });
    }
  }

  // Resolve HTML
  let html = "";
  let resolvedSubject = subject || "";
  let resolvedTemplateId: string | undefined;

  if (template_id) {
    // Load from DB
    const { data: tmpl } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", template_id)
      .single();
    if (!tmpl) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    resolvedTemplateId = tmpl.id;
    resolvedSubject = resolvedSubject || tmpl.subject;

    if (tmpl.engine === "react" && tmpl.react_component) {
      const element = getTemplateElement(tmpl.react_component, {
        ...(variables || {}),
        logoUrl: tenant?.logo_url,
        brandColor: tenant?.brand_color,
        signatureHtml: tenant?.signature_html,
      });
      if (element) {
        html = await renderTemplate(element);
      }
    } else if (tmpl.html_compiled) {
      html = tmpl.html_compiled;
    }
  } else if (template_name) {
    // React template by name
    const element = getTemplateElement(template_name, {
      ...(variables || {}),
      logoUrl: tenant?.logo_url,
      brandColor: tenant?.brand_color,
      signatureHtml: tenant?.signature_html,
    });
    if (!element) {
      return NextResponse.json({ error: `Template "${template_name}" not found` }, { status: 404 });
    }
    html = await renderTemplate(element);
  }

  if (!html) {
    return NextResponse.json({ error: "No HTML content — provide template_id, template_name, or html" }, { status: 400 });
  }
  if (!resolvedSubject) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }

  const result = await sendEmail(supabase, {
    to: toArray,
    subject: resolvedSubject,
    html,
    tenant_id: tenant?.id,
    template_id: resolvedTemplateId,
    entity_id,
    variables: variables as Record<string, string> | undefined,
    cc,
    bcc,
  });

  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}
