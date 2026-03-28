import type {
  AgeCategory,
  DominantFoot,
  LoadRecommendation,
  PositionFamily,
} from "./types";

export const PLAYER_LEVELS = [
  "Débutant",
  "Intermédiaire",
  "Confirmé",
  "Élite",
] as const;

export const PLAYER_POSITIONS = [
  "Gardien",
  "Défenseur latéral",
  "Défenseur central",
  "Milieu défensif",
  "Milieu relayeur",
  "Milieu offensif",
  "Ailier",
  "Avant-centre",
] as const;

export const DOMINANT_FEET: readonly DominantFoot[] = [
  "Droitier",
  "Gaucher",
  "Ambidextre",
];

export const AGE_CATEGORIES: readonly AgeCategory[] = [
  "U9",
  "U11",
  "U13",
  "U15",
  "U17",
  "U19",
  "Senior",
];

export const TRAINING_FREQUENCY_OPTIONS = [
  { label: "1 séance / semaine", value: 1 },
  { label: "2 séances / semaine", value: 2 },
  { label: "3 séances / semaine", value: 3 },
  { label: "4 séances / semaine", value: 4 },
  { label: "5+ séances / semaine", value: 5 },
] as const;

export const POSITION_FAMILY_LABELS: Record<PositionFamily, string> = {
  goalkeeper: "Gardien",
  defender: "Défenseur",
  midfielder: "Milieu",
  attacker: "Attaquant",
};

export const POSITION_OBJECTIVES_BY_FAMILY: Record<PositionFamily, string[]> = {
  goalkeeper: [
    "Jeu au pied sous pression",
    "Prises de balle aériennes",
    "Explosivité sur la ligne",
    "Lecture des trajectoires",
  ],
  defender: [
    "Timing dans les duels",
    "Relance propre",
    "Défense de zone",
    "Couverture et communication",
  ],
  midfielder: [
    "Orientation du corps",
    "Jeu entre les lignes",
    "Vitesse de décision",
    "Résistance à la pression",
  ],
  attacker: [
    "Finition premier contact",
    "Appels et contre-appels",
    "1 contre 1 offensif",
    "Timing dans la surface",
  ],
};

export const FOOTBALL_SKILL_AXES = [
  { key: "technique", label: "Technique" },
  { key: "tactique", label: "Tactique" },
  { key: "physique", label: "Physique" },
  { key: "intensite", label: "Intensité" },
  { key: "mental", label: "Mental" },
] as const;

export const LOAD_RECOMMENDATION_LABELS: Record<LoadRecommendation, string> = {
  normal: "Charge normale",
  lighten: "Alléger la charge",
  recover: "Récupération",
};

export const COACH_FOCUS_AREAS = [
  "Premier contrôle",
  "Finition",
  "Prise d'information",
  "Explosivité",
  "Prévention blessures",
  "Jeu aérien",
  "Analyse vidéo",
  "Préparation mentale",
] as const;

export const COACH_SESSION_FORMATS = [
  "Individuel",
  "Duo",
  "Petit groupe",
  "Analyse vidéo",
] as const;

export function getPositionFamily(position: string | null | undefined): PositionFamily | null {
  if (!position) return null;
  const normalized = position.toLowerCase();
  if (normalized.includes("gard")) return "goalkeeper";
  if (normalized.includes("déf") || normalized.includes("def")) return "defender";
  if (normalized.includes("milieu") || normalized.includes("relayeur")) return "midfielder";
  return "attacker";
}

export function getPositionObjectives(positionFamily: PositionFamily | null | undefined): string[] {
  if (!positionFamily) return [];
  return POSITION_OBJECTIVES_BY_FAMILY[positionFamily];
}

export function parseTextArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => entry.trim()).filter(Boolean);
  }
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getPlayerAgeCategory(birthDate: string | null | undefined): AgeCategory | null {
  if (!birthDate) return null;
  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  if (age <= 9) return "U9";
  if (age <= 11) return "U11";
  if (age <= 13) return "U13";
  if (age <= 15) return "U15";
  if (age <= 17) return "U17";
  if (age <= 19) return "U19";
  return "Senior";
}
