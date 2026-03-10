// Edge Function: sync-memory
// Receives CLAUDE.md content from GitHub Action,
// splits into chunks, generates embeddings, upserts to vb_ai_memory.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CHUNK_MAX_CHARS = 1500;

Deno.serve(async (req) => {
  // Verify webhook secret
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("SYNC_WEBHOOK_SECRET");

  if (!secret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { content, source = "CLAUDE.md" } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Split into chunks by headings
    const chunks = splitIntoChunks(content);

    // Init Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Generate embeddings via Voyage AI (if key exists) or skip
    const voyageKey = Deno.env.get("VOYAGE_API_KEY");
    let embeddings: (number[] | null)[] = chunks.map(() => null);

    if (voyageKey) {
      try {
        const texts = chunks.map((c) => c.content);
        const voyageRes = await fetch("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${voyageKey}`,
          },
          body: JSON.stringify({
            input: texts,
            model: "voyage-3-lite",
          }),
        });

        if (voyageRes.ok) {
          const voyageData = await voyageRes.json();
          embeddings = voyageData.data.map(
            (d: { embedding: number[] }) => d.embedding,
          );
        }
      } catch {
        // Embeddings failed — continue without them
      }
    }

    // Upsert chunks
    const rows = chunks.map((chunk, i) => ({
      source,
      chunk_index: i,
      heading: chunk.heading,
      content: chunk.content,
      content_hash: md5Hash(chunk.content),
      embedding: embeddings[i],
      updated_at: new Date().toISOString(),
    }));

    // Delete old chunks for this source that are beyond current count
    await supabase
      .from("vb_ai_memory")
      .delete()
      .eq("source", source)
      .gte("chunk_index", chunks.length);

    // Upsert current chunks
    const { error: upsertError } = await supabase
      .from("vb_ai_memory")
      .upsert(rows, { onConflict: "source,chunk_index" });

    if (upsertError) {
      return new Response(
        JSON.stringify({ error: "Upsert failed", details: upsertError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunks: chunks.length,
        has_embeddings: embeddings.some((e) => e !== null),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

// ─── Helpers ─────────────────────────────────────────

interface Chunk {
  heading: string | null;
  content: string;
}

function splitIntoChunks(markdown: string): Chunk[] {
  const lines = markdown.split("\n");
  const chunks: Chunk[] = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  function flush() {
    const text = currentContent.join("\n").trim();
    if (text) {
      // Split further if too long
      if (text.length > CHUNK_MAX_CHARS) {
        const subChunks = splitBySize(text, CHUNK_MAX_CHARS);
        for (const sub of subChunks) {
          chunks.push({ heading: currentHeading, content: sub });
        }
      } else {
        chunks.push({ heading: currentHeading, content: text });
      }
    }
    currentContent = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1].trim();
      currentContent.push(line);
    } else {
      currentContent.push(line);
    }
  }
  flush();

  return chunks;
}

function splitBySize(text: string, maxSize: number): string[] {
  const parts: string[] = [];
  const paragraphs = text.split("\n\n");
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxSize && current) {
      parts.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }
  if (current.trim()) parts.push(current.trim());

  return parts;
}

function md5Hash(input: string): string {
  // Simple hash for dedup — not cryptographic
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
}
