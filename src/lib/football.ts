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
  "U9F",
  "U11F",
  "U13F",
  "U15F",
  "U17F",
  "U19F",
  "Senior F",
];

/**
 * Liste officielle des spécialités coach proposées lors de l'inscription
 * et de l'édition de profil. Remplace les anciennes (coach technique,
 * prépa physique, gardien, ...) par un découpage par poste + discipline.
 */
export const COACH_SPECIALITIES = [
  "Préparateur physique",
  "Spé gardien",
  "Spé défenseur",
  "Spé milieu",
  "Spé attaquant",
  "Analyste vidéo",
  "Coach tactique au poste",
  "Coach technique au poste",
  "Coach mental",
  "Coach Développement des jeunes",
] as const;

export type CoachSpeciality = (typeof COACH_SPECIALITIES)[number];

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

/**
 * Axes de notation spécifiques à chaque spécialité coach, utilisés
 * dans le formulaire de retour post-séance.
 *
 * La clé (slug) sert à stocker la note dans session_feedback.
 * speciality_ratings (JSONB) sans collision entre axes similaires
 * (ex: "passe" apparaît chez gardien, défenseur, milieu — c'est ok,
 * chaque coach a ses propres axes dans son formulaire).
 */
export type SpecialityAxis = {
  key: string;
  label: string;
  /** Libellé court pour les charts type radar où la place manque (≤ 12 car.). */
  shortLabel?: string;
};

export const SPECIALITY_AXES: Record<string, readonly SpecialityAxis[]> = {
  "Préparateur physique": [
    { key: "vitesse", label: "Vitesse" },
    { key: "endurance", label: "Endurance" },
    { key: "coordination", label: "Coordination" },
    { key: "acceleration", label: "Accélération" },
    { key: "detente_verticale", label: "Détente verticale", shortLabel: "Détente" },
    { key: "equilibre", label: "Équilibre" },
    { key: "puissance", label: "Puissance" },
  ],
  "Spé gardien": [
    { key: "detente", label: "Détente" },
    { key: "passe", label: "Passe" },
    { key: "prise_de_balle", label: "Prise de balle", shortLabel: "Prise balle" },
    { key: "reflexe", label: "Réflexe" },
    { key: "relance_main", label: "Relance à la main", shortLabel: "Relance" },
    { key: "sortie_surface", label: "Sortie dans la surface", shortLabel: "Sortie surf." },
    { key: "sortie_pieds", label: "Sortie dans les pieds", shortLabel: "Sortie pieds" },
  ],
  "Spé défenseur": [
    { key: "duel", label: "Duel" },
    { key: "anticipation", label: "Anticipation" },
    { key: "alignement", label: "Alignement" },
    { key: "relance", label: "Relance" },
    { key: "couverture", label: "Couverture" },
    { key: "jeu_aerien", label: "Jeu aérien" },
    { key: "concentration", label: "Concentration" },
  ],
  "Spé milieu": [
    { key: "orientation", label: "Orientation" },
    { key: "vision_de_jeu", label: "Vision de jeu", shortLabel: "Vision" },
    { key: "disponibilite", label: "Disponibilité" },
    { key: "gestion_tempo", label: "Gestion du tempo", shortLabel: "Tempo" },
    { key: "pressing", label: "Pressing" },
    { key: "qualite_passe", label: "Qualité de passe", shortLabel: "Passe" },
    { key: "intelligence_tactique", label: "Intelligence tactique", shortLabel: "Intel. tactique" },
  ],
  "Spé attaquant": [
    { key: "appel", label: "Appel" },
    { key: "finition", label: "Finition" },
    { key: "timing", label: "Timing" },
    { key: "sang_froid", label: "Sang-froid" },
    { key: "deplacement_surface", label: "Déplacement surface", shortLabel: "Déplac. surf." },
    { key: "pressing_offensif", label: "Pressing offensif", shortLabel: "Pressing" },
    { key: "jeu_dos_but", label: "Jeu dos au but", shortLabel: "Dos au but" },
  ],
  "Analyste vidéo": [
    { key: "positionnement", label: "Positionnement" },
    { key: "prise_information", label: "Prise d'information", shortLabel: "Prise d'info" },
    { key: "prise_decision", label: "Prise de décision", shortLabel: "Décision" },
    { key: "qualite_technique_situation", label: "Qualité technique en situation", shortLabel: "Qualité tech." },
    { key: "deplacement_sans_ballon", label: "Déplacement sans ballon", shortLabel: "Déplac. s. ballon" },
    { key: "impact_defensif", label: "Impact défensif", shortLabel: "Impact déf." },
    { key: "efficacite_zones_cles", label: "Efficacité zones clés", shortLabel: "Zones clés" },
  ],
  "Coach tactique au poste": [
    { key: "positionnement_offensif", label: "Positionnement offensif", shortLabel: "Position. off." },
    { key: "positionnement_defensif", label: "Positionnement défensif", shortLabel: "Position. déf." },
    { key: "lecture_du_jeu", label: "Lecture du jeu", shortLabel: "Lecture" },
    { key: "prise_decision", label: "Prise de décision", shortLabel: "Décision" },
    { key: "comprehension_poste", label: "Compréhension du poste", shortLabel: "Compr. poste" },
    { key: "transitions", label: "Transitions" },
    { key: "deplacement_tactique", label: "Déplacement tactique", shortLabel: "Déplac. tact." },
  ],
  "Coach technique au poste": [
    { key: "passe", label: "Passe" },
    { key: "tir", label: "Tir" },
    { key: "dribble", label: "Dribble" },
    { key: "marquage", label: "Marquage" },
    { key: "tacle", label: "Tacle" },
    { key: "jeu_de_tete", label: "Jeu de tête" },
    { key: "conduite", label: "Conduite" },
    { key: "pied_faible", label: "Pied faible" },
    { key: "coups_de_pied_arretes", label: "Coups de pied arrêtés", shortLabel: "CPA" },
  ],
  "Coach mental": [
    { key: "confiance_en_soi", label: "Confiance en soi", shortLabel: "Confiance" },
    { key: "concentration", label: "Concentration" },
    { key: "gestion_stress", label: "Gestion du stress", shortLabel: "Stress" },
    { key: "motivation", label: "Motivation" },
    { key: "resilience", label: "Résilience" },
    { key: "discipline", label: "Discipline" },
    { key: "leadership", label: "Leadership" },
    { key: "gestion_erreurs", label: "Gestion des erreurs", shortLabel: "Erreurs" },
  ],
  "Coach Développement des jeunes": [
    { key: "attitude_ecoute", label: "Attitude (écoute)", shortLabel: "Écoute" },
    { key: "concentration", label: "Concentration" },
    { key: "coordination_motrice", label: "Coordination motrice", shortLabel: "Coord. motrice" },
    { key: "bases_techniques", label: "Bases techniques", shortLabel: "Bases tech." },
    { key: "comprehension_du_jeu", label: "Compréhension du jeu", shortLabel: "Compréhension" },
    { key: "confiance_expression", label: "Confiance (expression)", shortLabel: "Expression" },
    { key: "autonomie", label: "Autonomie" },
    { key: "plaisir_motivation", label: "Plaisir (motivation)", shortLabel: "Plaisir" },
  ],
};

/**
 * Lookup "clé d'axe → label humain", construit à partir de toutes les
 * spécialités. Permet d'afficher proprement un axe stocké en DB (ex:
 * "prise_de_balle" → "Prise de balle") sans savoir de quelle spé il
 * vient. En cas de collision (ex: "concentration" existe chez plusieurs
 * spés avec le même label), le dernier gagne — sans impact car le label
 * est par convention identique pour une clé donnée.
 */
const AXIS_LABEL_LOOKUP: Record<string, string> = (() => {
  const lookup: Record<string, string> = {};
  for (const axes of Object.values(SPECIALITY_AXES)) {
    for (const axis of axes) {
      lookup[axis.key] = axis.label;
    }
  }
  for (const axis of FOOTBALL_SKILL_AXES) {
    if (!lookup[axis.key]) lookup[axis.key] = axis.label;
  }
  return lookup;
})();

/** Lookup "clé d'axe → shortLabel" pour le radar sur petits écrans. */
const AXIS_SHORT_LABEL_LOOKUP: Record<string, string> = (() => {
  const lookup: Record<string, string> = {};
  for (const axes of Object.values(SPECIALITY_AXES)) {
    for (const axis of axes) {
      if (axis.shortLabel) lookup[axis.key] = axis.shortLabel;
    }
  }
  return lookup;
})();

export function getAxisLabel(key: string): string {
  return AXIS_LABEL_LOOKUP[key] ?? key.replace(/_/g, " ");
}

/** Renvoie shortLabel si défini, sinon label complet. Utilisé pour
 *  les charts (radar) où la place est limitée sur mobile. */
export function getAxisShortLabel(key: string): string {
  return AXIS_SHORT_LABEL_LOOKUP[key] ?? AXIS_LABEL_LOOKUP[key] ?? key.replace(/_/g, " ");
}

/**
 * Renvoie les axes de notation à afficher dans le formulaire de retour
 * post-séance pour un coach donné. Fallback sur les 5 axes génériques
 * si la spécialité n'est pas reconnue (anciens coachs inscrits avec
 * "Coach technique", "Gardien"... avant la refonte).
 */
export function getSpecialityAxes(speciality: string | null | undefined): readonly SpecialityAxis[] {
  if (!speciality) return FOOTBALL_SKILL_AXES;
  const direct = SPECIALITY_AXES[speciality];
  if (direct) return direct;
  // Rétro-compat : essayer de matcher par substring sur les anciens libellés.
  const needle = speciality.toLowerCase();
  for (const [key, axes] of Object.entries(SPECIALITY_AXES)) {
    if (key.toLowerCase().includes(needle) || needle.includes(key.toLowerCase())) {
      return axes;
    }
  }
  return FOOTBALL_SKILL_AXES;
}

export const LOAD_RECOMMENDATION_LABELS: Record<LoadRecommendation, string> = {
  normal: "Charge normale",
  lighten: "Alléger la charge",
  recover: "Récupération",
  increase: "Augmenter la charge",
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
