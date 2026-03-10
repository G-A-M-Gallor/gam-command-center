import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { contractorSubmitSchema } from "@/lib/api/schemas";

/**
 * POST /api/contractor/submit
 * Public route — no auth required.
 * Creates a contractor entity from the public registration wizard.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contractorSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const supabase = createServiceClient();

    // Duplicate check on license number
    const { data: existing } = await supabase
      .from("vb_records")
      .select("id")
      .eq("entity_type", "contractor")
      .contains("meta", { contractor_license_number: data.contractor_license_number })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Contractor with this license number already exists" },
        { status: 409 },
      );
    }

    // Create the contractor entity
    const confirmationNumber = `GAM-${Date.now().toString(36).toUpperCase()}`;

    const { data: record, error: insertError } = await supabase
      .from("vb_records")
      .insert({
        title: data.business_name,
        entity_type: "contractor",
        status: "active",
        meta: {
          business: data.business_name,
          business_id: data.business_id,
          phone: data.phone,
          email: data.email,
          address: data.address,
          contractor_license_number: data.contractor_license_number,
          contractor_classification: data.contractor_classification,
          classification_category: data.classification_category,
          license_expiry_date: data.license_expiry_date,
          insurance_expiry_date: data.insurance_expiry_date,
          registration_status: "inquiry",
          service_area: data.service_area,
          insurance_file_url: data.insurance_file_url || null,
          license_file_url: data.license_file_url || null,
          confirmation_number: confirmationNumber,
          source: "public_registration",
        },
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create contractor record" },
        { status: 500 },
      );
    }

    // Send notification to admin
    await supabase.from("notifications").insert({
      title: `קבלן חדש: ${data.business_name}`,
      body: `רישיון: ${data.contractor_license_number} | סיווג: ${data.contractor_classification}`,
      type: "contractor_registration",
    });

    return NextResponse.json({
      success: true,
      id: record.id,
      confirmation_number: confirmationNumber,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
