import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function syncProfile(user: User) {
  const meta = user.user_metadata ?? {};
  const role = (meta.role as string) || "player";
  const firstName = (meta.first_name as string) || "";
  const lastName = (meta.last_name as string) || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user.email || "Coach";

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      role,
      first_name: firstName || null,
      last_name: lastName || null,
      gender: (meta.gender as string) || null,
      birth_date: (meta.birth_date as string) || null,
      city: (meta.city as string) || null,
      level: (meta.level as string) || null,
      position: (meta.position as string) || null,
      objectives: (meta.objectives as string) || null,
    },
    { onConflict: "user_id" },
  );

  if (role === "coach") {
    await supabase.from("coaches").upsert(
      {
        user_id: user.id,
        name: fullName,
        speciality: (meta.speciality as string) || "Coach",
        bio: (meta.bio as string) || "",
        location: (meta.location as string) || "",
        price_per_session: (meta.price_per_session as number) || 0,
        avatar_url: (meta.avatar_url as string) || null,
        diplomas: (meta.diplomas as string) || null,
        experience_years: (meta.experience_years as number) || null,
        certifications: (meta.certifications as string) || null,
      },
      { onConflict: "user_id" },
    );
  }
}
