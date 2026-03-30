import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { z } from "zod";

// Temporary schema for brain search
const brainSearchSchema = z.object({
  query: z.string().min(1, "query is required").max(2_000, "query exceeds 2,000 character limit"),
  max_results: z.number().int().min(1).max(100).optional().default(20),
  match_threshold: z.number().min(0).max(1).optional().default(0.3),
  filter_source_type: z.string().optional(),
  filter_domain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Authenticate the request
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const rawBody = await request.json();

    const parsed = brainSearchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, max_results, match_threshold: _match_threshold, filter_source_type, filter_domain } = parsed.data;

    // Call semantic-query v3 Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const semanticResponse = await fetch(`${supabaseUrl}/functions/v1/semantic-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        query,
        match_count: max_results,
        filter_source_type,
        filter_domain,
      }),
    });

    if (!semanticResponse.ok) {
      const errorText = await semanticResponse.text();
      return NextResponse.json(
        { error: `Semantic query failed with status ${semanticResponse.status}`, details: errorText },
        { status: 500 }
      );
    }

    const semanticData = await semanticResponse.json();

    // Return semantic-query v3 response as-is (no mapping/transformation)
    return NextResponse.json(semanticData);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}