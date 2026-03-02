// ===================================================
// GAM Command Center — Image Block Extension
// URL-based image with caption + alignment
// R2 upload will be added later
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attrs: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      width: { default: '100%' },
      alignment: { default: 'center' }, // left, center, right
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector('img');
          const caption = (el as HTMLElement).querySelector('figcaption');
          return {
            src: img?.getAttribute('src') || '',
            alt: img?.getAttribute('alt') || '',
            caption: caption?.textContent || '',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, caption, width, alignment } = node.attrs;

    return [
      'figure',
      mergeAttributes(
        {
          'data-type': 'image',
          class: `gam-image gam-image--${alignment}`,
          style: `max-width: ${width}`,
        },
        HTMLAttributes
      ),
      ['img', { src, alt, loading: 'lazy' }],
      caption ? ['figcaption', { class: 'gam-image__caption' }, caption] : '',
    ];
  },

  addCommands() {
    return {
      setImageBlock:
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
