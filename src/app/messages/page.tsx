import type { Metadata } from "next";
import { Suspense } from "react";
import MessagesClient from "./messages-client";
import { LoadingState } from "@/components/feedback-state";

export const metadata: Metadata = {
  title: "Messages",
  description: "Échange avec tes coachs et gère tes conversations sur PerformX.",
  robots: { index: false },
};

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="px-container py-10">
          <LoadingState title="Préparation de la messagerie" description="Chargement des conversations..." />
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
