import { parseTextArray } from "@/lib/football";
import { normalizeUserRole } from "@/lib/roles";
import {
  mockCoaches,
  mockConversations,
  mockMessages,
  mockParentChildren,
} from "@/lib/mock-data";
import type {
  Booking,
  Coach,
  Player,
  Session,
} from "@/lib/types";
import type {
  BookingRecord,
  CoachRecord,
  ConversationRecord,
  MessageRecord,
  ParentChildRecord,
  PlayerRecord,
  SessionRecord,
} from "./types";

const normalizeTimeValue = (value: string | null | undefined) => {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const buildName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = "Utilisateur",
) => {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback;
};

type CoachLike = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  speciality?: string | null;
  specialities?: string[] | string | null;
  accepted_age_categories?: string[] | string | null;
  service_radius_km?: number | null;
  intervention_locations?: string[] | string | null;
  bio?: string | null;
  location?: string | null;
  department?: string | null;
  price_per_session?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
  avatar_url?: string | null;
  availability?: CoachRecord["availability"] | null;
  experience_years?: number | null;
  diplomas?: string[] | string | null;
  certifications?: string[] | string | null;
  focus_areas?: string[] | string | null;
  session_formats?: string[] | string | null;
  pedagogy?: string | null;
};

type PlayerLike = {
  user_id?: string | null;
  id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  department?: string | null;
  level?: string | null;
  position?: string | null;
  position_family?: PlayerRecord["positionFamily"];
  objectives?: string | null;
  dominant_foot?: PlayerRecord["dominantFoot"];
  current_club?: string | null;
  age_category?: PlayerRecord["ageCategory"];
  position_objectives?: string[] | string | null;
  avatar_url?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
};

type SessionLike = {
  id: string;
  coach_id?: string | null;
  coachId?: string | null;
  player_id?: string | null;
  playerId?: string | null;
  title: string;
  date: string;
  time: string;
  duration_minutes?: number | null;
  durationMinutes?: number | null;
  status: SessionRecord["status"];
  feedback?: SessionRecord["feedback"];
  session_type?: string | null;
  sessionType?: string | null;
  coachName?: string | null;
};

type BookingLike = {
  id: string;
  session_id?: string | null;
  sessionId?: string | null;
  player_id?: string | null;
  playerId?: string | null;
  coach_id?: string | null;
  coachId?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  price?: number | null;
  payment_status?: BookingRecord["paymentStatus"] | null;
  paymentStatus?: BookingRecord["paymentStatus"] | null;
};

type ParentChildLike = {
  user_id?: string | null;
  userId?: string | null;
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  birth_date?: string | null;
  birthDate?: string | null;
  city?: string | null;
  department?: string | null;
  level?: string | null;
  position?: string | null;
  position_family?: ParentChildRecord["positionFamily"];
  positionFamily?: ParentChildRecord["positionFamily"];
  age_category?: ParentChildRecord["ageCategory"];
  ageCategory?: ParentChildRecord["ageCategory"];
  dominant_foot?: ParentChildRecord["dominantFoot"];
  dominantFoot?: ParentChildRecord["dominantFoot"];
  current_club?: string | null;
  currentClub?: string | null;
};

export function mapCoachLikeToCoachRecord(source: CoachLike): CoachRecord {
  const specialitiesList = parseTextArray(source.specialities ?? []);
  const speciality = source.speciality ?? specialitiesList[0] ?? "Coach";
  return {
    id: source.id,
    userId: source.user_id ?? null,
    name: source.name ?? "Coach",
    speciality,
    specialities: specialitiesList.length > 0 ? specialitiesList : [speciality],
    acceptedAgeCategories: parseTextArray(source.accepted_age_categories ?? []),
    serviceRadiusKm: source.service_radius_km ?? null,
    interventionLocations: parseTextArray(source.intervention_locations ?? []),
    bio: source.bio ?? null,
    location: source.location ?? null,
    department: source.department ?? source.location ?? null,
    pricePerSession: source.price_per_session ?? null,
    rating: source.rating ?? null,
    reviewsCount: source.reviews_count ?? 0,
    avatarUrl: source.avatar_url ?? null,
    availability: Array.isArray(source.availability) ? source.availability : [],
    experienceYears: source.experience_years ?? null,
    diplomas: parseTextArray(source.diplomas ?? []),
    certifications: parseTextArray(source.certifications ?? []),
    focusAreas: parseTextArray(source.focus_areas ?? []),
    sessionFormats: parseTextArray(source.session_formats ?? []),
    pedagogy: source.pedagogy ?? null,
  };
}

export function mapMockCoachToCoachRecord(source: Coach): CoachRecord {
  return {
    id: source.id,
    userId: source.userId,
    name: source.name,
    speciality: source.speciality,
    specialities: [source.speciality].filter(Boolean),
    acceptedAgeCategories: [],
    serviceRadiusKm: null,
    interventionLocations: [],
    bio: source.bio,
    location: source.location,
    department: source.department ?? source.location,
    pricePerSession: source.pricePerSession,
    rating: source.rating,
    reviewsCount: source.reviews,
    avatarUrl: null,
    availability: source.availability,
    experienceYears: source.experienceYears ?? null,
    diplomas: source.diplomas ?? [],
    certifications: source.certifications ?? [],
    focusAreas: source.focusAreas ?? [],
    sessionFormats: source.sessionFormats ?? [],
    pedagogy: source.pedagogy ?? null,
  };
}

export function mapPlayerLikeToPlayerRecord(source: PlayerLike): PlayerRecord {
  const firstName = source.first_name ?? null;
  const lastName = source.last_name ?? null;

  return {
    id: source.user_id ?? source.id ?? "",
    firstName,
    lastName,
    name: buildName(firstName, lastName, "Joueur"),
    city: source.city ?? null,
    department: source.department ?? source.city ?? null,
    level: source.level ?? null,
    position: source.position ?? null,
    positionFamily: source.position_family ?? null,
    objectives: source.objectives ?? null,
    dominantFoot: source.dominant_foot ?? null,
    currentClub: source.current_club ?? null,
    ageCategory: source.age_category ?? null,
    positionObjectives: parseTextArray(source.position_objectives ?? []),
    avatarUrl: source.avatar_url ?? null,
    rating: source.rating ?? null,
    reviewsCount: source.reviews_count ?? 0,
  };
}

export function mapMockPlayerToPlayerRecord(source: Player): PlayerRecord {
  const [firstName = "Joueur", ...rest] = source.name.split(" ");
  return {
    id: source.id,
    firstName,
    lastName: rest.join(" ") || null,
    name: source.name,
    city: source.city,
    department: source.city,
    level: source.level,
    position: source.position,
    positionFamily: source.positionFamily ?? null,
    objectives: source.objectives ?? null,
    dominantFoot: source.dominantFoot ?? null,
    currentClub: source.currentClub ?? null,
    ageCategory: source.ageCategory ?? null,
    positionObjectives: source.positionObjectives ?? [],
    avatarUrl: null,
    rating: source.rating,
    reviewsCount: source.reviews,
  };
}

export function mapSessionLikeToSessionRecord(source: SessionLike): SessionRecord {
  return {
    id: source.id,
    coachId: source.coach_id ?? source.coachId ?? "",
    playerId: source.player_id ?? source.playerId ?? "",
    title: source.title,
    date: source.date,
    time: normalizeTimeValue(source.time),
    durationMinutes: source.duration_minutes ?? source.durationMinutes ?? 60,
    status: source.status,
    feedback: source.feedback ?? null,
    sessionType: source.session_type ?? source.sessionType ?? null,
    coachName: source.coachName ?? null,
  };
}

export function mapMockSessionToSessionRecord(source: Session): SessionRecord {
  return {
    id: source.id,
    coachId: source.coachId,
    playerId: source.playerId,
    title: source.title,
    date: source.date,
    time: normalizeTimeValue(source.time),
    durationMinutes: source.durationMinutes,
    status: source.status,
    feedback: source.feedback ?? null,
    coachName: null,
  };
}

export function mapBookingLikeToBookingRecord(source: BookingLike): BookingRecord {
  return {
    id: source.id,
    sessionId: source.session_id ?? source.sessionId ?? "",
    playerId: source.player_id ?? source.playerId ?? "",
    coachId: source.coach_id ?? source.coachId ?? "",
    createdAt: source.created_at ?? source.createdAt ?? new Date().toISOString(),
    price: source.price ?? 0,
    paymentStatus: source.payment_status ?? source.paymentStatus ?? "paid",
  };
}

export function mapMockBookingToBookingRecord(source: Booking): BookingRecord {
  return {
    id: source.id,
    sessionId: source.sessionId,
    playerId: source.playerId,
    coachId: source.coachId,
    createdAt: source.createdAt,
    price: source.price,
    paymentStatus: source.paymentStatus,
  };
}

export function mapParentChildLikeToRecord(source: ParentChildLike): ParentChildRecord {
  const firstName = source.first_name ?? source.firstName ?? "Joueur";
  const lastName = source.last_name ?? source.lastName ?? "";

  return {
    userId: source.user_id ?? source.userId ?? "",
    firstName,
    lastName,
    name: buildName(firstName, lastName, "Joueur"),
    birthDate: source.birth_date ?? source.birthDate ?? null,
    city: source.city ?? null,
    department: source.department ?? source.city ?? null,
    level: source.level ?? null,
    position: source.position ?? null,
    positionFamily: source.position_family ?? source.positionFamily ?? null,
    ageCategory: source.age_category ?? source.ageCategory ?? null,
    dominantFoot: source.dominant_foot ?? source.dominantFoot ?? null,
    currentClub: source.current_club ?? source.currentClub ?? null,
  };
}

export function getMockParentChildrenRecords() {
  return mockParentChildren.map(mapParentChildLikeToRecord);
}

export function getMockConversationRecords(): ConversationRecord[] {
  return mockConversations.map((conversation) => ({
    id: conversation.id,
    createdAt: conversation.created_at,
    otherUserId: conversation.otherUserId,
    otherName: conversation.otherName,
    role: normalizeUserRole(conversation.role ?? null),
    profileHref:
      conversation.role === "coach"
        ? "/coach"
        : conversation.role === "player" && conversation.otherUserId
          ? `/players/${conversation.otherUserId}`
          : "/dashboard",
    avatarSeed: conversation.avatarSeed,
    unread: conversation.unread,
    online: conversation.online,
    lastSeen: conversation.lastSeen ?? null,
  }));
}

export function getMockMessageRecords(conversationId: string): MessageRecord[] {
  return mockMessages
    .filter((message) => message.conversationId === conversationId)
    .map((message) => ({
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.created_at,
    }));
}

export function getMockCoachRecords() {
  return mockCoaches.map(mapMockCoachToCoachRecord);
}
