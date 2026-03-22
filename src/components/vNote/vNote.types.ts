import type { NoteRecord } from "@/lib/entities/types";
import type { LayoutBlock } from "./storyMap.types";

/** Block arrangement stored in vblock_layouts for a vNote page */
export interface VNoteLayout {
  id: string;
  context_type: string;
  context_id: string;
  blocks: LayoutBlock[];
  updated_at: string;
}

/** Props for the top-level VNotePage */
export interface VNotePageProps {
  entityId: string;
}

/** Return type of useVNote */
export interface VNoteData {
  entity: NoteRecord | null;
  blocks: LayoutBlock[];
  layout: VNoteLayout | null;
  isLoading: boolean;
  error: Error | null;
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
}

/** Sidebar tab identifiers */
export type VNoteSidebarTab = "comm-log" | "progress-log" | "instance-link";

/** Block-specific sidebar tabs */
export type VNoteBlockTab = "details" | "history" | "relations";

/** Status options for the universal fields dropdown */
export const VNOTE_STATUS_OPTIONS = [
  { value: "active", label: "פעיל", color: "emerald" },
  { value: "inactive", label: "לא פעיל", color: "slate" },
  { value: "pending", label: "ממתין", color: "amber" },
  { value: "completed", label: "הושלם", color: "blue" },
  { value: "archived", label: "בארכיון", color: "purple" },
] as const;
