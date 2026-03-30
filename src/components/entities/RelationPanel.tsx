'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link2, _Plus, _X, Search, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import {
  fetchEntityConnections, fetchNoteRelations, fetchNoteInfoBatch,
  createNoteRelation, deleteNoteRelation, searchNotes,
} from '@/lib/supabase/entityQueries';
import type { EntityConnection, NoteRelation, NoteRecord, I18nLabel } from '@/lib/entities/types';

interface RelationPanelProps {
  noteId: string;
  entityType: string;
  language: string;
}

// A resolved relation with enriched info
interface ResolvedRelation {
  relationId: string;          // note_relations.id
  linkedNoteId: string;        // the other note's id
  linkedTitle: string;
  linkedEntityType: string | null;
  connectionId: string;        // entity_connections.id
  direction: 'forward' | 'reverse';
}

// A group of relations under one connection definition
interface RelationGroup {
  connection: EntityConnection;
  direction: 'forward' | 'reverse';
  label: string;
  targetType: string;
  items: ResolvedRelation[];
}

export function RelationPanel({ noteId, entityType }: RelationPanelProps) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const isRtl = language === 'he';
  const lang = (language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en') as keyof I18nLabel;
  const te = t.entities;

  const [connections, setConnections] = useState<EntityConnection[]>([]);
  const [relations, setRelations] = useState<NoteRelation[]>([]);
  const [groups, setGroups] = useState<RelationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  // Add-flow state: which group is in add mode
  const [addingGroupKey, setAddingGroupKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NoteRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load connections + relations
  const loadData = useCallback(async () => {
    setLoading(true);
    const [conns, rels] = await Promise.all([
      fetchEntityConnections(),
      fetchNoteRelations(noteId),
    ]);
    setConnections(conns);
    setRelations(rels);
    setLoading(false);
  }, [noteId]);
  useEffect(() => { loadData(); }, [loadData]);

  // Build groups whenever connections/relations change
  useEffect(() => {
    if (connections.length === 0) {
      setGroups([]);
      return;
    }

    // Find connections relevant to this entity type
    const relevantConns = connections.filter(
      c => c.source_type === entityType || c.target_type === entityType
    );

    // Collect all linked note IDs to batch-fetch
    const linkedNoteIds = new Set<string>();
    for (const rel of relations) {
      if (rel.source_id === noteId) linkedNoteIds.add(rel.target_id);
      else linkedNoteIds.add(rel.source_id);
    }

    // Enrich and group
    (async () => {
      const noteInfo = await fetchNoteInfoBatch(Array.from(linkedNoteIds));

      const builtGroups: RelationGroup[] = [];

      for (const conn of relevantConns) {
        const isForward = conn.source_type === entityType;
        const direction = isForward ? 'forward' as const : 'reverse' as const;
        const label = isForward
          ? (conn.relation_label[lang] || conn.relation_label.en)
          : (conn.reverse_label[lang] || conn.reverse_label.en);
        const targetType = isForward ? conn.target_type : conn.source_type;

        // Match relations to this connection definition
        const items: ResolvedRelation[] = [];
        for (const rel of relations) {
          // relation_type stores the connection id
          if (rel.relation_type !== conn.id) continue;

          const linkedId = rel.source_id === noteId ? rel.target_id : rel.source_id;
          const info = noteInfo[linkedId];
          items.push({
            relationId: rel.id,
            linkedNoteId: linkedId,
            linkedTitle: info?.title ?? linkedId,
            linkedEntityType: info?.entity_type ?? null,
            connectionId: conn.id,
            direction,
          });
        }

        builtGroups.push({ connection: conn, direction, label, targetType, items });
      }

      setGroups(builtGroups);
    })();
  }, [connections, relations, entityType, noteId, lang]);

  // Search for notes to link
  const handleSearch = useCallback(async (q: string, targetEntityType: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchNotes(q, targetEntityType);
    // Filter out the current note and already-linked notes in this group
    const existingLinkedIds = new Set(
      relations
        .map(r => r.source_id === noteId ? r.target_id : r.source_id)
    );
    existingLinkedIds.add(noteId);
    setSearchResults(results.filter(r => !existingLinkedIds.has(r.id)));
    setSearching(false);
  }, [noteId, relations]);

  // Create a new relation
  const handleLink = async (targetNoteId: string, connectionId: string, direction: 'forward' | 'reverse') => {
    const sourceId = direction === 'forward' ? noteId : targetNoteId;
    const targetId = direction === 'forward' ? targetNoteId : noteId;
    await createNoteRelation(sourceId, targetId, connectionId);
    // Reset add state
    setAddingGroupKey(null);
    setSearchQuery('');
    setSearchResults([]);
    // Refresh
    const rels = await fetchNoteRelations(noteId);
    setRelations(rels);
  };

  // Remove a relation (optimistic)
  const handleUnlink = async (relationId: string) => {
    // Optimistic: remove from local state immediately
    setRelations(prev => prev.filter(r => r.id !== relationId));
    await deleteNoteRelation(relationId);
  };

  // Open add mode for a specific group
  const openAddMode = (groupKey: string) => {
    setAddingGroupKey(groupKey);
    setSearchQuery('');
    setSearchResults([]);
    // Focus the search input after render
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeAddMode = () => {
    setAddingGroupKey(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const groupKey = (g: RelationGroup) => `${g.connection.id}-${g.direction}`;
  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div
      data-cc-id="relation-panel"
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.03] transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Link2 size={13} className="text-purple-400" />
        <span>{te.relations}</span>
        <span className="text-[10px] text-slate-500 ms-auto">{totalCount}</span>
      </button>

      {expanded && (
        <div className="border-_t border-white/[0.04]">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin text-slate-500" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-4 px-4">
              {te.noRelations}
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {groups.map(group => {
                const gk = groupKey(group);
                const isAdding = addingGroupKey === gk;

                return (
                  <div key={gk} className="px-4 py-3 space-y-2">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                        {group.label}
                        {group.items.length > 0 && (
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-slate-500">
                            {group.items.length}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => isAdding ? closeAddMode() : openAddMode(gk)}
                        className="rounded p-1 text-slate-500 hover:text-purple-400 hover:bg-white/[0.04] transition-colors"
                        title={te.addRelation}
                      >
                        {isAdding ? <X size={12} /> : <Plus size={12} />}
                      </button>
                    </div>

                    {/* Linked items */}
                    {group.items.length > 0 && (
                      <div className="space-y-1">
                        {group.items.map(item => (
                          <div
                            key={item.relationId}
                            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white/[0.03] group transition-colors"
                          >
                            <Link2 size={10} className="text-slate-600 shrink-0" />
                            <a
                              href={item.linkedEntityType
                                ? `/dashboard/entities/${item.linkedEntityType}/${item.linkedNoteId}`
                                : `/dashboard/editor/${item.linkedNoteId}`}
                              className="text-xs text-slate-200 hover:text-purple-300 truncate flex-1"
                            >
                              {item.linkedTitle}
                            </a>
                            {item.linkedEntityType && (
                              <span className="shrink-0 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500">
                                {item.linkedEntityType}
                              </span>
                            )}
                            <button
                              onClick={() => handleUnlink(item.relationId)}
                              className="shrink-0 rounded p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={te.removeRelation}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add search inline */}
                    {isAdding && (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value, group.targetType)}
                            placeholder={te.searchToLinkRelation}
                            className="w-full rounded border border-white/[0.08] bg-white/[0.03] ps-7 pe-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
                            autoFocus
                          />
                          {searchQuery && (
                            <button
                              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
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
                        {searchResults.length > 0 && (
                          <div className="max-h-32 overflow-y-auto rounded border border-white/[0.06] bg-slate-800">
                            {searchResults.map(r => (
                              <button
                                key={r.id}
                                onClick={() => handleLink(r.id, group.connection.id, group.direction)}
                                className="flex items-center gap-2 w-full text-start px-2 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
                              >
                                <Link2 size={10} className="text-slate-500 shrink-0" />
                                <span className="flex-1 truncate">{r.title}</span>
                                {r.entity_type && (
                                  <span className="text-[9px] text-slate-500 shrink-0">({r.entity_type})</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                          <p className="text-[10px] text-slate-600 px-1">{_t.common.noResults}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
