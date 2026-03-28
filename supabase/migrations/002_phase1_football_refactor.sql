-- PerformX migration 002
-- Football domain refactor: parent role, richer player profiles,
-- parent-child links, coach premium fields, and feedback v2 analytics.

-- 1. Roles and player profile fields
UPDATE public.profiles
SET role = 'parent'
WHERE role = 'club';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('player', 'coach', 'parent'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dominant_foot text,
  ADD COLUMN IF NOT EXISTS training_frequency_per_week integer,
  ADD COLUMN IF NOT EXISTS current_club text,
  ADD COLUMN IF NOT EXISTS age_category text,
  ADD COLUMN IF NOT EXISTS position_family text,
  ADD COLUMN IF NOT EXISTS position_objectives text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS injury_history text,
  ADD COLUMN IF NOT EXISTS load_constraints text;

UPDATE public.profiles
SET position_family = CASE
  WHEN position ILIKE '%gard%' THEN 'goalkeeper'
  WHEN position ILIKE '%def%' OR position ILIKE '%defenseur%' THEN 'defender'
  WHEN position ILIKE '%milieu%' OR position ILIKE '%relayeur%' THEN 'midfielder'
  WHEN position IS NOT NULL AND position <> '' THEN 'attacker'
  ELSE position_family
END
WHERE position_family IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_position_family_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_position_family_check
  CHECK (position_family IS NULL OR position_family IN ('goalkeeper', 'defender', 'midfielder', 'attacker'));

-- 2. Coach premium fields
ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS focus_areas text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS session_formats text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pedagogy text DEFAULT '',
  ADD COLUMN IF NOT EXISTS department text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coaches'
      AND column_name = 'diplomas'
      AND udt_name <> '_text'
  ) THEN
    ALTER TABLE public.coaches
      ALTER COLUMN diplomas TYPE text[]
      USING CASE
        WHEN diplomas IS NULL OR btrim(diplomas) = '' THEN '{}'::text[]
        ELSE regexp_split_to_array(diplomas, E'\\s*,\\s*')
      END;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coaches'
      AND column_name = 'certifications'
      AND udt_name <> '_text'
  ) THEN
    ALTER TABLE public.coaches
      ALTER COLUMN certifications TYPE text[]
      USING CASE
        WHEN certifications IS NULL OR btrim(certifications) = '' THEN '{}'::text[]
        ELSE regexp_split_to_array(certifications, E'\\s*,\\s*')
      END;
  END IF;
END $$;

ALTER TABLE public.coaches
  ALTER COLUMN diplomas SET DEFAULT '{}'::text[],
  ALTER COLUMN certifications SET DEFAULT '{}'::text[];

UPDATE public.coaches
SET diplomas = coalesce(diplomas, '{}'::text[]),
    certifications = coalesce(certifications, '{}'::text[]),
    focus_areas = coalesce(focus_areas, '{}'::text[]),
    session_formats = coalesce(session_formats, '{}'::text[]),
    pedagogy = coalesce(pedagogy, ''),
    department = coalesce(department, location, '')
WHERE diplomas IS NULL
   OR certifications IS NULL
   OR focus_areas IS NULL
   OR session_formats IS NULL
   OR pedagogy IS NULL
   OR department IS NULL;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS feedback jsonb;

-- 3. Parent-child relation and link codes
CREATE TABLE IF NOT EXISTS public.parent_children (
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_user_id, child_user_id)
);

CREATE TABLE IF NOT EXISTS public.parent_link_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_children_parent_user_id
  ON public.parent_children(parent_user_id);

CREATE INDEX IF NOT EXISTS idx_parent_children_child_user_id
  ON public.parent_children(child_user_id);

CREATE INDEX IF NOT EXISTS idx_parent_link_codes_child_user_id
  ON public.parent_link_codes(child_user_id);

-- 4. Public tables/views refreshed for new shape
ALTER TABLE public.public_players
  ADD COLUMN IF NOT EXISTS dominant_foot text,
  ADD COLUMN IF NOT EXISTS current_club text,
  ADD COLUMN IF NOT EXISTS age_category text,
  ADD COLUMN IF NOT EXISTS position_family text;

CREATE OR REPLACE FUNCTION public.sync_public_players()
RETURNS trigger AS $$
BEGIN
  IF (tg_op = 'DELETE') THEN
    DELETE FROM public.public_players WHERE user_id = old.user_id;
    RETURN old;
  END IF;

  IF (new.role = 'player') THEN
    INSERT INTO public.public_players (
      user_id,
      first_name,
      last_name,
      city,
      level,
      position,
      position_family,
      objectives,
      dominant_foot,
      current_club,
      age_category,
      avatar_url,
      rating,
      reviews_count,
      updated_at
    )
    VALUES (
      new.user_id,
      new.first_name,
      new.last_name,
      new.city,
      new.level,
      new.position,
      new.position_family,
      new.objectives,
      new.dominant_foot,
      new.current_club,
      new.age_category,
      new.avatar_url,
      new.rating,
      new.reviews_count,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
      SET first_name = excluded.first_name,
          last_name = excluded.last_name,
          city = excluded.city,
          level = excluded.level,
          position = excluded.position,
          position_family = excluded.position_family,
          objectives = excluded.objectives,
          dominant_foot = excluded.dominant_foot,
          current_club = excluded.current_club,
          age_category = excluded.age_category,
          avatar_url = excluded.avatar_url,
          rating = excluded.rating,
          reviews_count = excluded.reviews_count,
          updated_at = excluded.updated_at;
  ELSE
    DELETE FROM public.public_players WHERE user_id = new.user_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW public.public_coaches AS
  SELECT id,
         name,
         speciality,
         bio,
         location,
         department,
         price_per_session,
         rating,
         reviews_count,
         availability,
         avatar_url,
         diplomas,
         experience_years,
         certifications,
         focus_areas,
         session_formats,
         pedagogy
  FROM public.coaches;

GRANT SELECT ON public.public_coaches TO anon, authenticated;

-- 5. Analytics RPCs on feedback v2
CREATE OR REPLACE FUNCTION public.get_player_progression(p_player_id uuid)
RETURNS TABLE(month text, score numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(s.date, 'Mon') AS month,
    round(avg(
      (
        coalesce((s.feedback->'ratings'->>'technique')::numeric, 0) +
        coalesce((s.feedback->'ratings'->>'tactique')::numeric, 0) +
        coalesce((s.feedback->'ratings'->>'physique')::numeric, 0) +
        coalesce((s.feedback->'ratings'->>'intensite')::numeric, 0) +
        coalesce((s.feedback->'ratings'->>'mental')::numeric, 0)
      ) / 5.0 * 20
    ), 0) AS score
  FROM public.sessions s
  WHERE s.player_id = p_player_id
    AND s.status = 'completed'
    AND s.feedback IS NOT NULL
    AND s.feedback->>'version' = '2'
    AND s.date >= (current_date - interval '6 months')
  GROUP BY date_trunc('month', s.date), to_char(s.date, 'Mon')
  ORDER BY date_trunc('month', s.date);
$$;

CREATE OR REPLACE FUNCTION public.get_player_skills(p_player_id uuid)
RETURNS TABLE(skill text, value numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT skill, round(avg_val * 20, 0) AS value
  FROM (
    SELECT 'Technique' AS skill,
           avg(coalesce((feedback->'ratings'->>'technique')::numeric, 0)) AS avg_val
    FROM public.sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback->>'version' = '2'

    UNION ALL

    SELECT 'Tactique',
           avg(coalesce((feedback->'ratings'->>'tactique')::numeric, 0))
    FROM public.sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback->>'version' = '2'

    UNION ALL

    SELECT 'Physique',
           avg(coalesce((feedback->'ratings'->>'physique')::numeric, 0))
    FROM public.sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback->>'version' = '2'

    UNION ALL

    SELECT 'Intensite',
           avg(coalesce((feedback->'ratings'->>'intensite')::numeric, 0))
    FROM public.sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback->>'version' = '2'

    UNION ALL

    SELECT 'Mental',
           avg(coalesce((feedback->'ratings'->>'mental')::numeric, 0))
    FROM public.sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback->>'version' = '2'
  ) sub
  WHERE avg_val > 0;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_child_overview(p_player_id uuid)
RETURNS TABLE(
  attendance numeric,
  progression numeric,
  last_load_recommendation text,
  next_focus text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT *
    FROM public.sessions
    WHERE player_id = p_player_id
  ),
  latest_feedback AS (
    SELECT feedback
    FROM public.sessions
    WHERE player_id = p_player_id
      AND status = 'completed'
      AND feedback->>'version' = '2'
    ORDER BY date DESC, time DESC
    LIMIT 1
  )
  SELECT
    CASE
      WHEN count(*) FILTER (WHERE status IN ('completed', 'cancelled')) = 0 THEN 0
      ELSE round(
        count(*) FILTER (WHERE status = 'completed')::numeric /
        count(*) FILTER (WHERE status IN ('completed', 'cancelled'))::numeric * 100
      , 0)
    END AS attendance,
    round(coalesce(avg(
      (
        coalesce((feedback->'ratings'->>'technique')::numeric, 0) +
        coalesce((feedback->'ratings'->>'tactique')::numeric, 0) +
        coalesce((feedback->'ratings'->>'physique')::numeric, 0) +
        coalesce((feedback->'ratings'->>'intensite')::numeric, 0) +
        coalesce((feedback->'ratings'->>'mental')::numeric, 0)
      ) / 5.0 * 20
    ) FILTER (WHERE feedback->>'version' = '2'), 0), 0) AS progression,
    coalesce((SELECT feedback->>'load_recommendation' FROM latest_feedback), 'normal') AS last_load_recommendation,
    coalesce((SELECT feedback->>'next_focus' FROM latest_feedback), 'Suivre la progression sur les 5 axes.') AS next_focus
  FROM base;
$$;

-- 6. Parent link RPCs
CREATE OR REPLACE FUNCTION public.generate_parent_link_code()
RETURNS TABLE(code text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_code text;
  v_expires_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_user_id AND role = 'player'
  ) THEN
    RAISE EXCEPTION 'PLAYER_ONLY';
  END IF;

  DELETE FROM public.parent_link_codes
  WHERE child_user_id = v_user_id;

  v_code := upper(substring(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 8));
  v_expires_at := now() + interval '7 days';

  INSERT INTO public.parent_link_codes (child_user_id, code, expires_at)
  VALUES (v_user_id, v_code, v_expires_at);

  RETURN QUERY SELECT v_code, v_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_parent_to_child(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_user_id uuid;
  v_child_user_id uuid;
BEGIN
  v_parent_user_id := auth.uid();
  IF v_parent_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_parent_user_id AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'PARENT_ONLY';
  END IF;

  SELECT child_user_id
  INTO v_child_user_id
  FROM public.parent_link_codes
  WHERE code = upper(trim(p_code))
    AND consumed_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF v_child_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_LINK_CODE';
  END IF;

  INSERT INTO public.parent_children(parent_user_id, child_user_id)
  VALUES (v_parent_user_id, v_child_user_id)
  ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

  UPDATE public.parent_link_codes
  SET consumed_at = now(),
      consumed_by = v_parent_user_id
  WHERE code = upper(trim(p_code));

  RETURN v_child_user_id;
END;
$$;

-- 7. Permissions and RLS
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_link_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parent children visible to linked users" ON public.parent_children;
CREATE POLICY "Parent children visible to linked users" ON public.parent_children
  FOR SELECT USING (auth.uid() = parent_user_id OR auth.uid() = child_user_id);

DROP POLICY IF EXISTS "Link codes visible to child owner" ON public.parent_link_codes;
CREATE POLICY "Link codes visible to child owner" ON public.parent_link_codes
  FOR SELECT USING (auth.uid() = child_user_id);

DROP POLICY IF EXISTS "Link codes insertable by child owner" ON public.parent_link_codes;
CREATE POLICY "Link codes insertable by child owner" ON public.parent_link_codes
  FOR INSERT WITH CHECK (auth.uid() = child_user_id);

DROP POLICY IF EXISTS "Link codes mutable by child owner" ON public.parent_link_codes;
CREATE POLICY "Link codes mutable by child owner" ON public.parent_link_codes
  FOR UPDATE USING (auth.uid() = child_user_id);

DROP POLICY IF EXISTS "Link codes deletable by child owner" ON public.parent_link_codes;
CREATE POLICY "Link codes deletable by child owner" ON public.parent_link_codes
  FOR DELETE USING (auth.uid() = child_user_id);

DROP POLICY IF EXISTS "Profiles viewable by clubs" ON public.profiles;

DROP POLICY IF EXISTS "Profiles viewable by linked parents" ON public.profiles;
CREATE POLICY "Profiles viewable by linked parents" ON public.profiles
  FOR SELECT USING (
    role = 'player'
    AND EXISTS (
      SELECT 1
      FROM public.parent_children pc
      WHERE pc.parent_user_id = auth.uid()
        AND pc.child_user_id = profiles.user_id
    )
  );

DROP POLICY IF EXISTS "Profiles viewable by session coaches" ON public.profiles;
CREATE POLICY "Profiles viewable by session coaches" ON public.profiles
  FOR SELECT USING (
    role = 'player'
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      JOIN public.coaches c ON c.id = s.coach_id
      WHERE s.player_id = profiles.user_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sessions visible to participants" ON public.sessions;
CREATE POLICY "Sessions visible to participants" ON public.sessions
  FOR SELECT USING (
    auth.uid() = player_id
    OR auth.uid() = (SELECT user_id FROM public.coaches WHERE id = coach_id)
    OR EXISTS (
      SELECT 1
      FROM public.parent_children pc
      WHERE pc.parent_user_id = auth.uid()
        AND pc.child_user_id = sessions.player_id
    )
  );

DROP POLICY IF EXISTS "Bookings visible to participants" ON public.bookings;
CREATE POLICY "Bookings visible to participants" ON public.bookings
  FOR SELECT USING (
    auth.uid() = player_id
    OR auth.uid() = (SELECT user_id FROM public.coaches WHERE id = coach_id)
    OR EXISTS (
      SELECT 1
      FROM public.parent_children pc
      WHERE pc.parent_user_id = auth.uid()
        AND pc.child_user_id = bookings.player_id
    )
  );

GRANT EXECUTE ON FUNCTION public.get_player_progression(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_skills(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_child_overview(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_parent_link_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_parent_to_child(text) TO authenticated;
