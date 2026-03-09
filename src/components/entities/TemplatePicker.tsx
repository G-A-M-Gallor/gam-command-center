'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Search, X, ExternalLink, Link2, Unlink, Loader2,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchLinkedTemplates, linkTemplate, unlinkTemplate,
  searchTemplates, createTemplate,
} from '@/lib/supabase/entityQueries';
import type { NoteRecord } from '@/lib/entities/types';

interface Props {
  noteId: string;
}

export function TemplatePicker({ noteId }: Props) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const te = t.entities;
  const isHe = language === 'he';

  const [linked, setLinked] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NoteRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const loadLinked = useCallback(async () => {
    setLoading(true);
    const templates = await fetchLinkedTemplates(noteId);
    setLinked(templates);
    setLoading(false);
  }, [noteId]);

  useEffect(() => { loadLinked(); }, [loadLinked]);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await searchTemplates(q);
    // Filter out already linked
    const linkedIds = new Set(linked.map(l => l.id));
    setResults(res.filter(r => !linkedIds.has(r.id)));
    setSearching(false);
  }, [linked]);

  const handleLink = async (templateId: string) => {
    await linkTemplate(noteId, templateId);
    setShowSearch(false);
    setQuery('');
    setResults([]);
    await loadLinked();
  };

  const handleUnlink = async (templateId: string) => {
    await unlinkTemplate(noteId, templateId);
    await loadLinked();
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const template = await createTemplate(newTitle.trim());
    if (template) {
      await linkTemplate(noteId, template.id);
      setCreating(false);
      setNewTitle('');
      await loadLinked();
    }
  };

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <FileText size={12} className="text-slate-400" />
          {te.templates}
          {linked.length > 0 && (
            <span className="text-[10px] text-slate-500">({linked.length})</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(s => !s)}
            className="rounded p-1 text-slate-500 hover:text-purple-400 hover:bg-white/[0.04] transition-colors"
            title={te.linkTemplate}
          >
            <Link2 size={12} />
          </button>
          <button
            onClick={() => setCreating(c => !c)}
            className="rounded p-1 text-slate-500 hover:text-purple-400 hover:bg-white/[0.04] transition-colors"
            title={te.createTemplate}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Create inline */}
      {creating && (
        <div className="px-4 py-2 border-b border-white/[0.04] space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder={isHe ? 'שם התבנית...' : language === 'ru' ? 'Название шаблона...' : 'Template name...'}
            className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="rounded bg-purple-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-purple-500 disabled:opacity-40"
            >
              {te.createTemplate}
            </button>
            <button
              onClick={() => { setCreating(false); setNewTitle(''); }}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Search to link existing */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-white/[0.04] space-y-1">
          <div className="relative">
            <Search size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder={te.browseTemplates}
              className="w-full rounded border border-white/[0.08] bg-white/[0.03] ps-7 pe-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={10} />
              </button>
            )}
          </div>
          {searching && (
            <div className="flex items-center gap-1 px-1 py-1 text-[10px] text-slate-500">
              <Loader2 size={10} className="animate-spin" />
            </div>
          )}
          {results.length > 0 && (
            <div className="max-h-32 overflow-y-auto">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleLink(r.id)}
                  className="flex items-center gap-2 w-full text-start px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                >
                  <FileText size={10} className="text-slate-500 shrink-0" />
                  <span className="flex-1 truncate">{r.title}</span>
                  <span className="text-[9px] text-slate-600 shrink-0">{r.record_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked templates */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={14} className="animate-spin text-slate-500" />
          </div>
        ) : linked.length === 0 ? (
          <p className="text-[11px] text-slate-600 py-2 text-center">{te.noTemplates}</p>
        ) : (
          <div className="space-y-1">
            {linked.map(tmpl => (
              <div
                key={tmpl.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white/[0.03] group transition-colors"
              >
                <FileText size={12} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300 flex-1 truncate">{tmpl.title}</span>
                <a
                  href={`/dashboard/editor?id=${tmpl.id}`}
                  className="shrink-0 rounded p-1 text-slate-600 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={te.openFullEditor}
                >
                  <ExternalLink size={10} />
                </a>
                <button
                  onClick={() => handleUnlink(tmpl.id)}
                  className="shrink-0 rounded p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={te.unlinkTemplate}
                >
                  <Unlink size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
