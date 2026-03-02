// ===================================================
// GAM Command Center — Slash Commands Extension
// Tiptap extension using @tiptap/suggestion + tippy.js
// ===================================================

import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { SlashCommandMenu } from '../SlashCommandMenu';
import { slashCommandItems } from '../slash-command-items';

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          return slashCommandItems.filter((item) => {
            if (!query) return true;
            const q = query.toLowerCase();
            return (
              item.title.toLowerCase().includes(q) ||
              item.titleHe.includes(q) ||
              item.aliases.some((a) => a.includes(q))
            );
          });
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                // RTL: flip placement for Hebrew
                popperOptions: {
                  modifiers: [
                    {
                      name: 'flip',
                      options: { fallbackPlacements: ['bottom-end', 'top-start'] },
                    },
                  ],
                },
              });
            },

            onUpdate: (props: any) => {
              component?.updateProps(props);
              if (!props.clientRect) return;
              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return (component?.ref as any)?.onKeyDown?.(props) ?? false;
            },

            onExit: () => {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
