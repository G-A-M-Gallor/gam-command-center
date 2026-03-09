'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, X, Crown, Search, ChevronDown, ChevronRight,
  Bell, BellOff, Eye, Shield, Edit3, Trash2,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchStakeholders, addStakeholder, updateStakeholder, removeStakeholder,
  searchNotes,
} from '@/lib/supabase/entityQueries';
import { BUILTIN_ROLES, ACCESS_LEVELS } from '@/lib/entities/builtinRoles';
import type {
  NoteStakeholder, NoteStakeholderInsert,
  StakeholderRole, AccessLevel, NotifyLevel, NoteRecord, I18nLabel,
} from '@/lib/entities/types';

interface Props {
  noteId: string;
}

const NOTIFY_LABELS: Record<NotifyLevel, { he: string; en: string }> = {
  all: { he: 'הכל', en: 'All' },
  milestones: { he: 'אבני דרך', en: 'Milestones' },
  mentions: { he: 'אזכורים', en: 'Mentions' },
  none: { he: 'ללא', en: 'None' },
};

export function StakeholderPanel({ noteId }: Props) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const lang = isHe ? 'he' : 'en';
  const te = t.entities;

  const [stakeholders, setStakeholders] = useState<NoteStakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NoteRecord[]>([]);
  const [selectedContact, setSelectedContact] = useState<NoteRecord | null>(null);
  const [addRole, setAddRole] = useState<StakeholderRole>('participant');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadStakeholders = useCallback(async () => {
    setLoading(true);
    const data = await fetchStakeholders(noteId);
    setStakeholders(data);
    setLoading(false);
  }, [noteId]);

  useEffect(() => { loadStakeholders(); }, [loadStakeholders]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const results = await searchNotes(q);
    // Filter out notes already stakeholders + the note itself
    const existingIds = new Set(stakeholders.map(s => s.contact_note_id));
    existingIds.add(noteId);
    setSearchResults(results.filter(r => !existingIds.has(r.id)));
  }, [noteId, stakeholders]);

  const handleAdd = async () => {
    if (!selectedContact) return;
    const roleDef = BUILTIN_ROLES.find(r => r.role === addRole);
    await addStakeholder({
      note_id: noteId,
      contact_note_id: selectedContact.id,
      role: addRole,
      role_label: roleDef?.label ?? { he: '', en: '', ru: '' },
      access_level: roleDef?.defaultAccess ?? 'partial',
      is_primary: false,
      visible_fields: [],
      notify: roleDef?.defaultNotify ?? 'milestones',
      notify_channels: ['app'],
      notes: null,
    });
    setShowAdd(false);
    setSelectedContact(null);
    setSearchQuery('');
    setSearchResults([]);
    await loadStakeholders();
  };

  const handleUpdateAccess = async (id: string, level: AccessLevel) => {
    await updateStakeholder(id, { access_level: level });
    await loadStakeholders();
  };

  const handleUpdateNotify = async (id: string, notify: NotifyLevel) => {
    await updateStakeholder(id, { notify });
    await loadStakeholders();
  };

  const handleTogglePrimary = async (id: string, current: boolean) => {
    await updateStakeholder(id, { is_primary: !current });
    await loadStakeholders();
  };

  const handleRemove = async (id: string) => {
    await removeStakeholder(id);
    await loadStakeholders();
  };

  // Group stakeholders by role category
  const primaryStakeholders = stakeholders.filter(s => s.is_primary);
  const otherStakeholders = stakeholders.filter(s => !s.is_primary);

  return (
    <div
      data-cc-id="stakeholder-panel"
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.03] transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Users size={13} className="text-purple-400" />
        <span>{isHe ? 'בעלי עניין' : 'Stakeholders'}</span>
        <span className="text-[10px] text-slate-500 ms-auto">{stakeholders.length}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.04] space-y-3 pt-3">
          {/* Primary stakeholders */}
          {primaryStakeholders.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-medium text-yellow-400/80 uppercase tracking-wider">
                {isHe ? 'ראשיים' : 'Primary'}
              </span>
              {primaryStakeholders.map(s => (
                <StakeholderRow
                  key={s.id}
                  stakeholder={s}
                  lang={lang}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onTogglePrimary={handleTogglePrimary}
                  onUpdateAccess={handleUpdateAccess}
                  onUpdateNotify={handleUpdateNotify}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {/* Other stakeholders */}
          {otherStakeholders.length > 0 && (
            <div className="space-y-1.5">
              {primaryStakeholders.length > 0 && (
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">
                  {isHe ? 'נוספים' : 'Additional'}
                </span>
              )}
              {otherStakeholders.map(s => (
                <StakeholderRow
                  key={s.id}
                  stakeholder={s}
                  lang={lang}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onTogglePrimary={handleTogglePrimary}
                  onUpdateAccess={handleUpdateAccess}
                  onUpdateNotify={handleUpdateNotify}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {stakeholders.length === 0 && !loading && (
            <p className="text-[11px] text-slate-500 text-center py-2">
              {isHe ? 'אין בעלי עניין עדיין' : 'No stakeholders yet'}
            </p>
          )}

          {/* Add button */}
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Plus size={12} />
              {isHe ? 'הוסף בעל עניין' : 'Add stakeholder'}
            </button>
          ) : (
            <div className="space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
              {/* Search contact */}
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder={isHe ? 'חפש איש קשר...' : 'Search contact...'}
                className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
                autoFocus
              />

              {searchResults.length > 0 && !selectedContact && (
                <div className="max-h-28 overflow-y-auto rounded border border-white/[0.06] bg-slate-800">
                  {searchResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedContact(r); setSearchResults([]); }}
                      className="block w-full text-start px-2 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]"
                    >
                      {r.title}
                      {r.entity_type && <span className="text-[9px] text-slate-500 ms-1">({r.entity_type})</span>}
                    </button>
                  ))}
                </div>
              )}

              {selectedContact && (
                <div className="flex items-center gap-2 rounded bg-purple-500/10 px-2 py-1.5">
                  <span className="text-xs text-purple-300 flex-1">{selectedContact.title}</span>
                  <button onClick={() => setSelectedContact(null)} className="text-slate-500 hover:text-slate-300">
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* Role selection */}
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as StakeholderRole)}
                className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
              >
                {BUILTIN_ROLES.map(r => (
                  <option key={r.role} value={r.role}>
                    {r.label[lang as keyof I18nLabel] || r.role}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAdd(false); setSelectedContact(null); setSearchQuery(''); }}
                  className="flex-1 rounded border border-white/[0.08] py-1.5 text-xs text-slate-400 hover:bg-white/[0.04]"
                >
                  {te.cancel}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!selectedContact}
                  className="flex-1 rounded bg-purple-600 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-40"
                >
                  {te.add}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single Stakeholder Row ──────────────────────────
function StakeholderRow({
  stakeholder: s,
  lang,
  editingId,
  onEdit,
  onTogglePrimary,
  onUpdateAccess,
  onUpdateNotify,
  onRemove,
}: {
  stakeholder: NoteStakeholder;
  lang: string;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onTogglePrimary: (id: string, current: boolean) => void;
  onUpdateAccess: (id: string, level: AccessLevel) => void;
  onUpdateNotify: (id: string, level: NotifyLevel) => void;
  onRemove: (id: string) => void;
}) {
  const roleDef = BUILTIN_ROLES.find(r => r.role === s.role);
  const isEditing = editingId === s.id;
  const accessDef = ACCESS_LEVELS.find(a => a.level === s.access_level);

  return (
    <div className="group rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-2 px-2.5 py-2">
        {/* Primary indicator */}
        <button
          onClick={() => onTogglePrimary(s.id, s.is_primary)}
          className={`shrink-0 ${s.is_primary ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400/60'}`}
          title={s.is_primary ? 'Primary' : 'Set as primary'}
        >
          <Crown size={12} fill={s.is_primary ? 'currentColor' : 'none'} />
        </button>

        {/* Role badge */}
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
          style={{ backgroundColor: `${roleDef?.color ?? '#94a3b8'}20`, color: roleDef?.color ?? '#94a3b8' }}
        >
          {roleDef?.label[lang as keyof I18nLabel] || s.role}
        </span>

        {/* Contact name */}
        <a
          href={s.contact_entity_type
            ? `/dashboard/entities/${s.contact_entity_type}/${s.contact_note_id}`
            : `/dashboard/editor/${s.contact_note_id}`}
          className="text-xs text-slate-200 hover:text-purple-300 truncate flex-1"
        >
          {s.contact_title || s.contact_note_id}
        </a>

        {/* Quick indicators */}
        <span className="text-[9px] text-slate-600" title={accessDef?.label[lang as keyof I18nLabel]}>
          {s.access_level === 'full' ? <Shield size={10} className="text-emerald-400" /> :
           s.access_level === 'external' ? <Eye size={10} className="text-slate-500" /> :
           <Shield size={10} className="text-slate-500" />}
        </span>
        <span className="text-[9px] text-slate-600" title={NOTIFY_LABELS[s.notify]?.[lang as 'he' | 'en']}>
          {s.notify === 'none' ? <BellOff size={10} className="text-slate-600" /> :
           <Bell size={10} className={s.notify === 'all' ? 'text-purple-400' : 'text-slate-500'} />}
        </span>

        {/* Edit/Remove */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(isEditing ? null : s.id)}
            className="rounded p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
          >
            <Edit3 size={10} />
          </button>
          <button
            onClick={() => onRemove(s.id)}
            className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-white/[0.06]"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Expanded edit row */}
      {isEditing && (
        <div className="flex flex-wrap gap-2 px-2.5 pb-2.5 border-t border-white/[0.04] pt-2">
          <div>
            <label className="text-[9px] text-slate-500">{lang === 'he' ? 'גישה' : 'Access'}</label>
            <select
              value={s.access_level}
              onChange={e => onUpdateAccess(s.id, e.target.value as AccessLevel)}
              className="block rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-1 text-[10px] text-slate-300 mt-0.5"
            >
              {ACCESS_LEVELS.map(a => (
                <option key={a.level} value={a.level}>{a.label[lang as keyof I18nLabel]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-slate-500">{lang === 'he' ? 'עדכונים' : 'Notify'}</label>
            <select
              value={s.notify}
              onChange={e => onUpdateNotify(s.id, e.target.value as NotifyLevel)}
              className="block rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-1 text-[10px] text-slate-300 mt-0.5"
            >
              {(['all', 'milestones', 'mentions', 'none'] as NotifyLevel[]).map(n => (
                <option key={n} value={n}>{NOTIFY_LABELS[n]?.[lang as 'he' | 'en']}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
