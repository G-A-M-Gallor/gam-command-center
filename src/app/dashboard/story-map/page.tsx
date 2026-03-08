'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wifi, WifiOff } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useShortcuts } from '@/contexts/ShortcutsContext';
import { getTranslations } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/command-center/PageHeader';

const StoryBoard = dynamic(
  () => import('@/components/command-center/StoryBoard').then((m) => ({ default: m.StoryBoard })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-96 bg-slate-800/50 rounded-lg" />,
  }
);

const StoryMapFilterBar = dynamic(
  () => import('@/components/command-center/StoryMapFilterBar').then((m) => ({ default: m.StoryMapFilterBar })),
  { ssr: false }
);

const StoryMapStats = dynamic(
  () => import('@/components/command-center/StoryMapStats').then((m) => ({ default: m.StoryMapStats })),
  { ssr: false }
);

const StoryMapExport = dynamic(
  () => import('@/components/command-center/StoryMapExport').then((m) => ({ default: m.StoryMapExport })),
  { ssr: false }
);
import { supabase } from '@/lib/supabaseClient';
import {
  fetchStoryCards,
  createStoryCard,
  updateStoryCard,
  deleteStoryCard,
  deleteColumn as deleteColumnDb,
  batchUpdatePositions,
} from '@/lib/supabase/storyCardQueries';
import { createStoryNote } from '@/lib/supabase/editorQueries';
import {
  subscribeToStoryCards,
  unsubscribeFromStoryCards,
} from '@/lib/supabase/storyCardRealtime';
import type { StoryCard } from '@/lib/supabase/storyCardQueries';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Demo cards with 3-tier structure ───────────────
function makeDemoCards(): StoryCard[] {
  const now = new Date().toISOString();
  const epics = ['תכנון', 'פיתוח', 'בדיקות', 'הפצה'];
  const epicColors = ['purple', 'blue', 'emerald', 'amber'];

  // Per-column: features and their stories (stories grouped by feature index)
  const columnData: { features: string[]; stories: [string, number][] }[] = [
    {
      features: ['ניתוח'],
      stories: [['הגדרת דרישות', 0], ['תכנון ארכיטקטורה', 0]],
    },
    {
      features: ['Frontend', 'Backend'],
      stories: [['קומפוננטות UI', 0], ['ניתוב עמודים', 0], ['חיבור API', 1], ['אוטנטיקציה', 1]],
    },
    {
      features: ['אוטומטי', 'ידני'],
      stories: [['בדיקות יחידה', 0], ['בדיקות E2E', 0], ['בדיקות קבלה', 1]],
    },
    {
      features: ['DevOps'],
      stories: [['CI/CD', 0], ['תיעוד', 0], ['הדרכת משתמשים', 0]],
    },
  ];

  const cards: StoryCard[] = [];

  epics.forEach((text, col) => {
    cards.push({
      id: `demo-epic-${col}`,
      project_id: 'demo',
      col,
      row: 0,
      text,
      type: 'epic',
      color: epicColors[col],
      subs: [],
      sort_order: 0,
      notes: '',
      diagram: '',
      estimation: null,
      note_id: null,
      created_at: now,
    });
  });

  columnData.forEach(({ features, stories }, col) => {
    let sortOrder = 0;

    features.forEach((featureText, fi) => {
      // Feature card
      cards.push({
        id: `demo-feature-${col}-${fi}`,
        project_id: 'demo',
        col,
        row: 1,
        text: featureText,
        type: 'feature',
        color: null,
        subs: [],
        sort_order: sortOrder++,
        notes: '',
        diagram: '',
        estimation: 'M',
        note_id: null,
        created_at: now,
      });

      // Stories belonging to this feature
      stories
        .filter(([, featureIdx]) => featureIdx === fi)
        .forEach(([storyText]) => {
          cards.push({
            id: `demo-story-${col}-${sortOrder}`,
            project_id: 'demo',
            col,
            row: 1,
            text: storyText,
            type: 'story',
            color: null,
            subs: [],
            sort_order: sortOrder++,
            notes: '',
            diagram: '',
            estimation: ['XS', 'S', 'M', 'L', null][Math.floor(Math.random() * 5)],
            note_id: null,
            created_at: now,
          });
        });
    });
  });

  return cards;
}

// ─── Inner content (needs Suspense for useSearchParams) ─
function StoryMapContent() {
  const { language } = useSettings();
  const { setCurrentScope } = useShortcuts();
  const t = getTranslations(language);
  // Memoize storyMap translations so StoryBoard memo works effectively
  const storyMapT = useMemo(() => t.storyMap, [language]);
  const isRtl = language === 'he';
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProjectState] = useState<string>(
    searchParams.get('project') || ''
  );

  const setSelectedProject = useCallback((projectId: string) => {
    setSelectedProjectState(projectId);
    if (projectId) {
      router.replace(`/dashboard/story-map?project=${projectId}`, { scroll: false });
    } else {
      router.replace('/dashboard/story-map', { scroll: false });
    }
  }, [router]);
  const [cards, setCards] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(['epic', 'feature', 'story']));
  const [colorFilter, setColorFilter] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingIds = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // ── Scope management — activate card_browser on mount ──
  useEffect(() => {
    setCurrentScope('card_browser');
    return () => setCurrentScope('global');
  }, [setCurrentScope]);

  // ── Load projects ──────────────────────────────────
  useEffect(() => {
    async function loadProjects() {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (data && data.length > 0) {
        setProjects(data);
      }
      setLoading(false);
    }
    loadProjects();
  }, []);

  // ── Load cards when project changes ────────────────
  useEffect(() => {
    if (!selectedProject) {
      setCards(makeDemoCards());
      setIsDemo(true);
      setRealtimeStatus('disconnected');
      return;
    }

    setIsDemo(false);
    setLoading(true);
    fetchStoryCards(selectedProject).then((data) => {
      setCards(data);
      setLoading(false);
    });
  }, [selectedProject]);

  // ── Realtime subscription ───────────────────────────
  useEffect(() => {
    if (!selectedProject || isDemo) {
      if (channelRef.current) {
        unsubscribeFromStoryCards(channelRef.current);
        channelRef.current = null;
        setRealtimeStatus('disconnected');
      }
      return;
    }

    setRealtimeStatus('connecting');

    const channel = subscribeToStoryCards(selectedProject, {
      onInsert: (card) => {
        // Skip if we initiated this insert
        if (pendingIds.current.has(card.id)) {
          pendingIds.current.delete(card.id);
          return;
        }
        setCards((prev) => {
          if (prev.some((c) => c.id === card.id)) return prev;
          return [...prev, card];
        });
      },
      onUpdate: (card) => {
        if (pendingIds.current.has(card.id)) {
          pendingIds.current.delete(card.id);
          return;
        }
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, ...card } : c))
        );
      },
      onDelete: (id) => {
        if (pendingIds.current.has(id)) {
          pendingIds.current.delete(id);
          return;
        }
        setCards((prev) => prev.filter((c) => c.id !== id));
      },
    });

    channelRef.current = channel;

    // Track connection status
    channel.on('system', {}, (payload) => {
      if ('status' in payload) {
        if (payload.status === 'ok') setRealtimeStatus('connected');
        else setRealtimeStatus('disconnected');
      }
    });

    // Set connected after short delay (subscription setup)
    const timer = setTimeout(() => setRealtimeStatus('connected'), 1000);

    return () => {
      clearTimeout(timer);
      // Clear pending debounce timers to prevent stale writes after project switch
      debounceTimers.current.forEach((t) => clearTimeout(t));
      debounceTimers.current.clear();
      unsubscribeFromStoryCards(channel);
      channelRef.current = null;
      setRealtimeStatus('disconnected');
    };
  }, [selectedProject, isDemo]);

  // ── Card operations ────────────────────────────────
  const handleUpdateCard = useCallback(
    (id: string, updates: Partial<StoryCard>) => {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      if (isDemo) return;

      pendingIds.current.add(id);
      const existing = debounceTimers.current.get(id);
      if (existing) clearTimeout(existing);
      debounceTimers.current.set(
        id,
        setTimeout(() => {
          const { text, col, row, color, subs, sort_order, notes, diagram, estimation, note_id } = { ...updates } as Partial<StoryCard>;
          updateStoryCard(id, { text, col, row, color, subs, sort_order, notes, diagram, estimation, note_id });
          debounceTimers.current.delete(id);
        }, 500)
      );
    },
    [isDemo]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (!isDemo) {
        pendingIds.current.add(id);
        deleteStoryCard(id);
      }
    },
    [isDemo]
  );

  const handleAddEpic = useCallback(() => {
    const maxCol = cards.reduce((max, c) => Math.max(max, c.col), -1);
    const newCol = maxCol + 1;
    const epicText = language === 'he' ? `אפיק ${newCol + 1}` : `Epic ${newCol + 1}`;

    const newCard: StoryCard = {
      id: isDemo ? `demo-epic-${Date.now()}` : crypto.randomUUID(),
      project_id: selectedProject || 'demo',
      col: newCol,
      row: 0,
      text: epicText,
      type: 'epic',
      color: null,
      subs: [],
      sort_order: 0,
      notes: '',
      diagram: '',
      estimation: null,
      note_id: null,
      created_at: new Date().toISOString(),
    };

    setCards((prev) => [...prev, newCard]);

    if (!isDemo && selectedProject) {
      createStoryCard({
        project_id: selectedProject,
        col: newCol,
        row: 0,
        text: epicText,
        type: 'epic',
        color: null,
        subs: [],
        sort_order: 0,
      }).then((saved) => {
        if (saved) {
          pendingIds.current.add(saved.id);
          setCards((prev) =>
            prev.map((c) => (c.id === newCard.id ? { ...c, id: saved.id } : c))
          );
        }
      });
    }
  }, [cards, isDemo, selectedProject, language]);

  // ── Add Feature (B layer) ─────────────────────────
  const handleAddFeature = useCallback(
    (col: number) => {
      const colNonEpics = cards.filter((c) => c.col === col && c.type !== 'epic');
      const nextOrder = colNonEpics.length;
      const featureText = language === 'he' ? 'פיצ׳ר חדש' : 'New Feature';

      const newCard: StoryCard = {
        id: isDemo ? `demo-feature-${Date.now()}` : crypto.randomUUID(),
        project_id: selectedProject || 'demo',
        col,
        row: 1,
        text: featureText,
        type: 'feature',
        color: null,
        subs: [],
        sort_order: nextOrder,
        notes: '',
        diagram: '',
        estimation: null,
        note_id: null,
        created_at: new Date().toISOString(),
      };

      setCards((prev) => [...prev, newCard]);

      if (!isDemo && selectedProject) {
        createStoryCard({
          project_id: selectedProject,
          col,
          row: 1,
          text: featureText,
          type: 'feature',
          color: null,
          subs: [],
          sort_order: nextOrder,
        }).then((saved) => {
          if (saved) {
            pendingIds.current.add(saved.id);
            setCards((prev) =>
              prev.map((c) => (c.id === newCard.id ? { ...c, id: saved.id } : c))
            );
          }
        });
      }
    },
    [cards, isDemo, selectedProject, language]
  );

  // ── Add Story (with featureId for positional insert) ──
  const handleAddStory = useCallback(
    (col: number, featureId: string | null) => {
      const colNonEpics = cards
        .filter((c) => c.col === col && c.type !== 'epic')
        .sort((a, b) => a.sort_order - b.sort_order);

      let insertAt: number;

      if (featureId === null) {
        // Ungrouped — append at end
        insertAt = colNonEpics.length;
      } else {
        // Find the feature, walk forward past its stories
        const featureIdx = colNonEpics.findIndex((c) => c.id === featureId);
        if (featureIdx === -1) {
          insertAt = colNonEpics.length;
        } else {
          let endIdx = featureIdx + 1;
          while (endIdx < colNonEpics.length && colNonEpics[endIdx].type === 'story') {
            endIdx++;
          }
          insertAt = endIdx;
        }
      }

      const storyText = language === 'he' ? 'סיפור חדש' : 'New story';

      // Shift cards at >= insertAt up by 1
      setCards((prev) => {
        const updated = prev.map((c) => {
          if (c.col === col && c.type !== 'epic' && c.sort_order >= insertAt) {
            return { ...c, sort_order: c.sort_order + 1 };
          }
          return c;
        });

        const newCard: StoryCard = {
          id: isDemo ? `demo-story-${Date.now()}` : crypto.randomUUID(),
          project_id: selectedProject || 'demo',
          col,
          row: 1,
          text: storyText,
          type: 'story',
          color: null,
          subs: [],
          sort_order: insertAt,
          notes: '',
          diagram: '',
          estimation: null,
          note_id: null,
          created_at: new Date().toISOString(),
        };

        if (!isDemo && selectedProject) {
          // Persist shifted cards
          const shifted = colNonEpics
            .filter((c) => c.sort_order >= insertAt)
            .map((c) => ({ id: c.id, col, sort_order: c.sort_order + 1 }));
          if (shifted.length > 0) batchUpdatePositions(shifted);

          // Create new card
          createStoryCard({
            project_id: selectedProject,
            col,
            row: 1,
            text: storyText,
            type: 'story',
            color: null,
            subs: [],
            sort_order: insertAt,
          }).then((saved) => {
            if (saved) {
              setCards((p) =>
                p.map((c) => (c.id === newCard.id ? { ...c, id: saved.id } : c))
              );
            }
          });
        }

        return [...updated, newCard];
      });
    },
    [cards, isDemo, selectedProject, language]
  );

  const handleDeleteColumn = useCallback(
    (col: number) => {
      setCards((prev) => {
        return prev
          .filter((c) => c.col !== col)
          .map((c) => (c.col > col ? { ...c, col: c.col - 1 } : c));
      });

      if (!isDemo && selectedProject) {
        deleteColumnDb(selectedProject, col);
        const higherCards = cards.filter((c) => c.col > col);
        if (higherCards.length > 0) {
          batchUpdatePositions(
            higherCards.map((c) => ({ id: c.id, col: c.col - 1, sort_order: c.sort_order }))
          );
        }
      }
    },
    [cards, isDemo, selectedProject]
  );

  const handleBatchUpdate = useCallback(
    (updates: { id: string; col: number; sort_order: number }[]) => {
      if (!isDemo) {
        updates.forEach((u) => pendingIds.current.add(u.id));
        batchUpdatePositions(updates);
      }
    },
    [isDemo]
  );

  // ── Open note in editor ──────────────────────────
  const handleOpenNote = useCallback(
    async (card: StoryCard) => {
      // If card already has a linked note, navigate directly
      if (card.note_id) {
        router.push(`/dashboard/editor?id=${card.note_id}`);
        return;
      }

      // Demo mode — just navigate to editor
      if (isDemo) {
        router.push('/dashboard/editor');
        return;
      }

      // Create a new story note
      const note = await createStoryNote({
        id: card.id,
        text: card.text,
        project_id: card.project_id,
        type: card.type,
        col: card.col,
      });

      if (note) {
        // Update the card locally + in DB with the note_id
        handleUpdateCard(card.id, { note_id: note.id });
        router.push(`/dashboard/editor?id=${note.id}`);
      }
    },
    [isDemo, router, handleUpdateCard]
  );

  // ── Filtered cards (visual only) ──────────────────
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Type filter
      if (!typeFilter.has(card.type)) return false;
      // Color filter (if any selected, only show matching; uncolored cards pass when no color filter)
      if (colorFilter.size > 0) {
        if (!card.color || !colorFilter.has(card.color)) return false;
      }
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchText = card.text.toLowerCase().includes(q);
        const matchSubs = (card.subs || []).some((s) => s.text.toLowerCase().includes(q));
        if (!matchText && !matchSubs) return false;
      }
      return true;
    });
  }, [cards, searchQuery, typeFilter, colorFilter]);

  // ── Card navigation + filter shortcut listeners ────
  useEffect(() => {
    const handleCardNext = () => {
      setSelectedCardId((prev) => {
        const ids = filteredCards.map((c) => c.id);
        if (ids.length === 0) return null;
        if (!prev) return ids[0];
        const idx = ids.indexOf(prev);
        return ids[(idx + 1) % ids.length];
      });
    };
    const handleCardPrev = () => {
      setSelectedCardId((prev) => {
        const ids = filteredCards.map((c) => c.id);
        if (ids.length === 0) return null;
        if (!prev) return ids[ids.length - 1];
        const idx = ids.indexOf(prev);
        return ids[(idx - 1 + ids.length) % ids.length];
      });
    };
    const handleCardOpen = () => {
      if (!selectedCardId) return;
      const el = document.querySelector<HTMLElement>(`[data-card-id="${selectedCardId}"]`);
      if (el) el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    };
    const handleCardExpand = () => {
      if (!selectedCardId) return;
      const el = document.querySelector<HTMLElement>(`[data-card-id="${selectedCardId}"]`);
      if (el) {
        const notesBtn = el.querySelector<HTMLButtonElement>('button[title]');
        if (notesBtn) notesBtn.click();
      }
    };
    const handleFilterToggle = () => {
      filterInputRef.current?.focus();
    };
    const handleFilterClear = () => {
      setSearchQuery('');
      setTypeFilter(new Set(['epic', 'feature', 'story']));
      setColorFilter(new Set());
    };

    window.addEventListener('cc-card-next', handleCardNext);
    window.addEventListener('cc-card-prev', handleCardPrev);
    window.addEventListener('cc-card-open', handleCardOpen);
    window.addEventListener('cc-card-expand', handleCardExpand);
    window.addEventListener('cc-filter-toggle', handleFilterToggle);
    window.addEventListener('cc-filter-clear', handleFilterClear);
    return () => {
      window.removeEventListener('cc-card-next', handleCardNext);
      window.removeEventListener('cc-card-prev', handleCardPrev);
      window.removeEventListener('cc-card-open', handleCardOpen);
      window.removeEventListener('cc-card-expand', handleCardExpand);
      window.removeEventListener('cc-filter-toggle', handleFilterToggle);
      window.removeEventListener('cc-filter-clear', handleFilterClear);
    };
  }, [filteredCards, selectedCardId]);

  // ── Highlight + scroll selected card ───────────────
  useEffect(() => {
    document.querySelectorAll('[data-card-id].ring-2').forEach((el) => {
      el.classList.remove('ring-2', 'ring-purple-500/70');
    });
    if (!selectedCardId) return;
    const el = document.querySelector<HTMLElement>(`[data-card-id="${selectedCardId}"]`);
    if (el) {
      el.classList.add('ring-2', 'ring-purple-500/70');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedCardId]);

  return (
    <div className="min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader pageKey="storyMap" />

      <div className="px-4 pb-6 sm:px-6">
        {/* Project selector + demo badge */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-purple-500/50"
          >
            <option value="">{t.storyMap.selectProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {isDemo && (
            <span
              className="cursor-help rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400"
              title={t.storyMap.demoModeHint}
            >
              ⚠️ {t.storyMap.demoMode}
            </span>
          )}

          {!isDemo && selectedProject && (
            <span data-cc-id="storymap.realtime-status" className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
              realtimeStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400'
                : realtimeStatus === 'connecting'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-red-500/10 text-red-400'
            }`}>
              {realtimeStatus === 'connected'
                ? <><Wifi size={11} /> {t.storyMap.realtimeConnected}</>
                : realtimeStatus === 'connecting'
                  ? <><Wifi size={11} /> {t.storyMap.realtimeConnecting}</>
                  : <><WifiOff size={11} /> {t.storyMap.realtimeDisconnected}</>
              }
            </span>
          )}

          {loading && (
            <span className="text-xs text-slate-500">...</span>
          )}

          <div className="ms-auto shrink-0">
            <StoryMapExport cards={filteredCards} boardRef={boardRef} t={t.storyMap} />
          </div>
        </div>

        {/* Filter bar + Stats */}
        <StoryMapFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          colorFilter={colorFilter}
          setColorFilter={setColorFilter}
          searchInputRef={filterInputRef}
          t={t.storyMap}
        />
        <StoryMapStats cards={filteredCards} t={t.storyMap} />

        {/* Board */}
        <div ref={boardRef}>
          <StoryBoard
            cards={filteredCards}
            setCards={setCards}
            onAddEpic={handleAddEpic}
            onAddStory={handleAddStory}
            onAddFeature={handleAddFeature}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onOpenNote={handleOpenNote}
            onDeleteColumn={handleDeleteColumn}
            onBatchUpdate={handleBatchUpdate}
            t={storyMapT}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────
export default function StoryMapPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>...</div>}>
      <StoryMapContent />
    </Suspense>
  );
}
