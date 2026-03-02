'use client';

// ===================================================
// GAM Command Center — Floating Toolbar V2
// Custom positioned toolbar (Tiptap v3)
// Added: Text Color + Background Color dropdowns
// ===================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { ColorMenu } from './ColorMenu';

interface FloatingToolbarProps {
  editor: Editor;
}

interface ToolbarButton {
  key: string;
  label: string;
  icon: string;
  action: () => void;
  isActive: () => boolean;
  isColorBtn?: boolean;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [colorMenu, setColorMenu] = useState<'text' | 'background' | null>(null);

  // Position toolbar above selection
  const updatePosition = useCallback(() => {
    const { selection } = editor.state;
    const { from, to, empty } = selection;

    if (empty) {
      setVisible(false);
      setColorMenu(null);
      return;
    }

    try {
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const editorRect = editor.view.dom.getBoundingClientRect();

      const top = start.top - editorRect.top - 48;
      const left = (start.left + end.left) / 2 - editorRect.left;

      setPosition({ top, left });
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [editor]);

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
      // Small delay to allow color menu clicks
      setTimeout(() => {
        if (!toolbarRef.current?.matches(':hover')) {
          setVisible(false);
          setColorMenu(null);
        }
      }, 150);
    };
    editor.on('blur', handleBlur);
    return () => {
      editor.off('blur', handleBlur);
    };
  }, [editor]);

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

  const toggleColorMenu = useCallback((type: 'text' | 'background') => {
    setColorMenu((prev) => (prev === type ? null : type));
  }, []);

  const buttons: ToolbarButton[] = [
    {
      key: 'bold',
      label: 'Bold',
      icon: 'B',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      key: 'italic',
      label: 'Italic',
      icon: 'I',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      key: 'underline',
      label: 'Underline',
      icon: 'U',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      key: 'strike',
      label: 'Strikethrough',
      icon: 'S',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      key: 'textColor',
      label: 'צבע טקסט',
      icon: 'A',
      action: () => toggleColorMenu('text'),
      isActive: () => colorMenu === 'text',
      isColorBtn: true,
    },
    {
      key: 'bgColor',
      label: 'צבע רקע',
      icon: '🖍',
      action: () => toggleColorMenu('background'),
      isActive: () => colorMenu === 'background',
      isColorBtn: true,
    },
    {
      key: 'link',
      label: 'Link',
      icon: '🔗',
      action: setLink,
      isActive: () => editor.isActive('link'),
    },
  ];

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="gam-floating-toolbar"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
    >
      {buttons.map((btn, i) => (
        <span key={btn.key} style={{ position: 'relative' }}>
          {/* Separator before color buttons */}
          {btn.key === 'textColor' && (
            <span className="gam-floating-toolbar__sep" />
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              btn.action();
            }}
            className={`gam-floating-toolbar__btn ${
              btn.isActive() ? 'gam-floating-toolbar__btn--active' : ''
            } ${btn.isColorBtn ? 'gam-floating-toolbar__btn--color' : ''}`}
            title={btn.label}
            type="button"
          >
            <span
              className={`gam-floating-toolbar__icon ${
                btn.key === 'bold' ? 'gam-floating-toolbar__icon--bold' : ''
              } ${btn.key === 'italic' ? 'gam-floating-toolbar__icon--italic' : ''}
              ${btn.key === 'underline' ? 'gam-floating-toolbar__icon--underline' : ''}
              ${btn.key === 'strike' ? 'gam-floating-toolbar__icon--strike' : ''}
              ${btn.key === 'textColor' ? 'gam-floating-toolbar__icon--textcolor' : ''}`}
            >
              {btn.icon}
            </span>
            {btn.isColorBtn && (
              <span className="gam-floating-toolbar__dropdown-arrow">▾</span>
            )}
          </button>

          {/* Color dropdown */}
          {btn.key === 'textColor' && colorMenu === 'text' && (
            <ColorMenu
              editor={editor}
              type="text"
              onClose={() => setColorMenu(null)}
            />
          )}
          {btn.key === 'bgColor' && colorMenu === 'background' && (
            <ColorMenu
              editor={editor}
              type="background"
              onClose={() => setColorMenu(null)}
            />
          )}

          {/* Separator after color buttons */}
          {btn.key === 'bgColor' && (
            <span className="gam-floating-toolbar__sep" />
          )}
        </span>
      ))}
    </div>
  );
}
