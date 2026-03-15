'use client';

// ===================================================
// GAM Command Center — Floating Toolbar V3
// Redesigned: Lucide icons, below-selection positioning,
// button groups, alignment, gibberish convert, expanded menu
// ===================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Highlighter,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Languages,
  MoreHorizontal,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  RemoveFormatting,
  Copy,
  Trash2,
} from 'lucide-react';
import { ColorMenu } from './ColorMenu';
import { toHebrew, toEnglish } from '@/lib/gibberish';

interface FloatingToolbarProps {
  editor: Editor;
}

const ICON_SIZE = 15;

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [flipAbove, setFlipAbove] = useState(false);
  const [colorMenu, setColorMenu] = useState<'text' | 'background' | null>(null);
  const [showAlign, setShowAlign] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Close all dropdowns
  const closeDropdowns = useCallback(() => {
    setColorMenu(null);
    setShowAlign(false);
    setShowMore(false);
  }, []);

  // Position toolbar below selection (flip above if near bottom)
  const updatePosition = useCallback(() => {
    const { selection } = editor.state;
    const { from, to, empty } = selection;

    if (empty) {
      setVisible(false);
      closeDropdowns();
      return;
    }

    try {
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const editorRect = editor.view.dom.getBoundingClientRect();

      const midX = (start.left + end.right) / 2 - editorRect.left;
      const belowTop = end.bottom - editorRect.top + 8;
      const aboveTop = start.top - editorRect.top - 48;

      // Flip above if toolbar would go past bottom of editor
      const toolbarHeight = 42; // approximate
      const spaceBelow = editorRect.bottom - end.bottom;
      const shouldFlip = spaceBelow < toolbarHeight + 20;

      setFlipAbove(shouldFlip);
      setPosition({
        top: shouldFlip ? aboveTop : belowTop,
        left: midX,
      });
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [editor, closeDropdowns]);

  useEffect(() => {
    editor.on('selectionUpdate', updatePosition);
    editor.on('transaction', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('transaction', updatePosition);
    };
  }, [editor, updatePosition]);

  // Hide on blur
  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        if (!toolbarRef.current?.matches(':hover')) {
          setVisible(false);
          closeDropdowns();
        }
      }, 150);
    };
    editor.on('blur', handleBlur);
    return () => {
      editor.off('blur', handleBlur);
    };
  }, [editor, closeDropdowns]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        closeDropdowns();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible, closeDropdowns]);

  // Link handler
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('הכנס כתובת URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: '_blank' })
      .run();
  }, [editor]);

  // Gibberish convert handler
  const handleGibberishConvert = useCallback(() => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim()) return;

    // Detect direction: count Hebrew vs English chars
    let heCount = 0;
    let enCount = 0;
    for (const ch of selectedText) {
      const code = ch.codePointAt(0) ?? 0;
      if (code >= 0x0590 && code <= 0x05ff) heCount++;
      else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) enCount++;
    }

    const converted = heCount > enCount ? toEnglish(selectedText) : toHebrew(selectedText);
    if (converted === selectedText) return;

    editor.chain().focus().insertContent(converted).run();
  }, [editor]);

  // Get current alignment icon element
  const getAlignIconElement = () => {
    if (editor.isActive({ textAlign: 'center' })) return <AlignCenter size={ICON_SIZE} />;
    if (editor.isActive({ textAlign: 'left' })) return <AlignLeft size={ICON_SIZE} />;
    return <AlignRight size={ICON_SIZE} />;
  };

  // Get current text color for the Type icon underline
  const currentTextColor = editor.getAttributes('textStyle').color || 'var(--cc-accent-400, #a78bfa)';

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`gam-ftb ${flipAbove ? 'gam-ftb--above' : 'gam-ftb--below'}`}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
    >
      {/* ─── Formatting Group ─── */}
      <ToolbarBtn
        icon={<Bold size={ICON_SIZE} />}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      />
      <ToolbarBtn
        icon={<Italic size={ICON_SIZE} />}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      />
      <ToolbarBtn
        icon={<Underline size={ICON_SIZE} />}
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      />
      <ToolbarBtn
        icon={<Strikethrough size={ICON_SIZE} />}
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      />

      <span className="gam-ftb__sep" />

      {/* ─── Color Group ─── */}
      <span className="gam-ftb__color-wrap">
        <ToolbarBtn
          icon={
            <span className="gam-ftb__color-icon">
              <Type size={ICON_SIZE} />
              <span className="gam-ftb__color-bar" style={{ backgroundColor: currentTextColor }} />
            </span>
          }
          active={colorMenu === 'text'}
          onClick={() => {
            setColorMenu(colorMenu === 'text' ? null : 'text');
            setShowAlign(false);
            setShowMore(false);
          }}
          title="צבע טקסט"
          hasDropdown
        />
        {colorMenu === 'text' && (
          <ColorMenu editor={editor} type="text" onClose={() => setColorMenu(null)} />
        )}
      </span>

      <span className="gam-ftb__color-wrap">
        <ToolbarBtn
          icon={<Highlighter size={ICON_SIZE} />}
          active={colorMenu === 'background'}
          onClick={() => {
            setColorMenu(colorMenu === 'background' ? null : 'background');
            setShowAlign(false);
            setShowMore(false);
          }}
          title="צבע רקע"
          hasDropdown
        />
        {colorMenu === 'background' && (
          <ColorMenu editor={editor} type="background" onClose={() => setColorMenu(null)} />
        )}
      </span>

      <span className="gam-ftb__sep" />

      {/* ─── Link ─── */}
      <ToolbarBtn
        icon={<Link size={ICON_SIZE} />}
        active={editor.isActive('link')}
        onClick={setLink}
        title="קישור"
      />

      {/* ─── Alignment ─── */}
      <span className="gam-ftb__color-wrap">
        <ToolbarBtn
          icon={getAlignIconElement()}
          active={showAlign}
          onClick={() => {
            setShowAlign(!showAlign);
            setColorMenu(null);
            setShowMore(false);
          }}
          title="יישור טקסט"
          hasDropdown
        />
        {showAlign && (
          <div className="gam-ftb__dropdown">
            <button
              type="button"
              className={`gam-ftb__dropdown-item ${editor.isActive({ textAlign: 'right' }) ? 'gam-ftb__dropdown-item--active' : ''}`}
              onClick={() => { editor.chain().focus().setTextAlign('right').run(); setShowAlign(false); }}
            >
              <AlignRight size={14} />
              <span>ימין</span>
            </button>
            <button
              type="button"
              className={`gam-ftb__dropdown-item ${editor.isActive({ textAlign: 'center' }) ? 'gam-ftb__dropdown-item--active' : ''}`}
              onClick={() => { editor.chain().focus().setTextAlign('center').run(); setShowAlign(false); }}
            >
              <AlignCenter size={14} />
              <span>מרכז</span>
            </button>
            <button
              type="button"
              className={`gam-ftb__dropdown-item ${editor.isActive({ textAlign: 'left' }) ? 'gam-ftb__dropdown-item--active' : ''}`}
              onClick={() => { editor.chain().focus().setTextAlign('left').run(); setShowAlign(false); }}
            >
              <AlignLeft size={14} />
              <span>שמאל</span>
            </button>
          </div>
        )}
      </span>

      <span className="gam-ftb__sep" />

      {/* ─── Gibberish Convert ─── */}
      <ToolbarBtn
        icon={<Languages size={ICON_SIZE} />}
        active={false}
        onClick={handleGibberishConvert}
        title="תיקון שפה"
      />

      <span className="gam-ftb__sep" />

      {/* ─── More Menu ─── */}
      <span className="gam-ftb__color-wrap">
        <ToolbarBtn
          icon={<MoreHorizontal size={ICON_SIZE} />}
          active={showMore}
          onClick={() => {
            setShowMore(!showMore);
            setColorMenu(null);
            setShowAlign(false);
          }}
          title="עוד אפשרויות"
        />
        {showMore && (
          <div className="gam-ftb__dropdown gam-ftb__dropdown--more">
            {/* Turn Into section */}
            <div className="gam-ftb__dropdown-label">הפוך ל...</div>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowMore(false); }}>
              <Heading1 size={14} /> <span>כותרת 1</span>
            </button>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowMore(false); }}>
              <Heading2 size={14} /> <span>כותרת 2</span>
            </button>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setShowMore(false); }}>
              <Heading3 size={14} /> <span>כותרת 3</span>
            </button>

            <div className="gam-ftb__dropdown-sep" />

            {/* Lists */}
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowMore(false); }}>
              <List size={14} /> <span>רשימה</span>
            </button>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowMore(false); }}>
              <ListOrdered size={14} /> <span>ממוספרת</span>
            </button>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleTaskList().run(); setShowMore(false); }}>
              <CheckSquare size={14} /> <span>משימות</span>
            </button>

            <div className="gam-ftb__dropdown-sep" />

            {/* Blocks */}
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleBlockquote().run(); setShowMore(false); }}>
              <Quote size={14} /> <span>ציטוט</span>
            </button>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setShowMore(false); }}>
              <Code size={14} /> <span>קוד</span>
            </button>
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().setHorizontalRule().run(); setShowMore(false); }}>
              <Minus size={14} /> <span>קו הפרדה</span>
            </button>

            <div className="gam-ftb__dropdown-sep" />

            {/* Actions */}
            <button type="button" className="gam-ftb__dropdown-item" onClick={() => { editor.chain().focus().clearNodes().unsetAllMarks().run(); setShowMore(false); }}>
              <RemoveFormatting size={14} /> <span>נקה עיצוב</span>
            </button>
            <button
              type="button"
              className="gam-ftb__dropdown-item"
              onClick={() => {
                const { from, to } = editor.state.selection;
                const text = editor.state.doc.textBetween(from, to, '\n');
                navigator.clipboard.writeText(text);
                setShowMore(false);
              }}
            >
              <Copy size={14} /> <span>העתק בלוק</span>
            </button>
            <button
              type="button"
              className="gam-ftb__dropdown-item gam-ftb__dropdown-item--danger"
              onClick={() => {
                editor.chain().focus().deleteSelection().run();
                setShowMore(false);
              }}
            >
              <Trash2 size={14} /> <span>מחק בלוק</span>
            </button>
          </div>
        )}
      </span>
    </div>
  );
}

// ─── Toolbar Button Component ──────────────────────
function ToolbarBtn({
  icon,
  active,
  onClick,
  title,
  hasDropdown,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
  hasDropdown?: boolean;
}) {
  return (
    <button
      type="button"
      className={`gam-ftb__btn ${active ? 'gam-ftb__btn--active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
    >
      {icon}
      {hasDropdown && <span className="gam-ftb__arrow">▾</span>}
    </button>
  );
}
