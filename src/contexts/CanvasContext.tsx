'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type {
  CanvasLayout,
  FieldPlacement,
  GridPosition,
} from '@/lib/canvas/types';
import { createDefaultLayout } from '@/lib/canvas/types';
import {
  fetchCanvasLayout,
  saveCanvasLayout,
  fetchFieldPlacements,
  createFieldPlacement,
  updateFieldPlacement,
  deleteFieldPlacement,
} from '@/lib/canvas/canvasQueries';

// ─── Context Interface ───────────────────────────────
interface CanvasContextValue {
  layout: CanvasLayout;
  placements: FieldPlacement[];
  selectedPlacementId: string | null;
  isDragging: boolean;
  dragOverCell: GridPosition | null;
  loading: boolean;

  // Layout actions
  setLayout: (patch: Partial<CanvasLayout>) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setZoom: (zoom: number) => void;

  // Placement actions
  addPlacement: (
    placement: Omit<FieldPlacement, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'field_type' | 'label' | 'config'>
  ) => Promise<FieldPlacement | null>;
  movePlacement: (id: string, col: number, row: number) => void;
  removePlacement: (id: string) => void;
  selectPlacement: (id: string | null) => void;

  // Drag state
  setIsDragging: (v: boolean) => void;
  setDragOverCell: (cell: GridPosition | null) => void;
}

const defaultValue: CanvasContextValue = {
  layout: createDefaultLayout(''),
  placements: [],
  selectedPlacementId: null,
  isDragging: false,
  dragOverCell: null,
  loading: true,
  setLayout: () => {},
  toggleGrid: () => {},
  toggleSnap: () => {},
  setZoom: () => {},
  addPlacement: async () => null,
  movePlacement: () => {},
  removePlacement: () => {},
  selectPlacement: () => {},
  setIsDragging: () => {},
  setDragOverCell: () => {},
};

const CanvasCtx = createContext<CanvasContextValue>(defaultValue);

export function useCanvas() {
  return useContext(CanvasCtx);
}

// ─── Provider ────────────────────────────────────────
export function CanvasProvider({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  const [layout, setLayoutState] = useState<CanvasLayout>(createDefaultLayout(documentId));
  const [placements, setPlacements] = useState<FieldPlacement[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<GridPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const layoutSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [layoutData, placementsData] = await Promise.all([
        fetchCanvasLayout(documentId),
        fetchFieldPlacements(documentId),
      ]);
      if (cancelled) return;
      setLayoutState(layoutData);
      setPlacements(placementsData);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [documentId]);

  // Debounced layout save
  const persistLayout = useCallback((updated: CanvasLayout) => {
    if (layoutSaveTimer.current) clearTimeout(layoutSaveTimer.current);
    layoutSaveTimer.current = setTimeout(() => {
      saveCanvasLayout(updated);
    }, 1000);
  }, []);

  const setLayout = useCallback(
    (patch: Partial<CanvasLayout>) => {
      setLayoutState((prev) => {
        const next = { ...prev, ...patch };
        persistLayout(next);
        return next;
      });
    },
    [persistLayout]
  );

  const toggleGrid = useCallback(() => {
    setLayout({ show_grid: !layout.show_grid });
  }, [layout.show_grid, setLayout]);

  const toggleSnap = useCallback(() => {
    setLayout({ snap_to_grid: !layout.snap_to_grid });
  }, [layout.snap_to_grid, setLayout]);

  const setZoom = useCallback((zoom: number) => {
    setLayout({ zoom: Math.max(0.5, Math.min(2.0, zoom)) });
  }, [setLayout]);

  // Placement CRUD
  const addPlacement = useCallback(
    async (
      placement: Omit<FieldPlacement, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'field_type' | 'label' | 'config'>
    ) => {
      const result = await createFieldPlacement(placement);
      if (result) {
        setPlacements((prev) => [...prev, result]);
      }
      return result;
    },
    []
  );

  const movePlacement = useCallback((id: string, col: number, row: number) => {
    setPlacements((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, grid_col: col, grid_row: row, last_moved_at: new Date().toISOString() }
          : p
      )
    );
    // Persist async
    updateFieldPlacement(id, {
      grid_col: col,
      grid_row: row,
      last_moved_at: new Date().toISOString(),
    });
  }, []);

  const removePlacement = useCallback((id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    deleteFieldPlacement(id);
  }, []);

  const selectPlacement = useCallback((id: string | null) => {
    setSelectedPlacementId(id);
  }, []);

  const value = useMemo<CanvasContextValue>(
    () => ({
      layout,
      placements,
      selectedPlacementId,
      isDragging,
      dragOverCell,
      loading,
      setLayout,
      toggleGrid,
      toggleSnap,
      setZoom,
      addPlacement,
      movePlacement,
      removePlacement,
      selectPlacement,
      setIsDragging,
      setDragOverCell,
    }),
    [
      layout,
      placements,
      selectedPlacementId,
      isDragging,
      dragOverCell,
      loading,
      setLayout,
      toggleGrid,
      toggleSnap,
      setZoom,
      addPlacement,
      movePlacement,
      removePlacement,
      selectPlacement,
    ]
  );

  return <CanvasCtx.Provider value={value}>{children}</CanvasCtx.Provider>;
}
