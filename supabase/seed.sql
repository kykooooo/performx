-- Optional seed data for PerformX
-- Run after schema if you want demo data

insert into coaches (id, user_id, name, speciality, bio, location, price_per_session, rating, reviews_count, availability)
values
  (gen_random_uuid(), null, 'Jean Dupont', 'Coach technique', 'Ancien joueur professionnel, focus sur la précision et le contrôle du ballon.', 'Rouen · 12 km', 39, 4.7, 52,
   '[{"date":"2026-02-11","time":"18:00","durationMinutes":60},{"date":"2026-02-12","time":"19:30","durationMinutes":60}]'::jsonb),
  (gen_random_uuid(), null, 'Lea Martin', 'Prepa physique', 'Specialiste vitesse et explosivite, suivi personnalise sur 6 semaines.', 'Paris · 3 km', 55, 4.9, 73,
   '[{"date":"2026-02-13","time":"10:00","durationMinutes":60},{"date":"2026-02-14","time":"16:00","durationMinutes":60}]'::jsonb),
  (gen_random_uuid(), null, 'Rachid Benali', 'Gardien', 'Travail des appuis, lecture de trajectoire, relance au pied.', 'Lyon · 7 km', 45, 4.6, 38,
   '[{"date":"2026-02-15","time":"17:30","durationMinutes":60},{"date":"2026-02-16","time":"11:00","durationMinutes":60}]'::jsonb);

insert into public_players (user_id, first_name, last_name, city, level, position, objectives, rating, reviews_count)
values
  (gen_random_uuid(), 'Tom', 'Haddad', 'Paris', 'Intermédiaire', 'Milieu', 'Améliorer la vision de jeu et les transitions', 4.5, 12),
  (gen_random_uuid(), 'Ines', 'Roche', 'Lille', 'Confirme', 'Attaquante', 'Finition et appels en profondeur', 4.8, 21),
  (gen_random_uuid(), 'Lucas', 'Morel', 'Marseille', 'Debutant', 'Defenseur', 'Jeu de tete et placement defensif', 4.2, 6),
  (gen_random_uuid(), 'Yanis', 'Bouda', 'Toulouse', 'Intermediaire', 'Gardien', 'Relances longues et lecture de trajectoires', 4.6, 9);
