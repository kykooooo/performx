type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`px-skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[color:var(--px-card)]/92 p-4 space-y-4">
      <div className="relative h-32 overflow-hidden rounded-xl">
        <Skeleton className="h-full w-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    </div>
  );
}

export function SkeletonPlayerCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[color:var(--px-card)]/92 p-4 space-y-4">
      <div className="relative h-28 overflow-hidden rounded-xl">
        <Skeleton className="h-full w-full" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
