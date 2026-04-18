"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import ScrollReveal from "@/components/scroll-reveal";
import { getPlayerDashboardData } from "@/lib/data/dashboards";
import type {
  CoachRecord,
  PlayerSnapshotRecord,
  SessionRecord,
} from "@/lib/data/types";
import {
  BoltIcon,
  CalendarIcon,
  TrophyIcon,
  UserIcon,
  WhistleIcon,
} from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { FOOTBALL_SKILL_AXES, LOAD_RECOMMENDATION_LABELS } from "@/lib/football";
import { CHART_COLORS } from "@/lib/chart-data";
import { normalizeSessionFeedback } from "@/lib/session-feedback";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { PlayerProgressionPoint, PlayerRadarPoint } from "@/lib/types";

export default function PlayerDashboardPage() {
  const [upcoming, setUpcoming] = useState<SessionRecord[]>([]);
  const [completed, setCompleted] = useState<SessionRecord[]>([]);
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [coachMap, setCoachMap] = useState<Record<string, string>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [skillsData, setSkillsData] = useState<PlayerRadarPoint[]>([]);
  const [progressionData, setProgressionData] = useState<PlayerProgressionPoint[]>([]);
  const [playerSnapshot, setPlayerSnapshot] = useState<PlayerSnapshotRecord>({
    currentClub: null,
    dominantFoot: null,
    trainingFrequencyPerWeek: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const result = await getPlayerDashboardData();
      if (!mounted) return;
      setUpcoming(result.data.upcoming);
      setCompleted(result.data.completed);
      setCoachMap(result.data.coachLookup);
      setCoaches(result.data.coaches);
      setPlayerSnapshot(result.data.playerSnapshot);
      setTotalSpent(result.data.totalSpent);
      setSkillsData(result.data.skillsData);
      setProgressionData(result.data.progressionData);
      setIsDemo(result.mode === "demo");
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
      label: "Séances a venir",
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
              Suis ta progression sur les 5 axes foot, retrouve tes séances et lis le dernier feedback coach.
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

      {!loading && !isDemo && upcoming.length === 0 && completed.length === 0 && (
        <ScrollReveal>
          <section className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--px-accent)]/25 bg-gradient-to-br from-[color:var(--px-accent)]/12 via-[color:var(--px-accent)]/5 to-transparent p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--px-accent)]">
                  <BoltIcon className="h-3 w-3" />
                  Bienvenue sur PerformX
                </span>
                <h2 className="text-xl text-white sm:text-2xl">
                  Trois étapes pour démarrer
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--px-accent)]/20 text-[10px] font-bold text-[color:var(--px-accent)]">1</span>
                    Complète ton profil pour que les coachs te connaissent.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--px-accent)]/20 text-[10px] font-bold text-[color:var(--px-accent)]">2</span>
                    Explore l&apos;annuaire et choisis un coach adapté à ton objectif.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--px-accent)]/20 text-[10px] font-bold text-[color:var(--px-accent)]">3</span>
                    Réserve ta première séance et suis ta progression ici.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link href="/coach" className="px-button text-sm">
                  <WhistleIcon className="h-4 w-4" />
                  Trouver un coach
                </Link>
                <Link href="/dashboard/player/profile" className="px-button-ghost text-sm">
                  <UserIcon className="h-4 w-4" />
                  Compléter mon profil
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {!loading && (
        <ScrollReveal>
          <section className="px-role-band mb-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="px-role-kicker text-[color:var(--px-accent)]">Performance</p>
                <h2 className="mt-2 text-xl text-white">Lecture terrain de ta progression</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Ici, on suit le cycle, la charge et le prochain focus coach plutôt qu&apos;un dashboard
                  trop générique.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="px-role-stat min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Prochain focus</p>
                  <p className="mt-2 text-sm text-white">
                    {latestFeedback?.next_focus || "Séance complétée pour débloquer le suivi"}
                  </p>
                </div>
                <div className="px-role-stat min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Charge</p>
                  <p className="mt-2 text-sm text-white">
                    {latestFeedback?.load_recommendation
                      ? LOAD_RECOMMENDATION_LABELS[latestFeedback.load_recommendation]
                      : "Charge à calibrer"}
                  </p>
                </div>
                <div className="px-role-stat min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Prochaine séance</p>
                  <p className="mt-2 text-sm text-white">
                    {nextSession ? formatLongDate(new Date(`${nextSession.date}T12:00`)) : "À programmer"}
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
                {skillsData.length === 0 ? (
                  <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                    <TrophyIcon className="h-8 w-8 text-white/20" />
                    <p className="mt-2 text-sm text-white/70">Ton profil de progression se débloque</p>
                    <p className="mt-1 text-xs text-white/50">après ta première séance notée par un coach.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={skillsData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke={CHART_COLORS.grid} />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      <Radar dataKey="value" stroke={CHART_COLORS.accent} fill={CHART_COLORS.accent} fillOpacity={0.25} strokeWidth={2} name="Score" />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="px-card p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-[color:var(--px-text)]">Progression</h3>
                  <p className="text-xs text-[color:var(--px-text-secondary)]">Moyenne des feedbacks v2 sur 6 mois</p>
                </div>
                {progressionData.length === 0 ? (
                  <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                    <BoltIcon className="h-8 w-8 text-white/20" />
                    <p className="mt-2 text-sm text-white/70">Pas encore d&apos;historique</p>
                    <p className="mt-1 text-xs text-white/50">Les courbes apparaissent dès la deuxième séance notée.</p>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Séances a venir</h3>
                    <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  {upcoming.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">Aucune séance programmée</p>
                      <Link href="/booking" className="px-button mt-4 text-sm">
                        Reserver une séance
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
                                {coachMap[session.coachId] && ` · ${coachMap[session.coachId]}`}
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
                    <h3 className="text-lg text-white">Coachs recommandés</h3>
                    <Link href="/coach" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir annuaire
                    </Link>
                  </div>
                  {coaches.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                      <WhistleIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">Aucun coach pour l&apos;instant</p>
                      <p className="mt-1 text-xs text-white/50">
                        Les premiers coachs arrivent — reviens bientôt.
                      </p>
                    </div>
                  ) : (
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
                  )}
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg text-white">Dernier feedback coach</h3>
                    {completed[0] && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/60">
                        {formatLongDate(new Date(`${completed[0].date}T12:00`))}
                      </span>
                    )}
                  </div>

                  {latestFeedback && completed[0] && (
                    <p className="mt-1 text-xs text-white/60">
                      Par <span className="text-white/80">{coachMap[completed[0].coachId] ?? "ton coach"}</span> · Séance « {completed[0].title} »
                    </p>
                  )}

                  {latestFeedback ? (
                    <div className="mt-4 space-y-4">
                      {/* Notes sur les 5 axes foot */}
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/50">
                          Ton score sur les 5 axes
                        </p>
                        <div className="space-y-2">
                          {FOOTBALL_SKILL_AXES.map((axis) => {
                            const value = latestFeedback.ratings[axis.key] ?? 0;
                            return (
                              <div key={axis.key} className="flex items-center gap-3">
                                <span className="w-20 text-xs text-white/60">{axis.label}</span>
                                <div className="flex flex-1 gap-1">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <span
                                      key={n}
                                      className={`h-1.5 flex-1 rounded-full transition ${
                                        n <= value
                                          ? "bg-[color:var(--px-accent)]"
                                          : "bg-white/10"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="w-6 text-right text-xs font-medium text-white/80">
                                  {value}/5
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {latestFeedback.summary && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Synthèse</p>
                          <p className="mt-2 text-sm leading-relaxed text-white/80">
                            {latestFeedback.summary}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[color:var(--px-accent)]/25 bg-[color:var(--px-accent)]/8 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--px-accent)]">
                            Prochain focus
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-white/90">
                            {latestFeedback.next_focus || "En cours de structuration."}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                            Charge recommandée
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-white/80">
                            {latestFeedback.load_recommendation
                              ? LOAD_RECOMMENDATION_LABELS[latestFeedback.load_recommendation]
                              : "À calibrer"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                      <TrophyIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">
                        Aucun feedback disponible pour l&apos;instant
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        Termine ta première séance pour débloquer le suivi détaillé
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
                        : `${playerSnapshot.trainingFrequencyPerWeek} séance(s)`}
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
