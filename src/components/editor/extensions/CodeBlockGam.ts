// ===================================================
// GAM Command Center — Code Block Extension
// Basic code block with language label
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codeBlockGam: {
      setCodeBlock: (attrs?: { language?: string }) => ReturnType;
    };
  }
}

export const CodeBlockGam = Node.create({
  name: 'codeBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      language: {
        default: 'plain',
        parseHTML: (el) => el.getAttribute('data-language') || 'plain',
        renderHTML: (attrs) => ({
          'data-language': attrs.language,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(
        {
          class: 'gam-codeblock',
          'data-language': node.attrs.language,
        },
        HTMLAttributes
      ),
      ['code', {}, 0],
    ];
  },

  addCommands() {
    return {
      setCodeBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.setNode(this.name, attrs);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.setCodeBlock(),
      // Tab inside code block inserts 2 spaces
      Tab: ({ editor }) => {
        if (editor.isActive('codeBlock')) {
          editor.commands.insertContent('  ');
          return true;
        }
        return false;
      },
      // Shift-Enter inside code block creates new line (not new block)
      'Shift-Enter': ({ editor }) => {
        if (editor.isActive('codeBlock')) {
          editor.commands.insertContent('\n');
          return true;
        }
        return false;
      },
      // Backspace at start of empty code block converts to paragraph
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (
          empty &&
          editor.isActive('codeBlock') &&
          $from.parentOffset === 0 &&
          $from.parent.textContent.length === 0
        ) {
          return editor.commands.setParagraph();
        }
        return false;
      },
    };
  },
});
