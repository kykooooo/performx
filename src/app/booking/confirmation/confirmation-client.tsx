"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";

type BookingDetails = {
  coachName: string;
  date: string;
  time: string;
  price: number;
  bookingId: string;
  coachId: string;
  conversationId: string | null;
};

export default function ConfirmationClient() {
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get("bookingId") ?? "";
  const coachIdParam = searchParams.get("coach") ?? "";
  const conversationIdParam = searchParams.get("conversationId");

  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchBookingDetails = async () => {
      if (!bookingIdParam) {
        setLoading(false);
        return;
      }

      const { data: booking } = await supabase
        .from("bookings")
        .select("id, price, coach_id, session_id")
        .eq("id", bookingIdParam)
        .single();

      if (!mounted || !booking) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("date, time")
        .eq("id", booking.session_id)
        .single();

      const { data: coach } = await supabase
        .from("public_coaches")
        .select("name, price_per_session")
        .eq("id", booking.coach_id)
        .single();

      if (!mounted) return;

      setDetails({
        coachName: coach?.name ?? searchParams.get("coachName") ?? "Coach",
        date: session?.date ?? searchParams.get("date") ?? "",
        time: session?.time ?? searchParams.get("time") ?? "",
        price: coach?.price_per_session ?? booking.price ?? 0,
        bookingId: booking.id,
        coachId: booking.coach_id,
        conversationId: conversationIdParam,
      });
      setLoading(false);
    };

    fetchBookingDetails().catch(() => {
      if (mounted) {
        setDetails({
          coachName: searchParams.get("coachName") ?? "Coach",
          date: searchParams.get("date") ?? "",
          time: searchParams.get("time") ?? "",
          price: 0,
          bookingId: bookingIdParam,
          coachId: coachIdParam,
          conversationId: conversationIdParam,
        });
        setLoading(false);
      }
    });

    return () => { mounted = false; };
  }, [bookingIdParam, coachIdParam, conversationIdParam, searchParams]);

  const formattedDate = details?.date
    ? formatLongDate(new Date(`${details.date}T12:00`))
    : "Date non disponible";

  if (loading) {
    return (
      <AppShell active="/sessions" title="Réservation confirmée" description="Chargement de la confirmation...">
        <LoadingState title="Chargement" description="Récupération de la confirmation..." />
      </AppShell>
    );
  }

  const coachId = details?.coachId ?? coachIdParam;
  const conversationId = details?.conversationId ?? conversationIdParam;

  return (
    <AppShell
      active="/sessions"
      title="Réservation confirmée"
      description="Le créneau est bloqué et la conversation avec le coach est prête."
    >
      <section className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="px-card-strong p-6">
          <div role="status" className="rounded-xl border border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/12 px-3 py-2 text-xs text-[color:var(--px-success)]">
            Réservation enregistrée avec succès
          </div>
          <h2 className="mt-4 text-2xl text-white">Récapitulatif</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Coach</span>
              <span className="text-white">{details?.coachName ?? "Coach"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Date</span>
              <span className="text-white">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Heure</span>
              <span className="text-white">{details?.time ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Prix</span>
              <span className="text-white">{details?.price ?? 0} €</span>
            </div>
            {details?.bookingId && (
              <div className="flex items-center justify-between">
                <span>Référence</span>
                <span className="text-white">#{details.bookingId.slice(0, 8)}</span>
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
