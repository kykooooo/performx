import type { Metadata } from "next";
import { Suspense } from "react";
import ConfirmationClient from "./confirmation-client";
import { LoadingState } from "@/components/feedback-state";

export const metadata: Metadata = {
  title: "Réservation confirmée",
  robots: { index: false },
};

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
