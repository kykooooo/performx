"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import ScrollReveal from "@/components/scroll-reveal";
import {
  CalendarIcon,
  StarIcon,
  BoltIcon,
  ArrowRightIcon,
  UserIcon,
  WhistleIcon,
  TrophyIcon,
  ChatIcon,
} from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { mockSessions, mockCoaches, mockBookings } from "@/lib/mock-data";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { playerSkills, playerProgression, CHART_COLORS } from "@/lib/chart-data";
import type { SessionFeedback } from "@/lib/types";

type SessionRow = {
  id: string;
  coach_id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: string;
  feedback?: SessionFeedback | null;
};

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  rating: number | null;
  price_per_session: number | null;
};

export default function PlayerDashboardPage() {
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [completed, setCompleted] = useState<SessionRow[]>([]);
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [coachMap, setCoachMap] = useState<Record<string, string>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        // Demo mode with mock data
        if (!mounted) return;
        const upcomingMock = mockSessions
          .filter((s) => s.status === "upcoming")
          .map((s) => ({
            id: s.id,
            coach_id: s.coachId,
            title: s.title,
            date: s.date,
            time: s.time,
            duration_minutes: s.durationMinutes,
            status: s.status,
          }));
        const completedMock = mockSessions
          .filter((s) => s.status === "completed")
          .map((s) => ({
            id: s.id,
            coach_id: s.coachId,
            title: s.title,
            date: s.date,
            time: s.time,
            duration_minutes: s.durationMinutes,
            status: s.status,
            feedback: s.feedback ?? null,
          }));
        const coachNames: Record<string, string> = {};
        mockCoaches.forEach((c) => { coachNames[c.id] = c.name; });

        setUpcoming(upcomingMock);
        setCompleted(completedMock);
        setCoachMap(coachNames);
        setCoaches(
          mockCoaches.slice(0, 4).map((c) => ({
            id: c.id,
            name: c.name,
            speciality: c.speciality,
            rating: c.rating,
            price_per_session: c.pricePerSession,
          })),
        );
        setTotalSpent(mockBookings.reduce((sum, b) => sum + b.price, 0));
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const userId = userData.user.id;

      // Fetch sessions
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, coach_id, title, date, time, duration_minutes, status")
        .eq("player_id", userId)
        .order("date", { ascending: true });

      // Fetch bookings for total spent
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("price")
        .eq("player_id", userId)
        .eq("payment_status", "paid");

      // Fetch coaches for recommendations
      const { data: coachData } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, rating, price_per_session")
        .order("rating", { ascending: false })
        .limit(4);

      if (!mounted) return;

      const sessions = sessionData ?? [];
      const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
      const completedSessions = sessions.filter((s) => s.status === "completed");

      // Build coach name map
      const names: Record<string, string> = {};
      if (coachData) {
        coachData.forEach((c) => { names[c.id] = c.name; });
      }

      setUpcoming(upcomingSessions);
      setCompleted(completedSessions);
      setCoachMap(names);
      setCoaches(coachData ?? []);
      setTotalSpent(bookingData?.reduce((sum, b) => sum + (b.price ?? 0), 0) ?? 0);
      setLoading(false);
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  const statCards = [
    {
      label: "Séances à venir",
      value: upcoming.length,
      icon: <CalendarIcon className="h-5 w-5" />,
      color: "text-[color:var(--px-accent)]",
    },
    {
      label: "Séances terminées",
      value: completed.length,
      icon: <TrophyIcon className="h-5 w-5" />,
      color: "text-[color:var(--px-success)]",
    },
    {
      label: "Total investi",
      value: `${totalSpent} €`,
      icon: <BoltIcon className="h-5 w-5" />,
      color: "text-[color:var(--px-warning)]",
    },
  ];

  return (
    <AppShell active="/dashboard" hideTitle>
      {/* Hero */}
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Dashboard</span>
              {isDemo && <span className="px-pill">Mode démo</span>}
            </div>
            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Mon espace{" "}
              <span className="px-gradient-text">joueur.</span>
            </h1>
            <p
              className="px-fade-up max-w-md text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Retrouve tes séances, tes stats et tes coachs préférés.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/dashboard/player/profile" className="px-button-ghost text-sm">
              <UserIcon className="h-4 w-4" />
              Mon profil
            </Link>
            <Link href="/booking" className="px-button text-sm">
              <BoltIcon className="h-4 w-4" />
              Réserver
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-skeleton h-28 rounded-2xl" />
          ))}
          <div className="md:col-span-2 px-skeleton h-64 rounded-2xl" />
          <div className="px-skeleton h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {statCards.map((stat, i) => (
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

          {/* ── Charts ── */}
          <ScrollReveal>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {/* RadarChart — Profil technique */}
              <div className="px-card p-6">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[color:var(--px-text)]">Mon profil</h3>
                  <span className="rounded-full bg-[color:var(--px-accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[color:var(--px-accent)]">Évaluation</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={playerSkills} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke={CHART_COLORS.grid} />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar dataKey="value" stroke={CHART_COLORS.accent} fill={CHART_COLORS.accent} fillOpacity={0.25} strokeWidth={2} name="Score" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* AreaChart — Progression */}
              <div className="px-card p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-[color:var(--px-text)]">Progression</h3>
                  <p className="text-xs text-[color:var(--px-text-secondary)]">6 derniers mois</p>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={playerProgression}>
                    <defs>
                      <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a1f", border: "1px solid rgba(255,106,0,0.2)", borderRadius: 12, padding: "8px 12px", color: "#fff" }}
                      itemStyle={{ color: CHART_COLORS.accent }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="score" stroke={CHART_COLORS.accent} strokeWidth={2} fill="url(#progressGradient)" name="Score global" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left column */}
            <div className="space-y-6">
              {/* Upcoming sessions */}
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Séances à venir</h3>
                    <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  {upcoming.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">Aucune séance programmée</p>
                      <Link href="/booking" className="px-button mt-4 text-sm">
                        Réserver une séance
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.slice(0, 4).map((session) => (
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
                                {coachMap[session.coach_id] && ` · ${coachMap[session.coach_id]}`}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-accent)]">
                            À venir
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Completed sessions with feedback */}
              {completed.length > 0 && (
                <ScrollReveal>
                  <div className="px-card p-6">
                    <h3 className="text-lg text-white mb-4">Séances terminées</h3>
                    <div className="space-y-3">
                      {completed.slice(0, 5).map((session) => (
                        <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]">
                                <TrophyIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{session.title}</p>
                                <p className="text-xs text-white/70">
                                  {formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}
                                  {coachMap[session.coach_id] && ` · ${coachMap[session.coach_id]}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.feedback ? (
                                <button
                                  type="button"
                                  onClick={() => setFeedbackOpen(feedbackOpen === session.id ? null : session.id)}
                                  className="rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-accent)] transition hover:bg-[color:var(--px-accent)]/20"
                                >
                                  {feedbackOpen === session.id ? "Masquer" : "Retour du coach"}
                                </button>
                              ) : (
                                <span className="rounded-full border border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-success)]">
                                  Terminée
                                </span>
                              )}
                            </div>
                          </div>
                          {feedbackOpen === session.id && session.feedback && (
                            <div className="mt-3 ml-13 rounded-xl border border-[color:var(--px-accent)]/20 bg-[color:var(--px-accent)]/5 p-4 space-y-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--px-accent)]">Retour du coach</p>
                              {(["technique", "engagement", "progression"] as const).map((k) => (
                                <div key={k} className="flex items-center gap-3">
                                  <span className="w-24 text-xs capitalize text-white/70">{k}</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <span key={n} className={`h-2 w-5 rounded-full ${n <= session.feedback!.ratings[k] ? "bg-[color:var(--px-accent)]" : "bg-white/10"}`} />
                                    ))}
                                  </div>
                                  <span className="text-xs text-white/50">{session.feedback!.ratings[k]}/5</span>
                                </div>
                              ))}
                              {session.feedback.comment && (
                                <p className="text-sm italic text-white/60 mt-2 border-t border-white/10 pt-2">&ldquo;{session.feedback.comment}&rdquo;</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Top coaches */}
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Coachs recommandés</h3>
                    <Link href="/coach" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {coaches.map((coach) => (
                      <Link
                        key={coach.id}
                        href={`/coach/${coach.id}`}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20"
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
                          <div className="flex items-center gap-1">
                            <StarIcon className="h-3 w-3 text-[color:var(--px-accent)]" />
                            <span className="text-xs text-white">{(coach.rating ?? 0).toFixed(1)}</span>
                          </div>
                          <p className="text-[10px] text-white/70">{coach.price_per_session ?? 0} €/séance</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Quick actions */}
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <h3 className="text-lg text-white mb-4">Actions rapides</h3>
                  <div className="grid gap-3">
                    <Link href="/booking" className="px-button inline-flex items-center gap-2">
                      <BoltIcon className="h-4 w-4" />
                      Réserver une séance
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                    <Link href="/messages" className="px-button-ghost inline-flex items-center gap-2">
                      <ChatIcon className="h-4 w-4" />
                      Mes messages
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                    <Link href="/sessions" className="px-button-ghost inline-flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Mon calendrier
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                    <Link href="/dashboard/player/profile" className="px-button-ghost inline-flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Modifier mon profil
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
