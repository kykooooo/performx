import { supabase } from "@/lib/supabase";

/**
 * Un "pattern" de récurrence décrit une tranche horaire hebdomadaire :
 * "tous les mardis & jeudis, 18h-20h, par créneaux de 60 min, du 1/1 au 31/12".
 */
export type CoachAvailabilityPattern = {
  id: string;
  coachId: string;
  daysOfWeek: number[]; // 0=dim, 1=lun, ..., 6=sam
  timeStart: string;    // HH:MM
  timeEnd: string;      // HH:MM
  durationMinutes: number;
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  label: string | null;
};

/**
 * Exception = un jour bloqué ponctuellement (vacances, match, etc.).
 */
export type CoachAvailabilityException = {
  id: string;
  coachId: string;
  blockedDate: string;  // YYYY-MM-DD
  reason: string | null;
};

/**
 * Slot étendu = créneau réel calculé par la RPC `expand_coach_availability`.
 * Ce sont les créneaux affichés aux joueurs dans l'annuaire.
 */
export type ExpandedSlot = {
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  durationMinutes: number;
};

type PatternRow = {
  id: string;
  coach_id: string;
  days_of_week: number[];
  time_start: string;
  time_end: string;
  duration_minutes: number;
  start_date: string;
  end_date: string;
  label: string | null;
};

type ExceptionRow = {
  id: string;
  coach_id: string;
  blocked_date: string;
  reason: string | null;
};

const normalizeTime = (value: string) => value.length >= 5 ? value.slice(0, 5) : value;

const mapPattern = (row: PatternRow): CoachAvailabilityPattern => ({
  id: row.id,
  coachId: row.coach_id,
  daysOfWeek: row.days_of_week ?? [],
  timeStart: normalizeTime(row.time_start),
  timeEnd: normalizeTime(row.time_end),
  durationMinutes: row.duration_minutes,
  startDate: row.start_date,
  endDate: row.end_date,
  label: row.label,
});

const mapException = (row: ExceptionRow): CoachAvailabilityException => ({
  id: row.id,
  coachId: row.coach_id,
  blockedDate: row.blocked_date,
  reason: row.reason,
});

// ---------- PATTERNS (récurrence) ----------

export async function fetchCoachPatterns(coachId: string): Promise<CoachAvailabilityPattern[]> {
  const { data, error } = await supabase
    .from("coach_availability_patterns")
    .select("*")
    .eq("coach_id", coachId)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return ((data as PatternRow[] | null) ?? []).map(mapPattern);
}

export async function createCoachPattern(input: {
  coachId: string;
  daysOfWeek: number[];
  timeStart: string;
  timeEnd: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  label?: string | null;
}): Promise<CoachAvailabilityPattern> {
  const { data, error } = await supabase
    .from("coach_availability_patterns")
    .insert({
      coach_id: input.coachId,
      days_of_week: input.daysOfWeek,
      time_start: input.timeStart,
      time_end: input.timeEnd,
      duration_minutes: input.durationMinutes,
      start_date: input.startDate,
      end_date: input.endDate,
      label: input.label ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapPattern(data as PatternRow);
}

export async function deleteCoachPattern(patternId: string) {
  const { error } = await supabase
    .from("coach_availability_patterns")
    .delete()
    .eq("id", patternId);

  if (error) throw error;
}

// ---------- EXCEPTIONS (jours bloqués) ----------

export async function fetchCoachExceptions(coachId: string): Promise<CoachAvailabilityException[]> {
  const { data, error } = await supabase
    .from("coach_availability_exceptions")
    .select("*")
    .eq("coach_id", coachId)
    .gte("blocked_date", new Date().toISOString().slice(0, 10))
    .order("blocked_date", { ascending: true });

  if (error) throw error;
  return ((data as ExceptionRow[] | null) ?? []).map(mapException);
}

export async function createCoachException(input: {
  coachId: string;
  blockedDate: string;
  reason?: string | null;
}): Promise<CoachAvailabilityException> {
  const { data, error } = await supabase
    .from("coach_availability_exceptions")
    .insert({
      coach_id: input.coachId,
      blocked_date: input.blockedDate,
      reason: input.reason ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapException(data as ExceptionRow);
}

export async function deleteCoachException(exceptionId: string) {
  const { error } = await supabase
    .from("coach_availability_exceptions")
    .delete()
    .eq("id", exceptionId);

  if (error) throw error;
}

// ---------- EXPANSION (slots réels) ----------

type ExpandedRow = {
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
};

/**
 * Renvoie les créneaux réels disponibles entre `from` et `to` pour un coach.
 * Gère patterns + exceptions + sessions déjà réservées.
 */
export async function expandCoachAvailability(
  coachId: string,
  from?: string,
  to?: string,
): Promise<ExpandedSlot[]> {
  const { data, error } = await supabase.rpc("expand_coach_availability", {
    p_coach_id: coachId,
    p_from: from,
    p_to: to,
  });

  if (error) throw error;
  return ((data as ExpandedRow[] | null) ?? []).map((row) => ({
    date: row.slot_date,
    time: normalizeTime(row.slot_time),
    durationMinutes: row.duration_minutes,
  }));
}

export const DAY_LABELS: Record<number, string> = {
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
};

export const DAY_LABELS_LONG: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};
