// ── Sync Engine v2 — Notion Delta Adapter ────────────────────────────

import { Client } from '@notionhq/client';
import type { SyncAdapter, DeltaResult } from '../types';

/**
 * Fetches pages from a Notion database that were edited after `lastCursor`.
 * Returns raw Notion page objects — the Edge Function handles field mapping.
 *
 * Uses Notion SDK v5 `dataSources.query` API.
 */
export const notionAdapter: SyncAdapter = {
  async fetchDelta(
    apiKey: string,
    databaseId: string,
    lastCursor: string | null,
  ): Promise<DeltaResult> {
    const notion = new Client({ auth: apiKey });

    const allItems: unknown[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    // Paginate through all results
    while (hasMore) {
      const response = await notion.dataSources.query({
        data_source_id: databaseId,
        sorts: [{ timestamp: 'last_edited_time', direction: 'ascending' }],
        page_size: 100,
        ...(startCursor ? { start_cursor: startCursor } : {}),
        // Delta: only fetch pages edited after last sync
        ...(lastCursor
          ? {
              filter: {
                timestamp: 'last_edited_time' as const,
                last_edited_time: { after: lastCursor },
              },
            }
          : {}),
      });

      allItems.push(...response.results);

      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;

      // Safety: cap at 500 per cycle to avoid runaway
      if (allItems.length >= 500) break;
    }

    // New cursor = last_edited_time of the most recent item
    const newCursor =
      allItems.length > 0
        ? (allItems[allItems.length - 1] as { last_edited_time: string }).last_edited_time
        : lastCursor;

    return { items: allItems, newCursor };
  },
};
