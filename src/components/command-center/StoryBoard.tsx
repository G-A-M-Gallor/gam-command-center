'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { _Plus } from 'lucide-react';
import { StoryColumn } from './StoryColumn';
import type { FeatureGroup } from './StoryColumn';
import { StoryCardOverlay } from './StoryCard';
import type { StoryCard, EnrichedEntityLink } from '@/lib/supabase/storyCardQueries';

interface StoryBoardProps {
  cards: StoryCard[];
  setCards: React.Dispatch<React.SetStateAction<StoryCard[]>>;
  onAddEpic: () => void;
  onAddStory: (col: number, featureId: string | null) => void;
  onAddFeature: (col: number) => void;
  onUpdateCard: (id: string, updates: Partial<StoryCard>) => void;
  onDeleteCard: (id: string) => void;
  onOpenNote?: (card: StoryCard) => void;
  onDeleteColumn: (col: number) => void;
  onBatchUpdate: (updates: { id: string; col: number; sort_order: number }[]) => void;
  entityLinks?: Record<string, EnrichedEntityLink[]>;
  onLinkEntity?: (storyCardId: string, entityNoteId: string) => void;
  onUnlinkEntity?: (linkId: string, storyCardId: string) => void;
  t: {
    addEpic: string;
    addStory: string;
    addFeature: string;
    deleteColumn: string;
    deleteColumnConfirm: string;
    storyPlaceholder: string;
    epicPlaceholder: string;
    featurePlaceholder: string;
    deleteCard: string;
    subStories: string;
    addSub: string;
    subPlaceholder: string;
    colorPicker: string;
    noColor: string;
    cardCount: string;
    emptyBoard: string;
    notes: string;
    addNote: string;
    notePlaceholder: string;
    diagram: string;
    editDiagram: string;
    diagramPlaceholder: string;
    preview: string;
    save: string;
    estimation: string;
    noEstimation: string;
    totalPoints: string;
    openInEditor?: string;
    hasNote?: string;
    linkEntity?: string;
    linkedEntities?: string;
    searchEntity?: string;
    unlinkEntity?: string;
    noLinkedEntities?: string;
  };
}

export const StoryBoard = memo(function StoryBoard({
  cards,
  setCards,
  onAddEpic,
  onAddStory,
  onAddFeature,
  onUpdateCard,
  onDeleteCard,
  onOpenNote,
  onDeleteColumn,
  onBatchUpdate,
  entityLinks,
  onLinkEntity,
  onUnlinkEntity,
  _t,
}: StoryBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group cards by column → epic + featureGroups
  const columns = useMemo(() => {
    const colMap = new Map<number, {
      epic: StoryCard | null;
      nonEpics: StoryCard[];
    }>();

    for (const card of cards) {
      if (!colMap.has(card.col)) {
        colMap.set(card.col, { epic: null, nonEpics: [] });
      }
      const group = colMap.get(card.col)!;
      if (card.type === 'epic') {
        group.epic = card;
      } else {
        group.nonEpics.push(card);
      }
    }

    const sortedCols = [...colMap.keys()].sort((a, b) => a - b);

    return sortedCols.map((col) => {
      const { epic, nonEpics } = colMap.get(col)!;
      const sorted = [...nonEpics].sort((a, b) => a.sort_order - b.sort_order);

      // Build feature groups by sequential scan
      const featureGroups: FeatureGroup[] = [];
      let currentGroup: FeatureGroup = { feature: null, stories: [] };

      for (const card of sorted) {
        if (card.type === 'feature') {
          // Flush previous group
          if (currentGroup.feature !== null || currentGroup.stories.length > 0) {
            featureGroups.push(currentGroup);
          }
          currentGroup = { feature: card, stories: [] };
        } else {
          currentGroup.stories.push(card);
        }
      }
      // Flush final group
      if (currentGroup.feature !== null || currentGroup.stories.length > 0) {
        featureGroups.push(currentGroup);
      }

      return { colIndex: col, epic, featureGroups };
    });
  }, [cards]);

  const activeCard = useMemo(
    () => (activeId ? cards.find((c) => c.id === activeId) ?? null : null),
    [activeId, cards]
  );

  const findColumnOfCard = useCallback(
    (cardId: string): number | null => {
      const card = cards.find((c) => c.id === cardId);
      return card ? card.col : null;
    },
    [cards]
  );

  // ── Drag handlers ──────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeCardId = active.id as string;
      const overId = over.id as string;

      // Don't drag epics
      const draggedCard = cards.find((c) => c.id === activeCardId);
      if (!draggedCard || draggedCard.type === 'epic') return;

      let targetCol: number | null = null;
      if (overId.startsWith('column-')) {
        targetCol = parseInt(overId.replace('column-', ''), 10);
      } else {
        targetCol = findColumnOfCard(overId);
      }
      if (targetCol === null) return;

      const sourceCol = draggedCard.col;

      if (sourceCol === targetCol) {
        // Same column reorder — features and stories share the sortable pool
        const colItems = cards
          .filter((c) => c.col === sourceCol && c.type !== 'epic')
          .sort((a, b) => a.sort_order - b.sort_order);

        const oldIndex = colItems.findIndex((c) => c.id === activeCardId);
        const newIndex = colItems.findIndex((c) => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(colItems, oldIndex, newIndex);
          setCards((prev) => {
            const others = prev.filter((c) => !(c.col === sourceCol && c.type !== 'epic'));
            return [...others, ...reordered.map((c, i) => ({ ...c, sort_order: i }))];
          });
        }
      } else {
        // Cross-column move
        setCards((prev) =>
          prev.map((c) =>
            c.id === activeCardId ? { ...c, col: targetCol! } : c
          )
        );
      }
    },
    [cards, findColumnOfCard, setCards]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);

      const { active } = event;
      const draggedCard = cards.find((c) => c.id === active.id);
      if (!draggedCard || draggedCard.type === 'epic') return;

      // Recalculate sort_orders for affected column
      const updates: { id: string; col: number; sort_order: number }[] = [];
      const col = draggedCard.col;
      const colItems = cards
        .filter((c) => c.col === col && c.type !== 'epic')
        .sort((a, b) => a.sort_order - b.sort_order);

      colItems.forEach((c, i) => {
        updates.push({ id: c.id, col, sort_order: i });
      });

      if (updates.length > 0) {
        onBatchUpdate(updates);
      }
    },
    [cards, onBatchUpdate]
  );

  // ── Empty state ────────────────────────────────────
  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-slate-500">{t.emptyBoard}</p>
        <button
          type="button"
          onClick={onAddEpic}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-purple-500/30 px-4 py-2 text-sm text-purple-400 transition-colors hover:border-purple-500/50 hover:bg-purple-500/5"
        >
          <_Plus className="h-4 w-4" />
          {_t.addEpic}
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <StoryColumn
            key={col.colIndex}
            colIndex={col.colIndex}
            epic={col.epic}
            featureGroups={col.featureGroups}
            onUpdateCard={onUpdateCard}
            onDeleteCard={onDeleteCard}
            onOpenNote={onOpenNote}
            onAddStory={onAddStory}
            onAddFeature={onAddFeature}
            onDeleteColumn={onDeleteColumn}
            entityLinks={entityLinks}
            onLinkEntity={onLinkEntity}
            onUnlinkEntity={onUnlinkEntity}
            _t={_t}
          />
        ))}

        {/* Add Epic button */}
        <button
          type="button"
          onClick={onAddEpic}
          className="flex h-fit w-56 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700/50 px-4 py-8 text-sm text-slate-500 transition-colors hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-400"
        >
          <Plus className="h-4 w-4" />
          {t.addEpic}
        </button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? <StoryCardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
});
