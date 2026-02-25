import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/feedback-state";

const BookingClient = dynamic(() => import("./booking-client"), {
  loading: () => (
    <div className="px-container py-10">
      <LoadingState title="Préparation de la réservation" description="Chargement du parcours de réservation..." />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Réserver une séance",
  description: "Choisis un créneau et réserve ta séance de coaching football individuel.",
  robots: { index: false },
};

export default function BookingPage() {
  return <BookingClient />;
}
