"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import ScrollReveal from "@/components/scroll-reveal";
import {
  ArrowRightIcon,
  BoltIcon,
  CalendarIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
  WhistleIcon,
} from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import {
  buildParentMetricBars,
  fetchParentChildOverview,
  parentOverviewFallback,
} from "@/lib/chart-data";
import { LOAD_RECOMMENDATION_LABELS } from "@/lib/football";
import { mockBookings, mockCoaches, mockParentChildren, mockSessions } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type { ParentChildSummary, ParentOverview, SessionFeedbackRecord } from "@/lib/types";

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  rating: number | null;
};

type SessionRow = {
  id: string;
  coach_id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  feedback?: SessionFeedbackRecord | null;
};

type ChildProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  position_family: ParentChildSummary["positionFamily"];
  age_category: ParentChildSummary["ageCategory"];
  dominant_foot: ParentChildSummary["dominantFoot"];
  current_club: string | null;
};

const getAge = (birthDate: string | null) => {
  if (!birthDate) return null;
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
};

export default function ParentDashboardPage() {
  const [coachCount, setCoachCount] = useState<number>(0);
  const [children, setChildren] = useState<ParentChildSummary[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [parentName, setParentName] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<ParentOverview>(parentOverviewFallback);
  const [linkCode, setLinkCode] = useState("");
  const [linkNotice, setLinkNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [legacyChildHint, setLegacyChildHint] = useState<Partial<ParentChildSummary> | null>(null);

  const activeChild = useMemo(
    () => children.find((child) => child.userId === activeChildId) ?? null,
    [activeChildId, children],
  );

  const metricBars = useMemo(() => buildParentMetricBars(overview), [overview]);
  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status === "upcoming").slice(0, 4),
    [sessions],
  );

  useEffect(() => {
    let mounted = true;

    const applyDemoState = () => {
      if (!mounted) return;
      setIsDemo(true);
      setParentName("Marie Dupont");
      setChildren(mockParentChildren);
      setActiveChildId((current) => current ?? mockParentChildren[0]?.userId ?? null);
      setCoachCount(mockCoaches.length);
      setCoaches(
        mockCoaches.slice(0, 4).map((coach) => ({
          id: coach.id,
          name: coach.name,
          speciality: coach.speciality,
          rating: coach.rating,
        })),
      );
      setTotalSpent(mockBookings.reduce((sum, booking) => sum + booking.price, 0));
      setCompletedCount(mockSessions.filter((session) => session.status === "completed").length);
      setLoading(false);
    };

    const fetchParentHome = async () => {
      setLoading(true);
      setError(null);
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        applyDemoState();
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("user_id", userData.user.id)
        .single();

      const role = profileData?.role ?? null;
      if (role !== "parent" && role !== "club") {
        if (mounted) {
          setError("Accès réservé aux comptes parent.");
          setLoading(false);
        }
        return;
      }

      if (!mounted) return;
      setParentName(
        [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ") || "Parent",
      );

      const legacyMeta = userData.user.user_metadata ?? {};
      if (legacyMeta.child_first_name) {
        setLegacyChildHint({
          firstName: (legacyMeta.child_first_name as string) || "",
          lastName: (legacyMeta.child_last_name as string) || "",
          birthDate: (legacyMeta.child_birth_date as string) || null,
          level: (legacyMeta.child_level as string) || null,
          position: (legacyMeta.child_position as string) || null,
        });
      } else {
        setLegacyChildHint(null);
      }

      const { data: links } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", userData.user.id);

      const childIds = (links ?? []).map((link) => link.child_user_id as string);
      if (childIds.length === 0) {
        if (mounted) {
          setChildren([]);
          setActiveChildId(null);
          setSessions([]);
          setOverview(parentOverviewFallback);
          setCoachCount(0);
          setCompletedCount(0);
          setTotalSpent(0);
          setLoading(false);
        }
        return;
      }

      const [childProfilesRes, coachRes, bookingsRes, sessionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "user_id, first_name, last_name, birth_date, city, level, position, position_family, age_category, dominant_foot, current_club",
          )
          .in("user_id", childIds),
        supabase
          .from("public_coaches")
          .select("id, name, speciality, rating", { count: "exact" })
          .order("rating", { ascending: false })
          .limit(4),
        supabase
          .from("bookings")
          .select("price, player_id")
          .in("player_id", childIds)
          .eq("payment_status", "paid"),
        supabase
          .from("sessions")
          .select("id, status, player_id")
          .in("player_id", childIds),
      ]);

      if (!mounted) return;

      const mappedChildren = (childProfilesRes.data ?? []).map((row: ChildProfileRow) => ({
        userId: row.user_id,
        firstName: row.first_name ?? "Joueur",
        lastName: row.last_name ?? "",
        birthDate: row.birth_date,
        city: row.city,
        level: row.level,
        position: row.position,
        positionFamily: row.position_family ?? null,
        ageCategory: row.age_category ?? null,
        dominantFoot: row.dominant_foot ?? null,
        currentClub: row.current_club,
      }));

      setChildren(mappedChildren);
      setActiveChildId((current) =>
        current && mappedChildren.some((child) => child.userId === current)
          ? current
          : mappedChildren[0]?.userId ?? null,
      );
      setCoachCount(coachRes.count ?? coachRes.data?.length ?? 0);
      setCoaches(coachRes.data ?? []);
      setTotalSpent(bookingsRes.data?.reduce((sum, booking) => sum + (booking.price ?? 0), 0) ?? 0);
      setCompletedCount(
        sessionsRes.data?.filter((session) => session.status === "completed").length ?? 0,
      );
      setLoading(false);
    };

    fetchParentHome();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchChildData = async () => {
      if (!activeChildId) return;

      if (isDemo) {
        const demoSessions = mockSessions
          .filter((session) => session.playerId === activeChildId || activeChildId === mockParentChildren[0]?.userId)
          .map((session) => ({
            id: session.id,
            coach_id: session.coachId,
            title: session.title,
            date: session.date,
            time: session.time,
            status: session.status,
            feedback: session.feedback ?? null,
          }));
        if (!mounted) return;
        setSessions(demoSessions);
        setOverview(parentOverviewFallback);
        return;
      }

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, coach_id, title, date, time, status, feedback")
        .eq("player_id", activeChildId)
        .order("date", { ascending: true });

      if (!mounted) return;
      setSessions(sessionData ?? []);

      const childOverview = await fetchParentChildOverview(activeChildId);
      if (!mounted) return;
      setOverview(childOverview);
    };

    fetchChildData();
    return () => {
      mounted = false;
    };
  }, [activeChildId, isDemo]);

  const handleLinkChild = async () => {
    const trimmedCode = linkCode.trim().toUpperCase();
    if (!trimmedCode) {
      setLinkNotice({ type: "error", text: "Entre un code de liaison valide." });
      return;
    }

    const { error: linkError } = await supabase.rpc("link_parent_to_child", {
      p_code: trimmedCode,
    });

    if (linkError) {
      setLinkNotice({ type: "error", text: linkError.message });
      return;
    }

    setLinkCode("");
    setLinkNotice({ type: "success", text: "Compte joueur lie avec succes." });
    window.location.reload();
  };

  return (
    <AppShell active="/dashboard" hideTitle>
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Parent</span>
              {isDemo && <span className="px-pill">Mode demo</span>}
            </div>
            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Suivi{" "}
              <span className="px-gradient-text">parent.</span>
            </h1>
            <p
              className="px-fade-up max-w-xl text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Visualise la progression de tes enfants lies, les recommandations de charge et les prochaines seances.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/coach" className="px-button-ghost text-sm">
              <WhistleIcon className="h-4 w-4" />
              Trouver un coach
            </Link>
            <Link href="/booking" className="px-button text-sm">
              <BoltIcon className="h-4 w-4" />
              Reserver
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="px-card p-6">
          <p className="text-sm text-[color:var(--px-danger)]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-skeleton h-28 rounded-2xl" />
          ))}
          <div className="md:col-span-2 px-skeleton h-64 rounded-2xl" />
          <div className="px-skeleton h-64 rounded-2xl" />
        </div>
      ) : children.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="px-card-strong p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg text-white">Lier un compte joueur</h3>
                <p className="text-xs text-white/70">Demande le code temporaire genere depuis le profil du joueur.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                className="px-input"
                placeholder="Code de liaison"
                value={linkCode}
                onChange={(event) => setLinkCode(event.target.value.toUpperCase())}
              />
              <button className="px-button" type="button" onClick={handleLinkChild}>
                Lier le joueur
              </button>
            </div>
            {linkNotice && (
              <div
                className={`mt-4 rounded-xl border px-4 py-2 text-xs ${
                  linkNotice.type === "success"
                    ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                    : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                }`}
              >
                {linkNotice.text}
              </div>
            )}
          </div>

          <div className="px-card p-6">
            <h3 className="text-lg text-white">Transition legacy</h3>
            {legacyChildHint ? (
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Ancienne fiche detectee pour {legacyChildHint.firstName} {legacyChildHint.lastName}. Elle n&apos;est plus utilisee comme source principale: cree ou connecte maintenant un vrai compte joueur avec un code de liaison.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Aucun enfant lie pour le moment. Une fois un compte joueur connecte, tu retrouveras ici les seances, la progression et les recommandations coach.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <ScrollReveal>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">Enfants lies</span>
              {children.map((child) => (
                <button
                  key={child.userId}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    activeChildId === child.userId
                      ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                  onClick={() => setActiveChildId(child.userId)}
                >
                  {child.firstName} {child.lastName}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {activeChild && (
            <ScrollReveal>
              <div className="mb-6 px-card-strong p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                    <ShieldIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg text-white">
                      {activeChild.firstName} {activeChild.lastName}
                    </h3>
                    <p className="text-xs text-white/70">
                      {activeChild.currentClub || "Compte joueur lie"} {parentName ? `· suivi par ${parentName.split(" ")[0]}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getAge(activeChild.birthDate) !== null && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {getAge(activeChild.birthDate)} ans
                    </span>
                  )}
                  {activeChild.ageCategory && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {activeChild.ageCategory}
                    </span>
                  )}
                  {activeChild.level && (
                    <span className="rounded-full border border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/10 px-3 py-1 text-xs text-[color:var(--px-warning)]">
                      {activeChild.level}
                    </span>
                  )}
                  {activeChild.position && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {activeChild.position}
                    </span>
                  )}
                  {activeChild.dominantFoot && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {activeChild.dominantFoot}
                    </span>
                  )}
                </div>
              </div>
            </ScrollReveal>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Enfants lies", value: children.length, icon: <UserIcon className="h-5 w-5" />, color: "text-[color:var(--px-accent)]" },
              { label: "Seances terminees", value: completedCount, icon: <BoltIcon className="h-5 w-5" />, color: "text-[color:var(--px-success)]" },
              { label: "Total investi", value: `${totalSpent}€`, icon: <CalendarIcon className="h-5 w-5" />, color: "text-[color:var(--px-warning)]" },
              { label: "Coachs visibles", value: coachCount, icon: <StarIcon className="h-5 w-5" />, color: "text-[color:var(--px-accent)]" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 60}>
                <div className="px-card flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card p-6">
                  <h3 className="mb-5 text-base font-semibold text-[color:var(--px-text)]">Suivi de progression</h3>
                  <div className="space-y-5">
                    {metricBars.map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm text-[color:var(--px-text-secondary)]">{metric.label}</span>
                          <span className="text-sm font-semibold text-[color:var(--px-text)]">{metric.value}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Seances a venir</h3>
                    <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  {upcomingSessions.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">Aucune seance programmee pour cet enfant.</p>
                      <Link href="/booking" className="px-button mt-4 text-sm">
                        Reserver une seance
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                              <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{session.title}</p>
                              <p className="text-xs text-white/70">
                                {formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-accent)]">
                            A venir
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card p-6">
                  <h3 className="text-lg text-white">Recommandation coach</h3>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Charge actuelle</p>
                    <p className="mt-2 text-lg text-white">
                      {LOAD_RECOMMENDATION_LABELS[overview.lastLoadRecommendation]}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50">Prochain focus</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{overview.nextFocus}</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Top coachs</h3>
                    <Link href="/coach" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {coaches.map((coach) => (
                      <div
                        key={coach.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-transparent text-white/70">
                            <WhistleIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{coach.name}</p>
                            <p className="text-xs text-white/70">{coach.speciality}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{coach.rating?.toFixed(1) ?? "-"}</p>
                          <Link href={`/coach/${coach.id}`} className="text-xs text-[color:var(--px-accent)] hover:underline">
                            Voir profil
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="px-card p-6">
                  <h3 className="text-lg text-white mb-4">Actions parent</h3>
                  <div className="grid gap-3">
                    <Link href="/booking" className="px-button inline-flex items-center gap-2">
                      <BoltIcon className="h-4 w-4" />
                      Reserver une seance
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                    <Link href="/messages" className="px-button-ghost inline-flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Ecrire a un coach
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
