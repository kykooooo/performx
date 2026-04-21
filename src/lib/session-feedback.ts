import { FOOTBALL_SKILL_AXES } from "./football";
import type {
  LegacySessionFeedback,
  LoadRecommendation,
  SessionFeedback,
  SessionFeedbackRecord,
} from "./types";

type FeedbackAxisKey = (typeof FOOTBALL_SKILL_AXES)[number]["key"];

const DEFAULT_RATING = 3;

export function createEmptyFeedbackDraft(): SessionFeedback {
  return {
    version: 2,
    ratings: {
      technique: DEFAULT_RATING,
      tactique: DEFAULT_RATING,
      physique: DEFAULT_RATING,
      intensite: DEFAULT_RATING,
      mental: DEFAULT_RATING,
    },
    speciality_ratings: {},
    summary: "",
    next_focus: "",
    advice: "",
    load_recommendation: "normal",
  };
}

export function isSessionFeedbackV2(value: SessionFeedbackRecord | null | undefined): value is SessionFeedback {
  return Boolean(value && "version" in value && value.version === 2);
}

function fromLegacyFeedback(feedback: LegacySessionFeedback): SessionFeedback {
  return {
    version: 2,
    ratings: {
      technique: feedback.ratings.technique,
      tactique: feedback.ratings.progression,
      physique: feedback.ratings.engagement,
      intensite: feedback.ratings.engagement,
      mental: feedback.ratings.progression,
    },
    summary: feedback.comment,
    next_focus: "",
    load_recommendation: "normal",
  };
}

export function normalizeSessionFeedback(
  value: SessionFeedbackRecord | null | undefined,
): SessionFeedback | null {
  if (!value) return null;
  if (isSessionFeedbackV2(value)) return value;
  return fromLegacyFeedback(value);
}

export function getFeedbackAverage(feedback: SessionFeedback | null | undefined): number {
  if (!feedback) return 0;
  const values = Object.values(feedback.ratings);
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getLatestFeedback<T extends { feedback?: SessionFeedbackRecord | null }>(
  sessions: T[],
): SessionFeedback | null {
  for (const session of sessions) {
    const feedback = normalizeSessionFeedback(session.feedback);
    if (feedback) return feedback;
  }
  return null;
}

export function getLoadRecommendationTone(load: LoadRecommendation): string {
  switch (load) {
    case "recover":
      return "text-[color:var(--px-danger)]";
    case "lighten":
      return "text-[color:var(--px-warning)]";
    case "increase":
      return "text-[color:var(--px-accent)]";
    default:
      return "text-[color:var(--px-success)]";
  }
}

export function getFeedbackAxisValue(
  feedback: SessionFeedback | null | undefined,
  axis: FeedbackAxisKey,
): number {
  return feedback?.ratings[axis] ?? DEFAULT_RATING;
}
