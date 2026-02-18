-- PerformX schema for Supabase
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

drop view if exists public_sessions;

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('player','coach','club')),
  first_name text,
  last_name text,
  gender text,
  birth_date date,
  city text,
  level text,
  position text,
  objectives text,
  avatar_url text,
  rating numeric(2,1) default 0,
  reviews_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists coaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  speciality text default 'Coach',
  bio text default '',
  location text default '',
  avatar_url text,
  diplomas text,
  experience_years integer,
  certifications text,
  price_per_session integer default 0,
  rating numeric(2,1) default 0,
  reviews_count integer default 0,
  availability jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table coaches add column if not exists avatar_url text;
alter table coaches add column if not exists diplomas text;
alter table coaches add column if not exists experience_years integer;
alter table coaches add column if not exists certifications text;

alter table profiles add column if not exists level text;
alter table profiles add column if not exists position text;
alter table profiles add column if not exists objectives text;
alter table profiles add column if not exists rating numeric(2,1) default 0;
alter table profiles add column if not exists reviews_count integer default 0;

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade,
  player_id uuid references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  time time not null,
  duration_minutes integer not null default 60,
  status text not null default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  created_at timestamptz not null default now()
);

create unique index if not exists sessions_unique_slot
  on sessions (coach_id, date, time)
  where status <> 'cancelled';

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references auth.users(id) on delete cascade,
  coach_id uuid references coaches(id) on delete cascade,
  price integer not null default 0,
  payment_status text not null default 'paid' check (payment_status in ('paid','pending','failed')),
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade,
  player_id uuid references auth.users(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  player_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  date date default current_date,
  created_at timestamptz not null default now()
);

create table if not exists player_reviews (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references auth.users(id) on delete cascade,
  coach_id uuid references coaches(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  date date default current_date,
  created_at timestamptz not null default now()
);

alter table reviews add column if not exists session_id uuid references sessions(id) on delete set null;
alter table player_reviews add column if not exists session_id uuid references sessions(id) on delete set null;

create unique index if not exists reviews_unique_session
  on reviews (session_id)
  where session_id is not null;

create unique index if not exists player_reviews_unique_session
  on player_reviews (session_id)
  where session_id is not null;

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public_sessions (
  coach_id uuid references coaches(id) on delete cascade,
  date date not null,
  time time not null,
  status text not null,
  primary key (coach_id, date, time)
);

create table if not exists public_players (
  user_id uuid primary key,
  first_name text,
  last_name text,
  city text,
  level text,
  position text,
  objectives text,
  avatar_url text,
  rating numeric(2,1) default 0,
  reviews_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function recalculate_coach_rating()
returns trigger as $$
begin
  update coaches
    set reviews_count = (
          select count(*) from reviews where coach_id = coalesce(new.coach_id, old.coach_id)
        ),
        rating = coalesce((
          select avg(rating)::numeric(2,1) from reviews where coach_id = coalesce(new.coach_id, old.coach_id)
        ), 0)
    where id = coalesce(new.coach_id, old.coach_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

create or replace function recalculate_player_rating()
returns trigger as $$
begin
  update profiles
    set reviews_count = (
          select count(*) from player_reviews where player_id = coalesce(new.player_id, old.player_id)
        ),
        rating = coalesce((
          select avg(rating)::numeric(2,1) from player_reviews where player_id = coalesce(new.player_id, old.player_id)
        ), 0)
    where user_id = coalesce(new.player_id, old.player_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

create or replace function sync_public_sessions()
returns trigger as $$
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
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    delete from public_players where user_id = old.user_id;
    return old;
  end if;

  if (new.role = 'player') then
    insert into public_players (
      user_id,
      first_name,
      last_name,
      city,
      level,
      position,
      objectives,
      avatar_url,
      rating,
      reviews_count,
      updated_at
    )
    values (
      new.user_id,
      new.first_name,
      new.last_name,
      new.city,
      new.level,
      new.position,
      new.objectives,
      new.avatar_url,
      new.rating,
      new.reviews_count,
      now()
    )
    on conflict (user_id) do update
      set first_name = excluded.first_name,
          last_name = excluded.last_name,
          city = excluded.city,
          level = excluded.level,
          position = excluded.position,
          objectives = excluded.objectives,
          avatar_url = excluded.avatar_url,
          rating = excluded.rating,
          reviews_count = excluded.reviews_count,
          updated_at = excluded.updated_at;
  else
    delete from public_players where user_id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function create_booking_with_conversation(
  p_coach_id uuid,
  p_date date,
  p_time time,
  p_duration_minutes integer default 60
)
returns table (
  session_id uuid,
  booking_id uuid,
  conversation_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_coach_user_id uuid;
  v_price integer;
  v_session_id uuid;
  v_booking_id uuid;
  v_conversation_id uuid;
begin
  v_player_id := auth.uid();
  if v_player_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select user_id, price_per_session
    into v_coach_user_id, v_price
    from coaches
    where id = p_coach_id;

  if not exists (select 1 from coaches where id = p_coach_id) then
    raise exception 'COACH_NOT_FOUND';
  end if;

  begin
    insert into sessions (
      coach_id,
      player_id,
      title,
      date,
      time,
      duration_minutes,
      status
    )
    values (
      p_coach_id,
      v_player_id,
      'Séance privée',
      p_date,
      p_time,
      greatest(coalesce(p_duration_minutes, 60), 30),
      'upcoming'
    )
    returning id into v_session_id;
  exception
    when unique_violation then
      raise exception 'SLOT_ALREADY_BOOKED';
  end;

  insert into bookings (session_id, player_id, coach_id, price, payment_status)
  values (v_session_id, v_player_id, p_coach_id, coalesce(v_price, 0), 'paid')
  returning id into v_booking_id;

  if v_coach_user_id is not null then
    select cp_self.conversation_id
      into v_conversation_id
      from conversation_participants cp_self
      join conversation_participants cp_other
        on cp_self.conversation_id = cp_other.conversation_id
      where cp_self.user_id = v_player_id
        and cp_other.user_id = v_coach_user_id
      limit 1;

    if v_conversation_id is null then
      insert into conversations (created_by)
      values (v_player_id)
      returning id into v_conversation_id;

      insert into conversation_participants (conversation_id, user_id)
      values
        (v_conversation_id, v_player_id),
        (v_conversation_id, v_coach_user_id);
    end if;

    insert into messages (conversation_id, sender_id, body)
    values (
      v_conversation_id,
      v_player_id,
      format(
        'Nouvelle réservation confirmée: %s à %s.',
        to_char(p_date, 'DD/MM/YYYY'),
        to_char(p_time, 'HH24:MI')
      )
    );
  end if;

  return query
  select v_session_id, v_booking_id, v_conversation_id;
end;
$$;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
before update on profiles
for each row execute procedure set_updated_at();

drop trigger if exists set_coaches_updated_at on coaches;
create trigger set_coaches_updated_at
before update on coaches
for each row execute procedure set_updated_at();

drop trigger if exists reviews_after_insert on reviews;
drop trigger if exists reviews_after_change on reviews;
create trigger reviews_after_change
after insert or update or delete on reviews
for each row execute procedure recalculate_coach_rating();

drop trigger if exists player_reviews_after_change on player_reviews;
create trigger player_reviews_after_change
after insert or update or delete on player_reviews
for each row execute procedure recalculate_player_rating();

drop trigger if exists sessions_public_sync on sessions;
create trigger sessions_public_sync
after insert or update or delete on sessions
for each row execute procedure sync_public_sessions();

drop trigger if exists profiles_public_sync on profiles;
create trigger profiles_public_sync
after insert or update or delete on profiles
for each row execute procedure sync_public_players();

alter table profiles enable row level security;
alter table coaches enable row level security;
alter table sessions enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table player_reviews enable row level security;
alter table public_sessions enable row level security;
alter table public_players enable row level security;

-- Profiles: only owner
drop policy if exists "Profiles are viewable by owner" on profiles;
create policy "Profiles are viewable by owner" on profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Profiles viewable by clubs" on profiles;
create policy "Profiles viewable by clubs" on profiles
  for select using (
    role = 'player'
    and exists (select 1 from profiles p2 where p2.user_id = auth.uid() and p2.role = 'club')
  );

drop policy if exists "Profiles viewable by conversation participants" on profiles;
create policy "Profiles viewable by conversation participants" on profiles
  for select using (
    auth.uid() = user_id
    or exists (
      select 1
      from conversation_participants cp_self
      join conversation_participants cp_other
        on cp_self.conversation_id = cp_other.conversation_id
      where cp_self.user_id = auth.uid()
        and cp_other.user_id = profiles.user_id
    )
  );

drop policy if exists "Profiles are insertable by owner" on profiles;
create policy "Profiles are insertable by owner" on profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Profiles are updatable by owner" on profiles;
create policy "Profiles are updatable by owner" on profiles
  for update using (auth.uid() = user_id);

-- Coaches: public read, owner write
drop policy if exists "Coaches are public" on coaches;
create policy "Coaches are public" on coaches
  for select using (true);

drop policy if exists "Coaches can insert" on coaches;
create policy "Coaches can insert" on coaches
  for insert with check (auth.uid() = user_id);

drop policy if exists "Coaches can update" on coaches;
create policy "Coaches can update" on coaches
  for update using (auth.uid() = user_id);

-- Sessions: participants + clubs can view
drop policy if exists "Sessions visible to participants" on sessions;
create policy "Sessions visible to participants" on sessions
  for select using (
    auth.uid() = player_id
    or auth.uid() = (select user_id from coaches where id = coach_id)
    or exists (select 1 from profiles where user_id = auth.uid() and role = 'club')
  );

drop policy if exists "Sessions are public for availability" on sessions;

drop policy if exists "Players can create sessions" on sessions;
create policy "Players can create sessions" on sessions
  for insert with check (auth.uid() = player_id);

drop policy if exists "Participants can update sessions" on sessions;
create policy "Participants can update sessions" on sessions
  for update using (
    auth.uid() = player_id
    or auth.uid() = (select user_id from coaches where id = coach_id)
  );

-- Bookings: participants only
drop policy if exists "Bookings visible to participants" on bookings;
create policy "Bookings visible to participants" on bookings
  for select using (
    auth.uid() = player_id
    or auth.uid() = (select user_id from coaches where id = coach_id)
  );

drop policy if exists "Players can create bookings" on bookings;
create policy "Players can create bookings" on bookings
  for insert with check (auth.uid() = player_id);

-- Reviews: public read, player write
drop policy if exists "Reviews are public" on reviews;
create policy "Reviews are public" on reviews
  for select using (true);

drop policy if exists "Players can create reviews" on reviews;
create policy "Players can create reviews" on reviews
  for insert with check (
    auth.uid() = player_id
    and session_id is not null
    and exists (
      select 1
      from sessions s
      where s.id = reviews.session_id
        and s.status = 'completed'
        and s.player_id = auth.uid()
        and s.coach_id = reviews.coach_id
    )
  );

-- Player reviews: public read, coaches write
drop policy if exists "Player reviews are public" on player_reviews;
create policy "Player reviews are public" on player_reviews
  for select using (true);

drop policy if exists "Coaches can create player reviews" on player_reviews;
create policy "Coaches can create player reviews" on player_reviews
  for insert with check (
    session_id is not null
    and auth.uid() = (select user_id from coaches where id = coach_id)
    and exists (
      select 1
      from sessions s
      where s.id = player_reviews.session_id
        and s.status = 'completed'
        and s.coach_id = player_reviews.coach_id
        and s.player_id = player_reviews.player_id
    )
  );

-- Conversations & messages
drop policy if exists "Conversations visible to participants" on conversations;
create policy "Conversations visible to participants" on conversations
  for select using (
    exists (
      select 1 from conversation_participants
      where conversation_id = id and user_id = auth.uid()
    )
  );

drop policy if exists "Conversations insertable by creator" on conversations;
create policy "Conversations insertable by creator" on conversations
  for insert with check (auth.uid() = created_by);

drop policy if exists "Participants visible to conversation members" on conversation_participants;
create policy "Participants visible to conversation members" on conversation_participants
  for select using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Participants insertable by creator or self" on conversation_participants;
create policy "Participants insertable by creator or self" on conversation_participants
  for insert with check (
    auth.uid() = user_id
    or auth.uid() = (select created_by from conversations where id = conversation_id)
  );

drop policy if exists "Messages visible to participants" on messages;
create policy "Messages visible to participants" on messages
  for select using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Messages insertable by participants" on messages;
create policy "Messages insertable by participants" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

-- Public views (clean read surface)
create or replace view public_coaches as
  select id,
         name,
         speciality,
         bio,
         location,
         price_per_session,
         rating,
         reviews_count,
         availability,
         avatar_url,
         diplomas,
         experience_years,
         certifications
  from coaches;

create or replace view public_reviews as
  select id, coach_id, session_id, player_name, rating, comment, date
  from reviews;

create or replace view public_player_reviews as
  select pr.id,
         pr.player_id,
         pr.coach_id,
         pr.session_id,
         co.name as coach_name,
         pr.rating,
         pr.comment,
         pr.date
  from player_reviews pr
  left join coaches co on co.id = pr.coach_id;

grant select on public_coaches to anon, authenticated;
grant select on public_reviews to anon, authenticated;
grant select on public_player_reviews to anon, authenticated;
revoke all on function create_booking_with_conversation(uuid, date, time, integer) from public;
grant execute on function create_booking_with_conversation(uuid, date, time, integer) to authenticated;
drop policy if exists "Public sessions are readable" on public_sessions;
create policy "Public sessions are readable" on public_sessions
  for select using (true);

grant select on public_sessions to anon, authenticated;

drop policy if exists "Public players are readable" on public_players;
create policy "Public players are readable" on public_players
  for select using (true);

grant select on public_players to anon, authenticated;

insert into public_sessions (coach_id, date, time, status)
select coach_id, date, time, status
from sessions
where status <> 'cancelled'
on conflict (coach_id, date, time)
do update set status = excluded.status;

insert into public_players (user_id, first_name, last_name, city, level, position, objectives, avatar_url, rating, reviews_count, updated_at)
select user_id, first_name, last_name, city, level, position, objectives, avatar_url, rating, reviews_count, now()
from profiles
where role = 'player'
on conflict (user_id)
do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  city = excluded.city,
  level = excluded.level,
  position = excluded.position,
  objectives = excluded.objectives,
  avatar_url = excluded.avatar_url,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  updated_at = excluded.updated_at;

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are public" on storage.objects;
create policy "Avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Avatar uploads by owner" on storage.objects;
create policy "Avatar uploads by owner" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "Avatar updates by owner" on storage.objects;
create policy "Avatar updates by owner" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "Avatar deletes by owner" on storage.objects;
create policy "Avatar deletes by owner" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid() = owner);
