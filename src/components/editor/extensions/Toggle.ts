// ===================================================
// GAM Command Center — Toggle Extension
// Simple toggle using <details>/<summary> HTML
// Supports: regular toggle + toggle headings (H1/H2/H3)
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

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
        parseHTML: (el) => el.hasAttribute('open'),
        renderHTML: (attrs) => (attrs.open ? { open: '' } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes({ class: 'gam-toggle' }, HTMLAttributes), 0];
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
                content: [{ type: 'text', text: '' }],
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
                content: [{ type: 'text', text: '' }],
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
          // At start of summary — unwrap toggle to paragraph
          return editor.commands.lift('details');
        }
        return false;
      },
    };
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
        default: 0, // 0 = regular toggle, 1-3 = heading toggle
        parseHTML: (el) => {
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
    return [{ tag: 'summary' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.headingLevel;
    const classes = ['gam-toggle__summary'];
    if (level > 0) classes.push(`gam-toggle__summary--h${level}`);

    return ['summary', mergeAttributes({ class: classes.join(' ') }, HTMLAttributes), 0];
  },
});

export const DetailsContent = Node.create({
  name: 'detailsContent',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-details-content]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-details-content': '', class: 'gam-toggle__content' },
        HTMLAttributes
      ),
      0,
    ];
  },
});
