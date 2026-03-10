'use client';

// ===================================================
// GAM Command Center — Tiptap Editor V3
// Phase 2: Image, File, Table, Embed, Callout
// + Phase 1.5: Toggle, Block Handles, Colors, Code
// ===================================================

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { JSONContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';
import { useSettings, type Language } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';

import { SlashCommands } from './extensions/SlashCommands';
import { ToggleDetails, DetailsSummary, DetailsContent } from './extensions/Toggle';
import { CodeBlockGam } from './extensions/CodeBlockGam';
import { ImageBlock } from './extensions/ImageBlock';
import { FileBlock } from './extensions/FileBlock';
import { EmbedBlock } from './extensions/EmbedBlock';
import { CalloutBlock } from './extensions/CalloutBlock';
import { tableExtensions } from './extensions/TableSetup';
import { FieldBlock } from './extensions/FieldBlock';
import { FloatingToolbar } from './FloatingToolbar';
import { BlockHandle } from './BlockHandle';
import type { TiptapEditorProps } from './types';
import './editor.css';

// ─── Default empty content ───────────────────────────
const DEFAULT_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

// ─── Per-block Placeholder Config (language-aware) ───
function getPlaceholderMap(et: Record<string, string>): Record<string, string | ((node: any) => string)> {
  return {
    paragraph: et.placeholderSlashMenu,
    heading: (node: any) => {
      const level = node.attrs?.level || 1;
      const labels: Record<number, string> = {
        1: et.placeholderHeading1,
        2: et.placeholderHeading2,
        3: et.placeholderHeading3,
      };
      return labels[level] || et.placeholderHeading;
    },
    bulletList: et.placeholderListItem,
    orderedList: et.placeholderListItem,
    taskList: et.placeholderTask,
    blockquote: et.placeholderBlockquote,
    codeBlock: et.placeholderCode,
    detailsSummary: et.placeholderToggle,
    callout: et.placeholderCallout,
  };
}

// ─── Component ───────────────────────────────────────
export function TiptapEditor({
  content,
  onChange,
  onSave,
  placeholder,
  editable = true,
  autoFocus = false,
  className = '',
  recordId,
  saveStatus = 'idle',
  lastSavedAt,
  onConflictReload,
}: TiptapEditorProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const et = t.editor;
  const placeholderMap = useMemo(() => getPlaceholderMap(et), [et]);
  const defaultPlaceholder = et.placeholderSlashMenu;
  // Track internal changes to prevent content sync from resetting the editor
  const isInternalChange = useRef(false);

  // ─── Auto-save: 1s debounce after every change ───
  const debouncedSave = useDebouncedCallback((json: JSONContent) => {
    if (onSave) onSave(json);
  }, 1000);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // We use CodeBlockGam
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          const type = node.type.name;
          const entry = placeholderMap[type];
          if (typeof entry === 'function') return entry(node);
          if (typeof entry === 'string') return entry;
          return placeholder || defaultPlaceholder;
        },
        emptyEditorClass: 'gam-editor--empty',
        emptyNodeClass: 'gam-editor__node--empty',
        includeChildren: true,
      }),
      TaskList.configure({
        HTMLAttributes: { class: 'gam-tasklist' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'gam-taskitem' },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'gam-link',
          rel: 'noopener noreferrer',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: { class: 'gam-highlight' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      // Toggle
      ToggleDetails,
      DetailsSummary,
      DetailsContent,
      // Code
      CodeBlockGam,
      // Phase 2 blocks
      ImageBlock,
      FileBlock,
      EmbedBlock,
      CalloutBlock,
      // Table
      ...tableExtensions,
      // Field blocks
      FieldBlock,
      // Slash commands
      SlashCommands,
    ],
    content: content || DEFAULT_CONTENT,
    editable,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: `gam-editor ${className}`,
        dir: 'auto',
        spellcheck: 'true',
        'data-record-id': recordId || '',
      },
    },
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON();
      isInternalChange.current = true;
      onChange?.(json);
      debouncedSave(json);
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  // Listen for field save events to insert field blocks
  useEffect(() => {
    if (!editor) return;
    const handleFieldSaved = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.fieldType) {
        editor.chain().focus().setFieldBlock({
          fieldType: detail.fieldType,
          fieldId: detail.fieldId || '',
          label: detail.label || detail.fieldType,
          config: detail.config || {},
        }).run();
      }
    };
    window.addEventListener('cc-field-saved', handleFieldSaved);
    return () => window.removeEventListener('cc-field-saved', handleFieldSaved);
  }, [editor]);

  // Sync external content changes (e.g., version restore) — skip internal edits
  useEffect(() => {
    if (!editor || !content) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        debouncedSave.cancel();
        if (onSave && editor) onSave(editor.getJSON());
      }
    },
    [editor, onSave, debouncedSave]
  );

  if (!editor) return null;

  return (
    <div className="gam-editor-wrapper" dir="rtl" onKeyDown={handleKeyDown}>
      {editable && <BlockHandle editor={editor} />}
      {editable && <FloatingToolbar editor={editor} />}
      <EditorContent editor={editor} />
      <StatusBar editor={editor} saveStatus={saveStatus} lastSavedAt={lastSavedAt} language={language} et={et} onConflictReload={onConflictReload} />
    </div>
  );
}

// ─── Status Bar ────────────────────────────────────────
function StatusBar({
  editor,
  saveStatus,
  lastSavedAt,
  language,
  et,
  onConflictReload,
}: {
  editor: ReturnType<typeof useEditor>;
  saveStatus: string;
  lastSavedAt?: Date;
  language: Language;
  et: Record<string, string>;
  onConflictReload?: () => void;
}) {
  const text = editor?.getText() || '';
  const wordCount = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);
  const charCount = text.length;
  const readingTime = Math.ceil(wordCount / 200);

  const relativeTime = useMemo(() => {
    if (!lastSavedAt) return '';
    const diff = Math.round((Date.now() - lastSavedAt.getTime()) / 1000);
    if (diff < 10) return et.timeJustNow;
    if (diff < 60) return et.timeSecondsAgo.replace('{{n}}', String(diff));
    const mins = Math.round(diff / 60);
    if (mins < 60) return et.timeMinutesAgo.replace('{{n}}', String(mins));
    const hrs = Math.round(mins / 60);
    return et.timeHoursAgo.replace('{{n}}', String(hrs));
  }, [lastSavedAt, et]);

  return (
    <div className="gam-editor-statusbar">
      <span className="gam-editor-statusbar__save">
        {saveStatus === 'saving' && <span className="text-blue-400">{et.saving}</span>}
        {saveStatus === 'saved' && <span className="text-emerald-400">{"✓ "}{et.saved}</span>}
        {saveStatus === 'retrying' && <span className="text-amber-400">{et.retrying}</span>}
        {saveStatus === 'error' && <span className="text-red-400">{"⚠ "}{et.saveError}</span>}
        {saveStatus === 'conflict' && (
          <span className="flex items-center gap-2 text-amber-400">
            <span>{"⚠ "}{et.conflictMessage}</span>
            <button
              onClick={() => onConflictReload ? onConflictReload() : window.location.reload()}
              className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              {et.reload}
            </button>
          </span>
        )}
        {saveStatus === 'offline' && <span className="text-orange-400">{"☁ "}{et.offlineSavedLocally}</span>}
        {saveStatus === 'idle' && relativeTime && (
          <span className="text-slate-500">{et.lastSaved}: {relativeTime}</span>
        )}
      </span>
      <span className="gam-editor-statusbar__chars">
        {wordCount} {et.words} · {charCount} {et.chars}
        {readingTime > 0 && ` · ${readingTime} ${et.minRead}`}
      </span>
      <span className="gam-editor-statusbar__hint">
        <kbd>/</kbd> {et.menu} · <kbd>{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'}+S</kbd>
      </span>
    </div>
  );
}

export default TiptapEditor;
