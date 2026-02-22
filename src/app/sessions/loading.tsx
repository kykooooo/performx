import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";

export default function SessionsLoading() {
  return (
    <AppShell active="/sessions" title="Mes séances" description="Chargement...">
      <LoadingState title="Chargement" description="Récupération de tes séances..." />
    </AppShell>
  );
}
