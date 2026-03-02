// ===================================================
// GAM Command Center — Embed Block Extension
// iframe embed for YouTube, Google Maps, any URL
// Auto-detects YouTube/Vimeo for proper embed URLs
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embedBlock: {
      setEmbed: (attrs: { url: string }) => ReturnType;
    };
  }
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Google Maps
  if (url.includes('google.com/maps') || url.includes('goo.gl/maps')) {
    if (url.includes('/embed')) return url;
    return url.replace('/maps/', '/maps/embed?');
  }

  // Figma
  if (url.includes('figma.com')) {
    return `https://www.figma.com/embed?embed_host=gam&url=${encodeURIComponent(url)}`;
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

  // Default — use as-is
  return url;
}

function getEmbedType(url: string): string {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo')) return 'vimeo';
  if (url.includes('google.com/maps') || url.includes('goo.gl/maps')) return 'maps';
  if (url.includes('figma.com')) return 'figma';
  if (url.includes('loom.com')) return 'loom';
  return 'generic';
}

export const EmbedBlock = Node.create({
  name: 'embedBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: '' },
      embedUrl: { default: '' },
      embedType: { default: 'generic' },
      aspectRatio: { default: '16/9' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="embed"]',
        getAttrs: (el) => ({
          url: (el as HTMLElement).getAttribute('data-url') || '',
          embedUrl: (el as HTMLElement).getAttribute('data-embed-url') || '',
          embedType: (el as HTMLElement).getAttribute('data-embed-type') || 'generic',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { url, embedUrl, embedType, aspectRatio } = node.attrs;
    const finalEmbedUrl = embedUrl || getEmbedUrl(url);

    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'embed',
          'data-url': url,
          'data-embed-url': finalEmbedUrl,
          'data-embed-type': embedType || getEmbedType(url),
          class: 'gam-embed',
        },
        HTMLAttributes
      ),
      [
        'div',
        { class: 'gam-embed__wrapper', style: `aspect-ratio: ${aspectRatio}` },
        [
          'iframe',
          {
            src: finalEmbedUrl,
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'true',
            loading: 'lazy',
            class: 'gam-embed__iframe',
          },
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setEmbed:
        ({ url }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              url,
              embedUrl: getEmbedUrl(url),
              embedType: getEmbedType(url),
            },
          });
        },
    };
  },
});
