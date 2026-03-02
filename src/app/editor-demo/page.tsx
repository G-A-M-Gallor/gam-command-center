'use client';

// ===================================================
// GAM Command Center — Editor Demo Page V3
// Phase 2: Image, File, Table, Embed, Callout
// ===================================================

import { useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { TiptapEditor } from '@/components/editor';

const SAMPLE_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'עורך GAM — Phase 2 Demo' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '19 סוגי בלוקים, 5 קטגוריות Slash, צבעים, Block Handles — הכל עובד.' },
      ],
    },
    // === Callout examples ===
    {
      type: 'callout',
      attrs: { variant: 'info', icon: 'ℹ️' },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'מידע: ' },
            { type: 'text', text: 'הקלד / לתפריט עם כל סוגי הבלוקים. חפש בעברית או באנגלית.' },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { variant: 'tip', icon: '💡' },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'טיפ: ' },
            { type: 'text', text: 'העבר עכבר על בלוק כדי לראות את ⠿ (תפריט) ו-➕ (הוסף).' },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { variant: 'warning', icon: '⚠️' },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'אזהרה: ' },
            { type: 'text', text: 'תמונות וקבצים עובדים כרגע עם URL בלבד. Upload ל-R2 יתווסף בהמשך.' },
          ],
        },
      ],
    },
    { type: 'horizontalRule' },
    // === Image ===
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🖼️ תמונה' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'הקלד ' },
        { type: 'text', marks: [{ type: 'code' }], text: '/תמונה' },
        { type: 'text', text: ' והדבק URL:' },
      ],
    },
    {
      type: 'imageBlock',
      attrs: {
        src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        alt: 'בניין משרדים מודרני',
        caption: 'בניין משרדים — GAM Command Center',
        alignment: 'center',
      },
    },
    { type: 'horizontalRule' },
    // === File ===
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📎 קובץ' }],
    },
    {
      type: 'fileBlock',
      attrs: {
        url: 'https://example.com/contract.pdf',
        filename: 'חוזה_שירות_GAM_2026.pdf',
        size: '2.4 MB',
      },
    },
    {
      type: 'fileBlock',
      attrs: {
        url: 'https://example.com/report.xlsx',
        filename: 'דוח_רבעוני_Q1.xlsx',
        size: '840 KB',
      },
    },
    { type: 'horizontalRule' },
    // === Table ===
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '▦ טבלה' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'הקלד ' },
        { type: 'text', marks: [{ type: 'code' }], text: '/טבלה' },
        { type: 'text', text: ' ליצירת טבלה 3×3. גרור את הקצוות לשינוי רוחב עמודות.' },
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'שירות' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'מחיר' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'סטטוס' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'רישום קבלנים' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '₪1,200' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '✅ פעיל' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ביטוח פרויקט' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '₪3,500' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '⏳ בהמתנה' }] }] },
          ],
        },
      ],
    },
    { type: 'horizontalRule' },
    // === Embed ===
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🌐 הטמעה' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'הקלד ' },
        { type: 'text', marks: [{ type: 'code' }], text: '/הטמעה' },
        { type: 'text', text: ' והדבק URL של YouTube, Vimeo, Google Maps, Figma, או Loom.' },
      ],
    },
    { type: 'horizontalRule' },
    // === Toggle ===
    {
      type: 'details',
      attrs: { open: true },
      content: [
        {
          type: 'detailsSummary',
          attrs: { headingLevel: 2 },
          content: [{ type: 'text', text: 'כל 19 סוגי הבלוקים' }],
        },
        {
          type: 'detailsContent',
          content: [
            {
              type: 'taskList',
              content: [
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Paragraph, H1, H2, H3' }] }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet List, Numbered List, Checklist' }] }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Toggle, Toggle H1/H2/H3' }] }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Code Block, Quote, Divider' }] }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Image (URL), File (URL), Embed' }] }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Table (resizable), Callout (info/warning/tip)' }] }] },
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mention, Field Embed, AI Block (Phase 3)' }] }] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default function EditorDemoPage() {
  const [json, setJson] = useState<JSONContent>(SAMPLE_CONTENT);
  const [showJson, setShowJson] = useState(false);

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: 800,
        margin: '2rem auto',
        padding: '0 1.5rem',
        fontFamily: 'Rubik, system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        ✏️ Tiptap Editor — Phase 2 Demo
      </h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        19 blocks · 5 categories · Image · File · Table · Embed · Callout · Colors · RTL
      </p>

      <TiptapEditor
        content={SAMPLE_CONTENT}
        onChange={setJson}
        onSave={(data) => {
          console.log('💾 Saved:', data);
          alert('נשמר! (בדוק console)');
        }}
        autoFocus
      />

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setShowJson(!showJson)}
          style={{
            padding: '8px 16px',
            fontSize: '0.8125rem',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {showJson ? 'הסתר JSON' : 'הצג JSON'}
        </button>
      </div>

      {showJson && (
        <pre
          dir="ltr"
          style={{
            marginTop: '0.75rem',
            padding: '1rem',
            background: '#0f172a',
            color: '#a5b4fc',
            borderRadius: '8px',
            fontSize: '0.75rem',
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(json, null, 2)}
        </pre>
      )}
    </div>
  );
}
