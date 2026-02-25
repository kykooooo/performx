import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/feedback-state";

const MessagesClient = dynamic(() => import("./messages-client"), {
  loading: () => (
    <div className="px-container py-10">
      <LoadingState title="Préparation de la messagerie" description="Chargement des conversations..." />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Messages",
  description: "Échange avec tes coachs et gère tes conversations sur PerformX.",
  robots: { index: false },
};

export default function MessagesPage() {
  return <MessagesClient />;
}
