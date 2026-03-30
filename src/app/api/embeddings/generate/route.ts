import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "@/lib/ai/embeddings";
import { extractPlainText } from "@/lib/utils/textExtract";
import { createHash } from "crypto";
import { requireAuth } from "@/lib/api/auth";
import { embeddingsGenerateSchema } from "@/lib/api/schemas";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function md5(text: string): string {
  return createHash("md5").update(text).digest("hex");
}
async function embedDocument(supabase: SupabaseClient<any>, docId: string) {
  const { data: doc } = await supabase
    .from("vb_records")
    .select("id, title, content")
    .eq("id", docId)
    .single();

  if (!doc) return { id: docId, status: "not_found" };

  const plainText = [doc.title || "", extractPlainText(doc.content)].join("\n").trim();
  if (!plainText) return { id: docId, status: "empty" };

  const hash = md5(plainText);

  // Check if already embedded with same hash
  const { data: existing } = await supabase
    .from("document_embeddings")
    .select("content_hash")
    .eq("document_id", docId)
    .single();

  if (existing?.content_hash === hash) {
    return { id: docId, status: "unchanged" };
  }

  const embedding = await embedText(plainText);

  // Upsert embedding
  const { error } = await supabase
    .from("document_embeddings")
    .upsert(
      {
        document_id: docId,
        content_hash: hash,
        embedding: JSON.stringify(embedding),
        embedded_at: new Date().toISOString(),
      },
      { onConflict: "document_id" }
    );

  if (error) return { id: docId, status: "error", error: error.message };
  return { id: docId, status: "embedded" };
}

export async function POST(request: NextRequest) {
  // Authenticate the request
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const rawBody = await request.json();

    const parsed = embeddingsGenerateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { document_id, batch } = parsed.data;
    const supabase = getServiceClient();

    // Single document
    if (document_id) {
      const result = await embedDocument(supabase, document_id);
      return NextResponse.json(result);
    }

    // Batch: embed all un-embedded documents
    if (batch) {
      const { data: docs } = await supabase
        .from("vb_records")
        .select("id")
        .eq("record_type", "document")
        .eq("is_deleted", false);

      if (!docs || docs.length === 0) {
        return NextResponse.json({ status: "no_documents" });
      }

      const results = [];
      for (const doc of docs) {
        const result = await embedDocument(supabase, doc.id);
        results.push(result);
      }

      const embedded = results.filter((r) => r.status === "embedded").length;
      const unchanged = results.filter((r) => r.status === "unchanged").length;
      const errors = results.filter((r) => r.status === "error").length;

      return NextResponse.json({
        total: docs.length,
        embedded,
        unchanged,
        errors,
        results,
      });
    }

    // This shouldn't be reachable due to the .refine() in the schema,
    // but TypeScript doesn't know that
    return NextResponse.json({ error: "Provide document_id or batch: true" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
