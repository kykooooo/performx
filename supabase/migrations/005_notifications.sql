-- Notifications system: table, RLS, triggers, and RPCs

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  read boolean DEFAULT false,
  href text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Index for efficient per-user unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, read, created_at DESC);

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- 4. Trigger function: notify coach on new booking
CREATE OR REPLACE FUNCTION notify_on_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_user_id uuid;
  v_player_name text;
  v_session_date date;
BEGIN
  -- Find the coach's auth user_id
  SELECT c.user_id INTO v_coach_user_id
  FROM coaches c
  WHERE c.id = NEW.coach_id;

  IF v_coach_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get player display name from profiles
  SELECT coalesce(p.first_name || ' ' || p.last_name, 'Un joueur')
  INTO v_player_name
  FROM profiles p
  WHERE p.user_id = NEW.player_id;

  -- Get session date if session_id is present
  IF NEW.session_id IS NOT NULL THEN
    SELECT s.date INTO v_session_date
    FROM sessions s
    WHERE s.id = NEW.session_id;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, href)
  VALUES (
    v_coach_user_id,
    'new_booking',
    'Nouvelle reservation',
    v_player_name || ' a reserve une seance'
      || CASE WHEN v_session_date IS NOT NULL
           THEN ' le ' || to_char(v_session_date, 'DD/MM/YYYY')
           ELSE ''
         END
      || '.',
    '/dashboard/coach'
  );

  RETURN NEW;
END;
$$;

-- 5. Trigger function: notify player when session feedback is added
CREATE OR REPLACE FUNCTION notify_on_session_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when feedback changes from null to non-null
  IF OLD.feedback IS NULL AND NEW.feedback IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, href)
    VALUES (
      NEW.player_id,
      'new_feedback',
      'Nouveau feedback de seance',
      'Votre coach a laisse un feedback pour la seance du '
        || to_char(NEW.date, 'DD/MM/YYYY') || '.',
      '/dashboard/player'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Create triggers
CREATE TRIGGER trg_notify_on_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_booking();

CREATE TRIGGER trg_notify_on_session_feedback
  AFTER UPDATE ON sessions
  FOR EACH ROW
  WHEN (OLD.feedback IS NULL AND NEW.feedback IS NOT NULL)
  EXECUTE FUNCTION notify_on_session_feedback();

-- 7. RPC: get unread notification count for current user
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)::integer INTO v_count
  FROM notifications
  WHERE user_id = auth.uid()
    AND read = false;

  RETURN v_count;
END;
$$;

-- 8. RPC: mark all notifications as read for current user
CREATE OR REPLACE FUNCTION mark_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = auth.uid()
    AND read = false;
END;
$$;
