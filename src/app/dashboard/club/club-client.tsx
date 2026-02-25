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
  ShieldIcon,
  ChatIcon,
} from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { mockCoaches, mockSessions, mockBookings } from "@/lib/mock-data";

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  rating: number | null;
};

type SessionRow = {
  id: string;
  title: string;
  date: string;
  time: string;
};

type ChildInfo = {
  firstName: string;
  lastName: string;
  birthDate: string;
  level: string;
  position: string;
};

export default function ClubDashboardPage() {
  const [coachCount, setCoachCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [parentName, setParentName] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        // Demo mode
        if (!mounted) return;
        setIsDemo(true);
        setParentName("Marie Dupont");
        setChildInfo({
          firstName: "Léo",
          lastName: "Dupont",
          birthDate: "2013-05-22",
          level: "Intermédiaire",
          position: "Milieu offensif",
        });
        setCoachCount(mockCoaches.length);
        setSessionCount(4);
        setCoaches(
          mockCoaches.slice(0, 4).map((c) => ({
            id: c.id,
            name: c.name,
            speciality: c.speciality,
            rating: c.rating,
          })),
        );
        setSessions(
          mockSessions
            .filter((s) => s.status === "upcoming")
            .slice(0, 3)
            .map((s) => ({ id: s.id, title: s.title, date: s.date, time: s.time })),
        );
        setTotalSpent(mockBookings.reduce((sum, b) => sum + b.price, 0));
        setCompletedCount(mockSessions.filter((s) => s.status === "completed").length);
        setLoading(false);
        return;
      }

      // Auth: check role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("user_id", userData.user.id)
        .single();

      const role = profileData?.role ?? null;
      if (role !== "club") {
        if (mounted) {
          setError("Accès réservé aux comptes parent.");
          setLoading(false);
        }
        return;
      }

      // Extract child info from user metadata
      const meta = userData.user.user_metadata ?? {};
      setParentName(
        [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ") || "Parent",
      );
      if (meta.child_first_name) {
        setChildInfo({
          firstName: (meta.child_first_name as string) || "",
          lastName: (meta.child_last_name as string) || "",
          birthDate: (meta.child_birth_date as string) || "",
          level: (meta.child_level as string) || "",
          position: (meta.child_position as string) || "",
        });
      }

      const [coachRes, sessionRes] = await Promise.all([
        supabase
          .from("public_coaches")
          .select("id, name, speciality, rating", { count: "exact" }),
        supabase
          .from("sessions")
          .select("id, title, date, time", { count: "exact" })
          .order("date", { ascending: true })
          .limit(3),
      ]);

      if (!mounted) return;
      setCoachCount(coachRes.count ?? coachRes.data?.length ?? 0);
      setSessionCount(sessionRes.count ?? sessionRes.data?.length ?? 0);
      setCoaches((coachRes.data ?? []).slice(0, 4));
      setSessions(sessionRes.data ?? []);
      setLoading(false);
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  const childAge = childInfo?.birthDate
    ? Math.floor((Date.now() - new Date(childInfo.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <AppShell active="/dashboard" hideTitle>
      {/* Hero */}
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Parent</span>
              {isDemo && <span className="px-pill">Mode démo</span>}
            </div>
            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Bonjour{parentName ? `, ${parentName.split(" ")[0]}` : ""}{" "}
              <span className="px-gradient-text">!</span>
            </h1>
            <p
              className="px-fade-up max-w-md text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Suis la progression de ton enfant et gère ses séances d&apos;entraînement.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/coach" className="px-button-ghost text-sm">
              <WhistleIcon className="h-4 w-4" />
              Trouver un coach
            </Link>
            <Link href="/booking" className="px-button text-sm">
              <BoltIcon className="h-4 w-4" />
              Réserver
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="px-card p-6">
          <p className="text-sm text-[color:var(--px-danger)]">{error}</p>
          {error.includes("Connecte-toi") && (
            <Link href="/auth/login" className="px-button mt-4">Se connecter</Link>
          )}
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
      ) : (
        <>
          {/* Child card */}
          {childInfo && (
            <ScrollReveal>
              <div className="mb-6 px-card-strong p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                    <ShieldIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg text-white">
                      {childInfo.firstName} {childInfo.lastName}
                    </h3>
                    <p className="text-xs text-white/70">Joueur suivi</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {childAge !== null && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {childAge} ans
                    </span>
                  )}
                  {childInfo.level && (
                    <span className="rounded-full border border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/10 px-3 py-1 text-xs text-[color:var(--px-warning)]">
                      {childInfo.level}
                    </span>
                  )}
                  {childInfo.position && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {childInfo.position}
                    </span>
                  )}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Séances à venir", value: sessionCount, icon: <CalendarIcon className="h-5 w-5" />, color: "text-[color:var(--px-accent)]" },
              { label: "Séances terminées", value: completedCount, icon: <BoltIcon className="h-5 w-5" />, color: "text-[color:var(--px-success)]" },
              { label: "Total investi", value: `${totalSpent}€`, icon: <UserIcon className="h-5 w-5" />, color: "text-[color:var(--px-warning)]" },
              { label: "Note moy. coachs", value: coaches.length > 0 ? (coaches.reduce((s, c) => s + (c.rating ?? 0), 0) / coaches.length).toFixed(1) : "-", icon: <StarIcon className="h-5 w-5" />, color: "text-[color:var(--px-accent)]" },
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
            {/* Left */}
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-white">Séances à venir</h3>
                    <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  {sessions.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-sm text-white/70">Aucune séance programmée</p>
                      <Link href="/booking" className="px-button mt-4 text-sm">
                        Réserver une séance
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
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
                            À venir
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* Right */}
            <div className="space-y-6">
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
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-3 w-3 text-[color:var(--px-accent)]" />
                          <span className="text-xs text-white">{(coach.rating ?? 0).toFixed(1)}</span>
                        </div>
                      </Link>
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
                      Réserver une séance
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                    <Link href="/coach" className="px-button-ghost inline-flex items-center gap-2">
                      <WhistleIcon className="h-4 w-4" />
                      Trouver un coach
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                    <Link href="/messages" className="px-button-ghost inline-flex items-center gap-2">
                      <ChatIcon className="h-4 w-4" />
                      Contacter un coach
                      <ArrowRightIcon className="ml-auto h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Progression enfant */}
              {childInfo && (
                <ScrollReveal>
                  <div className="px-card p-6">
                    <h3 className="text-lg text-white mb-4">Progression de {childInfo.firstName}</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Technique", value: 72 },
                        { label: "Endurance", value: 58 },
                        { label: "Tactique", value: 65 },
                        { label: "Mental", value: 80 },
                      ].map((skill) => (
                        <div key={skill.label}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-white/70">{skill.label}</span>
                            <span className="text-white">{skill.value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[color:var(--px-accent)] to-[color:var(--px-accent-2)]"
                              style={{ width: `${skill.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[10px] text-white/30 uppercase tracking-wider">Basé sur les retours des coachs</p>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
