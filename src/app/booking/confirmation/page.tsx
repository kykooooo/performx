import { Suspense } from "react";
import ConfirmationClient from "./confirmation-client";
import { LoadingState } from "@/components/feedback-state";

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="px-container py-10">
          <LoadingState title="Validation de la réservation" description="Préparation du récapitulatif..." />
        </div>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
