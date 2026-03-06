import { Skeleton } from "@/components/ui";

export default function EditorLoading() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <Skeleton width="1.5rem" height="1.5rem" rounded />
        <Skeleton width="120px" height="1.125rem" />
      </div>
      <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <Skeleton width="50%" height="0.875rem" />
            <Skeleton width="100%" height="2rem" />
            <Skeleton width="30%" height="0.625rem" />
          </div>
        ))}
      </div>
    </div>
  );
}
