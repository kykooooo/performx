import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";

export default function BookingLoading() {
  return (
    <AppShell active="/coach" title="Réservation" description="Chargement...">
      <LoadingState title="Préparation" description="Chargement du parcours de réservation..." />
    </AppShell>
  );
}
