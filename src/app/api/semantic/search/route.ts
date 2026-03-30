import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/ai/embeddings";

interface SearchRequestBody {
  query: string;
  max_results?: number;
  threshold?: number;
}

interface SemanticMemoryRecord {
  id: string;
  source_id: string;
  content: string;
  source_type: string;
  domain: string;
  embedding: string | number[] | null;
}

interface CourseMetadata {
  name: string;
  description: string;
  platform: string;
  language: string;
  status: string;
  tags: string[];
}

interface EnrichedSearchResult {
  id: string;
  course_id: string;
  content: string;
  similarity: number;
  course: CourseMetadata | null;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function POST(_request: NextRequest) {
  try {
    const { query, max_results = 10, threshold = 0.3 }: SearchRequestBody = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const queryEmbedding = await embedQuery(query.trim());

    // Get all course embeddings from semantic memory
    const supabase = createServiceClient();
    const { data: memoryData, error } = await supabase
      .from('semantic_memory')
      .select('id, source_id, content, source_type, domain, embedding')
      .eq('source_type', 'course')
      .not('embedding', 'is', null) as { data: SemanticMemoryRecord[] | null; error: unknown };

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown database error' },
        { status: 500 }
      );
    }

    if (!memoryData || memoryData.length === 0) {
      return NextResponse.json({
        query,
        results: [],
        total: 0
      });
    }

    // Calculate similarities and filter results
    const results = memoryData
      .map((item) => {
        // Parse the embedding vector (stored as string in pgvector format)
        let itemEmbedding: number[];
        try {
          if (typeof item.embedding === 'string') {
            // Remove brackets and split by comma
            const cleanStr = item.embedding.replace(/[[\]]/g, '');
            itemEmbedding = cleanStr.split(',').map(x => parseFloat(x.trim()));
          } else if (Array.isArray(item.embedding)) {
            itemEmbedding = item.embedding;
          } else {
            return null;
          }
        } catch (parseError) {
          console.error('Failed to parse embedding:', parseError);
          return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);

        return {
          id: item.id,
          source_id: item.source_id,
          content: item.content,
          domain: item.domain,
          similarity
        };
      })
      .filter((item): item is NonNullable<typeof item> =>
        item !== null && item.similarity >= threshold
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, max_results);

    // Enrich results with course metadata
    const enrichedResults: EnrichedSearchResult[] = await Promise.all(
      results.map(async (result): Promise<EnrichedSearchResult> => {
        const { data: course } = await supabase
          .from('cc_courses')
          .select('name, description, platform, language, status, tags')
          .eq('id', result.source_id)
          .single() as { data: CourseMetadata | null };

        return {
          id: result.id,
          course_id: result.source_id,
          content: result.content,
          similarity: result.similarity,
          course: course || null
        };
      })
    );

    return NextResponse.json({
      query,
      results: enrichedResults,
      total: enrichedResults.length
    });

  } catch (error: unknown) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}