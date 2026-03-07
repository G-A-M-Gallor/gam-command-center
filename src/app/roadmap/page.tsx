import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap/RoadmapView";

export const metadata: Metadata = {
  title: "Roadmap — vBrain.io",
};

export default function RoadmapPage() {
  return <RoadmapView />;
}
