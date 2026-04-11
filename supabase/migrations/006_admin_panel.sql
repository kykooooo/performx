-- Admin panel: add verified column to coaches, admin RLS policies

-- 1. Add verified column to coaches
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- 2. Update public_coaches view to include verified status
CREATE OR REPLACE VIEW public_coaches AS
  SELECT id,
         user_id,
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
         pedagogy,
         verified
  FROM coaches;

GRANT SELECT ON public_coaches TO anon, authenticated;

-- 3. Admin RLS policy: allow admin role to update any coach
DROP POLICY IF EXISTS "Admins can update coaches" ON coaches;
CREATE POLICY "Admins can update coaches" ON coaches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. Admin RLS policy: allow admin to read all profiles (for stats)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );
