"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface DashboardModeState {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  guideMode: boolean;
  setGuideMode: (v: boolean) => void;
}

const defaultState: DashboardModeState = {
  editMode: false,
  setEditMode: () => {},
  guideMode: false,
  setGuideMode: () => {},
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

  const setEditMode = useCallback((v: boolean) => {
    setEditModeState(v);
  }, []);

  const setGuideMode = useCallback((v: boolean) => {
    setGuideModeState(v);
  }, []);

  return (
    <DashboardModeContext.Provider
      value={{ editMode, setEditMode, guideMode, setGuideMode }}
    >
      {children}
    </DashboardModeContext.Provider>
  );
}
