"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";
import ConfirmModal from "@/components/confirm-modal";
import ScrollReveal from "@/components/scroll-reveal";
import {
  CalendarIcon,
  StarIcon,
  BoltIcon,
  ArrowRightIcon,
  WhistleIcon,
  CheckCircleIcon,
} from "@/components/icons";
import { addDays, formatDayLabel, formatLongDate, formatShortDate, startOfWeek, toISODate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { mockCoaches, mockSessions } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { coachMonthlyActivity, coachDayDistribution, CHART_COLORS, fetchCoachMonthlyActivity, fetchCoachDayDistribution } from "@/lib/chart-data";
import type { AvailabilitySlot, SessionFeedback } from "@/lib/types";

const normalizeTime = (value: string) => (value.length >= 5 ? value.slice(0, 5) : value);

type CoachRow = {
  id: string;
  user_id: string;
  name: string;
  rating: number | null;
  price_per_session: number | null;
  availability: AvailabilitySlot[] | null;
};

type SessionRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  feedback?: SessionFeedback | null;
};

function useMockFallback() {
  return useMemo(() => {
    const coach = mockCoaches[0];
    const coachRow: CoachRow = {
      id: coach.id,
      user_id: "user_10",
      name: coach.name,
      rating: coach.rating,
      price_per_session: coach.pricePerSession,
      availability: coach.availability,
    };
    const sessionRows: SessionRow[] = mockSessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      time: s.time,
      status: s.status,
      feedback: s.feedback ?? null,
    }));
    return { coachRow, sessionRows };
  }, []);
}

export default function CoachDashboardPage() {
  const [coach, setCoach] = useState<CoachRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [slotNotice, setSlotNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sessionNotice, setSessionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotDuration, setSlotDuration] = useState(60);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week",
  );
  const [dayDate, setDayDate] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<SessionFeedback>({
    ratings: { technique: 3, engagement: 3, progression: 3 },
    comment: "",
  });
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    tone: "danger" | "warning";
    onConfirm: () => void;
  } | null>(null);
  const [activityData, setActivityData] = useState(coachMonthlyActivity);
  const [dayData, setDayData] = useState(coachDayDistribution);

  const mock = useMockFallback();

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (mounted) {
          setIsDemo(true);
          setCoach(mock.coachRow);
          setSessions(mock.sessionRows);
          setLoading(false);
        }
        return;
      }

      const { data: coachData } = await supabase
        .from("coaches")
        .select("id, user_id, name, rating, price_per_session, availability")
        .eq("user_id", userData.user.id)
        .single();

      if (!coachData) {
        if (mounted) {
          setIsDemo(true);
          setCoach(mock.coachRow);
          setSessions(mock.sessionRows);
          setLoading(false);
        }
        return;
      }

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, title, date, time, status")
        .eq("coach_id", coachData.id)
        .order("date", { ascending: true });

      if (!mounted) return;
      setCoach(coachData);
      setSessions(
        (sessionData ?? []).map((row) => ({
          ...row,
          time: normalizeTime(row.time),
        })),
      );

      // Fetch chart data (real → mock fallback)
      Promise.all([
        fetchCoachMonthlyActivity(coachData.id),
        fetchCoachDayDistribution(coachData.id),
      ]).then(([actRes, dayRes]) => {
        if (!mounted) return;
        setActivityData(actRes);
        setDayData(dayRes);
      });

      setLoading(false);
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, [mock]);

  const upcoming = useMemo(
    () => sessions.filter((session) => session.status === "upcoming"),
    [sessions],
  );
  const completed = useMemo(
    () => sessions.filter((session) => session.status === "completed"),
    [sessions],
  );

  const revenue = (coach?.price_per_session ?? 0) * upcoming.length;

  const availableSlots = useMemo(() => {
    if (!coach?.availability) return [] as AvailabilitySlot[];
    return coach.availability.filter((slot) => {
      const normalized = normalizeTime(slot.time);
      return !sessions.some(
        (session) => session.date === slot.date && normalizeTime(session.time) === normalized,
      );
    });
  }, [coach, sessions]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return {
        date,
        dateKey: toISODate(date),
        label: formatDayLabel(date),
        short: formatShortDate(date),
      };
    });
  }, [weekStart]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(monthCursor);
  }, [monthCursor]);

  const monthDays = useMemo(() => {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      return {
        date,
        dateKey: toISODate(date),
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === monthCursor.getMonth(),
      };
    });
  }, [monthCursor]);

  const timeSlots = useMemo(() => {
    const base: string[] = [];
    for (let hour = 7; hour <= 21; hour += 1) {
      base.push(`${String(hour).padStart(2, "0")}:00`);
    }
    const extra = (coach?.availability ?? []).map((slot) => normalizeTime(slot.time));
    return Array.from(new Set([...base, ...extra])).sort();
  }, [coach?.availability]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilitySlot>();
    availableSlots.forEach((slot) => {
      map.set(`${slot.date}-${normalizeTime(slot.time)}`, slot);
    });
    return map;
  }, [availableSlots]);

  const reservedMap = useMemo(() => {
    const map = new Map<string, SessionRow>();
    sessions.forEach((session) => {
      map.set(`${session.date}-${normalizeTime(session.time)}`, session);
    });
    return map;
  }, [sessions]);

  const slotCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    availableSlots.forEach((slot) => {
      map.set(slot.date, (map.get(slot.date) ?? 0) + 1);
    });
    return map;
  }, [availableSlots]);

  const reservedCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session) => {
      map.set(session.date, (map.get(session.date) ?? 0) + 1);
    });
    return map;
  }, [sessions]);

  const handleAddSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coach) return;
    if (!slotDate || !slotTime) {
      setSlotNotice({ type: "error", text: "Choisis une date et une heure." });
      return;
    }
    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const normalizedTime = normalizeTime(slotTime);
    const exists = availability.some(
      (slot) => slot.date === slotDate && normalizeTime(slot.time) === normalizedTime,
    );
    if (exists) {
      setSlotNotice({ type: "error", text: "Ce créneau existe déjà." });
      return;
    }
    const updated = [
      ...availability,
      { date: slotDate, time: normalizedTime, durationMinutes: slotDuration },
    ];

    if (!isDemo) {
      const { error } = await supabase
        .from("coaches")
        .update({ availability: updated })
        .eq("id", coach.id);
      if (error) {
        setSlotNotice({ type: "error", text: error.message });
        return;
      }
    }

    setCoach({ ...coach, availability: updated });
    setSlotDate("");
    setSlotTime("");
    setSlotDuration(60);
    setSlotNotice({ type: "success", text: "Créneau ajouté." });
  };

  const executeRemoveSlot = useCallback(async (slotToRemove: AvailabilitySlot) => {
    if (!coach) return;
    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const updated = availability.filter(
      (slot) => !(slot.date === slotToRemove.date && normalizeTime(slot.time) === normalizeTime(slotToRemove.time)),
    );

    if (!isDemo) {
      const { error } = await supabase
        .from("coaches")
        .update({ availability: updated })
        .eq("id", coach.id);
      if (error) {
        setSlotNotice({ type: "error", text: error.message });
        return;
      }
    }

    setCoach({ ...coach, availability: updated });
    setSlotNotice({ type: "success", text: "Créneau supprimé." });
  }, [coach, isDemo]);

  const handleRemoveSlot = (slotToRemove: AvailabilitySlot) => {
    setConfirmAction({
      title: "Supprimer ce créneau ?",
      description: `Le créneau du ${formatLongDate(new Date(`${slotToRemove.date}T12:00`))} à ${slotToRemove.time} sera supprimé.`,
      tone: "danger",
      onConfirm: () => {
        setConfirmAction(null);
        executeRemoveSlot(slotToRemove);
      },
    });
  };

  const executeSessionStatusChange = useCallback(async (
    sessionId: string,
    status: "completed" | "cancelled",
  ) => {
    if (!isDemo) {
      const { error } = await supabase
        .from("sessions")
        .update({ status })
        .eq("id", sessionId);
      if (error) {
        setSessionNotice({ type: "error", text: error.message });
        return;
      }
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, status } : session,
      ),
    );
    setSessionNotice({
      type: "success",
      text: status === "completed" ? "Séance marquée terminée." : "Séance annulée.",
    });
  }, [isDemo]);

  const handleSessionStatusChange = (
    sessionId: string,
    status: "completed" | "cancelled",
  ) => {
    if (status === "cancelled") {
      const session = sessions.find((s) => s.id === sessionId);
      setConfirmAction({
        title: "Annuler cette séance ?",
        description: `La séance « ${session?.title ?? ""} » sera annulée. Cette action est irréversible.`,
        tone: "danger",
        onConfirm: () => {
          setConfirmAction(null);
          executeSessionStatusChange(sessionId, status);
        },
      });
    } else {
      executeSessionStatusChange(sessionId, status);
    }
  };

  const handleFeedbackSubmit = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, feedback: { ...feedbackDraft } } : s)),
    );
    setFeedbackOpen(null);
    setFeedbackDraft({ ratings: { technique: 3, engagement: 3, progression: 3 }, comment: "" });
    setSessionNotice({ type: "success", text: "Retour envoyé au joueur." });
  };

  const NAV_SECTIONS = [
    { id: "section-sessions", label: "Séances" },
    { id: "section-dispos", label: "Disponibilités" },
    { id: "section-actions", label: "Actions" },
    { id: "section-calendrier", label: "Calendrier" },
  ];

  return (
    <AppShell active="/dashboard" hideTitle>
      {/* ── Hero header ── */}
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Coach</span>
              {isDemo && <span className="px-pill">Mode démo</span>}
            </div>
            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Salut,{" "}
              <span className="px-gradient-text">{coach?.name ?? "Coach"}.</span>
            </h1>
            <p
              className="px-fade-up max-w-md text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Gère tes disponibilités, suis tes séances et développe ton activité.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/dashboard/coach/profile" className="px-button-ghost text-sm">
              Mon profil
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Séances à venir", value: upcoming.length, icon: <CalendarIcon className="h-5 w-5" />, accent: true },
            { label: "Séances terminées", value: completed.length, icon: <CheckCircleIcon className="h-5 w-5" />, accent: false },
            { label: "Revenus estimés", value: `${revenue}€`, icon: <BoltIcon className="h-5 w-5" />, accent: true },
            { label: "Note moyenne", value: (coach?.rating ?? 0).toFixed(1), icon: <StarIcon className="h-5 w-5" />, accent: false },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.accent ? "px-card-strong" : "px-card"} group flex items-center gap-4 p-5`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] transition-transform duration-300 group-hover:scale-110">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Charts ── */}
      <ScrollReveal>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* LineChart — Activité 6 mois */}
          <div className="px-card p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[color:var(--px-text)]">Activité</h3>
              <p className="text-xs text-[color:var(--px-text-secondary)]">6 derniers mois</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={activityData}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1f", border: "1px solid rgba(255,106,0,0.2)", borderRadius: 12, padding: "8px 12px", color: "#fff" }}
                  itemStyle={{ color: CHART_COLORS.accent }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="seances" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ fill: CHART_COLORS.accent, r: 4 }} activeDot={{ r: 6 }} name="Séances" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BarChart — Répartition par jour */}
          <div className="px-card p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[color:var(--px-text)]">Séances par jour</h3>
              <p className="text-xs text-[color:var(--px-text-secondary)]">Répartition hebdomadaire</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dayData}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART_COLORS.tick, fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1f", border: "1px solid rgba(255,106,0,0.2)", borderRadius: 12, padding: "8px 12px", color: "#fff" }}
                  itemStyle={{ color: CHART_COLORS.accent }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                  cursor={{ fill: "rgba(255,106,0,0.05)" }}
                />
                <Bar dataKey="count" fill={CHART_COLORS.accent} radius={[6, 6, 0, 0]} name="Séances" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Sticky sub-nav ── */}
      <nav className="sticky top-[73px] z-20 -mx-4 flex gap-2 overflow-x-auto border-b border-[color:var(--px-border)] bg-[color:var(--px-bg)]/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        {NAV_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap rounded-full border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-1.5 text-xs font-medium text-[color:var(--px-text-secondary)] transition hover:border-[color:var(--px-accent)]/40 hover:text-[color:var(--px-accent)]"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          <ScrollReveal>
            <div id="section-sessions" className="px-card p-6 scroll-mt-32">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg text-white">Séances à venir</h3>
                </div>
                <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">Voir planning</Link>
              </div>
              <div className="mt-4 space-y-3">
                {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="px-skeleton h-16 rounded-xl" />)}
                {!loading && upcoming.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                    <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                    <p className="mt-2 text-xs text-white/70">Aucune séance à venir.</p>
                  </div>
                )}
                {upcoming.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[color:var(--px-accent)]/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <WhistleIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{session.title}</p>
                      <p className="text-xs text-white/70">{formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg border border-[color:var(--px-success)]/25 bg-[color:var(--px-success)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase text-[color:var(--px-success)]"
                        type="button"
                        onClick={() => handleSessionStatusChange(session.id, "completed")}
                      >
                        Terminée
                      </button>
                      <button
                        className="rounded-lg border border-[color:var(--px-danger)]/30 bg-[color:var(--px-danger)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-[color:var(--px-danger)]"
                        type="button"
                        onClick={() => handleSessionStatusChange(session.id, "cancelled")}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
                {sessionNotice && (
                  <div
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      sessionNotice.type === "success"
                        ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                        : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                    }`}
                  >
                    {sessionNotice.text}
                  </div>
                )}
                {completed.length > 0 && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/70">Terminées</p>
                    {completed.slice(0, 4).map((session) => (
                      <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3 mb-2">
                        <div className="flex items-center gap-4">
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-white/70" />
                          <div className="flex-1">
                            <p className="text-sm text-white/70">{session.title}</p>
                            <p className="text-xs text-white/70">{formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}</p>
                          </div>
                          {session.feedback ? (
                            <span className="rounded-full bg-[color:var(--px-success)]/15 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-success)]">Retour envoyé</span>
                          ) : (
                            <button
                              type="button"
                              className="rounded-lg border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-[color:var(--px-accent)]"
                              onClick={() => setFeedbackOpen(feedbackOpen === session.id ? null : session.id)}
                            >
                              {feedbackOpen === session.id ? "Fermer" : "Donner un retour"}
                            </button>
                          )}
                        </div>
                        {session.feedback && (
                          <div className="mt-2 ml-8 space-y-1">
                            {(["technique", "engagement", "progression"] as const).map((k) => (
                              <div key={k} className="flex items-center gap-2">
                                <span className="w-24 text-[10px] capitalize text-white/50">{k}</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <span key={n} className={`h-1.5 w-4 rounded-full ${n <= session.feedback!.ratings[k] ? "bg-[color:var(--px-accent)]" : "bg-white/10"}`} />
                                  ))}
                                </div>
                              </div>
                            ))}
                            {session.feedback.comment && (
                              <p className="text-[11px] italic text-white/50 mt-1">&ldquo;{session.feedback.comment}&rdquo;</p>
                            )}
                          </div>
                        )}
                        {feedbackOpen === session.id && !session.feedback && (
                          <div className="mt-3 ml-8 space-y-3 rounded-xl border border-[color:var(--px-accent)]/20 bg-[color:var(--px-accent)]/5 p-4">
                            {(["technique", "engagement", "progression"] as const).map((k) => (
                              <div key={k} className="flex items-center gap-3">
                                <span className="w-24 text-xs capitalize text-white/70">{k}</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() =>
                                        setFeedbackDraft((prev) => ({
                                          ...prev,
                                          ratings: { ...prev.ratings, [k]: n },
                                        }))
                                      }
                                      className={`h-6 w-6 rounded-md text-xs font-medium transition ${
                                        n <= feedbackDraft.ratings[k]
                                          ? "bg-[color:var(--px-accent)] text-black"
                                          : "border border-white/15 bg-white/5 text-white/50 hover:bg-white/10"
                                      }`}
                                    >
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <textarea
                              className="px-input w-full text-sm"
                              rows={2}
                              placeholder="Commentaire pour le joueur..."
                              value={feedbackDraft.comment}
                              onChange={(e) =>
                                setFeedbackDraft((prev) => ({ ...prev, comment: e.target.value }))
                              }
                            />
                            <button
                              type="button"
                              className="px-button text-xs"
                              onClick={() => handleFeedbackSubmit(session.id)}
                            >
                              Envoyer le retour
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          <ScrollReveal>
            <div id="section-dispos" className="px-card-strong p-6 scroll-mt-32">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                  <BoltIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg text-white">Disponibilités</h3>
                  <p className="text-xs text-white/70">Gère tes créneaux ouverts à la réservation.</p>
                </div>
              </div>
              <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto]" onSubmit={handleAddSlot}>
                <input className="px-input" type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
                <input className="px-input" type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} />
                <input className="px-input" type="number" min={30} step={15} value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))} />
                <button className="px-button" type="submit">Ajouter</button>
              </form>
              {slotNotice && (
                <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${slotNotice.type === "success" ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]" : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"}`}>
                  {slotNotice.text}
                </div>
              )}
              <div className="mt-4 space-y-2">
                {availableSlots.length === 0 && !loading && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-xs text-white/70">Aucun créneau disponible.</p>
                  </div>
                )}
                {availableSlots.slice(0, 5).map((slot) => (
                  <div key={`${slot.date}-${slot.time}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-[color:var(--px-accent)]/20">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-success)] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--px-success)]" />
                      </span>
                      <div>
                        <p className="text-sm text-white">{formatLongDate(new Date(`${slot.date}T12:00`))}</p>
                        <p className="text-xs text-white/70">{slot.time} · {slot.durationMinutes} min</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-[color:var(--px-danger)]/30 hover:text-[color:var(--px-danger)]" type="button" onClick={() => handleRemoveSlot(slot)}>
                      Supprimer
                    </button>
                  </div>
                ))}
                {availableSlots.length > 5 && (
                  <p className="text-center text-xs text-white/70">+{availableSlots.length - 5} autres créneaux</p>
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div id="section-actions" className="px-card p-6 scroll-mt-32">
              <h3 className="text-lg text-white">Actions rapides</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/dashboard/coach/profile" className="px-button text-center text-sm">
                  <WhistleIcon className="h-4 w-4" />
                  Modifier mon profil
                </Link>
                <Link href="/sessions" className="px-button-ghost text-center text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  Mon planning
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── Calendrier ── */}
      <ScrollReveal>
        <section id="section-calendrier" className="mt-6 scroll-mt-32">
          <div className="px-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h3 className="text-lg text-white">Calendrier</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                  <button className={`rounded-full px-3 py-1 text-xs transition ${calendarView === "day" ? "bg-[color:var(--px-accent)] text-black" : "text-white/70"}`} type="button" onClick={() => setCalendarView("day")}>Jour</button>
                  <button className={`rounded-full px-3 py-1 text-xs transition ${calendarView === "week" ? "bg-[color:var(--px-accent)] text-black" : "text-white/70"}`} type="button" onClick={() => setCalendarView("week")}>Semaine</button>
                  <button className={`rounded-full px-3 py-1 text-xs transition ${calendarView === "month" ? "bg-[color:var(--px-accent)] text-black" : "text-white/70"}`} type="button" onClick={() => setCalendarView("month")}>Mois</button>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-[color:var(--px-accent)]/30 hover:text-white"
                  onClick={() => {
                    if (calendarView === "day") setDayDate(new Date());
                    else if (calendarView === "week") setWeekStart(startOfWeek(new Date()));
                    else setMonthCursor(new Date());
                  }}
                >
                  Aujourd&apos;hui
                </button>
                {calendarView === "day" ? (
                  <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white" type="button" onClick={() => setDayDate((prev) => addDays(prev, -1))}>◀</button>
                    <span className="px-pill text-xs">{formatLongDate(dayDate)}</span>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white" type="button" onClick={() => setDayDate((prev) => addDays(prev, 1))}>▶</button>
                  </div>
                ) : calendarView === "week" ? (
                  <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white" type="button" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>◀</button>
                    <span className="px-pill text-xs">Sem. {formatShortDate(weekStart)}</span>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white" type="button" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>▶</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white" type="button" onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>◀</button>
                    <span className="px-pill text-xs capitalize">{monthLabel}</span>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white" type="button" onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>▶</button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] uppercase tracking-wider text-white/70">
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-white/20 bg-white/10" /> Disponible</div>
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/15" /> Réservé</div>
            </div>

            {calendarView === "day" ? (
              <div className="mt-4 space-y-2">
                {(() => {
                  const dayKey = toISODate(dayDate);
                  const daySlots = timeSlots.map((time) => {
                    const key = `${dayKey}-${time}`;
                    const slot = availabilityMap.get(key);
                    const reserved = reservedMap.get(key);
                    return { time, slot, reserved };
                  });
                  return daySlots.map(({ time, slot, reserved }) => (
                    <div
                      key={time}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                        reserved
                          ? "border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/8"
                          : slot
                            ? "border-white/15 bg-white/8"
                            : "border-white/5 bg-black/20"
                      }`}
                    >
                      <span className="w-14 text-sm font-medium text-white/70">{time}</span>
                      {slot && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white/70">
                          Disponible · {slot.durationMinutes} min
                        </span>
                      )}
                      {!slot && reserved && (
                        <span className="rounded-full bg-[color:var(--px-accent)]/15 px-3 py-1 text-[10px] font-medium text-[color:var(--px-accent)]">
                          Réservé · {reserved.title}
                        </span>
                      )}
                      {!slot && !reserved && (
                        <span className="text-[10px] text-white/30">—</span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            ) : calendarView === "week" ? (
              <div className="mt-4 -mx-2 overflow-x-auto scroll-smooth snap-x snap-mandatory px-2 pb-2 md:mx-0 md:snap-none md:px-0 md:pb-0">
                <div className="min-w-[700px] md:min-w-0">
                  <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] md:grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
                    <div />
                    {weekDays.map((day) => (
                      <div key={day.dateKey} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">{day.short}</p>
                        <p className="text-sm font-medium text-white">{day.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-[60px_repeat(7,minmax(0,1fr))] md:grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
                    {timeSlots.map((time) => (
                      <div key={time} className="contents">
                        <div className="flex items-center justify-center text-xs text-white/70">{time}</div>
                        {weekDays.map((day) => {
                          const key = `${day.dateKey}-${time}`;
                          const slot = availabilityMap.get(key);
                          const reserved = reservedMap.get(key);
                          return (
                            <div key={key} className={`min-h-[44px] rounded-xl border p-1 transition ${reserved ? "border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/8" : "border-white/5 bg-black/20"}`}>
                              {slot && <div className="flex h-full items-center justify-center rounded-lg border border-white/15 bg-white/8 px-2 py-1 text-[10px] font-medium text-white/70">Dispo</div>}
                              {!slot && reserved && <div className="flex h-full items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 px-2 py-1 text-[10px] font-medium text-[color:var(--px-accent)]">Réservé</div>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-7 gap-2">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label) => (
                  <div key={label} className="pb-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/70">{label}</div>
                ))}
                {monthDays.map((day) => {
                  const slotCount = slotCountByDay.get(day.dateKey) ?? 0;
                  const reservedCount = reservedCountByDay.get(day.dateKey) ?? 0;
                  return (
                    <div key={day.dateKey} className={`min-h-[80px] rounded-xl border p-2.5 text-sm transition ${day.isCurrentMonth ? "border-white/10 bg-white/5" : "border-white/5 bg-black/20 text-white/20"}`}>
                      <p className="text-xs text-white/70">{day.day}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[9px]">
                        {slotCount > 0 && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-white/70">{slotCount} dispo</span>}
                        {reservedCount > 0 && <span className="rounded-full bg-[color:var(--px-accent)]/20 px-1.5 py-0.5 text-[color:var(--px-accent)]">{reservedCount} rés.</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        tone={confirmAction?.tone ?? "danger"}
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </AppShell>
  );
}
