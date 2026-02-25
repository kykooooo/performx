import AppShell from "@/components/app-shell";

export default function PlayerProfileLoading() {
  return (
    <AppShell>
      <div className="px-stack-3 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="px-skeleton h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <div className="px-skeleton h-6 w-48" />
                <div className="px-skeleton h-4 w-32" />
              </div>
            </div>
            <div className="px-skeleton h-40 w-full rounded-2xl" />
            <div className="px-skeleton h-60 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <div className="px-skeleton h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
