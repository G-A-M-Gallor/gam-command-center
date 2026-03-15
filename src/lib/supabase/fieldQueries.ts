// ===================================================
// Field Definitions — Supabase queries + usage computation
// ===================================================

import { supabase } from '@/lib/supabaseClient';
import type { FieldTypeId } from '@/components/command-center/fields/fieldTypes';

// ─── Types ───────────────────────────────────────────
export interface FieldDefinition {
  id: string;
  field_type: FieldTypeId;
  label: string;
  config: Record<string, unknown>;
  category: string;
  workspace_id: string | null;
  is_deleted: boolean;
  created_at: string;
  last_edited_at: string;
}

export interface FieldUsageInfo {
  count: number;
  documents: { id: string; title: string }[];
}

// ─── Fetch all field definitions ─────────────────────
export async function fetchFieldDefinitions(): Promise<FieldDefinition[]> {
  try {
    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('is_deleted', false)
      .order('last_edited_at', { ascending: false });

    if (error || !data) {
      // Table may not exist yet
      return [];
    }

    return data as FieldDefinition[];
  } catch {
    return [];
  }
}

// ─── Compute field usage from document content ───────
// Walks Tiptap JSON trees from all documents to count
// how many times each fieldId appears across documents.
export async function computeFieldUsage(
  fieldIds: string[]
): Promise<Map<string, FieldUsageInfo>> {
  const usageMap = new Map<string, FieldUsageInfo>();

  // Initialize all field IDs
  for (const id of fieldIds) {
    usageMap.set(id, { count: 0, documents: [] });
  }

  if (fieldIds.length === 0) return usageMap;

  // Fetch all documents
  const { data: docs, error } = await supabase
    .from('vb_records')
    .select('id, title, content')
    .eq('record_type', 'document')
    .eq('is_deleted', false);

  if (error || !docs) {
    console.error('Failed to fetch documents for usage:', error?.message);
    return usageMap;
  }

  const fieldIdSet = new Set(fieldIds);

  for (const doc of docs) {
    if (!doc.content) continue;

    // Collect unique fieldIds found in this document
    const foundInDoc = new Set<string>();
    walkTiptapTree(doc.content, (node: Record<string, unknown>) => {
      if (node.type === 'fieldBlock') {
        const attrs = node.attrs as Record<string, unknown> | undefined;
        const fId = attrs?.fieldId as string | undefined;
        if (fId && fieldIdSet.has(fId)) {
          foundInDoc.add(fId);
        }
      }
    });

    // Update usage map
    for (const fId of foundInDoc) {
      const info = usageMap.get(fId)!;
      info.count += 1;
      info.documents.push({ id: doc.id, title: doc.title || 'ללא כותרת' });
    }
  }

  return usageMap;
}

// ─── Tiptap JSON tree walker ─────────────────────────
function walkTiptapTree(
  node: Record<string, unknown>,
  visitor: (n: Record<string, unknown>) => void
) {
  visitor(node);
  const content = node.content as Record<string, unknown>[] | undefined;
  if (Array.isArray(content)) {
    for (const child of content) {
      walkTiptapTree(child, visitor);
    }
  }
}
