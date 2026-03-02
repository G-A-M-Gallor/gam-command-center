'use client';

// ===================================================
// GAM Command Center — Slash Command Menu V2
// Categories, better icons, smooth animations
// ===================================================

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { SlashCommandItem } from './types';
import { slashCommandCategories } from './slash-command-items';

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  query: string;
}

export const SlashCommandMenu = forwardRef<any, SlashCommandMenuProps>(
  ({ items, command, query }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter categories based on query
    const filteredCategories = slashCommandCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (!query) return true;
          const q = query.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.titleHe.includes(q) ||
            item.description.includes(q) ||
            item.aliases.some((a) => a.includes(q))
          );
        }),
      }))
      .filter((cat) => cat.items.length > 0);

    // Flat filtered list for keyboard navigation
    const flatFiltered = filteredCategories.flatMap((cat) => cat.items);

    const selectItem = useCallback(
      (index: number) => {
        const item = flatFiltered[index];
        if (item) command(item);
      },
      [flatFiltered, command]
    );

    // Reset selection when query changes
    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    // Scroll selected item into view
    useEffect(() => {
      const el = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) =>
            (prev + flatFiltered.length - 1) % flatFiltered.length
          );
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % flatFiltered.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (flatFiltered.length === 0) {
      return (
        <div className="gam-slash-menu gam-slash-menu--empty">
          <div className="gam-slash-menu__empty">אין תוצאות</div>
        </div>
      );
    }

    let globalIndex = 0;

    return (
      <div className="gam-slash-menu" ref={menuRef}>
        {filteredCategories.map((cat) => (
          <div key={cat.name} className="gam-slash-menu__category">
            <div className="gam-slash-menu__header">{cat.nameHe}</div>
            {cat.items.map((item) => {
              const idx = globalIndex++;
              return (
                <button
                  key={`${item.title}`}
                  data-index={idx}
                  className={`gam-slash-menu__item ${
                    idx === selectedIndex ? 'gam-slash-menu__item--active' : ''
                  }`}
                  onClick={() => selectItem(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="gam-slash-menu__icon">{item.icon}</span>
                  <div className="gam-slash-menu__text">
                    <span className="gam-slash-menu__title">{item.titleHe}</span>
                    <span className="gam-slash-menu__desc">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
