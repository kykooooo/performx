-- 009_fix_sync_triggers_security.sql
-- Fix: "new row violates row-level security policy for table public_sessions"
--
-- Cause : les trigger functions sync_public_sessions() et sync_public_players()
-- n'avaient pas SECURITY DEFINER, donc elles tournent avec les permissions de
-- l'utilisateur qui a fait l'UPDATE. Or les users n'ont que SELECT sur les
-- tables public_*, pas INSERT → le trigger échoue → l'UPDATE initial échoue.
--
-- Fix : recréer les deux functions avec SECURITY DEFINER pour qu'elles tournent
-- avec les permissions du owner (postgres), contournant le RLS sur les tables
-- public_* (qui est voulu pour bloquer les écritures directes du côté client).
--
-- Impact : permet aux coaches de marquer une séance "Terminée" ou "Annulée"
-- via le dashboard sans erreur RLS.

create or replace function sync_public_sessions()
returns trigger
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public_sessions
      where coach_id = old.coach_id and date = old.date and time = old.time;
    return old;
  end if;

  if (new.status = 'cancelled') then
    delete from public_sessions
      where coach_id = new.coach_id and date = new.date and time = new.time;
  else
    insert into public_sessions (coach_id, date, time, status)
    values (new.coach_id, new.date, new.time, new.status)
    on conflict (coach_id, date, time)
    do update set status = excluded.status;
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function sync_public_players()
returns trigger
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public_players where user_id = old.user_id;
    return old;
  end if;

  insert into public_players (
    user_id,
    first_name,
    last_name,
    age_category,
    dominant_foot,
    position,
    level,
    current_club,
    short_description,
    avatar_url,
    published,
    phone,
    created_at,
    updated_at
  )
  values (
    new.user_id,
    new.first_name,
    new.last_name,
    new.age_category,
    new.dominant_foot,
    new.position,
    new.level,
    new.current_club,
    new.short_description,
    new.avatar_url,
    new.published,
    new.phone,
    new.created_at,
    new.updated_at
  )
  on conflict (user_id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    age_category = excluded.age_category,
    dominant_foot = excluded.dominant_foot,
    position = excluded.position,
    level = excluded.level,
    current_club = excluded.current_club,
    short_description = excluded.short_description,
    avatar_url = excluded.avatar_url,
    published = excluded.published,
    phone = excluded.phone,
    updated_at = excluded.updated_at;

  return new;
end;
$$ language plpgsql;
