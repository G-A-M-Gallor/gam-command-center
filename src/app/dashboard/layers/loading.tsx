import { Skeleton, SkeletonCard } from "@/components/ui";

export default function HubLoading() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <Skeleton width="1.5rem" height="1.5rem" rounded />
        <Skeleton width="100px" height="1.125rem" />
      </div>

      <div className="flex flex-1 flex-col gap-6 pt-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-[var(--cc-radius-lg)] border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <Skeleton width="2rem" height="2rem" rounded />
              <Skeleton width="3rem" height="1.5rem" />
              <Skeleton width="80%" height="0.625rem" />
            </div>
          ))}
        </div>

        {/* Activity + Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard lines={8} />
          <SkeletonCard lines={8} />
        </div>

        {/* Quick Access */}
        <div>
          <Skeleton width="120px" height="0.875rem" className="mb-3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-[var(--cc-radius-lg)] border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <Skeleton width="2.5rem" height="2.5rem" rounded />
                <Skeleton width="60%" height="0.625rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
