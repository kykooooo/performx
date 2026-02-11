"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "@/components/app-shell";
import { addDays, formatDayLabel, formatLongDate, formatShortDate, startOfWeek, toISODate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import type { AvailabilitySlot } from "@/lib/types";

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
};

export default function CoachDashboardPage() {
  const [coach, setCoach] = useState<CoachRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [slotNotice, setSlotNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotDuration, setSlotDuration] = useState(60);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState(60);
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [bulkTime, setBulkTime] = useState("18:00");
  const [bulkDuration, setBulkDuration] = useState(60);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setAuthNotice("Connecte-toi pour accéder au dashboard coach.");
        setLoading(false);
        return;
      }

      const { data: coachData } = await supabase
        .from("coaches")
        .select("id, user_id, name, rating, price_per_session, availability")
        .eq("user_id", userData.user.id)
        .single();

      if (!coachData) {
        setAuthNotice("Aucun profil coach trouvé. Complète ton profil pour continuer.");
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, title, date, time, status")
        .eq("coach_id", coachData.id)
        .order("date", { ascending: true });

      if (!mounted) return;
      setAuthNotice(null);
      setCoach(coachData);
      setSessions(
        (sessionData ?? []).map((row) => ({
          ...row,
          time: normalizeTime(row.time),
        })),
      );
      setLoading(false);
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = useMemo(
    () => sessions.filter((session) => session.status === "upcoming"),
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
    const hasSession = sessions.some(
      (session) => session.date === slotDate && normalizeTime(session.time) === normalizedTime,
    );
    if (hasSession) {
      setSlotNotice({ type: "error", text: "Ce créneau est déjà réservé." });
      return;
    }
    const updated = [
      ...availability,
      { date: slotDate, time: normalizedTime, durationMinutes: slotDuration },
    ];

    const { error } = await supabase
      .from("coaches")
      .update({ availability: updated })
      .eq("id", coach.id);

    if (error) {
      setSlotNotice({ type: "error", text: error.message });
      return;
    }

    setCoach({ ...coach, availability: updated });
    setSlotDate("");
    setSlotTime("");
    setSlotDuration(60);
    setSlotNotice({ type: "success", text: "Créneau ajouté." });
  };

  const handleRemoveSlot = async (slotToRemove: AvailabilitySlot) => {
    if (!coach) return;
    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const updated = availability.filter(
      (slot) => !(slot.date === slotToRemove.date && normalizeTime(slot.time) === normalizeTime(slotToRemove.time)),
    );

    const { error } = await supabase
      .from("coaches")
      .update({ availability: updated })
      .eq("id", coach.id);

    if (error) {
      setSlotNotice({ type: "error", text: error.message });
      return;
    }

    setCoach({ ...coach, availability: updated });
  };

  const handleStartEdit = (slot: AvailabilitySlot) => {
    setEditKey(`${slot.date}-${normalizeTime(slot.time)}`);
    setEditDate(slot.date);
    setEditTime(normalizeTime(slot.time));
    setEditDuration(slot.durationMinutes);
    setSlotNotice(null);
  };

  const handleUpdateSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coach || !editKey) return;
    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const normalizedTime = normalizeTime(editTime);
    if (!editDate || !normalizedTime) {
      setSlotNotice({ type: "error", text: "Choisis une date et une heure." });
      return;
    }
    const duplicate = availability.some(
      (slot) =>
        `${slot.date}-${normalizeTime(slot.time)}` !== editKey &&
        slot.date === editDate &&
        normalizeTime(slot.time) === normalizedTime,
    );
    if (duplicate) {
      setSlotNotice({ type: "error", text: "Un créneau identique existe déjà." });
      return;
    }
    const hasSession = sessions.some(
      (session) => session.date === editDate && normalizeTime(session.time) === normalizedTime,
    );
    if (hasSession) {
      setSlotNotice({ type: "error", text: "Ce créneau est déjà réservé." });
      return;
    }

    const updated = availability.map((slot) => {
      const key = `${slot.date}-${normalizeTime(slot.time)}`;
      if (key !== editKey) return slot;
      return { date: editDate, time: normalizedTime, durationMinutes: editDuration };
    });

    const { error } = await supabase
      .from("coaches")
      .update({ availability: updated })
      .eq("id", coach.id);

    if (error) {
      setSlotNotice({ type: "error", text: error.message });
      return;
    }

    setCoach({ ...coach, availability: updated });
    setEditKey(null);
    setEditDate("");
    setEditTime("");
    setEditDuration(60);
    setSlotNotice({ type: "success", text: "Créneau mis à jour." });
  };

  const handleMoveSlot = async (slot: AvailabilitySlot, targetDate: string, targetTime: string) => {
    if (!coach) return;
    const fromKey = `${slot.date}-${normalizeTime(slot.time)}`;
    const toKey = `${targetDate}-${normalizeTime(targetTime)}`;
    if (fromKey === toKey) return;

    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const duplicate = availability.some(
      (item) =>
        `${item.date}-${normalizeTime(item.time)}` !== fromKey &&
        item.date === targetDate &&
        normalizeTime(item.time) === normalizeTime(targetTime),
    );
    if (duplicate) {
      setSlotNotice({ type: "error", text: "Un créneau identique existe déjà." });
      return;
    }
    const hasSession = sessions.some(
      (session) => session.date === targetDate && normalizeTime(session.time) === normalizeTime(targetTime),
    );
    if (hasSession) {
      setSlotNotice({ type: "error", text: "Ce créneau est déjà réservé." });
      return;
    }

    const updated = availability.map((item) => {
      const key = `${item.date}-${normalizeTime(item.time)}`;
      if (key !== fromKey) return item;
      return { ...item, date: targetDate, time: normalizeTime(targetTime) };
    });

    const { error } = await supabase
      .from("coaches")
      .update({ availability: updated })
      .eq("id", coach.id);

    if (error) {
      setSlotNotice({ type: "error", text: error.message });
      return;
    }

    setCoach({ ...coach, availability: updated });
    setSlotNotice({ type: "success", text: "Créneau déplacé." });
  };

  const handleBulkCommit = async () => {
    if (!coach || !dragStart || !dragEnd) return;
    const startDate = new Date(`${dragStart}T12:00`);
    const endDate = new Date(`${dragEnd}T12:00`);
    const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];

    const dates: string[] = [];
    let cursor = new Date(from);
    while (cursor <= to) {
      if (cursor.getMonth() === monthCursor.getMonth()) {
        dates.push(toISODate(cursor));
      }
      cursor = addDays(cursor, 1);
    }

    if (!bulkTime) {
      setSlotNotice({ type: "error", text: "Choisis une heure pour ajouter des créneaux." });
      return;
    }

    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const normalizedTime = normalizeTime(bulkTime);
    const updated = [...availability];
    let added = 0;
    let skipped = 0;

    dates.forEach((dateKey) => {
      const duplicate = updated.some(
        (slot) => slot.date === dateKey && normalizeTime(slot.time) === normalizedTime,
      );
      const hasSession = sessions.some(
        (session) => session.date === dateKey && normalizeTime(session.time) === normalizedTime,
      );
      if (duplicate || hasSession) {
        skipped += 1;
        return;
      }
      updated.push({ date: dateKey, time: normalizedTime, durationMinutes: bulkDuration });
      added += 1;
    });

    if (added === 0) {
      setSlotNotice({ type: "error", text: "Aucun créneau ajouté (déjà pris ou existant)." });
      return;
    }

    const { error } = await supabase
      .from("coaches")
      .update({ availability: updated })
      .eq("id", coach.id);

    if (error) {
      setSlotNotice({ type: "error", text: error.message });
      return;
    }

    setCoach({ ...coach, availability: updated });
    setSlotNotice({
      type: "success",
      text: `${added} créneau(x) ajouté(s). ${skipped ? `${skipped} ignoré(s).` : ""}`,
    });
  };

  const isInDragRange = (dateKey: string) => {
    if (!dragStart || !dragEnd) return false;
    const start = new Date(`${dragStart}T12:00`);
    const end = new Date(`${dragEnd}T12:00`);
    const target = new Date(`${dateKey}T12:00`);
    const [from, to] = start <= end ? [start, end] : [end, start];
    return target >= from && target <= to;
  };

  return (
    <AppShell
      active="/dashboard"
      title="Dashboard Coach"
      description="Suivi des séances, disponibilité et performance."
    >
      {authNotice && (
        <div className="px-card p-6">
          <p className="text-sm text-white/60">{authNotice}</p>
          <Link href="/auth/login" className="px-button mt-4">Se connecter</Link>
        </div>
      )}

      {!authNotice && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Séances à venir", value: upcoming.length },
                { label: "Revenus estimés", value: `${revenue}€` },
                { label: "Note moyenne", value: (coach?.rating ?? 0).toFixed(1) },
              ].map((stat) => (
                <div key={stat.label} className="px-card p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="px-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg text-white">Séances à venir</h3>
                <Link href="/sessions" className="text-xs text-[color:var(--px-accent)]">
                  Voir planning
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {loading && <p className="text-xs text-white/50">Chargement...</p>}
                {!loading && upcoming.length === 0 && (
                  <p className="text-xs text-white/50">Aucune séance à venir.</p>
                )}
                {upcoming.map((session) => (
                  <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <p className="text-white">{session.title}</p>
                    <p className="text-xs text-white/50">
                      {formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="px-card-strong p-6">
              <h3 className="text-lg text-white">Disponibilités</h3>
              <p className="mt-2 text-xs text-white/60">Gère tes créneaux ouverts à la réservation.</p>
              <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]" onSubmit={handleAddSlot}>
                <input
                  className="px-input"
                  type="date"
                  value={slotDate}
                  onChange={(event) => setSlotDate(event.target.value)}
                />
                <input
                  className="px-input"
                  type="time"
                  value={slotTime}
                  onChange={(event) => setSlotTime(event.target.value)}
                />
                <input
                  className="px-input"
                  type="number"
                  min={30}
                  step={15}
                  value={slotDuration}
                  onChange={(event) => setSlotDuration(Number(event.target.value))}
                />
                <button className="px-button" type="submit">Ajouter</button>
              </form>
              {editKey && (
                <form
                  className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr_120px_auto]"
                  onSubmit={handleUpdateSlot}
                >
                  <input
                    className="px-input"
                    type="date"
                    value={editDate}
                    onChange={(event) => setEditDate(event.target.value)}
                  />
                  <input
                    className="px-input"
                    type="time"
                    value={editTime}
                    onChange={(event) => setEditTime(event.target.value)}
                  />
                  <input
                    className="px-input"
                    type="number"
                    min={30}
                    step={15}
                    value={editDuration}
                    onChange={(event) => setEditDuration(Number(event.target.value))}
                  />
                  <div className="flex gap-2">
                    <button className="px-button" type="submit">Mettre à jour</button>
                    <button
                      className="px-button-ghost"
                      type="button"
                      onClick={() => setEditKey(null)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
              {slotNotice && (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                    slotNotice.type === "success"
                      ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                      : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                  }`}
                >
                  {slotNotice.text}
                </div>
              )}
              <div className="mt-4 space-y-3">
                {availableSlots.length === 0 && !loading && (
                  <p className="text-xs text-white/50">Aucun créneau disponible.</p>
                )}
                {availableSlots.slice(0, 5).map((slot) => (
                  <div
                    key={`${slot.date}-${slot.time}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                  >
                    <div>
                      <p className="text-white">{formatLongDate(new Date(`${slot.date}T12:00`))}</p>
                      <p className="text-xs text-white/50">{slot.time} · {slot.durationMinutes} min</p>
                    </div>
                    <button className="px-button-ghost" type="button" onClick={() => handleRemoveSlot(slot)}>
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg text-white">Calendrier des créneaux</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      className={`rounded-full px-3 py-1 text-xs ${
                        calendarView === "week"
                          ? "bg-[color:var(--px-accent)] text-black"
                          : "text-white/60"
                      }`}
                      type="button"
                      onClick={() => setCalendarView("week")}
                    >
                      Semaine
                    </button>
                    <button
                      className={`rounded-full px-3 py-1 text-xs ${
                        calendarView === "month"
                          ? "bg-[color:var(--px-accent)] text-black"
                          : "text-white/60"
                      }`}
                      type="button"
                      onClick={() => setCalendarView("month")}
                    >
                      Mois
                    </button>
                  </div>
                  {calendarView === "week" ? (
                    <>
                      <button
                        className="px-button-ghost"
                        type="button"
                        onClick={() => setWeekStart((prev) => addDays(prev, -7))}
                      >
                        ◀
                      </button>
                      <span className="px-pill">Semaine du {formatLongDate(weekStart)}</span>
                      <button
                        className="px-button-ghost"
                        type="button"
                        onClick={() => setWeekStart((prev) => addDays(prev, 7))}
                      >
                        ▶
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="px-button-ghost"
                        type="button"
                        onClick={() =>
                          setMonthCursor(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                          )
                        }
                      >
                        ◀
                      </button>
                      <span className="px-pill">{monthLabel}</span>
                      <button
                        className="px-button-ghost"
                        type="button"
                        onClick={() =>
                          setMonthCursor(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                          )
                        }
                      >
                        ▶
                      </button>
                    </>
                  )}
                </div>
              </div>
              {calendarView === "week" ? (
                <div className="mt-4 overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
                      <div />
                      {weekDays.map((day) => (
                        <div key={day.dateKey} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{day.short}</p>
                          <p className="text-sm text-white">{day.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
                      {timeSlots.map((time) => (
                        <div key={time} className="contents">
                          <div className="flex items-center justify-center text-xs text-white/40">{time}</div>
                          {weekDays.map((day) => {
                            const key = `${day.dateKey}-${time}`;
                            const slot = availabilityMap.get(key);
                            const reserved = reservedMap.get(key);
                            return (
                              <div
                                key={key}
                                className={`min-h-[48px] rounded-xl border border-white/10 bg-black/20 p-1 ${
                                  reserved ? "border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/10" : ""
                                }`}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  const payload = event.dataTransfer.getData("text/plain");
                                  if (!payload) return;
                                  const data = JSON.parse(payload) as { date: string; time: string };
                                  const dragged = availabilityMap.get(`${data.date}-${normalizeTime(data.time)}`);
                                  if (!dragged) return;
                                  handleMoveSlot(dragged, day.dateKey, time);
                                }}
                              >
                                {slot && (
                                  <div
                                    className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white"
                                    draggable
                                    onDragStart={(event) => {
                                      event.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({ date: slot.date, time: normalizeTime(slot.time) }),
                                      );
                                    }}
                                  >
                                    <span>Dispo</span>
                                    <div className="flex gap-1">
                                      <button
                                        className="text-[10px] text-white/60 hover:text-white"
                                        type="button"
                                        onClick={() => handleStartEdit(slot)}
                                      >
                                        Éditer
                                      </button>
                                      <button
                                        className="text-[10px] text-white/60 hover:text-white"
                                        type="button"
                                        onClick={() => handleRemoveSlot(slot)}
                                      >
                                        Suppr.
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {!slot && reserved && (
                                  <div className="rounded-lg bg-[color:var(--px-accent)]/15 px-2 py-1 text-[11px] text-white/80">
                                    Réservé
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                    <span>Drag multi-jours pour ajouter un créneau :</span>
                    <input
                      className="px-input max-w-[140px]"
                      type="time"
                      value={bulkTime}
                      onChange={(event) => setBulkTime(event.target.value)}
                    />
                    <input
                      className="px-input max-w-[120px]"
                      type="number"
                      min={30}
                      step={15}
                      value={bulkDuration}
                      onChange={(event) => setBulkDuration(Number(event.target.value))}
                    />
                    <span>{bulkDuration} min</span>
                  </div>
                  <div
                    className="mt-4 grid grid-cols-7 gap-2"
                    onMouseLeave={() => {
                      if (isDragging) {
                        setIsDragging(false);
                        setDragStart(null);
                        setDragEnd(null);
                      }
                    }}
                  >
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label) => (
                      <div key={label} className="text-xs uppercase tracking-[0.2em] text-white/40">
                        {label}
                      </div>
                    ))}
                    {monthDays.map((day) => {
                      const highlight = isInDragRange(day.dateKey);
                      const slotCount = slotCountByDay.get(day.dateKey) ?? 0;
                      const reservedCount = reservedCountByDay.get(day.dateKey) ?? 0;
                      return (
                        <div
                          key={day.dateKey}
                          className={`min-h-[90px] rounded-2xl border border-white/10 p-3 text-sm ${
                            day.isCurrentMonth ? "bg-white/5" : "bg-black/20 text-white/30"
                          } ${highlight ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15" : ""}`}
                          onMouseDown={() => {
                            if (!day.isCurrentMonth) return;
                            setIsDragging(true);
                            setDragStart(day.dateKey);
                            setDragEnd(day.dateKey);
                          }}
                          onMouseEnter={() => {
                            if (!isDragging) return;
                            setDragEnd(day.dateKey);
                          }}
                          onMouseUp={async () => {
                            if (!isDragging) return;
                            setIsDragging(false);
                            await handleBulkCommit();
                            setDragStart(null);
                            setDragEnd(null);
                          }}
                        >
                          <div className="flex items-center justify-between text-xs text-white/70">
                            <span>{day.day}</span>
                            <span className="text-[10px] text-white/40">{day.isCurrentMonth ? "" : " "}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-white/60">
                            {slotCount > 0 && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5">Dispo {slotCount}</span>
                            )}
                            {reservedCount > 0 && (
                              <span className="rounded-full bg-[color:var(--px-accent)]/20 px-2 py-0.5">
                                Réservé {reservedCount}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="px-card p-6">
              <h3 className="text-lg text-white">Actions rapides</h3>
              <div className="mt-4 grid gap-3">
                <button className="px-button" type="button">Ajouter un créneau</button>
                <Link href="/dashboard/coach/profile" className="px-button-ghost text-center">
                  Voir mon profil
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
