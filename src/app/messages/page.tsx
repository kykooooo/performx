import { Suspense } from "react";
import MessagesClient from "./messages-client";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="px-container py-10 text-sm text-white/60">Chargement...</div>}>
      <MessagesClient />
    </Suspense>
  );
}
