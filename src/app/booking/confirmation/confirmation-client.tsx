"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";
import { CalendarIcon, CheckCircleIcon } from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.pointerEvents = "none";

    const colors = ["#ff6a00", "#ff8a00", "#43d17a", "#ffb020", "#ff5c5c", "#ffffff"];
    const pieces: { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rot: number; vr: number; opacity: number }[] = [];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 - 100,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: -8 - Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        opacity: 1,
      });
    }

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.vx *= 0.99;
        p.rot += p.vr;
        if (frame > 40) p.opacity -= 0.015;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  return { canvasRef, fire };
}

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
  const { canvasRef, fire } = useConfetti();

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

  useEffect(() => {
    if (!loading && details) {
      const timer = setTimeout(() => fire(), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, details, fire]);

  const formattedDate = details?.date
    ? formatLongDate(new Date(`${details.date}T12:00`))
    : "Date non disponible";

  const handleAddToCalendar = () => {
    if (!details?.date || !details?.time) return;
    const [hours, minutes] = details.time.split(":").map(Number);
    const start = new Date(`${details.date}T${details.time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PerformX//Booking//FR",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Séance avec ${details.coachName}`,
      `DESCRIPTION:Séance de coaching football avec ${details.coachName} via PerformX`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performx-seance-${details.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />
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

        {/* Notifications */}
        <div className="px-card p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-success)]/15">
                <CheckCircleIcon className="h-4 w-4 text-[color:var(--px-success)]" />
              </div>
              <div>
                <p className="text-sm text-white">E-mail de confirmation envoyé</p>
                <p className="text-xs text-white/70">Un récapitulatif a été envoyé à ton adresse e-mail.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="px-button-ghost inline-flex items-center justify-center gap-2 text-sm"
            >
              <CalendarIcon className="h-4 w-4" />
              Ajouter au calendrier
            </button>
          </div>
        </div>

        {/* Next steps */}
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
