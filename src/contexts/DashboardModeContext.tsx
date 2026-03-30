"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

interface DashboardModeState {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  guideMode: boolean;
  setGuideMode: (v: boolean) => void;
}

const defaultState: DashboardModeState = {
  editMode: false,
  setEditMode: () => { /* no-op */ },
  guideMode: false,
  setGuideMode: () => { /* no-op */ },
};

const DashboardModeContext = createContext<DashboardModeState>(defaultState);

export function useDashboardMode() {
  return useContext(DashboardModeContext);
}

export function DashboardModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [editMode, setEditModeState] = useState(false);
  const [guideMode, setGuideModeState] = useState(false);

  const _setEditMode = useCallback((v: boolean) => {
    setEditModeState(v);
  }, []);

  const setGuideMode = useCallback((v: boolean) => {
    setGuideModeState(v);
  }, []);

  const value = useMemo(
    () => ({ editMode, _setEditMode, guideMode, setGuideMode }),
    [editMode, _setEditMode, guideMode, setGuideMode]
  );

  return (
    <DashboardModeContext.Provider value={value}>
      {children}
    </DashboardModeContext.Provider>
  );
}
