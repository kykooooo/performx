-- Optional seed data for PerformX
-- Run after schema if you want demo data

insert into coaches (id, user_id, name, speciality, bio, location, price_per_session, rating, reviews_count, availability)
values
  (gen_random_uuid(), null, 'Jean Dupont', 'Coach technique', 'Ancien joueur professionnel, focus sur la précision et le contrôle du ballon.', 'Rouen · 12 km', 39, 4.7, 52,
   '[{"date":"2026-02-11","time":"18:00","durationMinutes":60},{"date":"2026-02-12","time":"19:30","durationMinutes":60}]'::jsonb);
