import type { AvailabilitySlot, PositionFamily } from "./types";

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const dedupe = (items: string[]) => Array.from(new Set(items.filter(Boolean)));
const normalizeSignal = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function getNextAvailabilityLabel(availability: AvailabilitySlot[] | null | undefined) {
  const slots = Array.isArray(availability) ? availability : [];
  if (slots.length === 0) return "Planning à ouvrir";

  const now = Date.now();
  const sorted = [...slots].sort((left, right) =>
    `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`),
  );

  const upcoming =
    sorted.find((slot) => new Date(`${slot.date}T${slot.time}:00`).getTime() >= now) ?? sorted[0];

  return `${SHORT_DATE_FORMATTER.format(new Date(`${upcoming.date}T12:00`))} · ${upcoming.time}`;
}

export function getCoachBestForLabel(
  speciality: string,
  focusAreas: string[] | null | undefined,
) {
  const signals = normalizeSignal(dedupe([speciality, ...(focusAreas ?? [])]).join(" "));

  if (signals.includes("gard")) return "Best for gardiens";
  if (signals.includes("finition") || signals.includes("frappe")) return "Best for profils offensifs";
  if (signals.includes("vision") || signals.includes("prise d'information") || signals.includes("lecture")) {
    return "Best for milieux créateurs";
  }
  if (signals.includes("def") || signals.includes("duel")) return "Best for joueurs de duel";
  if (signals.includes("intens") || signals.includes("explos") || signals.includes("endurance")) {
    return "Best for reprise physique";
  }

  return "Best for progression ciblée";
}

export function getCoachStyleLabel(
  speciality: string,
  pedagogy: string | null | undefined,
) {
  const source = normalizeSignal(`${speciality} ${(pedagogy ?? "")}`);

  if (source.includes("analyse") || source.includes("video")) return "Analyse + terrain";
  if (source.includes("exige") || source.includes("repetition")) return "Exigence terrain";
  if (source.includes("rassur") || source.includes("pedagog")) return "Pedagogie progressive";
  if (source.includes("intens") || source.includes("explos")) return "Haute intensite";

  return "Coaching individuel";
}

export function getCoachAudienceLabel(
  sessionFormats: string[] | null | undefined,
  experienceYears: number | null | undefined,
) {
  const formats = dedupe(sessionFormats ?? []);

  if (formats.includes("Petit groupe")) return "Solo, duo, petit groupe";
  if ((experienceYears ?? 0) >= 10) return "Cycle performance club";
  if ((experienceYears ?? 0) >= 5) return "Progression competition";

  return "Travail individualise";
}

export function buildSessionChecklist(
  speciality: string,
  sessionFormats: string[] | null | undefined,
  focusAreas: string[] | null | undefined,
) {
  const signals = normalizeSignal(`${speciality} ${(focusAreas ?? []).join(" ")}`);
  const formats = dedupe(sessionFormats ?? []);
  const normalizedFormats = formats.map(normalizeSignal);
  const checklist = ["Crampons adaptes", "Bouteille d'eau", "Tenue d'entrainement"];

  if (signals.includes("gard")) checklist.push("Gants + sous-couche");
  if (signals.includes("video") || normalizedFormats.includes("analyse video")) {
    checklist.push("1 video ou sequence recente");
  }
  if (signals.includes("intens") || signals.includes("explos") || signals.includes("endurance")) {
    checklist.push("1 snack de recuperation");
  }
  if (signals.includes("frappe") || signals.includes("finition")) {
    checklist.push("Protege-tibias");
  }

  return dedupe(checklist).slice(0, 4);
}

export function buildPreparationMessage(
  coachName: string,
  slotLabel: string,
  focusAreas: string[] | null | undefined,
) {
  const focus = (focusAreas ?? []).filter(Boolean).slice(0, 2).join(" et ");
  const focusLine = focus
    ? `Si possible, je veux prioriser ${focus.toLowerCase()} sur cette seance.`
    : "Je suis pret a suivre le focus du cycle du moment.";

  return [
    `Bonjour ${coachName}, je confirme ma presence pour la seance du ${slotLabel}.`,
    "Je serai la 10 min avant avec eau, tenue et materiel necessaire.",
    focusLine,
  ].join(" ");
}

export function getPositionLaneLabel(positionFamily: PositionFamily | null | undefined) {
  switch (positionFamily) {
    case "goalkeeper":
      return "Dernier rempart";
    case "defender":
      return "Ligne defensive";
    case "midfielder":
      return "Coeur du jeu";
    case "attacker":
      return "Zone de finition";
    default:
      return "Profil terrain";
  }
}

export function getPositionZoneLabel(positionFamily: PositionFamily | null | undefined) {
  switch (positionFamily) {
    case "goalkeeper":
      return "Surface + relance";
    case "defender":
      return "Couloir + duel";
    case "midfielder":
      return "Interligne + orientation";
    case "attacker":
      return "Surface + appels";
    default:
      return "Terrain complet";
  }
}
