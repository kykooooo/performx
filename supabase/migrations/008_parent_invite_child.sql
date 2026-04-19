-- ============================================
-- Migration 008 : Lien d'invitation Parent → Enfant
-- ============================================
-- Inverse du flow existant (parent_link_codes : child -> parent).
-- Ici, c'est le PARENT qui génère un code d'invitation, et l'enfant
-- (déjà inscrit ou nouveau) consomme le code pour créer le lien.

create table if not exists parent_invite_codes (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  label text,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_parent_invite_codes_parent_user_id
  on parent_invite_codes(parent_user_id);

create index if not exists idx_parent_invite_codes_code
  on parent_invite_codes(code);

alter table parent_invite_codes enable row level security;

drop policy if exists "Parent invite codes select own" on parent_invite_codes;
create policy "Parent invite codes select own" on parent_invite_codes
  for select using (parent_user_id = auth.uid());

drop policy if exists "Parent invite codes insert own" on parent_invite_codes;
create policy "Parent invite codes insert own" on parent_invite_codes
  for insert with check (parent_user_id = auth.uid());

drop policy if exists "Parent invite codes delete own" on parent_invite_codes;
create policy "Parent invite codes delete own" on parent_invite_codes
  for delete using (parent_user_id = auth.uid());

-- Le claim lui-même se fait via une SECURITY DEFINER RPC qui bypass le RLS
-- (sinon l'enfant ne peut pas écrire used_at/claimed_by sur le code du parent).

-- RPC : parent courant génère un nouveau code (8 caractères alphanumériques)
create or replace function generate_parent_invite_code(p_label text default null)
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
  v_code text;
  v_expires timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Vérifie que l'utilisateur est bien un parent (profiles.role)
  select role into v_role from profiles where user_id = v_user_id;
  if v_role is distinct from 'parent' then
    raise exception 'PARENT_ROLE_REQUIRED';
  end if;

  -- Nettoie les codes expirés du parent
  delete from parent_invite_codes
  where parent_user_id = v_user_id
    and (expires_at < now() or used_at is not null);

  -- Génère un code unique (6 chars majuscule + chiffres, évite I/O/0/1)
  loop
    v_code := upper(substring(md5(gen_random_uuid()::text || now()::text), 1, 6));
    v_code := translate(v_code, 'O0I1', 'X9X9');
    exit when not exists (select 1 from parent_invite_codes pic where pic.code = v_code);
  end loop;

  v_expires := now() + interval '14 days';

  insert into parent_invite_codes (parent_user_id, code, label, expires_at)
  values (v_user_id, v_code, nullif(trim(p_label), ''), v_expires);

  return query select v_code, v_expires;
end;
$$;

grant execute on function generate_parent_invite_code(text) to authenticated;

-- RPC : joueur courant consomme un code et crée le lien parent_children
create or replace function claim_parent_invite(p_code text)
returns table(parent_user_id uuid, linked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
  v_parent_user_id uuid;
  v_invite_id uuid;
  v_expires timestamptz;
  v_used_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Vérifie que l'utilisateur courant est un joueur
  select role into v_role from profiles where user_id = v_user_id;
  if v_role is distinct from 'player' then
    raise exception 'PLAYER_ROLE_REQUIRED';
  end if;

  select id, parent_user_id, expires_at, used_at
    into v_invite_id, v_parent_user_id, v_expires, v_used_at
  from parent_invite_codes
  where code = upper(p_code);

  if v_invite_id is null then
    raise exception 'INVALID_CODE';
  end if;

  if v_used_at is not null then
    raise exception 'CODE_ALREADY_USED';
  end if;

  if v_expires < now() then
    raise exception 'CODE_EXPIRED';
  end if;

  -- Crée le lien parent_children (ou ignore s'il existe déjà)
  insert into parent_children(parent_user_id, child_user_id)
  values (v_parent_user_id, v_user_id)
  on conflict (parent_user_id, child_user_id) do nothing;

  -- Marque le code comme utilisé
  update parent_invite_codes
  set used_at = now(), claimed_by = v_user_id
  where id = v_invite_id;

  -- Notification pour le parent
  insert into notifications (user_id, type, title, body, href)
  values (
    v_parent_user_id,
    'invite_claimed',
    'Enfant lié à ton compte',
    'Un enfant vient de rejoindre ton compte parent.',
    '/dashboard/parent'
  );

  return query select v_parent_user_id, true;
end;
$$;

grant execute on function claim_parent_invite(text) to authenticated;

-- RPC publique (authentifiée) : infos minimales d'un code pour preview
-- Ne retourne pas le parent_user_id — juste le prénom du parent + expires.
create or replace function get_parent_invite_preview(p_code text)
returns table(parent_name text, expires_at timestamptz, used boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  select pic.expires_at, pic.used_at, p.first_name, p.last_name
    into v_invite
  from parent_invite_codes pic
  left join profiles p on p.user_id = pic.parent_user_id
  where pic.code = upper(p_code);

  if v_invite is null then
    return;
  end if;

  return query select
    trim(coalesce(v_invite.first_name, '') || ' ' || coalesce(v_invite.last_name, '')) as parent_name,
    v_invite.expires_at,
    (v_invite.used_at is not null) as used;
end;
$$;

grant execute on function get_parent_invite_preview(text) to authenticated;
grant execute on function get_parent_invite_preview(text) to anon;
