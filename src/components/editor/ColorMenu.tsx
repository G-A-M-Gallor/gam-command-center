'use client';

// ===================================================
// GAM Command Center — Color Menu
// Uses same 6 accent colors as Settings page
// For text color + background highlight in editor
// ===================================================

import { useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';

interface ColorMenuProps {
  editor: Editor;
  type: 'text' | 'background';
  onClose: () => void;
}

// Same colors as ACCENT_OPTIONS in Settings
const EDITOR_COLORS = [
  { name: 'סגול', value: '#9333ea' },
  { name: 'כחול', value: '#2563eb' },
  { name: 'ירוק', value: '#059669' },
  { name: 'כתום', value: '#d97706' },
  { name: 'ורוד', value: '#e11d48' },
  { name: 'טורקיז', value: '#0891b2' },
];

// Background versions (lighter, 20% opacity)
const BG_COLORS = [
  { name: 'סגול', value: '#9333ea33' },
  { name: 'כחול', value: '#2563eb33' },
  { name: 'ירוק', value: '#05966933' },
  { name: 'כתום', value: '#d9770633' },
  { name: 'ורוד', value: '#e11d4833' },
  { name: 'טורקיז', value: '#0891b233' },
];

export function ColorMenu({ editor, type, onClose }: ColorMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const colors = type === 'text' ? EDITOR_COLORS : BG_COLORS;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const applyColor = (color: string) => {
    if (type === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    onClose();
  };

  const removeColor = () => {
    if (type === 'text') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    onClose();
  };

  return (
    <div ref={menuRef} className="gam-color-menu">
      <div className="gam-color-menu__label">
        {type === 'text' ? 'צבע טקסט' : 'צבע רקע'}
      </div>
      <div className="gam-color-menu__grid">
        {/* Reset / default */}
        <button
          className="gam-color-menu__swatch gam-color-menu__swatch--reset"
          onClick={removeColor}
          title="ברירת מחדל"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        {colors.map((c) => (
          <button
            key={c.value}
            className="gam-color-menu__swatch"
            style={{
              backgroundColor: type === 'text' ? 'transparent' : c.value,
              color: type === 'text' ? c.value : undefined,
              borderColor: c.value,
            }}
            onClick={() => applyColor(c.value)}
            title={c.name}
            type="button"
          >
            {type === 'text' ? 'A' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
