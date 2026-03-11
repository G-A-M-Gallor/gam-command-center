import { Skeleton, SkeletonCard } from "@/components/ui";

export default function BoardRoomLoading() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <Skeleton width="1.5rem" height="1.5rem" rounded />
        <Skeleton width="140px" height="1.125rem" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-[200px] shrink-0 flex-col gap-2 border-s border-slate-700/50 p-3">
          <Skeleton width="80px" height="0.5rem" className="mb-2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-[10px] border border-slate-700/30 p-2">
              <Skeleton width="1.5rem" height="1.5rem" rounded />
              <div className="flex-1 space-y-1">
                <Skeleton width="70%" height="0.625rem" />
                <Skeleton width="50%" height="0.5rem" />
              </div>
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex flex-1 flex-col gap-4 p-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    </div>
  );
}
