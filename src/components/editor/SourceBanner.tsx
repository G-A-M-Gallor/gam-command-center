'use client';

import { MapPin, Bookmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SourceBannerProps {
  cardText: string;
  t: {
    storyMap: string;
    backToStoryMap: string;
  };
  /** Override the link destination (defaults to /dashboard/story-map) */
  linkHref?: string;
}

export function SourceBanner({ cardText, _t, linkHref }: SourceBannerProps) {
  const isExternal = linkHref && !linkHref.startsWith('/');
  const href = linkHref || '/dashboard/story-map';
  const Icon = linkHref ? Bookmark : MapPin;

  return (
    <div className="rounded-lg border-s-4 border-purple-500 bg-slate-800/50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
        <Icon className="h-3.5 w-3.5" />
        {t.storyMap}
      </div>
      <div className="mt-1.5 rounded bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
        &ldquo;{cardText}&rdquo;
      </div>
      <div className="mt-2 flex justify-end">
        {isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-purple-400"
          >
            {_t.backToStoryMap}
            <ArrowRight className="h-3 w-3" />
          </a>
        ) : (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-purple-400"
          >
            {_t.backToStoryMap}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
