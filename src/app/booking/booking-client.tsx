"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { FeedbackState, LoadingState } from "@/components/feedback-state";
import { AlertIcon, CalendarIcon, CheckCircleIcon, WhistleIcon } from "@/components/icons";
import { Notice, type NoticeData } from "@/components/notice";
import SlotCalendar from "@/components/slot-calendar";
import { normalizeTime } from "@/lib/booking";
import {
  createBookingReservation,
  getBookingPageData,
  getReservedCoachSessions,
} from "@/lib/data/booking";
import type { BookingRecord, CoachRecord } from "@/lib/data/types";
import { addDays, formatLongDate, startOfWeek, toISODate } from "@/lib/date";
import {
  buildPreparationMessage,
  buildSessionChecklist,
  getCoachAudienceLabel,
  getCoachBestForLabel,
  getCoachStyleLabel,
} from "@/lib/football-surface";
import type { AvailabilitySlot } from "@/lib/types";

const formatSlotLabel = (slot: AvailabilitySlot) => {
  const date = new Date(`${slot.date}T12:00`);
  return `${formatLongDate(date)} - ${slot.time}`;
};

export default function BookingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoachId = searchParams.get("coach");
  const initialDate = searchParams.get("date");
  const initialTime = searchParams.get("time");

  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [sessions, setSessions] = useState<{ date: string; time: string; status: string }[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [lastBookedCoachId, setLastBookedCoachId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const result = await getBookingPageData();

      if (!mounted) return;

      setCoaches(result.data.coaches);
      setBookings(result.data.bookings);
      setUserId(result.data.userId);
      setSelectedCoachId(initialCoachId ?? result.data.coaches[0]?.id ?? "");
      setIsDemo(result.mode === "demo");
      setLoading(false);
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [initialCoachId]);

  useEffect(() => {
    if (!selectedCoachId) return;

    const fetchSessions = async () => {
      const result = await getReservedCoachSessions(selectedCoachId);
      setSessions(result.data);
    };

    fetchSessions();
  }, [selectedCoachId]);

  const selectedCoach = useMemo(
    () => coaches.find((coach) => coach.id === selectedCoachId) ?? null,
    [coaches, selectedCoachId],
  );

  const selectedCoachFocusAreas = useMemo(
    () => selectedCoach?.focusAreas.slice(0, 3) ?? [],
    [selectedCoach?.focusAreas],
  );
  const selectedCoachSessionFormats = useMemo(
    () => selectedCoach?.sessionFormats.slice(0, 3) ?? [],
    [selectedCoach?.sessionFormats],
  );
  const selectedCoachCertifications = useMemo(
    () => selectedCoach?.certifications.slice(0, 2) ?? [],
    [selectedCoach?.certifications],
  );
  const coachStyleLabel = useMemo(
    () => getCoachStyleLabel(selectedCoach?.speciality ?? "", selectedCoach?.pedagogy ?? null),
    [selectedCoach?.pedagogy, selectedCoach?.speciality],
  );
  const coachAudienceLabel = useMemo(
    () =>
      getCoachAudienceLabel(
        selectedCoach?.sessionFormats ?? [],
        selectedCoach?.experienceYears ?? null,
      ),
    [selectedCoach?.experienceYears, selectedCoach?.sessionFormats],
  );
  const coachBestForLabel = useMemo(
    () =>
      getCoachBestForLabel(
        selectedCoach?.speciality ?? "",
        selectedCoach?.focusAreas ?? [],
      ),
    [selectedCoach?.focusAreas, selectedCoach?.speciality],
  );

  const availableSlots = useMemo(() => {
    const availability = selectedCoach?.availability ?? [];

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

  const weekSlots = useMemo(() => {
    const weekStartKey = toISODate(weekStart);
    const weekEndKey = toISODate(addDays(weekStart, 6));
    return availableSlots.filter(
      (slot) => slot.date >= weekStartKey && slot.date <= weekEndKey,
    );
  }, [availableSlots, weekStart]);

  const preselectedSlot = useMemo(() => {
    if (!initialDate || !initialTime) return null;

    return (
      availableSlots.find(
        (slot) => slot.date === initialDate && normalizeTime(slot.time) === normalizeTime(initialTime),
      ) ?? null
    );
  }, [availableSlots, initialDate, initialTime]);

  const effectiveSelectedSlot = selectedSlot ?? preselectedSlot;
  const selectedSlotLabel = effectiveSelectedSlot ? formatSlotLabel(effectiveSelectedSlot) : null;
  const sessionChecklist = useMemo(
    () =>
      buildSessionChecklist(
        selectedCoach?.speciality ?? "",
        selectedCoach?.sessionFormats ?? [],
        selectedCoach?.focusAreas ?? [],
      ),
    [selectedCoach?.focusAreas, selectedCoach?.sessionFormats, selectedCoach?.speciality],
  );
  const preparationMessage = useMemo(
    () =>
      selectedCoach && selectedSlotLabel
        ? buildPreparationMessage(selectedCoach.name, selectedSlotLabel, selectedCoachFocusAreas)
        : "",
    [selectedCoach, selectedCoachFocusAreas, selectedSlotLabel],
  );
  const bookingStep = useMemo(() => {
    if (!selectedCoachId) return 1;
    if (!effectiveSelectedSlot) return 2;
    return 3;
  }, [effectiveSelectedSlot, selectedCoachId]);

  const handleBook = async () => {
    if (!selectedCoach || !effectiveSelectedSlot) return;

    if (!userId) {
      setNotice({ type: "error", text: "Connecte-toi pour reserver une seance." });
      return;
    }

    setBooking(true);

    const bookingResult = await createBookingReservation({
      coachId: selectedCoach.id,
      slot: effectiveSelectedSlot,
      userId,
    });

    if ("error" in bookingResult) {
      setNotice({ type: "error", text: bookingResult.error });
      setBooking(false);
      return;
    }

    setSessions((current) => [
      {
        date: effectiveSelectedSlot.date,
        time: normalizeTime(effectiveSelectedSlot.time),
        status: "upcoming",
      },
      ...current,
    ]);
    setBookings((current) => [
      {
        id: bookingResult.bookingId,
        sessionId: bookingResult.sessionId,
        playerId: userId,
        coachId: selectedCoach.id,
        createdAt: new Date().toISOString(),
        price: selectedCoach.pricePerSession ?? 0,
        paymentStatus: "paid",
      },
      ...current,
    ]);
    setLastBookedCoachId(selectedCoach.id);
    setSelectedSlot(null);
    setNotice({ type: "success", text: "Seance reservee. Redirection vers la confirmation..." });

    const nextParams = new URLSearchParams({
      coach: selectedCoach.id,
      coachName: selectedCoach.name,
      date: effectiveSelectedSlot.date,
      time: normalizeTime(effectiveSelectedSlot.time),
      bookingId: bookingResult.bookingId,
    });

    if (bookingResult.conversationId) {
      nextParams.set("conversationId", bookingResult.conversationId);
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
      title="Reservation"
      description="Choisis un coach, un creneau disponible et confirme ta seance."
    >
      <section className="px-card px-stack-2 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg text-white">Parcours de reservation</h2>
          <span className="px-pill">Etape {bookingStep} / 3</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { id: 1, label: "Coach", icon: <WhistleIcon className="h-4 w-4" /> },
            { id: 2, label: "Creneau", icon: <CalendarIcon className="h-4 w-4" /> },
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
                <h3 className="text-xl text-white">Selection du coach</h3>
                <p className="mt-1 text-xs text-white/70">Reservation automatique si le creneau est libre.</p>
              </div>
              <Link
                href={selectedCoach ? `/coach/${selectedCoach.id}` : "/coach"}
                className="px-button-ghost"
              >
                {selectedCoach ? "Voir le profil coach" : "Voir les coachs"}
              </Link>
            </div>

            <label htmlFor="booking-coach-select" className="sr-only">
              Selectionner un coach
            </label>
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
                  {coach.name} - {coach.speciality}
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-3">
              {loading && (
                <LoadingState
                  title="Chargement des disponibilites"
                  description="Nous recuperons les creneaux de ce coach."
                />
              )}

              {!loading && coaches.length === 0 && (
                <FeedbackState
                  icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-warning)]" />}
                  title="Aucun coach disponible"
                  description="Ajoute des coachs dans la base pour activer la reservation."
                  actionLabel="Voir les coachs"
                  actionHref="/coach"
                />
              )}

              {availableSlots.length === 0 && !loading && coaches.length > 0 && (
                <FeedbackState
                  icon={<CalendarIcon className="h-7 w-7 text-white/35" />}
                  title="Aucun creneau disponible"
                  description="Ce coach n'a plus de creneau libre pour le moment."
                />
              )}

              {!loading && availableSlots.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className="px-button-ghost"
                      type="button"
                      onClick={() => setWeekStart((previous) => addDays(previous, -7))}
                    >
                      {"<"}
                    </button>
                    <span className="px-pill text-xs">Semaine du {formatLongDate(weekStart)}</span>
                    <button
                      className="px-button-ghost"
                      type="button"
                      onClick={() => setWeekStart((previous) => addDays(previous, 7))}
                    >
                      {">"}
                    </button>
                  </div>
                  <SlotCalendar
                    slots={weekSlots}
                    selectedSlot={effectiveSelectedSlot}
                    onSelectSlot={setSelectedSlot}
                    weekStart={weekStart}
                  />
                </>
              )}
            </div>

            <div className="mt-4">
              <Notice notice={notice} />
            </div>
          </div>

          {selectedCoach && (
            <div className="px-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="px-role-kicker text-[color:var(--px-accent)]">Pourquoi ce coach</p>
                  <h3 className="mt-2 text-lg text-white">{selectedCoach.name}</h3>
                  <p className="mt-1 text-sm text-white/70">{selectedCoach.speciality}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-context-chip" data-tone="role">
                    {coachStyleLabel}
                  </span>
                  <span className="px-context-chip">{coachBestForLabel}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="px-role-stat">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Format</p>
                  <p className="mt-2 text-sm text-white">
                    {selectedCoachSessionFormats[0] ?? "Seance individuelle"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">{coachAudienceLabel}</p>
                </div>
                <div className="px-role-stat">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Experience</p>
                  <p className="mt-2 text-sm text-white">
                    {selectedCoach.experienceYears
                      ? `${selectedCoach.experienceYears} ans terrain`
                      : "Profil en cours d'enrichissement"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {selectedCoachCertifications[0] ?? "Diplomes visibles sur le profil"}
                  </p>
                </div>
                <div className="px-role-stat">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Lieu</p>
                  <p className="mt-2 text-sm text-white">
                    {selectedCoach.location ?? selectedCoach.department ?? "Lieu confirme apres validation"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {selectedCoachFocusAreas[0] ?? "Focus defini avec le coach"}
                  </p>
                </div>
              </div>

              {(selectedCoachFocusAreas.length > 0 || selectedCoachSessionFormats.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCoachFocusAreas.map((focusArea) => (
                    <span key={focusArea} className="px-context-chip">
                      {focusArea}
                    </span>
                  ))}
                  {selectedCoachSessionFormats.map((format) => (
                    <span key={format} className="px-context-chip">
                      {format}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="px-card p-6">
            <h3 className="text-lg text-white">Dernieres reservations</h3>
            <p className="mt-1 text-xs text-white/70">{bookings.length} reservations confirmees.</p>

            <div className="mt-4 space-y-3">
              {bookings.length === 0 && (
                <FeedbackState
                  icon={<CalendarIcon className="h-7 w-7 text-white/35" />}
                  title="Aucune reservation"
                  description="Tes reservations confirmees apparaitront ici."
                />
              )}

              {bookings.slice(0, 3).map((bookingRow) => (
                <div
                  key={bookingRow.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition duration-200 hover:border-[color:var(--px-accent)]/30"
                >
                  <p className="text-white">Reservation confirmee</p>
                  <p className="text-xs text-white/70">
                    Paiement :{" "}
                    {bookingRow.paymentStatus === "paid"
                      ? "Paye"
                      : bookingRow.paymentStatus === "pending"
                        ? "En attente"
                        : bookingRow.paymentStatus}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-stack-3">
          <div className="px-card-strong p-6">
            <h3 className="text-xl text-white">Recapitulatif</h3>

            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Coach</span>
                <span className="text-white">{selectedCoach?.name ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Creneau</span>
                <span className="text-right text-white">
                  {effectiveSelectedSlot ? formatSlotLabel(effectiveSelectedSlot) : "Selectionne un creneau"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duree</span>
                <span className="text-white">{effectiveSelectedSlot?.durationMinutes ?? "-"} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lieu</span>
                <span className="text-right text-white">
                  {selectedCoach?.location ?? "Confirme apres validation"}
                </span>
              </div>
              <div className="px-divider" />
              <div className="flex items-center justify-between text-base">
                <span>Total</span>
                <span className="text-white">{selectedCoach?.pricePerSession ?? 0} EUR</span>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Avant la seance</p>
                <div className="mt-3 grid gap-2">
                  {sessionChecklist.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-white/75">
                      <span className="h-2 w-2 rounded-full bg-[color:var(--px-accent)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-divider" />

              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Message preparatoire</p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {preparationMessage || "Selectionne un creneau pour previsualiser le message de preparation."}
                </p>
              </div>
            </div>

            <button
              className="px-button mt-5 w-full"
              type="button"
              onClick={handleBook}
              disabled={!effectiveSelectedSlot || !selectedCoach || booking}
            >
              {booking ? (
                <>
                  <span className="px-spinner mr-2" /> Reservation en cours...
                </>
              ) : (
                "Confirmer la reservation"
              )}
            </button>

            {lastBookedCoachId && (
              <Link
                href={`/messages?coach=${lastBookedCoachId}${preparationMessage ? `&prefill=${encodeURIComponent(preparationMessage)}` : ""}`}
                className="px-button-ghost mt-3 w-full text-center"
              >
                Ouvrir la conversation
              </Link>
            )}

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/65">
              <p>Paiement direct : le coach est paye immediatement apres confirmation.</p>
              <p className="mt-2">
                Reprogrammation et details logistiques valides dans la conversation une fois la reservation
                confirmee.
              </p>
            </div>
          </div>

          <div className="px-card p-6">
            <h3 className="text-lg text-white">Connexion requise</h3>
            <p className="mt-2 text-sm text-white/70">
              {userId
                ? isDemo
                  ? "Tu es en mode demo."
                  : "Tu es connecte."
                : "Connecte-toi pour finaliser la reservation."}
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
