import { Suspense } from "react";
import BookingClient from "./booking-client";

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="px-container py-10 text-sm text-white/60">Chargement...</div>}>
      <BookingClient />
    </Suspense>
  );
}
