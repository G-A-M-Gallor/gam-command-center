"use client";

import { useSplitScreen } from "@/lib/hooks/useSplitScreen";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { X } from "lucide-react";

interface SplitScreenContainerProps {
  children: React.ReactNode;
}

export function SplitScreenContainer({ children }: SplitScreenContainerProps) {
  const split = useSplitScreen();
  const { language } = useSettings();
  const t = getTranslations(language);
  const trayT = t.tray as Record<string, string>;

  // No split active — render children normally
  if (!split.isActive) {
    return <>{children}</>;
  }

  const { left, right } = split.state;
  const bothActive = left !== null && right !== null;

  return (
    <div className="flex h-full w-full gap-0">
      {/* Left pane */}
      {left && (
        <div
          className="relative flex-1 min-w-0 border-e border-slate-700/50"
          style={{ flex: bothActive ? "1 1 50%" : "1 1 100%" }}
        >
          <iframe
            src={`${left}?split=secondary`}
            className="h-full w-full border-0"
            title="Split left"
          />
          {/* Close button */}
          <button
            type="button"
            onClick={() => split.undock("left")}
            className="absolute top-2 end-2 z-10 rounded-full bg-slate-800/90 p-1 text-slate-400 shadow-lg transition-colors hover:bg-red-500/80 hover:text-white"
            title={trayT.closeSplit}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Primary content — hidden when both slots are filled */}
      {!bothActive && (
        <div className="flex-1 min-w-0" style={{ flex: "1 1 50%" }}>
          {children}
        </div>
      )}

      {/* Right pane */}
      {right && (
        <div
          className="relative flex-1 min-w-0 border-s border-slate-700/50"
          style={{ flex: bothActive ? "1 1 50%" : "1 1 100%" }}
        >
          <iframe
            src={`${right}?split=secondary`}
            className="h-full w-full border-0"
            title="Split right"
          />
          {/* Close button */}
          <button
            type="button"
            onClick={() => split.undock("right")}
            className="absolute top-2 start-2 z-10 rounded-full bg-slate-800/90 p-1 text-slate-400 shadow-lg transition-colors hover:bg-red-500/80 hover:text-white"
            title={trayT.closeSplit}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
