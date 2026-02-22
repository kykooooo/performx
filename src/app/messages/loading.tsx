import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";

export default function MessagesLoading() {
  return (
    <AppShell active="/messages" title="Messages" description="Chargement...">
      <LoadingState title="Messagerie" description="Chargement des conversations..." />
    </AppShell>
  );
}
