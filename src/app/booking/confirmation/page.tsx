import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/feedback-state";

const ConfirmationClient = dynamic(() => import("./confirmation-client"), {
  loading: () => (
    <div className="px-container py-10">
      <LoadingState title="Validation de la réservation" description="Préparation du récapitulatif..." />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Réservation confirmée",
  robots: { index: false },
};

export default function BookingConfirmationPage() {
  return <ConfirmationClient />;
}
