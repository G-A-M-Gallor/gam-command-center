"use client";

import { useParams } from "next/navigation";
import { VNotePage } from "@/components/vNote";

export default function VNoteRoute() {
  const params = useParams();
  const entityId = params.entityId as string;

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-slate-400">חסר entityId</p>
      </div>
    );
  }

  return <VNotePage entityId={entityId} />;
}
