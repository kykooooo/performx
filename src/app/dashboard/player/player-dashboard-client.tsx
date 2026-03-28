"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import ScrollReveal from "@/components/scroll-reveal";
import {
  ArrowRightIcon,
  BoltIcon,
  CalendarIcon,
  TrophyIcon,
  UserIcon,
  WhistleIcon,
} from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { LOAD_RECOMMENDATION_LABELS } from "@/lib/football";
import { fetchPlayerProgression, fetchPlayerSkills, playerProgression, playerSkills, CHART_COLORS } from "@/lib/chart-data";
import { mockBookings, mockCoaches, mockPlayer, mockSessions } from "@/lib/mock-data";
import { normalizeSessionFeedback } from "@/lib/session-feedback";
import { supabase } from "@/lib/supabase";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { PlayerProgressionPoint, PlayerRadarPoint, SessionFeedbackRecord } from "@/lib/types";

type SessionRow = {
  id: string;
  coach_id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: string;
  feedback?: SessionFeedbackRecord | null;
};

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  rating: number | null;
  price_per_session: number | null;
};

type PlayerProfileSnapshot = {
  currentClub: string | null;
  dominantFoot: string | null;
  trainingFrequencyPerWeek: number | null;
};

export default function PlayerDashboardPage() {
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [completed, setCompleted] = useState<SessionRow[]>([]);
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [coachMap, setCoachMap] = useState<Record<string, string>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [skillsData, setSkillsData] = useState<PlayerRadarPoint[]>(playerSkills);
  const [progressionData, setProgressionData] = useState<PlayerProgressionPoint[]>(playerProgression);
  const [playerSnapshot, setPlayerSnapshot] = useState<PlayerProfileSnapshot>({
    currentClub: null,
    dominantFoot: null,
    trainingFrequencyPerWeek: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        if (!mounted) return;
        const upcomingMock = mockSessions
          .filter((session) => session.status === "upcoming")
          .map((session) => ({
            id: session.id,
            coach_id: session.coachId,
            title: session.title,
            date: session.date,
            time: session.time,
            duration_minutes: session.durationMinutes,
            status: session.status,
            feedback: session.feedback ?? null,
          }));
        const completedMock = mockSessions
          .filter((session) => session.status === "completed")
          .map((session) => ({
            id: session.id,
            coach_id: session.coachId,
            title: session.title,
            date: session.date,
            time: session.time,
            duration_minutes: session.durationMinutes,
            status: session.status,
            feedback: session.feedback ?? null,
          }))
          .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

        const coachNames: Record<string, string> = {};
        mockCoaches.forEach((coach) => {
          coachNames[coach.id] = coach.name;
        });

        setUpcoming(upcomingMock);
        setCompleted(completedMock);
        setCoachMap(coachNames);
        setCoaches(
          mockCoaches.slice(0, 4).map((coach) => ({
            id: coach.id,
            name: coach.name,
            speciality: coach.speciality,
            rating: coach.rating,
            price_per_session: coach.pricePerSession,
          })),
        );
        setPlayerSnapshot({
          currentClub: mockPlayer.currentClub ?? null,
          dominantFoot: mockPlayer.dominantFoot ?? null,
          trainingFrequencyPerWeek: mockPlayer.trainingFrequencyPerWeek ?? null,
        });
        setTotalSpent(mockBookings.reduce((sum, booking) => sum + booking.price, 0));
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const userId = userData.user.id;

      const [sessionRes, bookingRes, coachRes, profileRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("id, coach_id, title, date, time, duration_minutes, status, feedback")
          .eq("player_id", userId)
          .order("date", { ascending: true }),
        supabase
          .from("bookings")
          .select("price")
          .eq("player_id", userId)
          .eq("payment_status", "paid"),
        supabase
          .from("public_coaches")
          .select("id, name, speciality, rating, price_per_session")
          .order("rating", { ascending: false })
          .limit(4),
        supabase
          .from("profiles")
          .select("current_club, dominant_foot, training_frequency_per_week")
          .eq("user_id", userId)
          .single(),
      ]);

      if (!mounted) return;

      const sessionRows = sessionRes.data ?? [];
      const upcomingSessions = sessionRows.filter((session) => session.status === "upcoming");
      const completedSessions = sessionRows
        .filter((session) => session.status === "completed")
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      const names: Record<string, string> = {};
      (coachRes.data ?? []).forEach((coach) => {
        names[coach.id] = coach.name;
      });

      setUpcoming(upcomingSessions);
      setCompleted(completedSessions);
      setCoachMap(names);
      setCoaches(coachRes.data ?? []);
      setPlayerSnapshot({
        currentClub: profileRes.data?.current_club ?? null,
        dominantFoot: profileRes.data?.dominant_foot ?? null,
        trainingFrequencyPerWeek: profileRes.data?.training_frequency_per_week ?? null,
      });
      setTotalSpent(bookingRes.data?.reduce((sum, booking) => sum + (booking.price ?? 0), 0) ?? 0);

      Promise.all([
        fetchPlayerSkills(userId),
        fetchPlayerProgression(userId),
      ]).then(([skills, progression]) => {
        if (!mounted) return;
        setSkillsData(skills);
        setProgressionData(progression);
      });

      setLoading(false);
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const latestFeedback = useMemo(
    () => normalizeSessionFeedback(completed[0]?.feedback),
    [completed],
  );
  const nextSession = upcoming[0] ?? null;

  const statCards = [
    {
      label: "Seances a venir",
      value: upcoming.length,
      icon: <CalendarIcon className="h-5 w-5" />,
      color: "text-[color:var(--px-accent)]",
    },
    {
      label: "Seances terminees",
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
      <div className="px-role-shell" data-role="player">
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Dashboard</span>
              {isDemo && <span className="px-pill">Mode demo</span>}
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
              Suis ta progression sur les 5 axes foot, retrouve tes seances et lis le dernier feedback coach.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/dashboard/player/profile" className="px-button-ghost text-sm">
              <UserIcon className="h-4 w-4" />
              Mon profil
            </Link>
            <Link href="/booking" className="px-button text-sm">
              <BoltIcon className="h-4 w-4" />
              Reserver
            </Link>
          </div>
        </div>
      </section>

      {!loading && (
        <ScrollReveal>
          <section className="px-role-band mb-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="px-role-kicker text-[color:var(--px-accent)]">Performance</p>
                <h2 className="mt-2 text-xl text-white">Lecture terrain de ta progression</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Ici, on suit le cycle, la charge et le prochain focus coach plutot qu&apos;un dashboard
                  trop generique.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="px-role-stat min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Prochain focus</p>
                  <p className="mt-2 text-sm text-white">
                    {latestFeedback?.next_focus || "Seance completee pour debloquer le suivi"}
                  </p>
                </div>
                <div className="px-role-stat min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Charge</p>
                  <p className="mt-2 text-sm text-white">
                    {latestFeedback?.load_recommendation
                      ? LOAD_RECOMMENDATION_LABELS[latestFeedback.load_recommendation]
                      : "Charge a calibrer"}
                  </p>
                </div>
                <div className="px-role-stat min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Prochaine seance</p>
                  <p className="mt-2 text-sm text-white">
                    {nextSession ? formatLongDate(new Date(`${nextSession.date}T12:00`)) : "A programmer"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

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

          <ScrollReveal>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="px-card p-6">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[color:var(--px-text)]">Profil de progression</h3>
                  <span className="rounded-full bg-[color:var(--px-accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[color:var(--px-accent)]">
                    5 axes
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={skillsData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke={CHART_COLORS.grid} />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar dataKey="value" stroke={CHART_COLORS.accent} fill={CHART_COLORS.accent} fillOpacity={0.25} strokeWidth={2} name="Score" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="px-card p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-[color:var(--px-text)]">Progression</h3>
                  <p className="text-xs text-[color:var(--px-text-secondary)]">Moyenne des feedbacks v2 sur 6 mois</p>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={progressionData}>
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
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Seances a venir</h3>
                    <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  {upcoming.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">Aucune seance programmee</p>
                      <Link href="/booking" className="px-button mt-4 text-sm">
                        Reserver une seance
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
                            A venir
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Coachs recommandes</h3>
                    <Link href="/coach" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir annuaire
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {coaches.map((coach) => (
                      <div key={coach.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70">
                            <WhistleIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{coach.name}</p>
                            <p className="text-xs text-white/70">{coach.speciality}</p>
                          </div>
                        </div>
                        <Link href={`/coach/${coach.id}`} className="text-xs text-[color:var(--px-accent)] hover:underline">
                          Voir profil
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <h3 className="text-lg text-white">Dernier feedback coach</h3>
                  {latestFeedback ? (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Synthese</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/80">{latestFeedback.summary}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Prochain focus</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/80">{latestFeedback.next_focus || "Feedback en cours de structuration."}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="text-sm text-white/70">
                        Aucun feedback structure disponible pour l&apos;instant. Termine une seance pour debloquer le suivi detaille.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-5">
                  <p className="text-xs font-semibold text-white/70 mb-2">Snapshot profil</p>
                  <ul className="space-y-2 text-xs text-white/70 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Club actuel: {playerSnapshot.currentClub ?? "A renseigner dans ton profil"}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Pied fort: {playerSnapshot.dominantFoot ?? "A renseigner"}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Charge hebdo:{" "}
                      {playerSnapshot.trainingFrequencyPerWeek == null
                        ? "A renseigner"
                        : `${playerSnapshot.trainingFrequencyPerWeek} seance(s)`}
                    </li>
                  </ul>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </>
      )}
      </div>
    </AppShell>
  );
}
