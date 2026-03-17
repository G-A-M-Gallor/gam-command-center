import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "vClip",
  description: "Screen recording by vBrain.io",
};

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
