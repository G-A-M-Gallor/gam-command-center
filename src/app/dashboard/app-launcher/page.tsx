"use client";

import dynamic from "next/dynamic";

const AppLauncherGrid = dynamic(
  () => import("@/components/app-launcher/AppLauncherGrid").then((m) => m.AppLauncherGrid),
  { ssr: false }
);

export default function AppLauncherPage() {
  return (
    <div className="flex h-[calc(100vh-48px-76px)] flex-col bg-slate-950">
      <AppLauncherGrid />
    </div>
  );
}
