"use client";

import { useState } from 'react';
import { ExternalLink, MessageCircle, Maximize2, Minimize2 } from 'lucide-react';

interface WATIEmbedWidgetProps {
  className?: string;
}

export function WATIEmbedWidget({ className }: WATIEmbedWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const watiUrl = process.env.NEXT_PUBLIC_WATI_URL || 'https://app.wati.io';

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-green-400" />
          <h3 className="text-sm font-medium text-slate-200">WATI Dashboard</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <a
            href={watiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* WATI Embed */}
      <div className={`${isExpanded ? 'h-96' : 'h-64'} transition-all duration-200`}>
        <iframe
          src={watiUrl}
          className="w-full h-full rounded-b-lg"
          title="WATI Dashboard"
          allow="microphone; camera"
        />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-slate-700 bg-slate-800/50 rounded-b-lg">
        <div className="flex gap-1 text-xs">
          <button className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-500">
            Quick Send
          </button>
          <button className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500">
            Templates
          </button>
          <button className="px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-500">
            Contacts
          </button>
        </div>
      </div>
    </div>
  );
}