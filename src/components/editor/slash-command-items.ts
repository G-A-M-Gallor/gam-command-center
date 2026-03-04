// ===================================================
// GAM Command Center — Slash Command Definitions V3
// 5 categories, 19 commands (Phase 1 + 2)
// ===================================================

import type { SlashCommandItem } from './types';

export interface SlashCommandCategory {
  name: string;
  nameHe: string;
  items: SlashCommandItem[];
}

export const slashCommandCategories: SlashCommandCategory[] = [
  {
    name: 'Basic',
    nameHe: 'בסיסי',
    items: [
      {
        title: 'Paragraph',
        titleHe: 'טקסט',
        description: 'טקסט רגיל',
        icon: '📝',
        aliases: ['text', 'טקסט', 'פסקה'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        },
      },
      {
        title: 'Heading 1',
        titleHe: 'כותרת 1',
        description: 'כותרת ראשית',
        icon: '𝗛₁',
        aliases: ['h1', 'כותרת', 'כותרת1'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        titleHe: 'כותרת 2',
        description: 'כותרת משנית',
        icon: '𝗛₂',
        aliases: ['h2', 'כותרת2'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
      },
      {
        title: 'Heading 3',
        titleHe: 'כותרת 3',
        description: 'כותרת קטנה',
        icon: '𝗛₃',
        aliases: ['h3', 'כותרת3'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
      },
    ],
  },
  {
    name: 'Lists',
    nameHe: 'רשימות',
    items: [
      {
        title: 'Bullet List',
        titleHe: 'רשימה',
        description: 'רשימת נקודות',
        icon: '•',
        aliases: ['bullet', 'ul', 'רשימה', 'נקודות'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: 'Numbered List',
        titleHe: 'רשימה ממוספרת',
        description: 'רשימה עם מספרים',
        icon: '1.',
        aliases: ['numbered', 'ol', 'מספרים', 'ממוספרת'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: 'Checklist',
        titleHe: 'משימות',
        description: 'רשימת משימות עם צ׳קבוקס',
        icon: '☑️',
        aliases: ['task', 'todo', 'check', 'משימה', 'משימות'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
    ],
  },
  {
    name: 'Toggle',
    nameHe: 'מתקפל',
    items: [
      {
        title: 'Toggle',
        titleHe: 'מתקפל',
        description: 'תוכן מתקפל (accordion)',
        icon: '▸',
        aliases: ['toggle', 'collapse', 'accordion', 'מתקפל'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setToggle().run();
        },
      },
      {
        title: 'Toggle H1',
        titleHe: 'כותרת 1 מתקפלת',
        description: 'כותרת ראשית שמתקפלת',
        icon: '▸𝗛₁',
        aliases: ['toggleh1', 'כותרת מתקפלת', 'כותרת1 מתקפלת'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setToggleHeading({ level: 1 }).run();
        },
      },
      {
        title: 'Toggle H2',
        titleHe: 'כותרת 2 מתקפלת',
        description: 'כותרת משנית שמתקפלת',
        icon: '▸𝗛₂',
        aliases: ['toggleh2', 'כותרת2 מתקפלת'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setToggleHeading({ level: 2 }).run();
        },
      },
      {
        title: 'Toggle H3',
        titleHe: 'כותרת 3 מתקפלת',
        description: 'כותרת קטנה שמתקפלת',
        icon: '▸𝗛₃',
        aliases: ['toggleh3', 'כותרת3 מתקפלת'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setToggleHeading({ level: 3 }).run();
        },
      },
    ],
  },
  {
    name: 'Media',
    nameHe: 'מדיה',
    items: [
      {
        title: 'Image',
        titleHe: 'תמונה',
        description: 'הוסף תמונה מ-URL',
        icon: '🖼️',
        aliases: ['image', 'img', 'תמונה', 'תמונות'],
        command: ({ editor, range }) => {
          const url = window.prompt('הכנס URL של תמונה:');
          if (!url) return;
          editor.chain().focus().deleteRange(range).setImageBlock({ src: url, alt: '' }).run();
        },
      },
      {
        title: 'File',
        titleHe: 'קובץ',
        description: 'צרף קובץ (URL)',
        icon: '📎',
        aliases: ['file', 'attachment', 'קובץ', 'צרף'],
        command: ({ editor, range }) => {
          const url = window.prompt('הכנס URL של קובץ:');
          if (!url) return;
          const filename = url.split('/').pop() || 'קובץ';
          editor.chain().focus().deleteRange(range).setFileBlock({ url, filename }).run();
        },
      },
      {
        title: 'Embed',
        titleHe: 'הטמעה',
        description: 'YouTube, Maps, Figma, Loom...',
        icon: '🌐',
        aliases: ['embed', 'iframe', 'youtube', 'הטמעה', 'וידאו'],
        command: ({ editor, range }) => {
          const url = window.prompt('הכנס URL להטמעה (YouTube, Maps, Figma...):');
          if (!url) return;
          editor.chain().focus().deleteRange(range).setEmbed({ url }).run();
        },
      },
    ],
  },
  {
    name: 'Advanced',
    nameHe: 'מתקדם',
    items: [
      {
        title: 'Table',
        titleHe: 'טבלה',
        description: 'טבלה עם עמודות ושורות',
        icon: '▦',
        aliases: ['table', 'טבלה', 'grid'],
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        },
      },
      {
        title: 'Callout — Info',
        titleHe: 'הודעה',
        description: 'בלוק מידע צבעוני',
        icon: 'ℹ️',
        aliases: ['callout', 'info', 'הודעה', 'מידע'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setCallout({ variant: 'info' }).run();
        },
      },
      {
        title: 'Callout — Warning',
        titleHe: 'אזהרה',
        description: 'בלוק אזהרה צבעוני',
        icon: '⚠️',
        aliases: ['warning', 'אזהרה', 'זהירות'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setCallout({ variant: 'warning', icon: '⚠️' }).run();
        },
      },
      {
        title: 'Callout — Tip',
        titleHe: 'טיפ',
        description: 'בלוק טיפ שימושי',
        icon: '💡',
        aliases: ['tip', 'טיפ', 'רמז'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setCallout({ variant: 'tip', icon: '💡' }).run();
        },
      },
      {
        title: 'Code Block',
        titleHe: 'קוד',
        description: 'בלוק קוד',
        icon: '{ }',
        aliases: ['code', 'קוד', 'codeblock'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setCodeBlock().run();
        },
      },
      {
        title: 'Quote',
        titleHe: 'ציטוט',
        description: 'בלוק ציטוט',
        icon: '❝',
        aliases: ['quote', 'blockquote', 'ציטוט'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setBlockquote().run();
        },
      },
      {
        title: 'Divider',
        titleHe: 'קו הפרדה',
        description: 'קו הפרדה אופקי',
        icon: '—',
        aliases: ['hr', 'divider', 'line', 'קו'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
    ],
  },
  {
    name: 'Fields',
    nameHe: 'שדות',
    items: [
      {
        title: 'Text Field',
        titleHe: 'שדה טקסט',
        description: 'שדה טקסט חופשי',
        icon: '📝',
        aliases: ['field', 'text', 'input', 'שדה', 'טקסט'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          window.dispatchEvent(new CustomEvent('cc-insert-field', { detail: { fieldType: 'short-text' } }));
        },
      },
      {
        title: 'Checkbox Field',
        titleHe: "צ'קבוקס",
        description: 'תיבת סימון כן/לא',
        icon: '☑️',
        aliases: ['checkbox', 'check', "צ'קבוקס", 'סימון'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          window.dispatchEvent(new CustomEvent('cc-insert-field', { detail: { fieldType: 'checkbox' } }));
        },
      },
      {
        title: 'Dropdown Field',
        titleHe: 'רשימה נפתחת',
        description: 'בחירה מרשימת אפשרויות',
        icon: '📋',
        aliases: ['dropdown', 'select', 'רשימה', 'נפתחת'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          window.dispatchEvent(new CustomEvent('cc-insert-field', { detail: { fieldType: 'dropdown' } }));
        },
      },
      {
        title: 'Date Field',
        titleHe: 'שדה תאריך',
        description: 'בורר תאריך',
        icon: '📅',
        aliases: ['date', 'calendar', 'תאריך', 'לוח שנה'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          window.dispatchEvent(new CustomEvent('cc-insert-field', { detail: { fieldType: 'date' } }));
        },
      },
      {
        title: 'Tags Field',
        titleHe: 'תגיות',
        description: 'תגיות עם צבעים',
        icon: '🏷️',
        aliases: ['tags', 'תגיות', 'labels'],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          window.dispatchEvent(new CustomEvent('cc-insert-field', { detail: { fieldType: 'tags' } }));
        },
      },
    ],
  },
];

// Flat list for backward compatibility
export const slashCommandItems: SlashCommandItem[] = slashCommandCategories.flatMap(
  (cat) => cat.items
);
