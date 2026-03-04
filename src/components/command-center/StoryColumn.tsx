'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Layers, Trash2 } from 'lucide-react';
import { EpicCard, FeatureCard, StoryCard } from './StoryCard';
import type { StoryCard as StoryCardType } from '@/lib/supabase/storyCardQueries';

// ─── Types ──────────────────────────────────────────
export interface FeatureGroup {
  feature: StoryCardType | null; // null = ungrouped stories
  stories: StoryCardType[];
}

interface StoryColumnProps {
  colIndex: number;
  epic: StoryCardType | null;
  featureGroups: FeatureGroup[];
  onUpdateCard: (id: string, updates: Partial<StoryCardType>) => void;
  onDeleteCard: (id: string) => void;
  onAddStory: (col: number, featureId: string | null) => void;
  onAddFeature: (col: number) => void;
  onDeleteColumn: (col: number) => void;
  t: {
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
  };
}

// ─── Feature Group Section ──────────────────────────
function FeatureGroupSection({
  featureGroup,
  colIndex,
  onUpdateCard,
  onDeleteCard,
  onAddStory,
  t,
}: {
  featureGroup: FeatureGroup;
  colIndex: number;
  onUpdateCard: StoryColumnProps['onUpdateCard'];
  onDeleteCard: StoryColumnProps['onDeleteCard'];
  onAddStory: StoryColumnProps['onAddStory'];
  t: StoryColumnProps['t'];
}) {
  const [expanded, setExpanded] = useState(true);
  const { feature, stories } = featureGroup;

  return (
    <div className="flex flex-col gap-1">
      {/* Feature header */}
      {feature && (
        <FeatureCard
          card={feature}
          onUpdate={onUpdateCard}
          onDelete={onDeleteCard}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          t={t}
        />
      )}

      {/* Stories — visible when expanded or ungrouped */}
      {(expanded || !feature) &&
        stories.map((story) => (
          <StoryCard
            key={story.id}
            card={story}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
            t={t}
          />
        ))}

      {/* Per-feature add-story button */}
      {(expanded || !feature) && feature && (
        <button
          type="button"
          onClick={() => onAddStory(colIndex, feature.id)}
          className="flex items-center gap-1 py-0.5 ps-5 text-[10px] text-slate-600 transition-colors hover:text-slate-400"
        >
          <Plus className="h-2.5 w-2.5" />
          {t.addStory}
        </button>
      )}
    </div>
  );
}

// ─── Column ─────────────────────────────────────────
export function StoryColumn({
  colIndex,
  epic,
  featureGroups,
  onUpdateCard,
  onDeleteCard,
  onAddStory,
  onAddFeature,
  onDeleteColumn,
  t,
}: StoryColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${colIndex}` });

  // All non-epic ids for SortableContext (features + stories in sort_order)
  const sortableIds = featureGroups.flatMap((fg) => [
    ...(fg.feature ? [fg.feature.id] : []),
    ...fg.stories.map((s) => s.id),
  ]);

  const totalStories = featureGroups.reduce((sum, fg) => sum + fg.stories.length, 0);

  return (
    <div
      className={`flex w-56 shrink-0 flex-col rounded-lg border transition-colors ${
        isOver
          ? 'border-purple-500/40 bg-purple-500/5'
          : 'border-slate-700/30 bg-slate-800/30'
      }`}
    >
      {/* Epic header */}
      <div className="group/col relative px-2 pt-2">
        {epic ? (
          <EpicCard card={epic} onUpdate={onUpdateCard} onDelete={onDeleteCard} t={t} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-700/50 px-3 py-2 text-center text-xs text-slate-500">
            —
          </div>
        )}
        {/* Column delete */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t.deleteColumnConfirm)) {
              onDeleteColumn(colIndex);
            }
          }}
          className="absolute -top-1 end-0 rounded bg-slate-800 p-0.5 text-slate-500 opacity-0 transition-opacity hover:text-red-400 group-hover/col:opacity-100"
          title={t.deleteColumn}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Sortable area — feature groups */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-1.5 px-2 py-2"
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {featureGroups.map((fg, idx) => (
            <FeatureGroupSection
              key={fg.feature?.id ?? `ungrouped-${idx}`}
              featureGroup={fg}
              colIndex={colIndex}
              onUpdateCard={onUpdateCard}
              onDeleteCard={onDeleteCard}
              onAddStory={onAddStory}
              t={t}
            />
          ))}
        </SortableContext>

        {/* Card count */}
        {totalStories > 0 && (
          <div className="text-center text-[10px] text-slate-600">
            {totalStories} {t.cardCount}
          </div>
        )}
      </div>

      {/* Column footer — Add Feature */}
      <button
        type="button"
        onClick={() => onAddFeature(colIndex)}
        className="flex items-center justify-center gap-1 border-t border-slate-700/30 px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-700/30 hover:text-slate-300"
      >
        <Layers className="h-3 w-3" />
        {t.addFeature}
      </button>
    </div>
  );
}
