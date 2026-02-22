-- PerformX demo seed
-- Run after schema.sql
-- This script fills public pages with realistic demo content.

-- Demo coach identities (not linked to auth by default)
insert into coaches (
  id,
  user_id,
  name,
  speciality,
  bio,
  location,
  price_per_session,
  rating,
  reviews_count,
  availability
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    null,
    'Jean Dupont',
    'Coach technique',
    'Ancien joueur pro, specialise controle de balle et prise d information.',
    'Rouen',
    39,
    4.7,
    52,
    '[{"date":"2026-06-18","time":"18:00","durationMinutes":60},{"date":"2026-06-19","time":"19:00","durationMinutes":60},{"date":"2026-06-21","time":"10:30","durationMinutes":60}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    null,
    'Lea Martin',
    'Prepa physique',
    'Programmes individualises vitesse, explosivite et prevention blessures.',
    'Paris',
    55,
    4.9,
    73,
    '[{"date":"2026-06-19","time":"10:00","durationMinutes":60},{"date":"2026-06-20","time":"16:00","durationMinutes":60},{"date":"2026-06-22","time":"09:30","durationMinutes":60}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    null,
    'Rachid Benali',
    'Gardien',
    'Travail des appuis, lecture de trajectoire et relance courte/longue.',
    'Lyon',
    45,
    4.6,
    38,
    '[{"date":"2026-06-20","time":"17:30","durationMinutes":60},{"date":"2026-06-21","time":"11:00","durationMinutes":60}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    null,
    'Nora El Amrani',
    'Vision de jeu',
    'Lecture des espaces, tempo et prise de decision sous pression.',
    'Lille',
    49,
    4.8,
    61,
    '[{"date":"2026-06-18","time":"14:00","durationMinutes":60},{"date":"2026-06-22","time":"18:30","durationMinutes":60}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    null,
    'Mathis Leroy',
    'Frappe et finition',
    'Ateliers repetition tirs, posture et enchainements dans la surface.',
    'Marseille',
    42,
    4.5,
    34,
    '[{"date":"2026-06-19","time":"12:00","durationMinutes":60},{"date":"2026-06-23","time":"17:00","durationMinutes":60}]'::jsonb
  )
on conflict (id)
do update set
  name = excluded.name,
  speciality = excluded.speciality,
  bio = excluded.bio,
  location = excluded.location,
  price_per_session = excluded.price_per_session,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  availability = excluded.availability,
  updated_at = now();

-- Public player directory examples
insert into public_players (
  user_id,
  first_name,
  last_name,
  city,
  level,
  position,
  objectives,
  rating,
  reviews_count
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Tom',
    'Haddad',
    'Paris',
    'Intermediaire',
    'Milieu',
    'Ameliorer la vision de jeu et les transitions offensives.',
    4.5,
    12
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Ines',
    'Roche',
    'Lille',
    'Confirme',
    'Attaquante',
    'Finition dans la surface et appels dans le dos.',
    4.8,
    21
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Lucas',
    'Morel',
    'Marseille',
    'Debutant',
    'Defenseur',
    'Jeu aerien, placement et relance courte.',
    4.2,
    6
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Yanis',
    'Bouda',
    'Toulouse',
    'Intermediaire',
    'Gardien',
    'Lecture des trajectoires et relances longues.',
    4.6,
    9
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Mila',
    'Diallo',
    'Nantes',
    'Intermediaire',
    'Ailiere',
    'Elimination en un contre un et changements de rythme.',
    4.7,
    14
  )
on conflict (user_id)
do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  city = excluded.city,
  level = excluded.level,
  position = excluded.position,
  objectives = excluded.objectives,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  updated_at = now();

-- Demo reviews on coaches (player_id left null for display only)
insert into reviews (
  id,
  coach_id,
  player_id,
  player_name,
  rating,
  comment,
  date
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    null,
    'Parent de Leo',
    5,
    'Coach tres clair, progression visible en trois seances.',
    '2026-06-10'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    null,
    'Parent de Sofia',
    5,
    'Excellente gestion de l effort et communication apres la seance.',
    '2026-06-11'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    null,
    'Parent de Noah',
    4,
    'Approche pedagogique tres adaptee pour un jeune joueur.',
    '2026-06-12'
  )
on conflict (id)
do update set
  rating = excluded.rating,
  comment = excluded.comment,
  date = excluded.date;

-- Demo sessions for activity counters (no auth player linked)
insert into sessions (
  id,
  coach_id,
  player_id,
  title,
  date,
  time,
  duration_minutes,
  status
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    null,
    'Technique individuelle',
    '2026-06-18',
    '18:00',
    60,
    'upcoming'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    null,
    'Prepa physique',
    '2026-06-19',
    '10:00',
    60,
    'upcoming'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    null,
    'Vision de jeu',
    '2026-06-12',
    '17:00',
    60,
    'completed'
  )
on conflict (id)
do update set
  title = excluded.title,
  status = excluded.status,
  date = excluded.date,
  time = excluded.time;

-- Optional: set these env vars in Vercel for one-click demo login on /auth/login
-- NEXT_PUBLIC_DEMO_COACH_EMAIL=coach.demo@performx.app
-- NEXT_PUBLIC_DEMO_COACH_PASSWORD=xxxxx
-- NEXT_PUBLIC_DEMO_PLAYER_EMAIL=player.demo@performx.app
-- NEXT_PUBLIC_DEMO_PLAYER_PASSWORD=xxxxx
-- NEXT_PUBLIC_DEMO_PARENT_EMAIL=parent.demo@performx.app
-- NEXT_PUBLIC_DEMO_PARENT_PASSWORD=xxxxx
