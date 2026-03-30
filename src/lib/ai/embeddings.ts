const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

interface GeminiResponse {
  embedding: { values: number[] };
}

/** Reduce dimensionality from 3072 to 768 using simple slicing */
function reduceDimensions(embedding: number[]): number[] {
  // Take every 4th element to reduce from 3072 to 768
  // This maintains good coverage across the embedding space
  const reduced: number[] = [];
  for (let i = 0; i < embedding.length; i += 4) {
    reduced.push(embedding[i]);
  }
  return reduced.slice(0, 768); // Ensure exactly 768 dimensions
}

/** Embed a single text string via Gemini */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    _headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: {
        parts: [{ text }]
      },
      taskType: "RETRIEVAL_DOCUMENT"
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini AI error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as GeminiResponse;
  return reduceDimensions(json.embedding.values);
}

/** Embed multiple texts by calling Gemini for each (no batch API) */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await embedText(text);
    embeddings.push(embedding);

    // Add small delay to avoid rate limiting
    if (texts.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}

/** Embed a query (uses taskType: "RETRIEVAL_QUERY" for better retrieval) */
export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    _headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: {
        parts: [{ text }]
      },
      taskType: "RETRIEVAL_QUERY"
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini AI error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as GeminiResponse;
  return reduceDimensions(json.embedding.values);
}