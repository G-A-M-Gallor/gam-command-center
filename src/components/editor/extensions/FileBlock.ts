// ===================================================
// GAM Command Center — File Block Extension
// File attachment link with icon by file type
// R2 upload will be added later — currently URL-based
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileBlock: {
      setFileBlock: (attrs: { url: string; filename: string; size?: string }) => ReturnType;
    };
  }
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  ppt: '📎',
  pptx: '📎',
  zip: '🗜️',
  rar: '🗜️',
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
  gif: '🖼️',
  mp4: '🎬',
  mp3: '🎵',
  csv: '📊',
  txt: '📃',
  default: '📁',
};

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export const FileBlock = Node.create({
  name: 'fileBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: '' },
      filename: { default: 'קובץ' },
      size: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file"]',
        getAttrs: (el) => ({
          url: (el as HTMLElement).getAttribute('data-url') || '',
          filename: (el as HTMLElement).getAttribute('data-filename') || '',
          size: (el as HTMLElement).getAttribute('data-size') || '',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { url, filename, size } = node.attrs;
    const icon = getFileIcon(filename);

    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'file',
          'data-url': url,
          'data-filename': filename,
          'data-size': size,
          class: 'gam-file',
        },
        HTMLAttributes
      ),
      ['span', { class: 'gam-file__icon' }, icon],
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'gam-file__name',
        },
        filename,
      ],
      size ? ['span', { class: 'gam-file__size' }, size] : '',
    ];
  },

  addCommands() {
    return {
      setFileBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
