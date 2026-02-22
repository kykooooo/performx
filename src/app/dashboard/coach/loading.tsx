import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";

export default function CoachDashboardLoading() {
  return (
    <AppShell active="/dashboard" title="Dashboard Coach" description="Chargement...">
      <LoadingState title="Dashboard Coach" description="Récupération de tes données..." />
    </AppShell>
  );
}
