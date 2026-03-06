import { Skeleton } from "@/components/ui";

export default function StoryMapLoading() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <Skeleton width="1.5rem" height="1.5rem" rounded />
        <Skeleton width="160px" height="1.125rem" />
      </div>
      <div className="flex gap-4 overflow-x-auto p-6">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex w-64 shrink-0 flex-col gap-3">
            <Skeleton width="100%" height="2rem" />
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <Skeleton width="80%" height="0.75rem" />
                <Skeleton width="60%" height="0.625rem" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
