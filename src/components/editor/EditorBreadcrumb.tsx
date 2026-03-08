'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface EditorBreadcrumbProps {
  storyMapLabel: string;
  epicText?: string;
  cardText: string;
}

export function EditorBreadcrumb({ storyMapLabel, epicText, cardText }: EditorBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500">
      <Link
        href="/dashboard/story-map"
        className="transition-colors hover:text-purple-400"
      >
        {storyMapLabel}
      </Link>
      {epicText && (
        <>
          <ChevronLeft className="h-3 w-3 rotate-180 rtl:rotate-0" />
          <span className="text-slate-400">{epicText}</span>
        </>
      )}
      <ChevronLeft className="h-3 w-3 rotate-180 rtl:rotate-0" />
      <span className="text-slate-300">{cardText}</span>
    </nav>
  );
}
