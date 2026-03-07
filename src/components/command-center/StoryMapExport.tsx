'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileJson, FileText, Image } from 'lucide-react';
import type { StoryCard } from '@/lib/supabase/storyCardQueries';
import { ESTIMATIONS } from '@/components/command-center/StoryCard';

interface StoryMapExportProps {
  cards: StoryCard[];
  boardRef: React.RefObject<HTMLDivElement | null>;
  t: {
    export: string;
    exportJSON: string;
    exportMarkdown: string;
    exportPNG: string;
    exporting: string;
  };
}

export function StoryMapExport({ cards, boardRef, t }: StoryMapExportProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'story-map.json');
    setOpen(false);
  };

  const exportMarkdown = () => {
    const colMap = new Map<number, StoryCard[]>();
    for (const card of cards) {
      if (!colMap.has(card.col)) colMap.set(card.col, []);
      colMap.get(card.col)!.push(card);
    }

    let md = '# Story Map\n\n';

    const sortedCols = [...colMap.keys()].sort((a, b) => a - b);
    for (const col of sortedCols) {
      const colCards = colMap.get(col)!;
      const epic = colCards.find((c) => c.type === 'epic');
      const nonEpics = colCards
        .filter((c) => c.type !== 'epic')
        .sort((a, b) => a.sort_order - b.sort_order);

      md += `## ${epic?.text || `Column ${col + 1}`}\n\n`;

      for (const card of nonEpics) {
        const estLabel = card.estimation
          ? ` [${card.estimation}]`
          : '';

        if (card.type === 'feature') {
          md += `### ${card.text}${estLabel}\n\n`;
        } else {
          md += `- ${card.text}${estLabel}\n`;

          // Sub-stories as checklist
          if (card.subs && card.subs.length > 0) {
            for (const sub of card.subs) {
              md += `  - [${sub.done ? 'x' : ' '}] ${sub.text}\n`;
            }
          }
        }
      }
      md += '\n';
    }

    // Points summary
    const totalPoints = cards.reduce((sum, c) => {
      if (c.estimation) {
        const est = ESTIMATIONS.find((e) => e.id === c.estimation);
        return sum + (est?.points || 0);
      }
      return sum;
    }, 0);

    if (totalPoints > 0) {
      md += `---\n\n**Total Points:** ${totalPoints}\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, 'story-map.md');
    setOpen(false);
  };

  const exportPNG = async () => {
    if (!boardRef.current) return;
    setExporting(true);
    setOpen(false);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, 'story-map.png');
        setExporting(false);
      });
    } catch {
      setExporting(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-slate-100 transition-colors disabled:opacity-50"
      >
        {exporting ? (
          <span className="animate-pulse">{t.exporting}</span>
        ) : (
          <>
            <Download size={13} />
            {t.export}
            <ChevronDown size={12} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
          <button
            onClick={exportJSON}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50"
          >
            <FileJson size={14} className="text-blue-400" />
            {t.exportJSON}
          </button>
          <button
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50"
          >
            <FileText size={14} className="text-emerald-400" />
            {t.exportMarkdown}
          </button>
          <button
            onClick={exportPNG}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50"
          >
            <Image size={14} className="text-purple-400" />
            {t.exportPNG}
          </button>
        </div>
      )}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
