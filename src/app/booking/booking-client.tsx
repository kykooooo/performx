"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { FeedbackState, LoadingState } from "@/components/feedback-state";
import { AlertIcon, CalendarIcon, CheckCircleIcon, WhistleIcon } from "@/components/icons";
import { Notice, type NoticeData } from "@/components/notice";
import { normalizeTime } from "@/lib/booking";
import { formatLongDate } from "@/lib/date";
import { mockCoaches, mockBookings } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type { AvailabilitySlot } from "@/lib/types";

const formatSlotLabel = (slot: AvailabilitySlot) => {
  const date = new Date(`${slot.date}T12:00`);
  return `${formatLongDate(date)} · ${slot.time}`;
};

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  price_per_session: number | null;
  availability: AvailabilitySlot[] | null;
};

type BookingRow = {
  id: string;
  payment_status: string;
};

type BookingRpcRow = {
  session_id: string;
  booking_id: string;
  conversation_id: string;
};

export default function BookingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoachId = searchParams.get("coach");
  const initialDate = searchParams.get("date");
  const initialTime = searchParams.get("time");

  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [sessions, setSessions] = useState<{ date: string; time: string; status: string }[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [lastBookedCoachId, setLastBookedCoachId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data: coachData, error: coachError } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, price_per_session, availability")
        .order("rating", { ascending: false });

      if (!mounted) return;

      const rows: CoachRow[] =
        !coachError && coachData && coachData.length > 0
          ? coachData
          : mockCoaches.map((c) => ({
              id: c.id,
              name: c.name,
              speciality: c.speciality,
              price_per_session: c.pricePerSession,
              availability: c.availability,
            }));

      setCoaches(rows);
      const fallbackCoachId = initialCoachId ?? rows[0]?.id ?? "";
      setSelectedCoachId(fallbackCoachId);
      setLoading(false);
    };

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };

    fetchData();
    fetchUser();

    return () => {
      mounted = false;
    };
  }, [initialCoachId]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (userId) {
        const { data } = await supabase
          .from("bookings")
          .select("id, payment_status")
          .eq("player_id", userId)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setBookings(data);
          return;
        }
      }
      // Fallback mock bookings for demo
      setBookings(
        mockBookings.slice(0, 3).map((b) => ({
          id: b.id,
          payment_status: b.paymentStatus,
        })),
      );
    };

    fetchBookings();
  }, [userId]);

  useEffect(() => {
    if (!selectedCoachId) return;
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("public_sessions")
        .select("coach_id, date, time, status")
        .eq("coach_id", selectedCoachId);

      if (error) {
        setSessions([]);
        return;
      }

      setSessions(
        (data ?? []).map((row) => ({
          date: row.date,
          time: normalizeTime(row.time),
          status: row.status,
        })),
      );
    };

    fetchSessions();
  }, [selectedCoachId]);

  const selectedCoach = useMemo(
    () => coaches.find((coach) => coach.id === selectedCoachId),
    [coaches, selectedCoachId],
  );

  const availableSlots = useMemo(() => {
    const availability = Array.isArray(selectedCoach?.availability) ? selectedCoach?.availability : [];
    return availability.filter((slot) => {
      const normalized = normalizeTime(slot.time);
      return !sessions.some(
        (session) =>
          session.date === slot.date &&
          normalizeTime(session.time) === normalized &&
          session.status !== "cancelled",
      );
    });
  }, [selectedCoach, sessions]);

  const preselectedSlot = useMemo(() => {
    if (!initialDate || !initialTime) return null;
    return (
      availableSlots.find(
        (slot) => slot.date === initialDate && normalizeTime(slot.time) === normalizeTime(initialTime),
      ) ?? null
    );
  }, [availableSlots, initialDate, initialTime]);

  const effectiveSelectedSlot = selectedSlot ?? preselectedSlot;
  const bookingStep = useMemo(() => {
    if (!selectedCoachId) return 1;
    if (!effectiveSelectedSlot) return 2;
    return 3;
  }, [selectedCoachId, effectiveSelectedSlot]);

  const handleBook = async () => {
    if (!selectedCoach || !effectiveSelectedSlot) return;
    if (!userId) {
      setNotice({ type: "error", text: "Connecte-toi pour réserver une séance." });
      return;
    }

    setBooking(true);
    const { data: bookingPath, error: bookingPathError } = await supabase
      .rpc("create_booking_with_conversation", {
        p_coach_id: selectedCoach.id,
        p_date: effectiveSelectedSlot.date,
        p_time: normalizeTime(effectiveSelectedSlot.time),
        p_duration_minutes: effectiveSelectedSlot.durationMinutes,
      })
      .single();

    if (bookingPathError || !bookingPath) {
      const text =
        bookingPathError?.message?.includes("SLOT_ALREADY_BOOKED")
          ? "Ce créneau vient d'être réservé. Choisis un autre horaire."
          : bookingPathError?.message ?? "Impossible de réserver.";
      setNotice({ type: "error", text });
      setBooking(false);
      return;
    }

    const rpcData = bookingPath as BookingRpcRow;

    setSessions((prev) => [
      {
        date: effectiveSelectedSlot.date,
        time: normalizeTime(effectiveSelectedSlot.time),
        status: "upcoming",
      },
      ...prev,
    ]);
    setBookings((prev) => [{ id: rpcData.booking_id, payment_status: "paid" }, ...prev]);
    setLastBookedCoachId(selectedCoach.id);
    setSelectedSlot(null);
    setNotice({ type: "success", text: "Séance réservée. Redirection vers la confirmation..." });

    const nextParams = new URLSearchParams({
      coach: selectedCoach.id,
      coachName: selectedCoach.name,
      date: effectiveSelectedSlot.date,
      time: normalizeTime(effectiveSelectedSlot.time),
      bookingId: rpcData.booking_id,
    });
    if (rpcData.conversation_id) {
      nextParams.set("conversationId", rpcData.conversation_id);
    }
    router.push(`/booking/confirmation?${nextParams.toString()}`);
  };

  const handleCoachChange = (coachId: string) => {
    setSelectedCoachId(coachId);
    setSelectedSlot(null);
  };

  return (
    <AppShell
      active="/sessions"
      title="Réservation"
      description="Choisis un coach, un créneau disponible et confirme ta séance."
    >
      <section className="px-card px-stack-2 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg text-white">Parcours de réservation</h2>
          <span className="px-pill">Étape {bookingStep} / 3</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { id: 1, label: "Coach", icon: <WhistleIcon className="h-4 w-4" /> },
            { id: 2, label: "Créneau", icon: <CalendarIcon className="h-4 w-4" /> },
            { id: 3, label: "Validation", icon: <CheckCircleIcon className="h-4 w-4" /> },
          ].map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                bookingStep >= step.id
                  ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {step.icon}
              {step.label}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="px-stack-3">
          <div className="px-card-strong p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl text-white">Sélection du coach</h3>
                <p className="mt-1 text-xs text-white/70">Réservation automatique si disponible.</p>
              </div>
              <Link href="/coach" className="px-button-ghost">
                Voir les coachs
              </Link>
            </div>
            <label htmlFor="booking-coach-select" className="sr-only">Sélectionner un coach</label>
            <select
              id="booking-coach-select"
              className="px-select mt-4"
              value={selectedCoachId}
              onChange={(event) => handleCoachChange(event.target.value)}
              disabled={loading}
            >
              {coaches.length === 0 && <option value="">Aucun coach disponible</option>}
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name} · {coach.speciality}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-2">
              {loading && (
                <LoadingState
                  title="Chargement des disponibilités"
                  description="Nous récupérons les créneaux de ce coach."
                />
              )}
              {!loading && coaches.length === 0 && (
                <FeedbackState
                  icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-warning)]" />}
                  title="Aucun coach disponible"
                  description="Ajoute des coachs dans la base pour activer la réservation."
                  actionLabel="Voir les coachs"
                  actionHref="/coach"
                />
              )}
              {availableSlots.length === 0 && !loading && coaches.length > 0 && (
                <FeedbackState
                  icon={<CalendarIcon className="h-7 w-7 text-white/35" />}
                  title="Aucun créneau disponible"
                  description="Ce coach n'a plus de créneau libre pour le moment."
                />
              )}
              {availableSlots.map((slot) => {
                const isSelected =
                  effectiveSelectedSlot?.date === slot.date && effectiveSelectedSlot?.time === slot.time;
                return (
                  <button
                    key={`${slot.date}-${slot.time}`}
                    type="button"
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition duration-200 ${
                      isSelected
                        ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-white"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-[color:var(--px-accent)] hover:bg-white/10"
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <span>{formatSlotLabel(slot)}</span>
                    <span className="text-[color:var(--px-accent)]">{selectedCoach?.price_per_session ?? 0}€</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <Notice notice={notice} />
            </div>
          </div>
          <div className="px-card p-6">
            <h3 className="text-lg text-white">Dernières réservations</h3>
            <p className="mt-1 text-xs text-white/70">{bookings.length} réservations confirmées.</p>
            <div className="mt-4 space-y-3">
              {bookings.length === 0 && (
                <FeedbackState
                  icon={<CalendarIcon className="h-7 w-7 text-white/35" />}
                  title="Aucune réservation"
                  description="Tes réservations confirmées apparaîtront ici."
                />
              )}
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition duration-200 hover:border-[color:var(--px-accent)]/30">
                  <p className="text-white">Réservation confirmée</p>
                  <p className="text-xs text-white/70">Paiement : {booking.payment_status === "paid" ? "Payé" : booking.payment_status === "pending" ? "En attente" : booking.payment_status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-stack-3">
          <div className="px-card-strong p-6">
            <h3 className="text-xl text-white">Récapitulatif</h3>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Coach</span>
                <span className="text-white">{selectedCoach?.name ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Créneau</span>
                <span className="text-white">
                  {effectiveSelectedSlot ? formatSlotLabel(effectiveSelectedSlot) : "Sélectionne un créneau"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Durée</span>
                <span className="text-white">{effectiveSelectedSlot?.durationMinutes ?? "-"} min</span>
              </div>
              <div className="px-divider" />
              <div className="flex items-center justify-between text-base">
                <span>Total</span>
                <span className="text-white">{selectedCoach?.price_per_session ?? 0}€</span>
              </div>
            </div>
            <button
              className="px-button mt-5 w-full"
              type="button"
              onClick={handleBook}
              disabled={!effectiveSelectedSlot || !selectedCoach || booking}
            >
              {booking ? (
                <><span className="px-spinner mr-2" /> Réservation en cours...</>
              ) : (
                "Confirmer la réservation"
              )}
            </button>
            {lastBookedCoachId && (
              <Link href={`/messages?coach=${lastBookedCoachId}`} className="px-button-ghost mt-3 w-full text-center">
                Ouvrir la conversation
              </Link>
            )}
            <p className="mt-3 text-xs text-white/70">
              Paiement direct : le coach est payé immédiatement après confirmation.
            </p>
          </div>
          <div className="px-card p-6">
            <h3 className="text-lg text-white">Connexion requise</h3>
            <p className="mt-2 text-sm text-white/70">
              {userId ? "Tu es connecté." : "Connecte-toi pour finaliser la réservation."}
            </p>
            {!userId && (
              <Link href="/auth/login" className="px-button mt-4">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
