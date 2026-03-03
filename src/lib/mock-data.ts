import { addDays, startOfWeek, toISODate } from "./date";
import type { Booking, Coach, Player, Profile, Review, Session, User } from "./types";

const baseWeek = startOfWeek(new Date());

const buildSlot = (dayOffset: number, time: string, durationMinutes = 60) => ({
  date: toISODate(addDays(baseWeek, dayOffset)),
  time,
  durationMinutes,
});

export const mockPlayer: Player = {
  id: "player_1",
  name: "Alex Martin",
  city: "Rouen",
  level: "Intermédiaire",
  position: "Milieu de terrain offensif",
  rating: 4.2,
  reviews: 8,
};

export const mockUsers: User[] = [
  { id: "user_1", email: "alex@performx.fr", role: "player", createdAt: new Date().toISOString() },
  { id: "user_10", email: "jean@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_11", email: "philippe@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_12", email: "sarah@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_13", email: "kevin@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_14", email: "amina@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_15", email: "hugo@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_16", email: "noa@performx.fr", role: "coach", createdAt: new Date().toISOString() },
  { id: "user_17", email: "lina@performx.fr", role: "coach", createdAt: new Date().toISOString() },
];

export const mockProfiles: Profile[] = [
  { userId: "user_1", firstName: "Alex", lastName: "Martin", city: "Rouen" },
  { userId: "user_10", firstName: "Jean", lastName: "Dupont", city: "Rouen" },
  { userId: "user_11", firstName: "Philippe", lastName: "Le Divert", city: "Le Havre" },
  { userId: "user_12", firstName: "Sarah", lastName: "Mbappé", city: "Dieppe" },
  { userId: "user_13", firstName: "Kevin", lastName: "Morel", city: "Elbeuf" },
  { userId: "user_14", firstName: "Amina", lastName: "Reza", city: "Rouen" },
  { userId: "user_15", firstName: "Hugo", lastName: "Lambert", city: "Dieppe" },
  { userId: "user_16", firstName: "Noa", lastName: "El Mahdi", city: "Rouen" },
  { userId: "user_17", firstName: "Lina", lastName: "Pereira", city: "Fécamp" },
];

export const mockCoaches: Coach[] = [
  {
    id: "coach_1",
    userId: "user_10",
    name: "Jean Dupont",
    speciality: "Coach technique",
    bio: "Ancien joueur professionnel, focus sur la précision et le contrôle du ballon.",
    location: "Rouen",
    department: "76 – Seine-Maritime",
    diplomas: ["UEFA B", "BEPF – Brevet d'Entraîneur Professionnel"],
    experience: 12,
    pricePerSession: 39,
    rating: 4.7,
    reviews: 52,
    availability: [
      buildSlot(1, "18:00"),
      buildSlot(2, "19:30"),
      buildSlot(4, "17:00"),
    ],
  },
  {
    id: "coach_2",
    userId: "user_11",
    name: "Philippe Le Divert",
    speciality: "Préparation physique",
    bio: "Travail vitesse, explosivité et prévention des blessures.",
    location: "Le Havre",
    department: "76 – Seine-Maritime",
    diplomas: ["DEJEPS Football", "BPJEPS Football"],
    experience: 8,
    pricePerSession: 55,
    rating: 4.3,
    reviews: 38,
    availability: [
      buildSlot(1, "20:00"),
      buildSlot(3, "18:30"),
      buildSlot(5, "10:00"),
    ],
  },
  {
    id: "coach_3",
    userId: "user_12",
    name: "Sarah Mbappé",
    speciality: "Gardienne",
    bio: "Spécialiste du jeu aérien et des réflexes rapides.",
    location: "Dieppe",
    department: "76 – Seine-Maritime",
    diplomas: ["UEFA A", "BEF – Brevet d'Entraîneur de Football"],
    experience: 10,
    pricePerSession: 45,
    rating: 4.9,
    reviews: 64,
    availability: [
      buildSlot(2, "16:00"),
      buildSlot(4, "19:00"),
      buildSlot(6, "11:00"),
    ],
  },
  {
    id: "coach_4",
    userId: "user_13",
    name: "Kevin Morel",
    speciality: "Vision de jeu",
    bio: "Séances personnalisées pour améliorer la prise d'informations.",
    location: "Elbeuf",
    department: "76 – Seine-Maritime",
    diplomas: ["UEFA C", "BMF – Brevet de Moniteur de Football"],
    experience: 5,
    pricePerSession: 42,
    rating: 4.6,
    reviews: 29,
    availability: [
      buildSlot(0, "17:30"),
      buildSlot(2, "18:00"),
      buildSlot(3, "20:00"),
    ],
  },
  {
    id: "coach_5",
    userId: "user_14",
    name: "Amina Reza",
    speciality: "Frappe",
    bio: "Travail de finition, placement et gestes techniques avancés.",
    location: "Rouen",
    department: "76 – Seine-Maritime",
    diplomas: ["UEFA B", "DEJEPS Football"],
    experience: 7,
    pricePerSession: 48,
    rating: 4.8,
    reviews: 47,
    availability: [
      buildSlot(1, "17:00"),
      buildSlot(2, "19:00"),
      buildSlot(4, "18:30"),
    ],
  },
  {
    id: "coach_6",
    userId: "user_15",
    name: "Hugo Lambert",
    speciality: "Endurance",
    bio: "Plan personnalisé pour progresser sur 90 minutes.",
    location: "Dieppe",
    department: "76 – Seine-Maritime",
    diplomas: ["BPJEPS Football"],
    experience: 3,
    pricePerSession: 35,
    rating: 4.2,
    reviews: 19,
    availability: [
      buildSlot(0, "08:30"),
      buildSlot(5, "09:30"),
    ],
  },
  {
    id: "coach_7",
    userId: "user_16",
    name: "Noa El Mahdi",
    speciality: "Dribbles",
    bio: "Travail coordination, feintes et changements de rythme.",
    location: "Sotteville-lès-Rouen",
    department: "76 – Seine-Maritime",
    diplomas: ["UEFA A", "DEJEPS Football", "BEF – Brevet d'Entraîneur de Football"],
    experience: 15,
    pricePerSession: 50,
    rating: 4.9,
    reviews: 71,
    availability: [
      buildSlot(1, "16:30"),
      buildSlot(3, "19:00"),
      buildSlot(5, "14:00"),
    ],
  },
  {
    id: "coach_8",
    userId: "user_17",
    name: "Lina Pereira",
    speciality: "Jeu défensif",
    bio: "Placement, interventions et lecture du jeu.",
    location: "Fécamp",
    department: "76 – Seine-Maritime",
    diplomas: ["UEFA C"],
    experience: 4,
    pricePerSession: 38,
    rating: 4.4,
    reviews: 22,
    availability: [
      buildSlot(2, "17:00"),
      buildSlot(6, "15:00"),
    ],
  },
];

export const mockPlayers: Player[] = [
  {
    id: "player_1",
    name: "Alex Martin",
    city: "Rouen",
    level: "Intermédiaire",
    position: "Milieu de terrain offensif",
    objectives: "Améliorer ma vision de jeu et mes passes décisives.",
    rating: 4.2,
    reviews: 8,
  },
  {
    id: "player_2",
    name: "Lucas Bertin",
    city: "Rouen",
    level: "Confirmé",
    position: "Avant-centre",
    objectives: "Travailler la finition et les frappes enroulées.",
    rating: 4.5,
    reviews: 14,
  },
  {
    id: "player_3",
    name: "Inès Chabane",
    city: "Le Havre",
    level: "Débutant",
    position: "Défenseur central",
    objectives: "Gagner en confiance et améliorer mon placement.",
    rating: 3.8,
    reviews: 3,
  },
  {
    id: "player_4",
    name: "Mathis Lefèvre",
    city: "Barentin",
    level: "Intermédiaire",
    position: "Gardien",
    objectives: "Développer mes réflexes et mon jeu au pied.",
    rating: 4.0,
    reviews: 6,
  },
  {
    id: "player_5",
    name: "Yasmine El Amrani",
    city: "Elbeuf",
    level: "Confirmé",
    position: "Milieu de terrain défensif",
    objectives: "Gagner en endurance et en pressing haut.",
    rating: 4.7,
    reviews: 19,
  },
  {
    id: "player_6",
    name: "Théo Garnier",
    city: "Dieppe",
    level: "Débutant",
    position: "Ailier",
    objectives: "Apprendre les bases du dribble et des centres.",
    rating: 3.5,
    reviews: 2,
  },
  {
    id: "player_7",
    name: "Chloé Da Silva",
    city: "Rouen",
    level: "Intermédiaire",
    position: "Défenseur latéral",
    objectives: "Améliorer les montées offensives et les centres.",
    rating: 4.3,
    reviews: 11,
  },
  {
    id: "player_8",
    name: "Rayan Benali",
    city: "Fécamp",
    level: "Confirmé",
    position: "Milieu de terrain offensif",
    objectives: "Perfectionner les coups de pied arrêtés.",
    rating: 4.6,
    reviews: 22,
  },
];

export const mockSessions: Session[] = [
  {
    id: "session_1",
    coachId: "coach_1",
    playerId: mockPlayer.id,
    title: "Entraînement tir au but",
    date: toISODate(addDays(baseWeek, 1)),
    time: "18:00",
    durationMinutes: 60,
    status: "upcoming",
  },
  {
    id: "session_2",
    coachId: "coach_1",
    playerId: mockPlayer.id,
    title: "Entraînement précision",
    date: toISODate(addDays(baseWeek, 3)),
    time: "19:30",
    durationMinutes: 60,
    status: "upcoming",
  },
  {
    id: "session_5",
    coachId: "coach_5",
    playerId: mockPlayer.id,
    title: "Frappe enroulée",
    date: toISODate(addDays(baseWeek, 5)),
    time: "17:00",
    durationMinutes: 60,
    status: "upcoming",
  },
  {
    id: "session_6",
    coachId: "coach_7",
    playerId: mockPlayer.id,
    title: "Dribbles & feintes",
    date: toISODate(addDays(baseWeek, 8)),
    time: "16:30",
    durationMinutes: 60,
    status: "upcoming",
  },
  {
    id: "session_3",
    coachId: "coach_5",
    playerId: mockPlayer.id,
    title: "Endurance fondamentale",
    date: toISODate(addDays(baseWeek, -3)),
    time: "18:30",
    durationMinutes: 60,
    status: "completed",
    feedback: {
      ratings: { technique: 4, engagement: 5, progression: 4 },
      comment: "Très bon investissement pendant la séance. La qualité de passe sous pression s'améliore nettement. Continue à travailler le jeu dos au but.",
    },
  },
  {
    id: "session_4",
    coachId: "coach_4",
    playerId: mockPlayer.id,
    title: "Motricité & Proprioception",
    date: toISODate(addDays(baseWeek, -7)),
    time: "17:00",
    durationMinutes: 60,
    status: "completed",
    feedback: {
      ratings: { technique: 3, engagement: 4, progression: 4 },
      comment: "Bonne séance, la coordination œil-pied progresse. Attention au placement du pied d'appui sur les changements de direction.",
    },
  },
  {
    id: "session_7",
    coachId: "coach_1",
    playerId: mockPlayer.id,
    title: "Contrôle orienté",
    date: toISODate(addDays(baseWeek, -10)),
    time: "18:00",
    durationMinutes: 60,
    status: "completed",
    feedback: {
      ratings: { technique: 4, engagement: 4, progression: 5 },
      comment: "Grosse progression sur le contrôle orienté côté droit. Le premier toucher est plus propre. On attaquera le côté gauche à la prochaine séance.",
    },
  },
  {
    id: "session_8",
    coachId: "coach_3",
    playerId: mockPlayer.id,
    title: "Jeu aérien défensif",
    date: toISODate(addDays(baseWeek, -14)),
    time: "16:00",
    durationMinutes: 60,
    status: "completed",
  },
  {
    id: "session_9",
    coachId: "coach_2",
    playerId: mockPlayer.id,
    title: "Vitesse & explosivité",
    date: toISODate(addDays(baseWeek, -17)),
    time: "10:00",
    durationMinutes: 60,
    status: "completed",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "booking_1",
    sessionId: "session_1",
    playerId: mockPlayer.id,
    coachId: "coach_1",
    createdAt: new Date().toISOString(),
    price: 39,
    paymentStatus: "paid",
  },
  {
    id: "booking_2",
    sessionId: "session_2",
    playerId: mockPlayer.id,
    coachId: "coach_1",
    createdAt: new Date().toISOString(),
    price: 39,
    paymentStatus: "paid",
  },
  {
    id: "booking_3",
    sessionId: "session_5",
    playerId: mockPlayer.id,
    coachId: "coach_5",
    createdAt: new Date().toISOString(),
    price: 48,
    paymentStatus: "paid",
  },
  {
    id: "booking_4",
    sessionId: "session_6",
    playerId: mockPlayer.id,
    coachId: "coach_7",
    createdAt: new Date().toISOString(),
    price: 50,
    paymentStatus: "paid",
  },
  {
    id: "booking_5",
    sessionId: "session_3",
    playerId: mockPlayer.id,
    coachId: "coach_5",
    createdAt: new Date().toISOString(),
    price: 48,
    paymentStatus: "paid",
  },
  {
    id: "booking_6",
    sessionId: "session_7",
    playerId: mockPlayer.id,
    coachId: "coach_1",
    createdAt: new Date().toISOString(),
    price: 39,
    paymentStatus: "paid",
  },
  {
    id: "booking_7",
    sessionId: "session_8",
    playerId: mockPlayer.id,
    coachId: "coach_3",
    createdAt: new Date().toISOString(),
    price: 45,
    paymentStatus: "paid",
  },
  {
    id: "booking_8",
    sessionId: "session_9",
    playerId: mockPlayer.id,
    coachId: "coach_2",
    createdAt: new Date().toISOString(),
    price: 55,
    paymentStatus: "paid",
  },
];

// ── Mock conversations & messages (demo messagerie) ──

export type MockConversation = {
  id: string;
  otherName: string;
  otherUserId: string;
  created_at: string;
};

export type MockMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  created_at: string;
};

const msgDate = (daysAgo: number, hours: number, minutes: number) => {
  const d = addDays(baseWeek, -daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const mockConversations: MockConversation[] = [
  { id: "conv_1", otherName: "Jean Dupont", otherUserId: "user_10", created_at: msgDate(2, 14, 0) },
  { id: "conv_2", otherName: "Sarah Mbappé", otherUserId: "user_12", created_at: msgDate(5, 10, 30) },
  { id: "conv_3", otherName: "Amina Reza", otherUserId: "user_14", created_at: msgDate(1, 18, 15) },
];

export const mockMessages: MockMessage[] = [
  // Conv 1 — Jean Dupont (technique)
  { id: "msg_1", conversationId: "conv_1", senderId: "user_10", body: "Salut Alex ! Prêt pour la séance de mardi ?", created_at: msgDate(2, 14, 0) },
  { id: "msg_2", conversationId: "conv_1", senderId: "user_1", body: "Oui, j'ai hâte ! On travaille les tirs cadrés ?", created_at: msgDate(2, 14, 5) },
  { id: "msg_3", conversationId: "conv_1", senderId: "user_10", body: "Exactement, on va bosser le contrôle orienté + frappe enchaînée. Pense à tes crampons moulés.", created_at: msgDate(2, 14, 8) },
  { id: "msg_4", conversationId: "conv_1", senderId: "user_1", body: "Parfait, j'apporte aussi de l'eau. À mardi !", created_at: msgDate(2, 14, 12) },
  { id: "msg_5", conversationId: "conv_1", senderId: "user_10", body: "Top ! On se retrouve au terrain synthétique à 18h. 💪", created_at: msgDate(2, 14, 15) },
  // Conv 2 — Sarah Mbappé (gardienne)
  { id: "msg_6", conversationId: "conv_2", senderId: "user_12", body: "Bonjour Alex, j'ai regardé ta dernière séance. Tu progresses bien sur les sorties aériennes.", created_at: msgDate(5, 10, 30) },
  { id: "msg_7", conversationId: "conv_2", senderId: "user_1", body: "Merci Sarah ! J'aimerais travailler les réflexes la prochaine fois.", created_at: msgDate(5, 11, 0) },
  { id: "msg_8", conversationId: "conv_2", senderId: "user_12", body: "Bonne idée, je prépare un circuit réactivité. On se cale ça jeudi ?", created_at: msgDate(5, 11, 15) },
  { id: "msg_9", conversationId: "conv_2", senderId: "user_1", body: "Jeudi c'est bon pour moi. 16h ça te va ?", created_at: msgDate(5, 11, 20) },
  { id: "msg_10", conversationId: "conv_2", senderId: "user_12", body: "Parfait, c'est noté. À jeudi !", created_at: msgDate(5, 11, 25) },
  // Conv 3 — Amina Reza (frappe)
  { id: "msg_11", conversationId: "conv_3", senderId: "user_1", body: "Bonjour Amina, est-ce que tu as des créneaux cette semaine ?", created_at: msgDate(1, 18, 15) },
  { id: "msg_12", conversationId: "conv_3", senderId: "user_14", body: "Salut ! Oui, j'ai un créneau mardi à 17h et un autre jeudi à 19h.", created_at: msgDate(1, 18, 30) },
  { id: "msg_13", conversationId: "conv_3", senderId: "user_1", body: "Je prends mardi 17h ! On continue sur les frappes enroulées ?", created_at: msgDate(1, 18, 35) },
  { id: "msg_14", conversationId: "conv_3", senderId: "user_14", body: "Oui, et on ajoutera du travail de placement avant la frappe. Tu vas voir la différence.", created_at: msgDate(1, 18, 40) },
];

// ── Mock player reviews (avis de coachs sur les joueurs) ──

export type MockPlayerReview = {
  id: string;
  playerId: string;
  coach_name: string;
  rating: number;
  comment: string;
  date: string;
};

export const mockPlayerReviews: MockPlayerReview[] = [
  { id: "prev_1", playerId: "player_1", coach_name: "Jean Dupont", rating: 4, comment: "Bon potentiel technique, belle progression sur les passes longues.", date: toISODate(addDays(baseWeek, -8)) },
  { id: "prev_2", playerId: "player_1", coach_name: "Amina Reza", rating: 5, comment: "Très motivé et à l'écoute. Sa frappe s'est nettement améliorée.", date: toISODate(addDays(baseWeek, -3)) },
  { id: "prev_3", playerId: "player_2", coach_name: "Jean Dupont", rating: 5, comment: "Excellent en finition, un vrai sens du but. Continue comme ça.", date: toISODate(addDays(baseWeek, -5)) },
  { id: "prev_4", playerId: "player_2", coach_name: "Noa El Mahdi", rating: 4, comment: "Bon dribbleur, doit encore progresser sur le pied gauche.", date: toISODate(addDays(baseWeek, -2)) },
  { id: "prev_5", playerId: "player_3", coach_name: "Sarah Mbappé", rating: 4, comment: "En bonne voie, le placement s'améliore séance après séance.", date: toISODate(addDays(baseWeek, -10)) },
  { id: "prev_6", playerId: "player_4", coach_name: "Sarah Mbappé", rating: 4, comment: "Bons réflexes, le jeu au pied progresse bien.", date: toISODate(addDays(baseWeek, -6)) },
  { id: "prev_7", playerId: "player_5", coach_name: "Philippe Le Divert", rating: 5, comment: "Endurance au top, pressing très efficace. Joueur modèle.", date: toISODate(addDays(baseWeek, -4)) },
  { id: "prev_8", playerId: "player_7", coach_name: "Kevin Morel", rating: 4, comment: "Bonne lecture de jeu, les centres sont de plus en plus précis.", date: toISODate(addDays(baseWeek, -7)) },
  { id: "prev_9", playerId: "player_8", coach_name: "Noa El Mahdi", rating: 5, comment: "Vision de jeu exceptionnelle. Coups de pied arrêtés très propres.", date: toISODate(addDays(baseWeek, -1)) },
];

export const mockReviews: Review[] = [
  {
    id: "review_1",
    coachId: "coach_1",
    playerName: "Lucas B.",
    rating: 5,
    comment: "Séance ultra précise, j'ai gagné en contrôle de balle dès la première semaine.",
    date: toISODate(addDays(baseWeek, -10)),
  },
  {
    id: "review_2",
    coachId: "coach_1",
    playerName: "Amine K.",
    rating: 4,
    comment: "Coach exigeant mais efficace, je recommande.",
    date: toISODate(addDays(baseWeek, -18)),
  },
  {
    id: "review_9",
    coachId: "coach_1",
    playerName: "Parent de Léo",
    rating: 5,
    comment: "Mon fils a énormément progressé en 4 séances. Coach très pro et patient.",
    date: toISODate(addDays(baseWeek, -5)),
  },
  {
    id: "review_3",
    coachId: "coach_2",
    playerName: "Sarah M.",
    rating: 4,
    comment: "Super préparation physique, j'ai senti la diff sur le terrain.",
    date: toISODate(addDays(baseWeek, -6)),
  },
  {
    id: "review_10",
    coachId: "coach_2",
    playerName: "Théo G.",
    rating: 5,
    comment: "Programme vitesse sur 6 semaines, résultats incroyables au test VMA.",
    date: toISODate(addDays(baseWeek, -2)),
  },
  {
    id: "review_4",
    coachId: "coach_3",
    playerName: "Jules R.",
    rating: 5,
    comment: "Top pour les gardiens, beaucoup de situations réelles.",
    date: toISODate(addDays(baseWeek, -14)),
  },
  {
    id: "review_11",
    coachId: "coach_3",
    playerName: "Inès C.",
    rating: 5,
    comment: "Réflexes au top après 2 mois. Elle sait motiver sans mettre la pression.",
    date: toISODate(addDays(baseWeek, -8)),
  },
  {
    id: "review_5",
    coachId: "coach_4",
    playerName: "Nora S.",
    rating: 4,
    comment: "Très pédagogique, des progrès visibles après 3 séances.",
    date: toISODate(addDays(baseWeek, -12)),
  },
  {
    id: "review_12",
    coachId: "coach_4",
    playerName: "Rayan B.",
    rating: 5,
    comment: "Ma lecture du jeu a complètement changé. Je vois des espaces que je ne voyais pas avant.",
    date: toISODate(addDays(baseWeek, -3)),
  },
  {
    id: "review_6",
    coachId: "coach_5",
    playerName: "Baptiste L.",
    rating: 5,
    comment: "Frappe et finition au top, je suis plus confiant devant le but.",
    date: toISODate(addDays(baseWeek, -9)),
  },
  {
    id: "review_13",
    coachId: "coach_5",
    playerName: "Yasmine E.",
    rating: 4,
    comment: "Excellente coach, elle décompose chaque geste technique. Ça rentre vite.",
    date: toISODate(addDays(baseWeek, -1)),
  },
  {
    id: "review_14",
    coachId: "coach_6",
    playerName: "Chloé D.",
    rating: 4,
    comment: "Programme endurance très bien structuré, je tiens tout le match maintenant.",
    date: toISODate(addDays(baseWeek, -11)),
  },
  {
    id: "review_7",
    coachId: "coach_7",
    playerName: "Maya T.",
    rating: 5,
    comment: "Les dribbles et changements de rythme, c'est devenu mon point fort.",
    date: toISODate(addDays(baseWeek, -4)),
  },
  {
    id: "review_15",
    coachId: "coach_7",
    playerName: "Alex M.",
    rating: 5,
    comment: "Noa est un magicien du ballon. J'ai appris 4 nouvelles feintes en une séance.",
    date: toISODate(addDays(baseWeek, -1)),
  },
  {
    id: "review_8",
    coachId: "coach_8",
    playerName: "Enzo G.",
    rating: 4,
    comment: "Placement défensif amélioré, bons conseils tactiques.",
    date: toISODate(addDays(baseWeek, -7)),
  },
  {
    id: "review_16",
    coachId: "coach_8",
    playerName: "Parent de Noah",
    rating: 4,
    comment: "Approche très adaptée pour un jeune joueur. Mon fils est plus solide en défense.",
    date: toISODate(addDays(baseWeek, -3)),
  },
];
