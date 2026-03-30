// Barrel export for all contexts - based on actual exports

// Auth context exports
export { AuthProvider, useAuth } from './AuthContext';
export type { UserRole, UserPermissions } from './AuthContext';

// Canvas context exports
export { CanvasProvider, useCanvas } from './CanvasContext';

// Dashboard mode context exports
export { DashboardModeProvider, useDashboardMode } from './DashboardModeContext';

// Settings context exports
export { SettingsProvider, useSettings } from './SettingsContext';
export type {
  _Language,
  SidebarPosition,
  SidebarVisibility,
  AccentColor,
  SavedColor,
  GlowIntensity,
  AccentEffect,
  BrandProfile,
  FontFamily,
  BorderRadius
} from './SettingsContext';

// Shortcuts context exports
export { ShortcutsProvider, useShortcuts } from './ShortcutsContext';

// Style override context exports
export { StyleOverrideProvider, useStyleOverrides } from './StyleOverrideContext';

// Toast context exports
export { ToastProvider, useToast } from './ToastContext';

// Weekly planner context exports
export { WeeklyPlannerProvider, useWeeklyPlanner } from './WeeklyPlannerContext';

// Widget context exports
export { WidgetProvider, useWidgets } from './WidgetContext';