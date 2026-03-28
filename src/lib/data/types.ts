import type {
  AgeCategory,
  AvailabilitySlot,
  DominantFoot,
  LoadRecommendation,
  PositionFamily,
  SessionFeedbackRecord,
  SessionStatus,
  UserRole,
} from "@/lib/types";

export type DataMode = "live" | "demo";
export type FallbackReason =
  | "unauthenticated"
  | "missing-config"
  | "empty-live"
  | "error";

export type DataResult<T> = {
  mode: DataMode;
  data: T;
  fallbackReason?: FallbackReason;
};

export type CoachRecord = {
  id: string;
  userId: string | null;
  name: string;
  speciality: string;
  bio: string | null;
  location: string | null;
  department: string | null;
  pricePerSession: number | null;
  rating: number | null;
  reviewsCount: number;
  avatarUrl: string | null;
  availability: AvailabilitySlot[];
  experienceYears: number | null;
  diplomas: string[];
  certifications: string[];
  focusAreas: string[];
  sessionFormats: string[];
  pedagogy: string | null;
};

export type CoachDashboardCoachRecord = Pick<
  CoachRecord,
  "id" | "userId" | "name" | "rating" | "pricePerSession" | "availability"
>;

export type PlayerRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  city: string | null;
  department: string | null;
  level: string | null;
  position: string | null;
  positionFamily: PositionFamily | null;
  objectives: string | null;
  dominantFoot: DominantFoot | null;
  currentClub: string | null;
  ageCategory: AgeCategory | null;
  positionObjectives: string[];
  avatarUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

export type SessionRecord = {
  id: string;
  coachId: string;
  playerId: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: SessionStatus;
  feedback: SessionFeedbackRecord | null;
  coachName?: string | null;
};

export type BookingRecord = {
  id: string;
  sessionId: string;
  playerId: string;
  coachId: string;
  createdAt: string;
  price: number;
  paymentStatus: "paid" | "pending" | "failed";
};

export type ParentChildRecord = {
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  birthDate: string | null;
  city: string | null;
  department: string | null;
  level: string | null;
  position: string | null;
  positionFamily: PositionFamily | null;
  ageCategory: AgeCategory | null;
  dominantFoot: DominantFoot | null;
  currentClub: string | null;
};

export type PlayerSnapshotRecord = {
  currentClub: string | null;
  dominantFoot: DominantFoot | null;
  trainingFrequencyPerWeek: number | null;
};

export type ParentLegacyHint = {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  level: string | null;
  position: string | null;
};

export type ConversationRecord = {
  id: string;
  createdAt: string;
  otherUserId: string | null;
  otherName: string;
  role: UserRole | null;
  profileHref: string;
  avatarSeed: string;
  unread: number;
  online: boolean;
  lastSeen: string | null;
};

export type MessageRecord = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type ParentOverviewRecord = {
  attendance: number;
  progression: number;
  lastLoadRecommendation: LoadRecommendation;
  nextFocus: string;
};
