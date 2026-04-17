-- ============================================
-- Migration 007 : Intégration Stripe (paiements)
-- ============================================
-- Ajoute les colonnes Stripe sur bookings, change le default payment_status à 'pending',
-- et expose une RPC server-side (service role uniquement) pour créer un booking
-- après confirmation du paiement par le webhook Stripe.

-- Colonnes Stripe
alter table bookings
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text;

-- payment_status par défaut devient 'pending' (paiement Stripe obligatoire)
alter table bookings
  alter column payment_status set default 'pending';

-- Index unique sur stripe_session_id (idempotence du webhook)
create unique index if not exists idx_bookings_stripe_session_id
  on bookings(stripe_session_id)
  where stripe_session_id is not null;

-- RPC appelée par le webhook Stripe (service role uniquement)
create or replace function create_paid_booking(
  p_player_id uuid,
  p_coach_id uuid,
  p_date date,
  p_time time,
  p_duration_minutes integer,
  p_price integer,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text
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
  v_session_id uuid;
  v_booking_id uuid;
  v_conversation_id uuid;
  v_coach_user_id uuid;
  v_existing_booking_id uuid;
  v_existing_session_id uuid;
begin
  -- Idempotence : si ce stripe_session_id a déjà été traité, on retourne l'existant
  select b.id, b.session_id
    into v_existing_booking_id, v_existing_session_id
    from bookings b
    where b.stripe_session_id = p_stripe_session_id;

  if v_existing_booking_id is not null then
    select cp1.conversation_id into v_conversation_id
      from conversation_participants cp1
      join conversation_participants cp2 on cp2.conversation_id = cp1.conversation_id
      where cp1.user_id = p_player_id
        and cp2.user_id = (select user_id from coaches where id = p_coach_id)
      limit 1;
    return query select v_existing_session_id, v_existing_booking_id, v_conversation_id;
    return;
  end if;

  select user_id into v_coach_user_id from coaches where id = p_coach_id;
  if v_coach_user_id is null then
    raise exception 'COACH_NOT_FOUND';
  end if;

  -- Créer la session
  begin
    insert into sessions (coach_id, player_id, title, date, time, duration_minutes, status)
    values (
      p_coach_id,
      p_player_id,
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

  -- Créer le booking payé avec les ids Stripe
  insert into bookings (session_id, player_id, coach_id, price, payment_status, stripe_session_id, stripe_payment_intent_id)
  values (v_session_id, p_player_id, p_coach_id, p_price, 'paid', p_stripe_session_id, p_stripe_payment_intent_id)
  returning id into v_booking_id;

  -- Trouver ou créer la conversation
  select cp1.conversation_id into v_conversation_id
    from conversation_participants cp1
    join conversation_participants cp2 on cp2.conversation_id = cp1.conversation_id
    where cp1.user_id = p_player_id and cp2.user_id = v_coach_user_id
    limit 1;

  if v_conversation_id is null then
    insert into conversations (created_by) values (p_player_id) returning id into v_conversation_id;
    insert into conversation_participants (conversation_id, user_id) values (v_conversation_id, p_player_id);
    insert into conversation_participants (conversation_id, user_id) values (v_conversation_id, v_coach_user_id);
  end if;

  -- Message d'annonce
  insert into messages (conversation_id, sender_id, body)
  values (
    v_conversation_id,
    p_player_id,
    'Séance réservée pour le ' || to_char(p_date, 'DD/MM/YYYY') || ' à ' || to_char(p_time, 'HH24:MI') || '. Paiement confirmé.'
  );

  return query select v_session_id, v_booking_id, v_conversation_id;
end;
$$;

-- Webhook-only : pas d'accès depuis les clients authentifiés
revoke all on function create_paid_booking(uuid, uuid, date, time, integer, integer, text, text) from public;
revoke all on function create_paid_booking(uuid, uuid, date, time, integer, integer, text, text) from authenticated;

-- RPC lookup : depuis la page confirmation, vérifier qu'un booking existe pour ce stripe_session_id
create or replace function get_booking_by_stripe_session(p_stripe_session_id text)
returns table (
  booking_id uuid,
  session_id uuid,
  conversation_id uuid,
  coach_id uuid,
  player_id uuid,
  session_date date,
  session_time time,
  payment_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  return query
  select
    b.id as booking_id,
    b.session_id,
    cp.conversation_id,
    b.coach_id,
    b.player_id,
    s.date as session_date,
    s.time as session_time,
    b.payment_status
  from bookings b
  join sessions s on s.id = b.session_id
  left join conversation_participants cp on cp.user_id = b.player_id
    and exists (
      select 1 from conversation_participants cp2
      where cp2.conversation_id = cp.conversation_id
        and cp2.user_id = (select user_id from coaches where id = b.coach_id)
    )
  where b.stripe_session_id = p_stripe_session_id
    and b.player_id = v_user_id
  limit 1;
end;
$$;

revoke all on function get_booking_by_stripe_session(text) from public;
grant execute on function get_booking_by_stripe_session(text) to authenticated;
