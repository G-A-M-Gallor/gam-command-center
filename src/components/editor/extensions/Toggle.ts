// ===================================================
// GAM Command Center — Toggle Extension (v2)
// Div-based toggle that works in contentEditable
// Uses NodeView for the toggle arrow click handler
// Supports: regular toggle + toggle headings (H1/H2/H3)
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleBlock: {
      setToggle: () => ReturnType;
      setToggleHeading: (attrs: { level: number }) => ReturnType;
    };
  }
}

export const ToggleDetails = Node.create({
  name: 'details',
  group: 'block',
  content: 'detailsSummary detailsContent',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('data-open') !== 'false',
        renderHTML: (attrs) => ({
          'data-open': attrs.open ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="toggle"]' },
      { tag: 'details' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'toggle',
          class: `gam-toggle ${HTMLAttributes['data-open'] === 'false' ? 'gam-toggle--closed' : ''}`,
        },
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { open: true },
            content: [
              {
                type: 'detailsSummary',
                content: [{ type: 'text', text: ' ' }],
              },
              {
                type: 'detailsContent',
                content: [{ type: 'paragraph' }],
              },
            ],
          });
        },
      setToggleHeading:
        ({ level }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { open: true },
            content: [
              {
                type: 'detailsSummary',
                attrs: { headingLevel: level },
                content: [{ type: 'text', text: ' ' }],
              },
              {
                type: 'detailsContent',
                content: [{ type: 'paragraph' }],
              },
            ],
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
          $from.parent.type.name === 'detailsSummary' &&
          $from.parentOffset === 0
        ) {
          return editor.commands.lift('details');
        }
        return false;
      },
    };
  },

  // Plugin to handle clicking the toggle arrow
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('toggleClick'),
        props: {
          handleClickOn: (view, _pos, node, nodePos, event) => {
            const target = event.target as HTMLElement;
            // Check if the click was on the toggle arrow
            if (
              target.classList?.contains('gam-toggle__arrow') ||
              target.closest?.('.gam-toggle__arrow')
            ) {
              const tr = view.state.tr;
              tr.setNodeMarkup(nodePos, undefined, {
                ...node.attrs,
                open: !node.attrs.open,
              });
              view.dispatch(tr);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

export const DetailsSummary = Node.create({
  name: 'detailsSummary',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      headingLevel: {
        default: 0,
        parseHTML: (el: HTMLElement) => {
          const cls = el.className;
          if (cls.includes('h1')) return 1;
          if (cls.includes('h2')) return 2;
          if (cls.includes('h3')) return 3;
          return 0;
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="toggle-summary"]' },
      { tag: 'summary' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.headingLevel;
    const classes = ['gam-toggle__summary'];
    if (level > 0) classes.push(`gam-toggle__summary--h${level}`);

    return [
      'div',
      mergeAttributes(
        { 'data-type': 'toggle-summary', class: classes.join(' ') },
        HTMLAttributes
      ),
      // Toggle arrow (non-editable)
      [
        'span',
        {
          class: 'gam-toggle__arrow',
          contenteditable: 'false',
          'data-drag-handle': '',
        },
        '▶',
      ],
      // Editable content wrapper
      ['span', { class: 'gam-toggle__summary-text' }, 0],
    ];
  },
});

export const DetailsContent = Node.create({
  name: 'detailsContent',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="toggle-content"]' },
      { tag: 'div[data-details-content]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'toggle-content',
          'data-details-content': '',
          class: 'gam-toggle__content',
        },
        HTMLAttributes
      ),
      0,
    ];
  },
});
