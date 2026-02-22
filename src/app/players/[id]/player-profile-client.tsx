"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import Breadcrumbs from "@/components/breadcrumbs";
import { MapPinIcon, StarIcon } from "@/components/icons";
import { Notice, type NoticeData } from "@/components/notice";
import { normalizeTime } from "@/lib/booking";
import { formatLongDate } from "@/lib/date";
import { getAverageRating, getReviewTotal } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";

type PlayerRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  objectives: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number | null;
};

type ReviewRow = {
  id: string;
  session_id?: string | null;
  coach_name: string | null;
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

export default function PlayerProfileClient() {
  const params = useParams();
  const playerId = typeof params.id === "string" ? params.id : "";

  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [eligibleReviewSessions, setEligibleReviewSessions] = useState<EligibleSessionRow[]>([]);
  const [selectedReviewSessionId, setSelectedReviewSessionId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewNotice, setReviewNotice] = useState<NoticeData>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPlayer = async () => {
      if (!playerId) return;
      setLoading(true);
      const { data: playerData } = await supabase
        .from("public_players")
        .select("user_id, first_name, last_name, city, level, position, objectives, avatar_url, rating, reviews_count")
        .eq("user_id", playerId)
        .single();

      const { data: reviewsData } = await supabase
        .from("public_player_reviews")
        .select("id, coach_name, rating, comment, date")
        .eq("player_id", playerId)
        .order("date", { ascending: false });

      const { data: userData } = await supabase.auth.getUser();
      const role = (userData.user?.user_metadata?.role as string | undefined) ?? null;
      if (role === "coach" && userData.user) {
        const { data: coachData } = await supabase
          .from("coaches")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();
        const resolvedCoachId = coachData?.id ?? null;
        if (mounted) {
          setCoachId(resolvedCoachId);
        }

        if (resolvedCoachId) {
          const { data: completedSessions } = await supabase
            .from("sessions")
            .select("id, title, date, time")
            .eq("coach_id", resolvedCoachId)
            .eq("player_id", playerId)
            .eq("status", "completed")
            .order("date", { ascending: false });

          const { data: existingReviews } = await supabase
            .from("player_reviews")
            .select("session_id")
            .eq("coach_id", resolvedCoachId)
            .eq("player_id", playerId)
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
        }
      } else if (mounted) {
        setEligibleReviewSessions([]);
        setSelectedReviewSessionId("");
      }

      if (!mounted) return;
      setPlayer(playerData ?? null);
      setReviews(reviewsData ?? []);
      setLoading(false);
    };

    fetchPlayer();
    return () => {
      mounted = false;
    };
  }, [playerId]);

  const reviewsTotal = getReviewTotal(reviews, player?.reviews_count ?? 0);
  const computedRating = getAverageRating(reviews, player?.rating ?? 0);

  const playerName = useMemo(() => {
    if (!player) return "";
    return [player.first_name, player.last_name].filter(Boolean).join(" ") || "Joueur";
  }, [player]);

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coachId || !player) {
      setReviewNotice({ type: "error", text: "Connexion coach requise pour noter." });
      return;
    }
    if (!selectedReviewSessionId) {
      setReviewNotice({ type: "error", text: "Aucune séance terminée à noter." });
      return;
    }
    const { error } = await supabase.from("player_reviews").insert({
      player_id: player.user_id,
      coach_id: coachId,
      session_id: selectedReviewSessionId,
      rating: reviewRating,
      comment: reviewComment,
    });

    if (error) {
      setReviewNotice({ type: "error", text: error.message });
      return;
    }

    setReviews((prev) => [
      {
        id: `local-${Date.now()}`,
        session_id: selectedReviewSessionId,
        coach_name: "Coach",
        rating: reviewRating,
        comment: reviewComment,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    const remainingSessions = eligibleReviewSessions.filter(
      (session) => session.id !== selectedReviewSessionId,
    );
    setEligibleReviewSessions(remainingSessions);
    setSelectedReviewSessionId(remainingSessions[0]?.id ?? "");
    setReviewComment("");
    setReviewRating(5);
    setReviewNotice({ type: "success", text: "Avis ajouté." });
  };

  if (loading) {
    return (
      <AppShell active="/players" title="Profil joueur" description="Chargement du profil...">
        <p className="text-sm text-white/50">Chargement...</p>
      </AppShell>
    );
  }

  if (!player) {
    return (
      <AppShell active="/players" title="Profil joueur" description="Joueur introuvable.">
        <p className="text-sm text-white/50">Ce joueur n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href="/players" className="px-button mt-4">
          Retour aux joueurs
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="/players"
      title={`Joueur ${playerName}`}
      description="Profil complet du joueur avec objectifs et avis."
    >
      <Breadcrumbs items={[
        { label: "Accueil", href: "/" },
        { label: "Joueurs", href: "/players" },
        { label: playerName },
      ]} />
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="px-card-strong space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Profil joueur</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/60 text-base font-semibold text-white">
                  {player.avatar_url ? (
                    <Image src={player.avatar_url} alt={playerName} fill sizes="56px" className="object-cover" />
                  ) : (
                    playerName
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-3xl text-white">{playerName}</h2>
                  <p className="text-sm text-white/60">{player.level ?? "Niveau non defini"}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                <MapPinIcon className="h-4 w-4" />
                {player.city ?? "Ville non definie"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Poste</p>
              <p className="text-3xl font-semibold text-white">{player.position ?? "N/A"}</p>
            </div>
          </div>
          <div className="px-divider" />
          <p className="text-white/70">{player.objectives ?? "Objectifs en cours de definition."}</p>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Note moyenne</p>
              <div className="mt-2 flex items-center gap-2">
                {renderStars(computedRating)}
                <span className="text-sm text-white/60">{computedRating.toFixed(1)} / 5</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Avis</p>
              <p className="mt-2 text-2xl text-white">{reviewsTotal}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/players" className="px-button-ghost">
              Retour aux joueurs
            </Link>
          </div>
        </div>
        <div className="px-card space-y-4 p-6">
          <h3 className="text-2xl text-white">Avis coaches</h3>
          {coachId && (
            <form className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={handleReviewSubmit}>
              <label className="text-xs text-white/60">Séance terminée</label>
              <select
                className="px-select"
                value={selectedReviewSessionId}
                onChange={(event) => setSelectedReviewSessionId(event.target.value)}
                required
              >
                {eligibleReviewSessions.length === 0 && (
                  <option value="">Aucune séance terminée disponible</option>
                )}
                {eligibleReviewSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {formatLongDate(new Date(`${session.date}T12:00`))} · {normalizeTime(session.time)}
                  </option>
                ))}
              </select>
              <label className="text-xs text-white/60">Note</label>
              <select
                className="px-select"
                value={reviewRating}
                onChange={(event) => setReviewRating(Number(event.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none"
                placeholder="Commentaire"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
              />
              <Notice notice={reviewNotice} />
              <button className="px-button w-full" type="submit">
                Publier l&apos;avis
              </button>
            </form>
          )}
          {!coachId && (
            <p className="text-sm text-white/50">Connecte-toi en coach pour laisser un avis.</p>
          )}
          <div className="space-y-3">
            {reviews.length === 0 && <p className="text-sm text-white/50">Aucun avis pour le moment.</p>}
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <p className="text-sm font-semibold text-white">{review.coach_name ?? "Coach"}</p>
                  <span>{review.date ? formatLongDate(new Date(`${review.date}T12:00`)) : ""}</span>
                </div>
                <div className="mt-2">{renderStars(review.rating)}</div>
                <p className="mt-3 text-sm text-white/70">{review.comment ?? ""}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
