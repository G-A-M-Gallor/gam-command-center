import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Skeleton width="2rem" height="2rem" rounded />
        <Skeleton width="200px" height="1.25rem" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <Skeleton width="60%" height="0.875rem" />
            <Skeleton width="100%" height="0.75rem" />
            <Skeleton width="80%" height="0.75rem" />
          </div>
        ))}
      </div>
    </div>
  );
}
