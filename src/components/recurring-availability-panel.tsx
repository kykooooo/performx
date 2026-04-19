"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CoachAvailabilityException,
  CoachAvailabilityPattern,
  DAY_LABELS,
  DAY_LABELS_LONG,
  createCoachException,
  createCoachPattern,
  deleteCoachException,
  deleteCoachPattern,
  fetchCoachExceptions,
  fetchCoachPatterns,
} from "@/lib/data/coach-availability";
import { formatLongDate, toISODate } from "@/lib/date";
import { AlertIcon, CalendarIcon, CheckCircleIcon } from "./icons";

type Props = {
  coachId: string | null;
  /**
   * Callback invoqué après tout changement (création ou suppression de
   * pattern / exception) pour que le parent puisse rafraîchir sa propre
   * vue des créneaux expanded.
   */
  onPatternsChanged?: () => void;
};

type Notice = { type: "success" | "error"; text: string } | null;

export default function RecurringAvailabilityPanel({ coachId, onPatternsChanged }: Props) {
  const [patterns, setPatterns] = useState<CoachAvailabilityPattern[]>([]);
  const [exceptions, setExceptions] = useState<CoachAvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire nouveau pattern
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4]); // mardi + jeudi par défaut
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");
  const [duration, setDuration] = useState(60);
  const [patternStartDate, setPatternStartDate] = useState(() => toISODate(new Date()));
  const [patternEndDate, setPatternEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return toISODate(d);
  });
  const [label, setLabel] = useState("");
  const [creatingPattern, setCreatingPattern] = useState(false);

  // Formulaire blocage
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [creatingBlock, setCreatingBlock] = useState(false);

  const [notice, setNotice] = useState<Notice>(null);

  const loadAll = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    try {
      const [p, e] = await Promise.all([
        fetchCoachPatterns(coachId),
        fetchCoachExceptions(coachId),
      ]);
      setPatterns(p);
      setExceptions(e);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement.";
      setNotice({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleDay = (day: number) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const handleCreatePattern = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coachId) return;
    setNotice(null);

    if (selectedDays.length === 0) {
      setNotice({ type: "error", text: "Choisis au moins un jour de la semaine." });
      return;
    }
    if (timeEnd <= timeStart) {
      setNotice({ type: "error", text: "L'heure de fin doit être après l'heure de début." });
      return;
    }
    if (patternEndDate < patternStartDate) {
      setNotice({ type: "error", text: "La date de fin doit être après la date de début." });
      return;
    }

    setCreatingPattern(true);
    try {
      const created = await createCoachPattern({
        coachId,
        daysOfWeek: selectedDays,
        timeStart,
        timeEnd,
        durationMinutes: duration,
        startDate: patternStartDate,
        endDate: patternEndDate,
        label: label.trim() || null,
      });
      setPatterns((current) => [...current, created]);
      setLabel("");
      setNotice({ type: "success", text: "Récurrence ajoutée. Les créneaux apparaissent déjà sur ton annuaire." });
      onPatternsChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur création.";
      setNotice({ type: "error", text: message });
    } finally {
      setCreatingPattern(false);
    }
  };

  const handleDeletePattern = async (patternId: string) => {
    try {
      await deleteCoachPattern(patternId);
      setPatterns((current) => current.filter((p) => p.id !== patternId));
      setNotice({ type: "success", text: "Récurrence supprimée." });
      onPatternsChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur suppression.";
      setNotice({ type: "error", text: message });
    }
  };

  const handleCreateBlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coachId || !blockDate) return;
    setNotice(null);

    setCreatingBlock(true);
    try {
      const created = await createCoachException({
        coachId,
        blockedDate: blockDate,
        reason: blockReason.trim() || null,
      });
      setExceptions((current) => [...current, created].sort((a, b) => a.blockedDate.localeCompare(b.blockedDate)));
      setBlockDate("");
      setBlockReason("");
      setNotice({ type: "success", text: "Jour bloqué. Les créneaux de ce jour sont masqués." });
      onPatternsChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur.";
      setNotice({ type: "error", text: message });
    } finally {
      setCreatingBlock(false);
    }
  };

  const handleDeleteBlock = async (exceptionId: string) => {
    try {
      await deleteCoachException(exceptionId);
      setExceptions((current) => current.filter((e) => e.id !== exceptionId));
      setNotice({ type: "success", text: "Blocage levé." });
      onPatternsChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur.";
      setNotice({ type: "error", text: message });
    }
  };

  const formattedPatterns = useMemo(
    () =>
      patterns.map((pattern) => ({
        ...pattern,
        daysLabel: pattern.daysOfWeek
          .map((d) => DAY_LABELS[d] ?? "")
          .filter(Boolean)
          .join(" · "),
      })),
    [patterns],
  );

  if (!coachId) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        Finalise ton profil coach pour gérer tes disponibilités.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulaire récurrence */}
      <div className="px-card-strong p-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[color:var(--px-accent)]" />
          <h4 className="text-base font-semibold text-white">Ajouter une récurrence</h4>
        </div>
        <p className="mb-4 text-xs text-white/60">
          Exemple : « Tous les mardis et jeudis, 18h-20h, créneaux de 60 min » → génère automatiquement tous les créneaux jusqu&apos;à la date de fin. Tu peux en ajouter plusieurs (ex : un pattern mardis soir + un pattern samedis matin).
        </p>

        <form onSubmit={handleCreatePattern} className="space-y-4">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/55">
              Jours de la semaine
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selectedDays.includes(day)
                      ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  {DAY_LABELS_LONG[day] ?? ""}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-white/55">
                Début
              </label>
              <input
                type="time"
                className="px-input"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-white/55">
                Fin
              </label>
              <input
                type="time"
                className="px-input"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-white/55">
                Durée / créneau (min)
              </label>
              <input
                type="number"
                className="px-input"
                value={duration}
                min={15}
                max={240}
                step={15}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-white/55">
                Valable du
              </label>
              <input
                type="date"
                className="px-input"
                value={patternStartDate}
                onChange={(e) => setPatternStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-white/55">
                Jusqu&apos;au
              </label>
              <input
                type="date"
                className="px-input"
                value={patternEndDate}
                onChange={(e) => setPatternEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-white/55">
              Libellé (optionnel)
            </label>
            <input
              className="px-input"
              placeholder="Séances du soir, Stages été..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
            />
          </div>

          <button type="submit" className="px-button text-sm" disabled={creatingPattern}>
            {creatingPattern ? "Création..." : "Ajouter cette récurrence"}
          </button>
        </form>
      </div>

      {/* Liste des patterns actifs */}
      <div className="px-card p-5">
        <h4 className="mb-3 text-base font-semibold text-white">Mes récurrences actives</h4>
        {loading ? (
          <p className="text-xs text-white/60">Chargement...</p>
        ) : formattedPatterns.length === 0 ? (
          <p className="text-xs text-white/60">
            Aucune récurrence pour l&apos;instant. Ajoute ta première ci-dessus pour que les joueurs
            voient tes créneaux.
          </p>
        ) : (
          <ul className="space-y-2">
            {formattedPatterns.map((pattern) => (
              <li
                key={pattern.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">
                    {pattern.daysLabel} · {pattern.timeStart}–{pattern.timeEnd} ({pattern.durationMinutes} min)
                  </p>
                  <p className="mt-0.5 text-xs text-white/60">
                    Du {pattern.startDate} au {pattern.endDate}
                    {pattern.label ? ` · ${pattern.label}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePattern(pattern.id)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:border-[color:var(--px-danger)]/40 hover:text-[color:var(--px-danger)]"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Blocages */}
      <div className="px-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertIcon className="h-4 w-4 text-[color:var(--px-warning)]" />
          <h4 className="text-base font-semibold text-white">Jours bloqués (vacances, matchs...)</h4>
        </div>
        <form onSubmit={handleCreateBlock} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="date"
            className="px-input sm:max-w-[180px]"
            value={blockDate}
            onChange={(e) => setBlockDate(e.target.value)}
            required
          />
          <input
            className="px-input sm:flex-1"
            placeholder="Raison (optionnel) — ex : Vacances"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            maxLength={120}
          />
          <button type="submit" className="px-button-ghost text-sm" disabled={creatingBlock}>
            {creatingBlock ? "..." : "Bloquer ce jour"}
          </button>
        </form>

        {exceptions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {exceptions.map((exception) => (
              <li
                key={exception.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--px-warning)]/20 bg-[color:var(--px-warning)]/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">
                    {formatLongDate(new Date(`${exception.blockedDate}T12:00`))}
                  </p>
                  {exception.reason && (
                    <p className="mt-0.5 text-xs text-white/60">{exception.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(exception.id)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Lever
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notice && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
            notice.type === "success"
              ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/12 text-[color:var(--px-success)]"
              : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/12 text-[color:var(--px-danger)]"
          }`}
        >
          <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  );
}
