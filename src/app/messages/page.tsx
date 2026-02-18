import { Suspense } from "react";
import MessagesClient from "./messages-client";
import { LoadingState } from "@/components/feedback-state";

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
