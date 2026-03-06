import { Skeleton, SkeletonCard } from "@/components/ui";

export default function LayersLoading() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <Skeleton width="1.5rem" height="1.5rem" rounded />
        <Skeleton width="140px" height="1.125rem" />
      </div>
      {/* Summary + grid */}
      <div className="flex flex-1 flex-col gap-6 pt-6">
        <div className="flex items-center gap-3">
          <Skeleton width="200px" height="0.875rem" />
          <Skeleton width="80px" height="1.25rem" rounded />
          <Skeleton width="80px" height="1.25rem" rounded />
          <Skeleton width="80px" height="1.25rem" rounded />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      </div>
    </div>
  );
}
