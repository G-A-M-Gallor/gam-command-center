// ===================================================
// GAM Command Center — Field Block Extension
// Renders form fields inside the Tiptap editor
// ===================================================

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fieldBlock: {
      setFieldBlock: (attrs: {
        fieldType: string;
        fieldId: string;
        label: string;
        config: Record<string, unknown>;
        placementId?: string;
        documentId?: string;
        placedBy?: string;
        placedAt?: string;
      }) => ReturnType;
    };
  }
}

// Icon map for field types (emoji fallbacks)
const FIELD_ICONS: Record<string, string> = {
  'short-text': '📝',
  checkbox: '☑️',
  dropdown: '📋',
  'multi-select': '☰',
  date: '📅',
  datetime: '📅',
  time: '🕐',
  tags: '🏷️',
};

export const FieldBlock = Node.create({
  name: 'fieldBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fieldType: {
        default: 'short-text',
        parseHTML: (el) => el.getAttribute('data-field-type') || 'short-text',
      },
      fieldId: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-field-id') || '',
      },
      label: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-label') || '',
      },
      config: {
        default: {},
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute('data-config') || '{}');
          } catch {
            return {};
          }
        },
      },
      placementId: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-placement-id') || '',
      },
      documentId: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-document-id') || '',
      },
      placedBy: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-placed-by') || '',
      },
      placedAt: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-placed-at') || '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="field-block"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { fieldType, fieldId, label, config, placementId, documentId, placedBy, placedAt } = node.attrs;
    const icon = FIELD_ICONS[fieldType] || '📝';
    const displayLabel = label || fieldType;

    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'field-block',
          'data-field-type': fieldType,
          'data-field-id': fieldId,
          'data-label': label,
          'data-config': JSON.stringify(config),
          'data-placement-id': placementId,
          'data-document-id': documentId,
          'data-placed-by': placedBy,
          'data-placed-at': placedAt,
          class: 'gam-field-block',
          contenteditable: 'false',
        },
        HTMLAttributes
      ),
      ['span', { class: 'gam-field-block__icon' }, icon],
      ['span', { class: 'gam-field-block__label' }, displayLabel],
      ['span', { class: 'gam-field-block__type' }, fieldType],
    ];
  },

  addCommands() {
    return {
      setFieldBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('gam-field-block');
      dom.setAttribute('data-type', 'field-block');
      dom.setAttribute('data-field-type', node.attrs.fieldType);
      dom.setAttribute('data-field-id', node.attrs.fieldId);
      dom.setAttribute('data-placement-id', node.attrs.placementId || '');
      dom.setAttribute('data-document-id', node.attrs.documentId || '');
      dom.contentEditable = 'false';

      const icon = FIELD_ICONS[node.attrs.fieldType] || '📝';
      const displayLabel = node.attrs.label || node.attrs.fieldType;

      dom.innerHTML = `
        <span class="gam-field-block__icon">${icon}</span>
        <span class="gam-field-block__label">${escapeHtml(displayLabel)}</span>
        <span class="gam-field-block__type">${escapeHtml(node.attrs.fieldType)}</span>
      `;

      // Click to open config modal
      dom.addEventListener('click', () => {
        window.dispatchEvent(
          new CustomEvent('cc-edit-field', {
            detail: {
              fieldType: node.attrs.fieldType,
              fieldId: node.attrs.fieldId,
              config: node.attrs.config,
              placementId: node.attrs.placementId,
              documentId: node.attrs.documentId,
              pos: typeof getPos === 'function' ? getPos() : 0,
            },
          })
        );
      });

      return { dom };
    };
  },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
