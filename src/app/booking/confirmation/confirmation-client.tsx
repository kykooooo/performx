"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { formatLongDate } from "@/lib/date";

export default function ConfirmationClient() {
  const searchParams = useSearchParams();

  const coachId = searchParams.get("coach") ?? "";
  const coachName = searchParams.get("coachName") ?? "Coach";
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const price = searchParams.get("price") ?? "0";
  const bookingId = searchParams.get("bookingId") ?? "";
  const conversationId = searchParams.get("conversationId");

  const formattedDate = date ? formatLongDate(new Date(`${date}T12:00`)) : "Date non disponible";

  return (
    <AppShell
      active="/sessions"
      title="Réservation confirmée"
      description="Le créneau est bloqué et la conversation avec le coach est prête."
    >
      <section className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="px-card-strong p-6">
          <div className="rounded-xl border border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/12 px-3 py-2 text-xs text-[color:var(--px-success)]">
            Réservation enregistrée avec succès
          </div>
          <h2 className="mt-4 text-2xl text-white">Récapitulatif</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Coach</span>
              <span className="text-white">{coachName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Date</span>
              <span className="text-white">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Heure</span>
              <span className="text-white">{time ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Prix</span>
              <span className="text-white">{price} €</span>
            </div>
            {bookingId && (
              <div className="flex items-center justify-between">
                <span>Référence</span>
                <span className="text-white">#{bookingId.slice(0, 8)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-card p-6">
          <h3 className="text-lg text-white">Étapes suivantes</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/sessions" className="px-button">
              Voir mes séances
            </Link>
            {conversationId ? (
              <Link href={`/messages?coach=${coachId}`} className="px-button-ghost text-center">
                Ouvrir la conversation
              </Link>
            ) : (
              <Link href={`/coach/${coachId}`} className="px-button-ghost text-center">
                Retour au profil coach
              </Link>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
