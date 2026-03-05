-- PerformX migration 001
-- Adds missing columns, performance indexes, and chart RPCs
-- Run AFTER schema.sql + seed.sql

-- ═══════════════════════════════════════════
-- 1. Missing columns
-- ═══════════════════════════════════════════

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feedback jsonb;

-- ═══════════════════════════════════════════
-- 2. Update public_coaches view (include department)
-- ═══════════════════════════════════════════

CREATE OR REPLACE VIEW public_coaches AS
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
         certifications
  FROM coaches;

GRANT SELECT ON public_coaches TO anon, authenticated;

-- ═══════════════════════════════════════════
-- 3. Performance indexes
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_bookings_player_id ON bookings(player_id);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id ON bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_reviews_coach_id ON reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_player_reviews_player_id ON player_reviews(player_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- ═══════════════════════════════════════════
-- 4. RPCs for chart data
-- ═══════════════════════════════════════════

-- 4a. Coach monthly activity (last 6 months)
CREATE OR REPLACE FUNCTION get_coach_monthly_activity(p_coach_id uuid)
RETURNS TABLE(month text, seances bigint, revenus bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(s.date, 'Mon') AS month,
    count(*)::bigint AS seances,
    coalesce(sum(b.price), 0)::bigint AS revenus
  FROM sessions s
  LEFT JOIN bookings b ON b.session_id = s.id
  WHERE s.coach_id = p_coach_id
    AND s.date >= (current_date - interval '6 months')
    AND s.status IN ('completed', 'upcoming')
  GROUP BY date_trunc('month', s.date), to_char(s.date, 'Mon')
  ORDER BY date_trunc('month', s.date);
$$;

-- 4b. Coach day distribution
CREATE OR REPLACE FUNCTION get_coach_day_distribution(p_coach_id uuid)
RETURNS TABLE(day text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT unnest(ARRAY['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']) AS day,
           unnest(ARRAY[1,2,3,4,5,6,0]) AS dow
  )
  SELECT d.day, coalesce(count(s.id), 0)::bigint AS count
  FROM days d
  LEFT JOIN sessions s
    ON extract(dow FROM s.date) = d.dow
    AND s.coach_id = p_coach_id
    AND s.status <> 'cancelled'
  GROUP BY d.day, d.dow
  ORDER BY d.dow;
$$;

-- 4c. Player progression (monthly average feedback score)
CREATE OR REPLACE FUNCTION get_player_progression(p_player_id uuid)
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
        coalesce((s.feedback->'ratings'->>'engagement')::numeric, 0) +
        coalesce((s.feedback->'ratings'->>'progression')::numeric, 0)
      ) / 3.0 * 20
    ), 0) AS score
  FROM sessions s
  WHERE s.player_id = p_player_id
    AND s.status = 'completed'
    AND s.feedback IS NOT NULL
    AND s.date >= (current_date - interval '6 months')
  GROUP BY date_trunc('month', s.date), to_char(s.date, 'Mon')
  ORDER BY date_trunc('month', s.date);
$$;

-- 4d. Player skills radar (average per feedback dimension)
CREATE OR REPLACE FUNCTION get_player_skills(p_player_id uuid)
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
    FROM sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback IS NOT NULL

    UNION ALL

    SELECT 'Endurance',
           avg(coalesce((feedback->'ratings'->>'engagement')::numeric, 0))
    FROM sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback IS NOT NULL

    UNION ALL

    SELECT 'Progression',
           avg(coalesce((feedback->'ratings'->>'progression')::numeric, 0))
    FROM sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback IS NOT NULL
  ) sub
  WHERE avg_val > 0;
$$;

-- 4e. Parent metrics (attendance, progression, satisfaction)
CREATE OR REPLACE FUNCTION get_parent_metrics(p_player_id uuid)
RETURNS TABLE(label text, value numeric, color text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    -- Assiduité: completed / (completed + cancelled) %
    SELECT
      'Assiduité'::text AS label,
      CASE
        WHEN count(*) FILTER (WHERE status IN ('completed','cancelled')) = 0 THEN 0
        ELSE round(
          count(*) FILTER (WHERE status = 'completed')::numeric /
          count(*) FILTER (WHERE status IN ('completed','cancelled'))::numeric * 100
        , 0)
      END AS value,
      '#ff6a00'::text AS color
    FROM sessions WHERE player_id = p_player_id

    UNION ALL

    -- Progression: avg feedback.ratings.progression * 20
    SELECT
      'Progression',
      round(coalesce(avg(
        (feedback->'ratings'->>'progression')::numeric
      ) * 20, 0), 0),
      '#22c55e'
    FROM sessions
    WHERE player_id = p_player_id AND status = 'completed' AND feedback IS NOT NULL

    UNION ALL

    -- Satisfaction: avg review ratings on coaches the player worked with * 20
    SELECT
      'Satisfaction',
      round(coalesce(avg(r.rating) * 20, 0), 0),
      '#f59e0b'
    FROM reviews r
    WHERE r.coach_id IN (
      SELECT DISTINCT s.coach_id FROM sessions s WHERE s.player_id = p_player_id
    )
  ) sub;
$$;

-- ═══════════════════════════════════════════
-- 5. Grant permissions
-- ═══════════════════════════════════════════

GRANT EXECUTE ON FUNCTION get_coach_monthly_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_coach_day_distribution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_progression(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_skills(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_parent_metrics(uuid) TO authenticated;
