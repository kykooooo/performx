import AppShell from "@/components/app-shell";
import { SkeletonPlayerCard } from "@/components/skeleton";

export default function PlayersLoading() {
  return (
    <AppShell active="/players" hideTitle>
      <section className="py-8 lg:py-12">
        <div className="space-y-4">
          <div className="px-skeleton h-8 w-32" />
          <div className="px-skeleton h-12 w-2/3" />
          <div className="px-skeleton h-5 w-1/2" />
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonPlayerCard key={i} />
        ))}
      </div>
    </AppShell>
  );
}
