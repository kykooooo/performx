"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import Breadcrumbs from "@/components/breadcrumbs";
import { CheckCircleIcon, MapPinIcon, StarIcon } from "@/components/icons";
import { Notice, type NoticeData } from "@/components/notice";
import { getAvailableSlots, normalizeTime } from "@/lib/booking";
import { getCoachAvatarUrl } from "@/lib/coach-avatars";
import { formatLongDate } from "@/lib/date";
import { getAverageRating, getReviewTotal } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";
import { mockCoaches, mockReviews } from "@/lib/mock-data";
import type { AvailabilitySlot, Session } from "@/lib/types";

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  bio: string | null;
  location: string | null;
  department: string | null;
  diplomas: string[] | null;
  experience: number | null;
  price_per_session: number | null;
  rating: number | null;
  reviews_count: number | null;
  availability: AvailabilitySlot[] | null;
  avatar_url: string | null;
};

type ReviewRow = {
  id: string;
  session_id?: string | null;
  player_name: string | null;
  rating: number;
  comment: string | null;
  date: string | null;
};

type EligibleSessionRow = {
  id: string;
  title: string;
  date: string;
  time: string;
};

const renderStars = (rating: number) => {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1 text-[color:var(--px-accent)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} className={index < full ? "h-4 w-4" : "h-4 w-4 opacity-30"} />
      ))}
    </div>
  );
};

export default function CoachProfileClient() {
  const params = useParams();
  const coachId = typeof params.id === "string" ? params.id : "";

  const [coach, setCoach] = useState<CoachRow | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedReviewSessionId, setSelectedReviewSessionId] = useState("");
  const [eligibleReviewSessions, setEligibleReviewSessions] = useState<EligibleSessionRow[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewNotice, setReviewNotice] = useState<NoticeData>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchCoach = async () => {
      if (!coachId) return;
      setLoading(true);
      const { data: coachData } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, bio, location, price_per_session, rating, reviews_count, availability, avatar_url")
        .eq("id", coachId)
        .single();

      const { data: reviewsData } = await supabase
        .from("public_reviews")
        .select("id, player_name, rating, comment, date")
        .eq("coach_id", coachId)
        .order("date", { ascending: false });

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("public_sessions")
        .select("coach_id, date, time, status")
        .eq("coach_id", coachId);

      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(userData.user?.id ?? null);

      if (userData.user?.id) {
        const { data: completedSessions } = await supabase
          .from("sessions")
          .select("id, title, date, time")
          .eq("player_id", userData.user.id)
          .eq("coach_id", coachId)
          .eq("status", "completed")
          .order("date", { ascending: false });

        const { data: existingReviews } = await supabase
          .from("reviews")
          .select("session_id")
          .eq("player_id", userData.user.id)
          .eq("coach_id", coachId)
          .not("session_id", "is", null);

        const reviewedSessionIds = new Set(
          (existingReviews ?? [])
            .map((row) => row.session_id as string | null)
            .filter((id): id is string => Boolean(id)),
        );
        const filteredSessions = (completedSessions ?? []).filter(
          (session) => !reviewedSessionIds.has(session.id),
        );
        if (mounted) {
          setEligibleReviewSessions(filteredSessions);
          setSelectedReviewSessionId(filteredSessions[0]?.id ?? "");
        }
      } else if (mounted) {
        setEligibleReviewSessions([]);
        setSelectedReviewSessionId("");
      }

      if (!mounted) return;

      if (coachData) {
        setCoach({
          ...coachData,
          department: null,
          diplomas: null,
          experience: null,
        });
        setReviews(reviewsData ?? []);
      } else {
        const mock = mockCoaches.find((c) => c.id === coachId);
        if (mock) {
          setCoach({
            id: mock.id,
            name: mock.name,
            speciality: mock.speciality,
            bio: mock.bio,
            location: mock.location,
            department: mock.department ?? null,
            diplomas: mock.diplomas ?? null,
            experience: mock.experience ?? null,
            price_per_session: mock.pricePerSession,
            rating: mock.rating,
            reviews_count: mock.reviews,
            availability: mock.availability,
            avatar_url: null,
          });
          setReviews(
            mockReviews
              .filter((r) => r.coachId === coachId)
              .map((r) => ({
                id: r.id,
                player_name: r.playerName,
                rating: r.rating,
                comment: r.comment,
                date: r.date,
              })),
          );
        } else {
          setCoach(null);
          setReviews([]);
        }
      }
      if (!sessionsError) {
        setSessions(
          (sessionsData ?? []).map((row, index) => ({
            id: `public-${index}`,
            coachId: coachId,
            playerId: "",
            title: "",
            date: row.date,
            time: row.time,
            durationMinutes: 60,
            status: row.status,
          })),
        );
      } else {
        setSessions([]);
      }
      setLoading(false);
    };

    fetchCoach();
    return () => {
      mounted = false;
    };
  }, [coachId]);

  const reviewsTotal = getReviewTotal(reviews, coach?.reviews_count ?? 0);
  const computedRating = getAverageRating(reviews, coach?.rating ?? 0);
  const coachAvatar = coach ? getCoachAvatarUrl(coach.avatar_url, `${coach.name}-${coach.id}`) : null;

  const availableSlots = useMemo(() => {
    if (!Array.isArray(coach?.availability)) return [] as AvailabilitySlot[];
    return getAvailableSlots({
      id: coach.id,
      userId: "",
      name: coach.name,
      speciality: coach.speciality,
      bio: coach.bio ?? "",
      location: coach.location ?? "",
      pricePerSession: coach.price_per_session ?? 0,
      rating: coach.rating ?? 0,
      reviews: coach.reviews_count ?? 0,
      availability: coach.availability ?? [],
    }, sessions).slice(0, 6);
  }, [coach, sessions]);

  if (loading) {
    return (
      <AppShell active="/coach" title="Profil coach" description="Chargement du profil...">
        <p className="text-sm text-white/70">Chargement...</p>
      </AppShell>
    );
  }

  if (!coach) {
    return (
      <AppShell active="/coach" title="Profil coach" description="Coach introuvable.">
        <p className="text-sm text-white/70">Ce coach n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href="/coach" className="px-button mt-4">Retour aux coachs</Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="/coach"
      title={`Coach ${coach.name}`}
      description="Profil détaillé, avis, et disponibilités pour réserver votre séance privée."
    >
      <Breadcrumbs items={[
        { label: "Accueil", href: "/" },
        { label: "Coachs", href: "/coach" },
        { label: coach.name },
      ]} />
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="px-card-strong space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Spécialité</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/60 text-base font-semibold text-white">
                  {coachAvatar ? (
                    <Image src={coachAvatar} alt={coach.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    coach.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-3xl text-white">{coach.speciality}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/70">{coach.name}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-success)] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--px-success)]" />
                      </span>
                      <span className="text-[color:var(--px-success)]">En ligne</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                <MapPinIcon className="h-4 w-4" />
                {coach.location}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Tarif</p>
              <p className="text-3xl font-semibold text-white">{coach.price_per_session ?? 0}€</p>
              <p className="text-xs text-white/70">par séance</p>
            </div>
          </div>
          <div className="px-divider" />
          <p className="text-white/70">{coach.bio}</p>

          {/* Enriched info */}
          <div className="flex flex-wrap gap-2">
            {coach.department && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <MapPinIcon className="h-3.5 w-3.5" />
                {coach.department}
              </span>
            )}
            {coach.experience != null && coach.experience > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                {coach.experience} ans d&apos;expérience
              </span>
            )}
          </div>

          {coach.diplomas && coach.diplomas.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/70">Diplômes & certifications</p>
              <div className="flex flex-wrap gap-2">
                {coach.diplomas.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--px-accent)]/20 bg-[color:var(--px-accent)]/10 px-3 py-1 text-xs font-medium text-[color:var(--px-accent)]"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Note moyenne</p>
              <div className="mt-2 flex items-center gap-2">
                {renderStars(computedRating)}
                <span className="text-sm text-white/70">{computedRating.toFixed(1)} / 5</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Avis</p>
              <p className="mt-2 text-2xl text-white">{reviewsTotal}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/booking?coach=${coach.id}`} className="px-button">
              Réserver une séance
            </Link>
            <Link href={`/messages?coach=${coach.id}`} className="px-button-ghost">
              Message
            </Link>
            <Link href="/coach" className="px-button-ghost">
              Retour aux coachs
            </Link>
          </div>
        </div>
        <div className="px-card space-y-4 p-6">
          <h3 className="text-2xl text-white">Disponibilités à venir</h3>
          <div className="space-y-3">
            {availableSlots.length === 0 && (
              <p className="text-sm text-white/70">Aucun créneau disponible cette semaine.</p>
            )}
            {availableSlots.map((slot) => (
              <div
                key={`${slot.date}-${slot.time}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
              >
                <div>
                  <p className="text-white">{formatLongDate(new Date(`${slot.date}T12:00`))}</p>
                  <p className="text-xs text-white/70">{slot.time} · {slot.durationMinutes} min</p>
                </div>
                <Link
                  href={`/booking?coach=${coach.id}&date=${slot.date}&time=${slot.time}`}
                  className="px-button-ghost"
                >
                  Choisir
                </Link>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 text-xs text-white/70">
            Les créneaux affichés sont mis à jour automatiquement après chaque réservation.
          </div>
        </div>
      </section>

      <section className="px-card space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl text-white">Avis des joueurs</h3>
          <span className="px-pill">{reviewsTotal} avis</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white">Laisser un avis</p>
          <p className="mt-1 text-xs text-white/70">Connecte-toi pour publier ton retour.</p>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_auto]"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (!userId) {
                setReviewNotice({ type: "error", text: "Connecte-toi pour publier un avis." });
                return;
              }
              if (!selectedReviewSessionId) {
                setReviewNotice({ type: "error", text: "Termine une séance avec ce coach avant de noter." });
                return;
              }
              setSubmittingReview(true);
              const { data: profileData } = await supabase
                .from("profiles")
                .select("first_name, last_name")
                .eq("user_id", userId)
                .single();

              const playerName =
                [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ") || "Joueur";

              const { error } = await supabase.from("reviews").insert({
                coach_id: coach.id,
                player_id: userId,
                session_id: selectedReviewSessionId,
                player_name: playerName,
                rating: reviewRating,
                comment: reviewComment,
              });

              if (error) {
                setReviewNotice({ type: "error", text: error.message });
                setSubmittingReview(false);
                return;
              }

              setReviews((prev) => [
                {
                  id: `local-${Date.now()}`,
                  session_id: selectedReviewSessionId,
                  player_name: playerName,
                  rating: reviewRating,
                  comment: reviewComment,
                  date: new Date().toISOString().split("T")[0],
                },
                ...prev,
              ]);
              const remainingSessions = eligibleReviewSessions.filter(
                (session) => session.id !== selectedReviewSessionId,
              );
              setEligibleReviewSessions(remainingSessions);
              setSelectedReviewSessionId(remainingSessions[0]?.id ?? "");
              setReviewComment("");
              setReviewNotice({ type: "success", text: "Merci pour ton avis !" });
              setSubmittingReview(false);
            }}
          >
            <select
              className="px-select"
              value={selectedReviewSessionId}
              onChange={(event) => setSelectedReviewSessionId(event.target.value)}
              required
            >
              {eligibleReviewSessions.length === 0 && (
                <option value="">Aucune séance terminée à noter</option>
              )}
              {eligibleReviewSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {formatLongDate(new Date(`${session.date}T12:00`))} · {normalizeTime(session.time)}
                </option>
              ))}
            </select>
            <select
              className="px-select"
              value={reviewRating}
              onChange={(event) => setReviewRating(Number(event.target.value))}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}★
                </option>
              ))}
            </select>
            <input
              className="px-input"
              placeholder="Ton avis sur la séance"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              required
            />
            <button className="px-button" type="submit" disabled={submittingReview}>
              {submittingReview ? <><span className="px-spinner mr-2" /> Envoi...</> : "Publier"}
            </button>
          </form>
          <div className="mt-3">
            <Notice notice={reviewNotice} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{review.player_name ?? "Joueur"}</p>
                <span className="text-xs text-white/70">
                  {review.date ? formatLongDate(new Date(`${review.date}T12:00`)) : ""}
                </span>
              </div>
              <div className="mt-2">{renderStars(review.rating)}</div>
              <p className="mt-3 text-sm text-white/70">{review.comment ?? ""}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
