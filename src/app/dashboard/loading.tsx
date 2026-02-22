import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";

export default function DashboardLoading() {
  return (
    <AppShell active="/dashboard" title="Dashboard" description="Chargement...">
      <LoadingState title="Dashboard" description="Préparation de ton espace personnel..." />
    </AppShell>
  );
}
