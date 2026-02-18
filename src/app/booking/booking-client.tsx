"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import type { AvailabilitySlot } from "@/lib/types";

const normalizeTime = (value: string) => (value.length >= 5 ? value.slice(0, 5) : value);

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
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastBookedCoachId, setLastBookedCoachId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data: coachData } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, price_per_session, availability")
        .order("rating", { ascending: false });

      if (!mounted) return;
      setCoaches(coachData ?? []);
      const fallbackCoachId = initialCoachId ?? coachData?.[0]?.id ?? "";
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
    if (!userId) return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, payment_status")
        .eq("player_id", userId)
        .order("created_at", { ascending: false });

      setBookings(data ?? []);
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

  const handleBook = async () => {
    if (!selectedCoach || !effectiveSelectedSlot) return;
    if (!userId) {
      setNotice({ type: "error", text: "Connecte-toi pour réserver une séance." });
      return;
    }

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
      price: String(selectedCoach.price_per_session ?? 0),
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
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="px-card-strong p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl text-white">Sélection du coach</h3>
                <p className="mt-1 text-xs text-white/60">Réservation automatique si disponible.</p>
              </div>
              <Link href="/coach" className="px-button-ghost">
                Voir les coachs
              </Link>
            </div>
            <select
              className="px-select mt-4"
              value={selectedCoachId}
              onChange={(event) => handleCoachChange(event.target.value)}
              disabled={loading}
            >
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name} · {coach.speciality}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-2">
              {availableSlots.length === 0 && !loading && (
                <p className="text-sm text-white/50">Aucun créneau disponible pour ce coach.</p>
              )}
              {availableSlots.map((slot) => {
                const isSelected =
                  effectiveSelectedSlot?.date === slot.date && effectiveSelectedSlot?.time === slot.time;
                return (
                  <button
                    key={`${slot.date}-${slot.time}`}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                      isSelected
                        ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-white"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-[color:var(--px-accent)]"
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <span>{formatSlotLabel(slot)}</span>
                    <span className="text-[color:var(--px-accent)]">{selectedCoach?.price_per_session ?? 0}€</span>
                  </button>
                );
              })}
            </div>
            {notice && (
              <div
                className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
                  notice.type === "success"
                    ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                    : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                }`}
              >
                {notice.text}
              </div>
            )}
          </div>
          <div className="px-card p-6">
            <h3 className="text-lg text-white">Dernières réservations</h3>
            <p className="mt-1 text-xs text-white/60">{bookings.length} réservations confirmées.</p>
            <div className="mt-4 space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="text-white">Réservation #{booking.id}</p>
                  <p className="text-xs text-white/50">Paiement: {booking.payment_status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
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
              disabled={!effectiveSelectedSlot}
            >
              Confirmer la réservation
            </button>
            {lastBookedCoachId && (
              <Link href={`/messages?coach=${lastBookedCoachId}`} className="px-button-ghost mt-3 w-full text-center">
                Ouvrir la conversation
              </Link>
            )}
            <p className="mt-3 text-xs text-white/50">
              Paiement direct : le coach est payé immédiatement après confirmation.
            </p>
          </div>
          <div className="px-card p-6">
            <h3 className="text-lg text-white">Connexion requise</h3>
            <p className="mt-2 text-sm text-white/60">
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
