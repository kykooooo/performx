import { getPlayerAgeCategory, getPositionFamily, parseTextArray } from "./football";

export type PlayerProfileValues = {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  city: string;
  level: string;
  position: string;
  dominantFoot: string;
  trainingFrequency: number | "";
  currentClub: string;
  ageCategory: string;
  positionObjectives: string[];
  objectives: string;
  injuryHistory: string;
  loadConstraints: string;
};

type PlayerProfileRecord = {
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  city?: string | null;
  level?: string | null;
  position?: string | null;
  dominant_foot?: string | null;
  training_frequency_per_week?: number | string | null;
  current_club?: string | null;
  age_category?: string | null;
  position_objectives?: string[] | string | null;
  objectives?: string | null;
  injury_history?: string | null;
  load_constraints?: string | null;
};

export function createEmptyPlayerProfileValues(): PlayerProfileValues {
  return {
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    city: "",
    level: "",
    position: "",
    dominantFoot: "",
    trainingFrequency: "",
    currentClub: "",
    ageCategory: "",
    positionObjectives: [],
    objectives: "",
    injuryHistory: "",
    loadConstraints: "",
  };
}

export function mapPlayerProfileRecordToValues(
  record: PlayerProfileRecord | null | undefined,
): PlayerProfileValues {
  return {
    firstName: record?.first_name ?? "",
    lastName: record?.last_name ?? "",
    gender: record?.gender ?? "",
    birthDate: record?.birth_date ?? "",
    city: record?.city ?? "",
    level: record?.level ?? "",
    position: record?.position ?? "",
    dominantFoot: record?.dominant_foot ?? "",
    trainingFrequency:
      typeof record?.training_frequency_per_week === "number"
        ? record.training_frequency_per_week
        : typeof record?.training_frequency_per_week === "string" &&
            record.training_frequency_per_week.trim()
          ? Number(record.training_frequency_per_week)
          : "",
    currentClub: record?.current_club ?? "",
    ageCategory: record?.age_category ?? "",
    positionObjectives: parseTextArray(record?.position_objectives ?? []),
    objectives: record?.objectives ?? "",
    injuryHistory: record?.injury_history ?? "",
    loadConstraints: record?.load_constraints ?? "",
  };
}

export function getResolvedPlayerAgeCategory(
  values: Pick<PlayerProfileValues, "birthDate" | "ageCategory">,
) {
  return values.ageCategory || getPlayerAgeCategory(values.birthDate) || null;
}

export function buildPlayerProfileMetadata(
  values: PlayerProfileValues,
  extras: { avatarUrl?: string | null } = {},
) {
  return {
    role: "player",
    first_name: values.firstName.trim() || null,
    last_name: values.lastName.trim() || null,
    gender: values.gender || null,
    birth_date: values.birthDate || null,
    city: values.city || null,
    level: values.level || null,
    position: values.position || null,
    position_family: getPositionFamily(values.position),
    objectives: values.objectives.trim() || null,
    dominant_foot: values.dominantFoot || null,
    training_frequency_per_week:
      values.trainingFrequency === "" ? null : Number(values.trainingFrequency),
    current_club: values.currentClub.trim() || null,
    age_category: getResolvedPlayerAgeCategory(values),
    position_objectives: values.positionObjectives,
    injury_history: values.injuryHistory.trim() || null,
    load_constraints: values.loadConstraints.trim() || null,
    avatar_url: extras.avatarUrl ?? null,
  };
}

export function buildPlayerProfileUpdate(
  values: PlayerProfileValues,
  extras: { avatarUrl?: string | null } = {},
) {
  return buildPlayerProfileMetadata(values, extras);
}
