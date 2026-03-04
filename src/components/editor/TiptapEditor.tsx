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
import { useCallback, useEffect } from 'react';
import type { JSONContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';

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

// ─── Per-block Placeholder Config ────────────────────
const PLACEHOLDER_MAP: Record<string, string | ((node: any) => string)> = {
  paragraph: 'הקלד / לתפריט בלוקים...',
  heading: (node: any) => {
    const level = node.attrs?.level || 1;
    const labels: Record<number, string> = {
      1: 'כותרת ראשית',
      2: 'כותרת משנית',
      3: 'כותרת קטנה',
    };
    return labels[level] || 'כותרת';
  },
  bulletList: 'פריט ברשימה',
  orderedList: 'פריט ברשימה',
  taskList: 'משימה',
  blockquote: 'ציטוט...',
  codeBlock: '// כתוב קוד כאן...',
  detailsSummary: 'כותרת מתקפלת...',
  callout: 'כתוב כאן...',
};

// ─── Component ───────────────────────────────────────
export function TiptapEditor({
  content,
  onChange,
  onSave,
  placeholder = 'הקלד / לתפריט בלוקים...',
  editable = true,
  autoFocus = false,
  className = '',
  recordId,
  saveStatus = 'idle',
}: TiptapEditorProps) {
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
          const entry = PLACEHOLDER_MAP[type];
          if (typeof entry === 'function') return entry(node);
          if (typeof entry === 'string') return entry;
          return placeholder;
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
      handleDOMEvents: {
        keydown: (_view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault();
            if (onSave && editor) {
              onSave(editor.getJSON());
            }
            return true;
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON();
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

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
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
      <div className="gam-editor-statusbar">
        <span className="gam-editor-statusbar__save">
          {saveStatus === 'saving' && '💾 שומר...'}
          {saveStatus === 'saved' && '✅ נשמר'}
          {saveStatus === 'error' && '❌ שגיאה בשמירה'}
        </span>
        <span className="gam-editor-statusbar__chars">
          {editor.storage.characterCount?.characters?.() ??
            editor.getText().length}{' '}
          תווים
        </span>
        <span className="gam-editor-statusbar__hint">
          הקלד <kbd>/</kbd> לתפריט &nbsp;|&nbsp; שמירה אוטומטית &nbsp;|&nbsp; <kbd>Ctrl+S</kbd> שמירה
        </span>
      </div>
    </div>
  );
}

export default TiptapEditor;
