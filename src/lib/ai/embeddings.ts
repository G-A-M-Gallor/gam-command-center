const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";

interface VoyageResponse {
  data: { embedding: number[] }[];
  usage: { total_tokens: number };
}

/** Embed a single text string via Voyage AI */
export async function embedText(text: string): Promise<number[]> {
  const [result] = await embedTexts([text]);
  return result;
}

/** Embed multiple texts in a single Voyage AI call (max 128 per batch) */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: "document",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as VoyageResponse;
  return json.data.map((d) => d.embedding);
}

/** Embed a query (uses input_type: "query" for better retrieval) */
export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: "query",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as VoyageResponse;
  return json.data[0].embedding;
}
