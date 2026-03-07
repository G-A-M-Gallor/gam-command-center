import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embedQuery } from "@/lib/ai/embeddings";
import { requireAuth } from "@/lib/api/auth";
import { embeddingsSearchSchema } from "@/lib/api/schemas";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  // Authenticate the request
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const rawBody = await request.json();

    const parsed = embeddingsSearchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, max_results, match_threshold } = parsed.data;

    const queryEmbedding = await embedQuery(query);
    const supabase = getServiceClient();

    const { data, error } = await supabase.rpc("semantic_search", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold,
      max_results,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
