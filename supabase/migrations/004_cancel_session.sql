-- RPC: cancel a session (player or coach can cancel upcoming sessions)
-- Enforces 24h minimum notice policy
CREATE OR REPLACE FUNCTION cancel_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session record;
  v_coach_user_id uuid;
  v_conversation_id uuid;
BEGIN
  -- Fetch session
  SELECT s.*, c.user_id AS coach_user_id
  INTO v_session
  FROM sessions s
  JOIN coaches c ON c.id = s.coach_id
  WHERE s.id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND';
  END IF;

  -- Only player or coach can cancel
  IF v_user_id <> v_session.player_id AND v_user_id <> v_session.coach_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF v_session.status <> 'upcoming' THEN
    RAISE EXCEPTION 'SESSION_NOT_CANCELLABLE';
  END IF;

  -- 24h notice policy
  IF (v_session.date + v_session.time) < (now() + interval '24 hours') THEN
    RAISE EXCEPTION 'TOO_LATE_TO_CANCEL';
  END IF;

  -- Cancel the session
  UPDATE sessions SET status = 'cancelled' WHERE id = p_session_id;

  -- Send cancellation message in the conversation
  SELECT cp.conversation_id INTO v_conversation_id
  FROM conversation_participants cp
  WHERE cp.user_id = v_session.player_id
    AND cp.conversation_id IN (
      SELECT cp2.conversation_id
      FROM conversation_participants cp2
      WHERE cp2.user_id = v_session.coach_user_id
    )
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (id, conversation_id, sender_id, body, created_at)
    VALUES (
      gen_random_uuid(),
      v_conversation_id,
      v_user_id,
      'Seance du ' || to_char(v_session.date, 'DD/MM/YYYY') || ' a ' || to_char(v_session.time, 'HH24:MI') || ' annulee.',
      now()
    );
  END IF;
END;
$$;
