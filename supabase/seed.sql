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

-- ═══════════════════════════════════════════
-- Historical sessions with feedback (last 6 months)
-- Spread across the 5 demo coaches, player_id null (demo display only)
-- ═══════════════════════════════════════════

INSERT INTO sessions (id, coach_id, player_id, title, date, time, duration_minutes, status, feedback)
VALUES
  -- October 2025
  ('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', null,
   'Controle oriente', '2025-10-05', '18:00', 60, 'completed',
   '{"ratings":{"technique":3,"engagement":4,"progression":3},"comment":"Premier contact, bases a travailler."}'::jsonb),
  ('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', null,
   'Test physique initial', '2025-10-08', '10:00', 60, 'completed',
   '{"ratings":{"technique":3,"engagement":5,"progression":3},"comment":"Bonne volonte, endurance a ameliorer."}'::jsonb),
  ('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', null,
   'Lecture de jeu', '2025-10-12', '14:00', 60, 'completed',
   '{"ratings":{"technique":3,"engagement":4,"progression":4},"comment":"Comprend bien les consignes."}'::jsonb),
  ('40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', null,
   'Frappe pieds droit', '2025-10-18', '17:00', 60, 'completed',
   '{"ratings":{"technique":3,"engagement":4,"progression":3},"comment":"Posture a corriger sur les frappes."}'::jsonb),

  -- November 2025
  ('40000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', null,
   'Conduite de balle', '2025-11-02', '18:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":4,"progression":4},"comment":"Nette amelioration conduite main faible."}'::jsonb),
  ('40000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000002', null,
   'Circuit explosivite', '2025-11-06', '10:00', 60, 'completed',
   '{"ratings":{"technique":3,"engagement":5,"progression":4},"comment":"Tres bon investissement physique."}'::jsonb),
  ('40000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000003', null,
   'Plongeon lateral', '2025-11-10', '17:30', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":4,"progression":3},"comment":"Bons reflexes, placement a affiner."}'::jsonb),
  ('40000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000004', null,
   'Jeu en triangle', '2025-11-15', '14:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":5,"progression":4},"comment":"Excellente lecture des appels."}'::jsonb),
  ('40000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000005', null,
   'Enchainement controle-frappe', '2025-11-20', '17:00', 60, 'cancelled', null),

  -- December 2025
  ('40000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000001', null,
   'Passe longue', '2025-12-03', '18:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":4,"progression":4},"comment":"Progression reguliere, bon toucher."}'::jsonb),
  ('40000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000002', null,
   'Endurance interval', '2025-12-07', '10:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":5,"progression":4},"comment":"VO2max en progres visible."}'::jsonb),
  ('40000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000003', null,
   'Relance courte', '2025-12-12', '17:30', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":4,"progression":4},"comment":"Relance plus sure sous pression."}'::jsonb),
  ('40000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000004', null,
   'Transition rapide', '2025-12-17', '14:00', 60, 'cancelled', null),

  -- January 2026
  ('40000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000001', null,
   'Dribble en espace reduit', '2026-01-08', '18:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":5,"progression":4},"comment":"Tres a l aise en petit perimetre."}'::jsonb),
  ('40000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000002', null,
   'Sprint et recuperation', '2026-01-12', '10:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":5,"progression":5},"comment":"Excellente progression en vitesse."}'::jsonb),
  ('40000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000003', null,
   'Arrets reflexes', '2026-01-16', '17:30', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":4,"progression":4},"comment":"Reflexes au top niveau."}'::jsonb),
  ('40000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000004', null,
   'Appels de balle', '2026-01-21', '14:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":5,"progression":5},"comment":"Timing des appels tres ameliore."}'::jsonb),
  ('40000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000005', null,
   'Tir en mouvement', '2026-01-25', '17:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":4,"progression":4},"comment":"Bonne puissance, precision en progres."}'::jsonb),

  -- February 2026
  ('40000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000001', null,
   'Jonglerie technique', '2026-02-05', '18:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":5,"progression":5},"comment":"Maitrise impressionnante du ballon."}'::jsonb),
  ('40000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000002', null,
   'Prepa match', '2026-02-09', '10:00', 60, 'completed',
   '{"ratings":{"technique":4,"engagement":5,"progression":4},"comment":"Pret physiquement pour la competition."}'::jsonb),
  ('40000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000004', null,
   'Analyse video + terrain', '2026-02-14', '14:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":5,"progression":5},"comment":"Comprend parfaitement les espaces."}'::jsonb),
  ('40000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000005', null,
   'Penalty et coups francs', '2026-02-19', '17:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":4,"progression":4},"comment":"Coups francs au-dessus du mur."}'::jsonb),
  ('40000000-0000-0000-0000-000000000054', '10000000-0000-0000-0000-000000000003', null,
   'Jeu au pied', '2026-02-22', '11:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":5,"progression":5},"comment":"Relance longue precise et reguliere."}'::jsonb),
  ('40000000-0000-0000-0000-000000000055', '10000000-0000-0000-0000-000000000001', null,
   'Remise appui', '2026-02-26', '19:00', 60, 'cancelled', null),

  -- March 2026 (current month - mix of completed and upcoming)
  ('40000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000001', null,
   'Jeu de tete', '2026-03-01', '18:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":5,"progression":5},"comment":"Excellent travail aerien."}'::jsonb),
  ('40000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-000000000002', null,
   'Vitesse reaction', '2026-03-03', '10:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":5,"progression":5},"comment":"Temps de reaction divise par 2."}'::jsonb),
  ('40000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-000000000004', null,
   'Contre-attaque', '2026-03-04', '14:00', 60, 'completed',
   '{"ratings":{"technique":5,"engagement":5,"progression":5},"comment":"Lecture des transitions au top."}'::jsonb),

  -- Upcoming sessions (March 2026)
  ('40000000-0000-0000-0000-000000000070', '10000000-0000-0000-0000-000000000001', null,
   'Technique avancee', '2026-03-12', '18:00', 60, 'upcoming', null),
  ('40000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000002', null,
   'Prepa endurance', '2026-03-14', '10:00', 60, 'upcoming', null),
  ('40000000-0000-0000-0000-000000000072', '10000000-0000-0000-0000-000000000003', null,
   'Seance gardien', '2026-03-16', '17:30', 60, 'upcoming', null),
  ('40000000-0000-0000-0000-000000000073', '10000000-0000-0000-0000-000000000004', null,
   'Vision et placement', '2026-03-18', '14:00', 60, 'upcoming', null),
  ('40000000-0000-0000-0000-000000000074', '10000000-0000-0000-0000-000000000005', null,
   'Finition en surface', '2026-03-20', '17:00', 60, 'upcoming', null)

ON CONFLICT (id) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  date = excluded.date,
  time = excluded.time,
  feedback = excluded.feedback;

-- ═══════════════════════════════════════════
-- Bookings for completed & upcoming sessions
-- ═══════════════════════════════════════════

INSERT INTO bookings (id, session_id, player_id, coach_id, price, payment_status)
VALUES
  ('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000010', null, '10000000-0000-0000-0000-000000000001', 39, 'paid'),
  ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000011', null, '10000000-0000-0000-0000-000000000002', 55, 'paid'),
  ('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000012', null, '10000000-0000-0000-0000-000000000004', 49, 'paid'),
  ('50000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000013', null, '10000000-0000-0000-0000-000000000005', 42, 'paid'),
  ('50000000-0000-0000-0000-000000000020', '40000000-0000-0000-0000-000000000020', null, '10000000-0000-0000-0000-000000000001', 39, 'paid'),
  ('50000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000021', null, '10000000-0000-0000-0000-000000000002', 55, 'paid'),
  ('50000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000022', null, '10000000-0000-0000-0000-000000000003', 45, 'paid'),
  ('50000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000023', null, '10000000-0000-0000-0000-000000000004', 49, 'paid'),
  ('50000000-0000-0000-0000-000000000030', '40000000-0000-0000-0000-000000000030', null, '10000000-0000-0000-0000-000000000001', 39, 'paid'),
  ('50000000-0000-0000-0000-000000000031', '40000000-0000-0000-0000-000000000031', null, '10000000-0000-0000-0000-000000000002', 55, 'paid'),
  ('50000000-0000-0000-0000-000000000032', '40000000-0000-0000-0000-000000000032', null, '10000000-0000-0000-0000-000000000003', 45, 'paid'),
  ('50000000-0000-0000-0000-000000000040', '40000000-0000-0000-0000-000000000040', null, '10000000-0000-0000-0000-000000000001', 39, 'paid'),
  ('50000000-0000-0000-0000-000000000041', '40000000-0000-0000-0000-000000000041', null, '10000000-0000-0000-0000-000000000002', 55, 'paid'),
  ('50000000-0000-0000-0000-000000000042', '40000000-0000-0000-0000-000000000042', null, '10000000-0000-0000-0000-000000000003', 45, 'paid'),
  ('50000000-0000-0000-0000-000000000043', '40000000-0000-0000-0000-000000000043', null, '10000000-0000-0000-0000-000000000004', 49, 'paid'),
  ('50000000-0000-0000-0000-000000000044', '40000000-0000-0000-0000-000000000044', null, '10000000-0000-0000-0000-000000000005', 42, 'paid'),
  ('50000000-0000-0000-0000-000000000050', '40000000-0000-0000-0000-000000000050', null, '10000000-0000-0000-0000-000000000001', 39, 'paid'),
  ('50000000-0000-0000-0000-000000000051', '40000000-0000-0000-0000-000000000051', null, '10000000-0000-0000-0000-000000000002', 55, 'paid'),
  ('50000000-0000-0000-0000-000000000052', '40000000-0000-0000-0000-000000000052', null, '10000000-0000-0000-0000-000000000004', 49, 'paid'),
  ('50000000-0000-0000-0000-000000000053', '40000000-0000-0000-0000-000000000053', null, '10000000-0000-0000-0000-000000000005', 42, 'paid'),
  ('50000000-0000-0000-0000-000000000054', '40000000-0000-0000-0000-000000000054', null, '10000000-0000-0000-0000-000000000003', 45, 'paid'),
  ('50000000-0000-0000-0000-000000000060', '40000000-0000-0000-0000-000000000060', null, '10000000-0000-0000-0000-000000000001', 39, 'paid'),
  ('50000000-0000-0000-0000-000000000061', '40000000-0000-0000-0000-000000000061', null, '10000000-0000-0000-0000-000000000002', 55, 'paid'),
  ('50000000-0000-0000-0000-000000000062', '40000000-0000-0000-0000-000000000062', null, '10000000-0000-0000-0000-000000000004', 49, 'paid'),
  ('50000000-0000-0000-0000-000000000070', '40000000-0000-0000-0000-000000000070', null, '10000000-0000-0000-0000-000000000001', 39, 'pending'),
  ('50000000-0000-0000-0000-000000000071', '40000000-0000-0000-0000-000000000071', null, '10000000-0000-0000-0000-000000000002', 55, 'pending'),
  ('50000000-0000-0000-0000-000000000072', '40000000-0000-0000-0000-000000000072', null, '10000000-0000-0000-0000-000000000003', 45, 'pending'),
  ('50000000-0000-0000-0000-000000000073', '40000000-0000-0000-0000-000000000073', null, '10000000-0000-0000-0000-000000000004', 49, 'pending'),
  ('50000000-0000-0000-0000-000000000074', '40000000-0000-0000-0000-000000000074', null, '10000000-0000-0000-0000-000000000005', 42, 'pending')
ON CONFLICT (id) DO UPDATE SET
  price = excluded.price,
  payment_status = excluded.payment_status;

-- ═══════════════════════════════════════════
-- Additional coach reviews (variety of ratings)
-- ═══════════════════════════════════════════

INSERT INTO reviews (id, coach_id, player_id, player_name, rating, comment, date)
VALUES
  ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', null, 'Parent de Yanis',
   5, 'Mon fils a pris enormement confiance grace aux seances.', '2025-11-15'),
  ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', null, 'Papa de Mila',
   4, 'Bon coach, ponctuel et structure.', '2025-12-20'),
  ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', null, 'Maman de Lucas',
   5, 'Preparation physique au top, vraiment pro.', '2025-11-22'),
  ('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', null, 'Parent de Tom',
   4, 'Seances intenses mais bien dosees.', '2026-01-10'),
  ('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', null, 'Papa de Ines',
   5, 'Super travail sur les reflexes de gardien.', '2025-12-05'),
  ('30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', null, 'Parent de Noah',
   4, 'Methode progressive et rassurante.', '2026-01-28'),
  ('30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000004', null, 'Maman de Sofia',
   5, 'Ma fille comprend enfin les espaces sur le terrain.', '2025-12-18'),
  ('30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000004', null, 'Parent de Leo',
   5, 'Vision de jeu transformee en 4 seances.', '2026-02-08'),
  ('30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000005', null, 'Papa de Yanis',
   4, 'Bon travail de finition, encore a peaufiner.', '2025-11-30'),
  ('30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000005', null, 'Parent de Mila',
   5, 'Frappe beaucoup plus puissante et precise.', '2026-01-22'),
  ('30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', null, 'Maman de Ines',
   5, 'Technique individuelle au rendez-vous, bravo!', '2026-02-15'),
  ('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000002', null, 'Parent de Noah',
   5, 'Seances adaptees et motivantes.', '2026-02-28')
ON CONFLICT (id) DO UPDATE SET
  rating = excluded.rating,
  comment = excluded.comment,
  date = excluded.date;

-- ═══════════════════════════════════════════
-- Player reviews (coaches evaluating players)
-- ═══════════════════════════════════════════

INSERT INTO player_reviews (id, player_id, coach_id, rating, comment, date)
VALUES
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   4, 'Tom progresse bien, bon investissement a chaque seance.', '2026-01-15'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005',
   5, 'Ines a un vrai potentiel en finition, tres a l ecoute.', '2026-02-01'),
  ('60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   4, 'Lucas se montre courageux dans les duels aeriens.', '2026-01-20'),
  ('60000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   5, 'Yanis a des reflexes naturels, beau potentiel.', '2026-02-10'),
  ('60000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004',
   5, 'Mila lit tres bien le jeu et ses appels sont precis.', '2026-02-20')
ON CONFLICT (id) DO UPDATE SET
  rating = excluded.rating,
  comment = excluded.comment,
  date = excluded.date;

-- Optional: set these env vars in Vercel for one-click demo login on /auth/login
-- NEXT_PUBLIC_DEMO_COACH_EMAIL=coach.demo@performx.app
-- NEXT_PUBLIC_DEMO_COACH_PASSWORD=xxxxx
-- NEXT_PUBLIC_DEMO_PLAYER_EMAIL=player.demo@performx.app
-- NEXT_PUBLIC_DEMO_PLAYER_PASSWORD=xxxxx
-- NEXT_PUBLIC_DEMO_PARENT_EMAIL=parent.demo@performx.app
-- NEXT_PUBLIC_DEMO_PARENT_PASSWORD=xxxxx
