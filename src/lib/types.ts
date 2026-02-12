export type UserRole = "player" | "coach" | "club";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Profile = {
  userId: string;
  firstName: string;
  lastName: string;
  city: string;
  avatarUrl?: string;
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
  pricePerSession: number;
  rating: number;
  reviews: number;
  availability: AvailabilitySlot[];
};

export type SessionStatus = "upcoming" | "completed" | "cancelled";

export type Session = {
  id: string;
  coachId: string;
  playerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  status: SessionStatus;
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
  objectives?: string;
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
