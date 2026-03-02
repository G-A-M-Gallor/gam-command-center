'use client';

// ===================================================
// GAM Command Center — Block Handle + Block Menu
// Shows ⠿ (drag/menu) + ➕ (add) on block hover
// Click ⠿ opens Block Menu (delete, duplicate, turn into...)
// ===================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';

interface BlockHandleProps {
  editor: Editor;
}

interface BlockMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodePos: number;
  nodeType: string;
}

const TURN_INTO_OPTIONS = [
  { type: 'paragraph', label: 'טקסט', icon: '¶' },
  { type: 'heading', label: 'כותרת 1', icon: 'H1', attrs: { level: 1 } },
  { type: 'heading', label: 'כותרת 2', icon: 'H2', attrs: { level: 2 } },
  { type: 'heading', label: 'כותרת 3', icon: 'H3', attrs: { level: 3 } },
  { type: 'bulletList', label: 'רשימה', icon: '•' },
  { type: 'orderedList', label: 'ממוספרת', icon: '1.' },
  { type: 'taskList', label: 'משימות', icon: '☑' },
  { type: 'blockquote', label: 'ציטוט', icon: '"' },
];

export function BlockHandle({ editor }: BlockHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [handlePos, setHandlePos] = useState({ top: 0, visible: false });
  const [currentNodePos, setCurrentNodePos] = useState(-1);
  const [menu, setMenu] = useState<BlockMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodePos: -1,
    nodeType: '',
  });
  const [showTurnInto, setShowTurnInto] = useState(false);

  // Track hovered block
  useEffect(() => {
    const editorEl = editor.view.dom;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the closest top-level block
      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!pos) {
        setHandlePos((p) => ({ ...p, visible: false }));
        return;
      }

      try {
        const resolved = editor.state.doc.resolve(pos.pos);
        // Get top-level node (depth 1)
        const depth = Math.min(resolved.depth, 1);
        const nodePos = resolved.before(depth || 1);
        const node = editor.state.doc.nodeAt(nodePos);

        if (!node) {
          setHandlePos((p) => ({ ...p, visible: false }));
          return;
        }

        // Get DOM element for this node
        const domNode = editor.view.nodeDOM(nodePos);
        if (!domNode || !(domNode instanceof HTMLElement)) {
          setHandlePos((p) => ({ ...p, visible: false }));
          return;
        }

        const editorRect = editorEl.getBoundingClientRect();
        const blockRect = domNode.getBoundingClientRect();

        setHandlePos({
          top: blockRect.top - editorRect.top + 2,
          visible: true,
        });
        setCurrentNodePos(nodePos);
      } catch {
        setHandlePos((p) => ({ ...p, visible: false }));
      }
    };

    const handleMouseLeave = () => {
      setTimeout(() => {
        if (!handleRef.current?.matches(':hover')) {
          setHandlePos((p) => ({ ...p, visible: false }));
        }
      }, 200);
    };

    editorEl.addEventListener('mousemove', handleMouseMove);
    editorEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorEl.removeEventListener('mousemove', handleMouseMove);
      editorEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor]);

  // Close menu on outside click
  useEffect(() => {
    if (!menu.visible) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.gam-block-menu')) {
        setMenu((m) => ({ ...m, visible: false }));
        setShowTurnInto(false);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [menu.visible]);

  // Add block below
  const handleAdd = useCallback(() => {
    if (currentNodePos < 0) return;
    const node = editor.state.doc.nodeAt(currentNodePos);
    if (!node) return;

    const insertPos = currentNodePos + node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type: 'paragraph' })
      .setTextSelection(insertPos + 1)
      .run();
  }, [editor, currentNodePos]);

  // Open block menu
  const handleMenuOpen = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentNodePos < 0) return;
      const node = editor.state.doc.nodeAt(currentNodePos);

      const editorRect = editor.view.dom.getBoundingClientRect();
      setMenu({
        visible: true,
        x: e.clientX - editorRect.left,
        y: e.clientY - editorRect.top,
        nodePos: currentNodePos,
        nodeType: node?.type.name || '',
      });
      setShowTurnInto(false);
    },
    [editor, currentNodePos]
  );

  // Delete block
  const handleDelete = useCallback(() => {
    if (menu.nodePos < 0) return;
    const node = editor.state.doc.nodeAt(menu.nodePos);
    if (!node) return;

    editor
      .chain()
      .focus()
      .deleteRange({ from: menu.nodePos, to: menu.nodePos + node.nodeSize })
      .run();
    setMenu((m) => ({ ...m, visible: false }));
  }, [editor, menu.nodePos]);

  // Duplicate block
  const handleDuplicate = useCallback(() => {
    if (menu.nodePos < 0) return;
    const node = editor.state.doc.nodeAt(menu.nodePos);
    if (!node) return;

    const insertPos = menu.nodePos + node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, node.toJSON())
      .run();
    setMenu((m) => ({ ...m, visible: false }));
  }, [editor, menu.nodePos]);

  // Turn into
  const handleTurnInto = useCallback(
    (type: string, attrs?: Record<string, any>) => {
      if (menu.nodePos < 0) return;

      editor.chain().focus().setTextSelection(menu.nodePos + 1).run();

      switch (type) {
        case 'paragraph':
          editor.chain().focus().setParagraph().run();
          break;
        case 'heading':
          editor.chain().focus().setHeading(attrs as { level: 1 | 2 | 3 }).run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'taskList':
          editor.chain().focus().toggleTaskList().run();
          break;
        case 'blockquote':
          editor.chain().focus().setBlockquote().run();
          break;
      }

      setMenu((m) => ({ ...m, visible: false }));
      setShowTurnInto(false);
    },
    [editor, menu.nodePos]
  );

  // Move block up/down
  const handleMove = useCallback(
    (direction: 'up' | 'down') => {
      if (menu.nodePos < 0) return;
      const { doc } = editor.state;
      const node = doc.nodeAt(menu.nodePos);
      if (!node) return;

      const nodeEnd = menu.nodePos + node.nodeSize;

      if (direction === 'up' && menu.nodePos > 0) {
        const $pos = doc.resolve(menu.nodePos);
        const prevPos = $pos.before();
        if (prevPos >= 0) {
          editor
            .chain()
            .focus()
            .deleteRange({ from: menu.nodePos, to: nodeEnd })
            .insertContentAt(Math.max(0, menu.nodePos - 1), node.toJSON())
            .run();
        }
      } else if (direction === 'down' && nodeEnd < doc.content.size) {
        const nextNode = doc.nodeAt(nodeEnd);
        if (nextNode) {
          const nextEnd = nodeEnd + nextNode.nodeSize;
          editor
            .chain()
            .focus()
            .deleteRange({ from: menu.nodePos, to: nodeEnd })
            .insertContentAt(
              Math.min(doc.content.size, nodeEnd - node.nodeSize + nextNode.nodeSize),
              node.toJSON()
            )
            .run();
        }
      }

      setMenu((m) => ({ ...m, visible: false }));
    },
    [editor, menu.nodePos]
  );

  return (
    <>
      {/* Block Handle — ⠿ + ➕ */}
      {handlePos.visible && (
        <div
          ref={handleRef}
          className="gam-block-handle"
          style={{ top: `${handlePos.top}px` }}
          contentEditable={false}
        >
          <button
            className="gam-block-handle__btn gam-block-handle__add"
            onClick={handleAdd}
            title="הוסף בלוק"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="gam-block-handle__btn gam-block-handle__drag"
            onClick={handleMenuOpen}
            title="גרור / תפריט"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="5" cy="3" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="3" r="1.2" fill="currentColor"/>
              <circle cx="5" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="5" cy="11" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="11" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}

      {/* Block Menu */}
      {menu.visible && (
        <div
          className="gam-block-menu"
          style={{ top: `${menu.y}px`, left: `${menu.x}px` }}
        >
          <button className="gam-block-menu__item" onClick={handleDelete}>
            <span className="gam-block-menu__icon">🗑</span>
            <span>מחק</span>
          </button>
          <button className="gam-block-menu__item" onClick={handleDuplicate}>
            <span className="gam-block-menu__icon">📋</span>
            <span>שכפל</span>
          </button>
          <div className="gam-block-menu__separator" />
          <button
            className="gam-block-menu__item"
            onClick={() => setShowTurnInto(!showTurnInto)}
          >
            <span className="gam-block-menu__icon">🔄</span>
            <span>הפוך ל...</span>
            <span className="gam-block-menu__arrow">◂</span>
          </button>
          {showTurnInto && (
            <div className="gam-block-menu__sub">
              {TURN_INTO_OPTIONS.map((opt) => (
                <button
                  key={`${opt.type}-${opt.attrs?.level || ''}`}
                  className="gam-block-menu__item"
                  onClick={() => handleTurnInto(opt.type, opt.attrs)}
                >
                  <span className="gam-block-menu__icon">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="gam-block-menu__separator" />
          <button className="gam-block-menu__item" onClick={() => handleMove('up')}>
            <span className="gam-block-menu__icon">⬆</span>
            <span>הזז למעלה</span>
          </button>
          <button className="gam-block-menu__item" onClick={() => handleMove('down')}>
            <span className="gam-block-menu__icon">⬇</span>
            <span>הזז למטה</span>
          </button>
        </div>
      )}
    </>
  );
}
