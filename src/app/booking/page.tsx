import { Suspense } from "react";
import BookingClient from "./booking-client";
import { LoadingState } from "@/components/feedback-state";

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="px-container py-10">
          <LoadingState title="Préparation de la réservation" description="Chargement du parcours de réservation..." />
        </div>
      }
    >
      <BookingClient />
    </Suspense>
  );
}
