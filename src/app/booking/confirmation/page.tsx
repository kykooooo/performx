import { Suspense } from "react";
import ConfirmationClient from "./confirmation-client";

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="px-container py-10 text-sm text-white/60">Chargement...</div>}>
      <ConfirmationClient />
    </Suspense>
  );
}
