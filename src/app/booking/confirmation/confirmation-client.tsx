"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";
import { CalendarIcon, CheckCircleIcon } from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { parseTextArray } from "@/lib/football";
import {
  buildPreparationMessage,
  buildSessionChecklist,
  getCoachAudienceLabel,
  getCoachBestForLabel,
  getCoachStyleLabel,
} from "@/lib/football-surface";
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
    const pieces: {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      vr: number;
      opacity: number;
    }[] = [];

    for (let index = 0; index < 120; index += 1) {
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
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const piece of pieces) {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.25;
        piece.vx *= 0.99;
        piece.rot += piece.vr;
        if (frame > 40) piece.opacity -= 0.015;
        if (piece.opacity <= 0) continue;

        alive = true;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.globalAlpha = Math.max(0, piece.opacity);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
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
  location: string | null;
  speciality: string;
  experienceYears: number | null;
  focusAreas: string[];
  sessionFormats: string[];
  pedagogy: string | null;
  certifications: string[];
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
        .select(
          "name, speciality, location, price_per_session, experience_years, focus_areas, session_formats, pedagogy, certifications",
        )
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
        location: coach?.location ?? null,
        speciality: coach?.speciality ?? "Coaching football",
        experienceYears: coach?.experience_years ?? null,
        focusAreas: parseTextArray(coach?.focus_areas ?? []).slice(0, 3),
        sessionFormats: parseTextArray(coach?.session_formats ?? []).slice(0, 3),
        pedagogy: coach?.pedagogy ?? null,
        certifications: parseTextArray(coach?.certifications ?? []).slice(0, 2),
      });
      setLoading(false);
    };

    fetchBookingDetails().catch(() => {
      if (!mounted) return;

      setDetails({
        coachName: searchParams.get("coachName") ?? "Coach",
        date: searchParams.get("date") ?? "",
        time: searchParams.get("time") ?? "",
        price: 0,
        bookingId: bookingIdParam,
        coachId: coachIdParam,
        conversationId: conversationIdParam,
        location: null,
        speciality: "Coaching football",
        experienceYears: null,
        focusAreas: [],
        sessionFormats: [],
        pedagogy: null,
        certifications: [],
      });
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [bookingIdParam, coachIdParam, conversationIdParam, searchParams]);

  useEffect(() => {
    if (!loading && details) {
      const timer = setTimeout(() => fire(), 300);
      return () => clearTimeout(timer);
    }
  }, [details, fire, loading]);

  const formattedDate = details?.date
    ? formatLongDate(new Date(`${details.date}T12:00`))
    : "Date non disponible";
  const slotLabel = details?.date && details?.time ? `${formattedDate} - ${details.time}` : "";
  const styleLabel = getCoachStyleLabel(details?.speciality ?? "", details?.pedagogy);
  const audienceLabel = getCoachAudienceLabel(details?.sessionFormats ?? [], details?.experienceYears ?? null);
  const bestForLabel = getCoachBestForLabel(details?.speciality ?? "", details?.focusAreas ?? []);
  const checklist = useMemo(
    () =>
      buildSessionChecklist(
        details?.speciality ?? "",
        details?.sessionFormats ?? [],
        details?.focusAreas ?? [],
      ),
    [details?.focusAreas, details?.sessionFormats, details?.speciality],
  );
  const preparationMessage = useMemo(
    () =>
      details
        ? buildPreparationMessage(details.coachName, slotLabel, details.focusAreas)
        : "",
    [details, slotLabel],
  );

  const handleAddToCalendar = () => {
    if (!details?.date || !details?.time) return;

    const start = new Date(`${details.date}T${details.time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatIcsDate = (value: Date) =>
      value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PerformX//Booking//FR",
      "BEGIN:VEVENT",
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:Seance avec ${details.coachName}`,
      `DESCRIPTION:Seance de coaching football avec ${details.coachName} via PerformX`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `performx-seance-${details.date}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppShell active="/sessions" title="Reservation confirmee" description="Chargement de la confirmation...">
        <LoadingState title="Chargement" description="Recuperation de la confirmation..." />
      </AppShell>
    );
  }

  const coachId = details?.coachId ?? coachIdParam;
  const conversationId = details?.conversationId ?? conversationIdParam;
  const messageHref = conversationId
    ? `/messages?coach=${coachId}${preparationMessage ? `&prefill=${encodeURIComponent(preparationMessage)}` : ""}`
    : `/messages?coach=${coachId}`;

  return (
    <AppShell
      active="/sessions"
      title="Reservation confirmee"
      description="Le creneau est bloque et la conversation avec le coach est prete."
    >
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />

      <section className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="px-card-strong p-6">
          <div
            role="status"
            className="rounded-xl border border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/12 px-3 py-2 text-xs text-[color:var(--px-success)]"
          >
            Reservation enregistree avec succes
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="px-role-kicker text-[color:var(--px-success)]">Seance verrouillee</p>
              <h2 className="mt-2 text-2xl text-white">Ton creneau est confirme</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Tout est pret pour la suite: recap, checklist de terrain, ajout calendrier et message
                preparatoire pour cadrer la seance.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="px-context-chip" data-tone="role">
                  {styleLabel}
                </span>
                <span className="px-context-chip">{bestForLabel}</span>
                <span className="px-context-chip">{audienceLabel}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Coach</span>
                <span className="text-right text-white">{details?.coachName ?? "Coach"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Date</span>
                <span className="text-right text-white">{formattedDate}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Heure</span>
                <span className="text-right text-white">{details?.time ?? "-"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Lieu</span>
                <span className="text-right text-white">
                  {details?.location ?? "Confirme dans la conversation"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Prix</span>
                <span className="text-right text-white">{details?.price ?? 0} EUR</span>
              </div>
              {details?.bookingId && (
                <div className="mt-3 flex items-center justify-between">
                  <span>Reference</span>
                  <span className="text-right text-white">#{details.bookingId.slice(0, 8)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="px-card p-6">
            <h3 className="text-lg text-white">Avant de partir au terrain</h3>
            <div className="mt-4 grid gap-3">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75"
                >
                  <span className="h-2 w-2 rounded-full bg-[color:var(--px-accent)]" />
                  {item}
                </div>
              ))}
            </div>

            {(details?.focusAreas.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {details?.focusAreas.map((focusArea) => (
                  <span key={focusArea} className="px-context-chip">
                    {focusArea}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-success)]/15">
                <CheckCircleIcon className="h-4 w-4 text-[color:var(--px-success)]" />
              </div>
              <div>
                <h3 className="text-lg text-white">Message preparatoire</h3>
                <p className="text-xs text-white/70">
                  A envoyer tel quel ou a personnaliser dans la conversation.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/75">
              {preparationMessage}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/65">
              <p>Un recapitulatif a ete envoye par e-mail.</p>
              <p className="mt-2">
                Le coach pourra confirmer les details de rendez-vous et d&apos;eventuelle reprogrammation dans
                la conversation.
              </p>
            </div>
          </div>
        </div>

        <div className="px-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg text-white">Etapes suivantes</h3>
              <p className="mt-1 text-sm text-white/70">
                Ajoute la seance a ton calendrier, puis ouvre la conversation pour verrouiller le contexte.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:flex">
              <button
                type="button"
                onClick={handleAddToCalendar}
                className="px-button inline-flex items-center justify-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Ajouter au calendrier
              </button>
              <Link href={messageHref} className="px-button-ghost text-center">
                Ouvrir la conversation
              </Link>
              <Link href={`/coach/${coachId}`} className="px-button-ghost text-center">
                Revoir le profil coach
              </Link>
              <Link href="/sessions" className="px-button-ghost text-center">
                Voir mes seances
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
