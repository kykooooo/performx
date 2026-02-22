import type { Metadata } from "next";
import { Suspense } from "react";
import BookingClient from "./booking-client";
import { LoadingState } from "@/components/feedback-state";

export const metadata: Metadata = {
  title: "Réserver une séance",
  description: "Choisis un créneau et réserve ta séance de coaching football individuel.",
  robots: { index: false },
};

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
