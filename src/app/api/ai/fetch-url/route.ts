import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";

const MAX_CONTENT_CHARS = 3000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory cache
const urlCache = new Map<string, { content: string; fetchedAt: number }>();

const fetchUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

function stripHtmlTags(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = fetchUrlSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { url } = parsed.data;

  // Check cache
  const cached = urlCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ content: cached.content, cached: true });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GAM-CC-Bot/1.0)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const textContent = stripHtmlTags(html).slice(0, MAX_CONTENT_CHARS);

    // Cache result
    urlCache.set(url, { content: textContent, fetchedAt: Date.now() });

    // Clean old cache entries
    if (urlCache.size > 100) {
      const now = Date.now();
      for (const [key, val] of urlCache) {
        if (now - val.fetchedAt > CACHE_TTL_MS) {
          urlCache.delete(key);
        }
      }
    }

    return NextResponse.json({ content: textContent, cached: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
