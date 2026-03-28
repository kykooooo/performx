export type UserRole = "player" | "coach" | "parent";
export type LegacyUserRole = UserRole | "club";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type PositionFamily = "goalkeeper" | "defender" | "midfielder" | "attacker";
export type DominantFoot = "Droitier" | "Gaucher" | "Ambidextre";
export type AgeCategory = "U9" | "U11" | "U13" | "U15" | "U17" | "U19" | "Senior";
export type LoadRecommendation = "normal" | "lighten" | "recover";

export type Profile = {
  userId: string;
  role?: UserRole;
  firstName: string;
  lastName: string;
  city: string;
  avatarUrl?: string;
  level?: string;
  position?: string;
  positionFamily?: PositionFamily;
  objectives?: string;
  dominantFoot?: DominantFoot;
  trainingFrequencyPerWeek?: number;
  currentClub?: string;
  ageCategory?: AgeCategory;
  positionObjectives?: string[];
  injuryHistory?: string;
  loadConstraints?: string;
};

export type AvailabilitySlot = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
};

export type Coach = {
  id: string;
  userId: string;
  name: string;
  speciality: string;
  bio: string;
  location: string;
  department?: string;
  diplomas?: string[];
  experienceYears?: number;
  certifications?: string[];
  focusAreas?: string[];
  sessionFormats?: string[];
  pedagogy?: string;
  pricePerSession: number;
  rating: number;
  reviews: number;
  availability: AvailabilitySlot[];
};

export type SessionStatus = "upcoming" | "completed" | "cancelled";

export type LegacySessionFeedback = {
  ratings: {
    technique: number;
    engagement: number;
    progression: number;
  };
  comment: string;
};

export type SessionFeedback = {
  version?: 2;
  ratings: {
    technique: number;
    tactique?: number;
    physique?: number;
    intensite?: number;
    mental?: number;
    engagement?: number;
    progression?: number;
  };
  summary?: string;
  next_focus?: string;
  load_recommendation?: LoadRecommendation;
  comment?: string;
};

export type SessionFeedbackRecord = SessionFeedback | LegacySessionFeedback;

export type Session = {
  id: string;
  coachId: string;
  playerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  status: SessionStatus;
  feedback?: SessionFeedbackRecord | null;
};

export type Booking = {
  id: string;
  sessionId: string;
  playerId: string;
  coachId: string;
  createdAt: string;
  price: number;
  paymentStatus: "paid" | "pending" | "failed";
};

export type Player = {
  id: string;
  name: string;
  city: string;
  level: string;
  position: string;
  positionFamily?: PositionFamily;
  objectives?: string;
  dominantFoot?: DominantFoot;
  trainingFrequencyPerWeek?: number;
  currentClub?: string;
  ageCategory?: AgeCategory;
  positionObjectives?: string[];
  injuryHistory?: string;
  loadConstraints?: string;
  rating: number;
  reviews: number;
};

export type Review = {
  id: string;
  coachId: string;
  playerName: string;
  rating: number;
  comment: string;
  date: string; // YYYY-MM-DD
};

export type PlayerRadarPoint = {
  skill: string;
  value: number;
};

export type PlayerProgressionPoint = {
  month: string;
  score: number;
};

export type ParentOverview = {
  attendance: number;
  progression: number;
  lastLoadRecommendation: LoadRecommendation;
  nextFocus: string;
};

export type ParentChildSummary = {
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  positionFamily: PositionFamily | null;
  ageCategory: AgeCategory | null;
  dominantFoot: DominantFoot | null;
  currentClub: string | null;
};
