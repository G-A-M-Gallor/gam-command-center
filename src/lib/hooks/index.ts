// Barrel export for all custom hooks - using named exports
export {
  useAppsRegistry,
  getAppStatusByRoute,
  getStatusBadge,
  type AppStatus,
  type AppType,
  type DisplayMode,
  type AppRecord,
  type AppSection,
  type AppsRegistry
} from './useAppsRegistry';

export { useBottomDock } from './useBottomDock';
export { useBreakpoint } from './useBreakpoint';
export { useFocusTrap } from './useFocusTrap';
export { useGibberishDetect } from './useGibberishDetect';
export { useMobileBottomBar } from './useMobileBottomBar';
export { useRecentItems } from './useRecentItems';
export { useShellPrefs } from './useShellPrefs';
export { useSplitScreen } from './useSplitScreen';
export { useTray } from './useTray';