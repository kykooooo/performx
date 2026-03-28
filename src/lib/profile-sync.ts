import type { User } from "@supabase/supabase-js";
import { getPlayerAgeCategory, getPositionFamily, parseTextArray } from "@/lib/football";
import { supabase } from "@/lib/supabase";

const normalizeRole = (role: string | null | undefined) => (role === "club" ? "parent" : role ?? "player");

const parseTrainingFrequency = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return null;
};

export async function syncProfile(user: User) {
  const meta = user.user_metadata ?? {};
  const role = normalizeRole(meta.role as string | undefined);
  const firstName = (meta.first_name as string) || "";
  const lastName = (meta.last_name as string) || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user.email || "Coach";
  const position = (meta.position as string) || null;
  const positionFamily =
    (meta.position_family as string | undefined) ?? getPositionFamily(position);
  const birthDate = (meta.birth_date as string) || null;

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      role,
      first_name: firstName || null,
      last_name: lastName || null,
      gender: (meta.gender as string) || null,
      birth_date: birthDate,
      city: (meta.city as string) || null,
      level: (meta.level as string) || null,
      position,
      position_family: positionFamily,
      objectives: (meta.objectives as string) || null,
      dominant_foot: (meta.dominant_foot as string) || null,
      training_frequency_per_week: parseTrainingFrequency(meta.training_frequency_per_week),
      current_club: (meta.current_club as string) || null,
      age_category: ((meta.age_category as string) || getPlayerAgeCategory(birthDate)) ?? null,
      position_objectives: parseTextArray(
        (meta.position_objectives as string[] | string | undefined) ?? [],
      ),
      injury_history: (meta.injury_history as string) || null,
      load_constraints: (meta.load_constraints as string) || null,
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
        department: (meta.department as string) || (meta.location as string) || "",
        price_per_session: (meta.price_per_session as number) || 0,
        avatar_url: (meta.avatar_url as string) || null,
        diplomas: parseTextArray((meta.diplomas as string[] | string | undefined) ?? []),
        experience_years:
          typeof meta.experience_years === "number"
            ? meta.experience_years
            : typeof meta.experience_years === "string" && meta.experience_years.trim()
              ? Number(meta.experience_years)
              : null,
        certifications: parseTextArray(
          (meta.certifications as string[] | string | undefined) ?? [],
        ),
        focus_areas: parseTextArray((meta.focus_areas as string[] | string | undefined) ?? []),
        session_formats: parseTextArray(
          (meta.session_formats as string[] | string | undefined) ?? [],
        ),
        pedagogy: (meta.pedagogy as string) || "",
      },
      { onConflict: "user_id" },
    );
  }
}
