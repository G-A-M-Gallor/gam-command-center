// ===================================================
// GAM Command Center — Slash Commands Extension
// Tiptap extension using @tiptap/suggestion + tippy.js
// ===================================================

import { Extension, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { SlashCommandMenu } from '../SlashCommandMenu';
import { slashCommandItems } from '../slash-command-items';

interface SuggestionCallbackProps {
  editor: Editor;
  range: Range;
  clientRect?: (() => DOMRect | null) | null;
  event?: KeyboardEvent;
  props?: { command: (args: { editor: Editor; range: Range }) => void };
  [key: string]: unknown;
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: SuggestionCallbackProps) => {
          props?.command({ editor, range });
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
            onStart: (props: SuggestionCallbackProps) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
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

            onUpdate: (props: SuggestionCallbackProps) => {
              component?.updateProps(props);
              if (!props.clientRect) return;
              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown: (props: SuggestionCallbackProps) => {
              if (props.event?.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return ((component?.ref as Record<string, unknown>)?.onKeyDown as ((p: unknown) => boolean) | undefined)?.(props) ?? false;
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
