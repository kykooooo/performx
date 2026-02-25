import AppShell from "@/components/app-shell";

export default function PlayerDashboardLoading() {
  return (
    <AppShell active="/dashboard">
      <div className="px-stack-3 py-8">
        <div className="px-skeleton h-8 w-48" />
        <div className="px-skeleton h-5 w-72" />
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="px-skeleton h-24 rounded-2xl" />
          <div className="px-skeleton h-24 rounded-2xl" />
          <div className="px-skeleton h-24 rounded-2xl" />
          <div className="px-skeleton h-24 rounded-2xl" />
        </div>
        <div className="px-skeleton h-64 rounded-2xl" />
      </div>
    </AppShell>
  );
}
