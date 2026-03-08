'use client';

import { useMemo } from 'react';
import type { EntityType, EntityConnection } from '@/lib/entities/types';

interface Props {
  types: EntityType[];
  connections: EntityConnection[];
  language: string;
}

export function ConnectionDiagram({ types, connections, language }: Props) {
  const lang = language === 'he' ? 'he' : 'en';

  const mermaid = useMemo(() => {
    const lines = ['graph LR'];

    for (const t of types) {
      const label = t.label[lang] || t.slug;
      lines.push(`  ${t.slug}["${t.icon} ${label}"]`);
    }

    for (const c of connections) {
      const label = c.relation_label[lang] || '';
      lines.push(`  ${c.source_type} -->|${label}| ${c.target_type}`);
    }

    return lines.join('\n');
  }, [types, connections, lang]);

  // Simple visual representation without Mermaid dependency
  if (connections.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        {lang === 'he' ? 'אין חיבורים מוגדרים' : 'No connections defined'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">
        {lang === 'he' ? 'דיאגרמת קשרים' : 'Connection Diagram'}
      </h3>

      {/* Visual nodes */}
      <div className="flex flex-wrap gap-6 justify-center py-4">
        {types.map(t => {
          const typeConns = connections.filter(c => c.source_type === t.slug || c.target_type === t.slug);
          return (
            <div
              key={t.slug}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 min-w-[80px]"
              style={{ borderColor: `${t.color}40` }}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-medium text-slate-300">{t.label[lang] || t.slug}</span>
              <span className="text-[9px] text-slate-500">{typeConns.length} {lang === 'he' ? 'קשרים' : 'links'}</span>
            </div>
          );
        })}
      </div>

      {/* Connection list */}
      <div className="space-y-1">
        {connections.map(c => {
          const sourceType = types.find(t => t.slug === c.source_type);
          const targetType = types.find(t => t.slug === c.target_type);
          return (
            <div key={c.id} className="flex items-center gap-2 text-xs text-slate-400 px-2">
              <span style={{ color: sourceType?.color ?? undefined }}>
                {sourceType?.icon} {sourceType?.label[lang] || c.source_type}
              </span>
              <span className="text-slate-600">—{c.relation_label[lang] || c.relation_kind}→</span>
              <span style={{ color: targetType?.color ?? undefined }}>
                {targetType?.icon} {targetType?.label[lang] || c.target_type}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mermaid code for reference */}
      <details className="group">
        <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-400">
          Mermaid
        </summary>
        <pre className="mt-1 overflow-x-auto rounded bg-white/[0.03] p-2 text-[10px] text-slate-500 font-mono">
          {mermaid}
        </pre>
      </details>
    </div>
  );
}
