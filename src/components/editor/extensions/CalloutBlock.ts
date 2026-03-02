// ===================================================
// GAM Command Center — Callout Block Extension
// Colored box with emoji/icon — info, warning, tip, error
// Like Notion callout blocks
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBlock: {
      setCallout: (attrs?: { variant?: string; icon?: string }) => ReturnType;
    };
  }
}

export type CalloutVariant = 'info' | 'warning' | 'tip' | 'error' | 'note';

const DEFAULT_ICONS: Record<CalloutVariant, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  tip: '💡',
  error: '🚫',
  note: '📝',
};

export const CalloutBlock = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-variant') || 'info',
      },
      icon: {
        default: 'ℹ️',
        parseHTML: (el) => el.getAttribute('data-icon') || 'ℹ️',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { variant, icon } = node.attrs;

    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'callout',
          'data-variant': variant,
          'data-icon': icon,
          class: `gam-callout gam-callout--${variant}`,
        },
        HTMLAttributes
      ),
      ['span', { class: 'gam-callout__icon', contenteditable: 'false' }, icon],
      ['div', { class: 'gam-callout__content' }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) => {
          const variant = (attrs?.variant || 'info') as CalloutVariant;
          const icon = attrs?.icon || DEFAULT_ICONS[variant] || 'ℹ️';

          return commands.insertContent({
            type: this.name,
            attrs: { variant, icon },
            content: [{ type: 'paragraph' }],
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (
          empty &&
          $from.parent.type.name === 'paragraph' &&
          $from.parentOffset === 0 &&
          $from.parent.textContent.length === 0
        ) {
          const calloutDepth = $from.depth - 1;
          if (
            calloutDepth > 0 &&
            $from.node(calloutDepth)?.type.name === 'callout'
          ) {
            return editor.commands.lift('callout');
          }
        }
        return false;
      },
    };
  },
});
