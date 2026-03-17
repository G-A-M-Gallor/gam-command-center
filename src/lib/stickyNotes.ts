/**
 * Sticky Notes — persistent per-element notes stored in localStorage.
 * Each note is keyed by an element identifier (sidebar item key, widget id, etc.)
 */

const STORAGE_KEY = "cc-sticky-notes";
const CHANGE_EVENT = "cc-sticky-notes-change";

export interface StickyNote {
  id: string;
  /** Element identifier (e.g. sidebar item key, widget id) */
  elementKey: string;
  /** Label of the element this note is attached to */
  elementLabel: string;
  /** Rich text content (HTML string) */
  content: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  updatedAt: number;
  /** Popup size state */
  width: number;
  height: number;
  /** Whether the note is pinned/visible */
  pinned: boolean;
}

export function loadNotes(): Record<string, StickyNote> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveNotes(notes: Record<string, StickyNote>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getNote(elementKey: string): StickyNote | undefined {
  return loadNotes()[elementKey];
}

export function upsertNote(
  elementKey: string,
  elementLabel: string,
  content: string,
  size?: { width: number; height: number }
): StickyNote {
  const notes = loadNotes();
  const existing = notes[elementKey];
  const now = Date.now();
  const note: StickyNote = {
    id: existing?.id || crypto.randomUUID(),
    elementKey,
    elementLabel,
    content,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    width: size?.width || existing?.width || 320,
    height: size?.height || existing?.height || 200,
    pinned: existing?.pinned ?? true,
  };
  notes[elementKey] = note;
  saveNotes(notes);
  return note;
}

export function deleteNote(elementKey: string): void {
  const notes = loadNotes();
  delete notes[elementKey];
  saveNotes(notes);
}

export function updateNoteSize(elementKey: string, width: number, height: number): void {
  const notes = loadNotes();
  if (notes[elementKey]) {
    notes[elementKey].width = width;
    notes[elementKey].height = height;
    saveNotes(notes);
  }
}

export function toggleNotePin(elementKey: string): void {
  const notes = loadNotes();
  if (notes[elementKey]) {
    notes[elementKey].pinned = !notes[elementKey].pinned;
    saveNotes(notes);
  }
}

export function getAllNotes(): StickyNote[] {
  return Object.values(loadNotes()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export { CHANGE_EVENT as STICKY_NOTES_EVENT };
