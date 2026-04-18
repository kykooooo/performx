import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPlayerAgeCategory, getPositionFamily, parseTextArray } from "@/lib/football";
import { normalizeUserRole } from "@/lib/roles";
import { getDashboardPathForRole } from "@/lib/roles";

export const runtime = "nodejs";

type UserMeta = Record<string, unknown>;

const str = (meta: UserMeta, key: string): string | null => {
  const value = meta[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const num = (meta: UserMeta, key: string): number | null => {
  const value = meta[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

async function ensureUserProfile(userId: string, meta: UserMeta, email: string | null) {
  const admin = getSupabaseAdmin();
  const role = normalizeUserRole(str(meta, "role")) ?? "player";
  const firstName = str(meta, "first_name");
  const lastName = str(meta, "last_name");
  const position = str(meta, "position");
  const birthDate = str(meta, "birth_date");

  await admin.from("profiles").upsert(
    {
      user_id: userId,
      role,
      first_name: firstName,
      last_name: lastName,
      gender: str(meta, "gender"),
      birth_date: birthDate,
      city: str(meta, "department") ?? str(meta, "city"),
      level: str(meta, "level"),
      position,
      position_family: str(meta, "position_family") ?? getPositionFamily(position),
      objectives: str(meta, "objectives"),
      dominant_foot: str(meta, "dominant_foot"),
      training_frequency_per_week: num(meta, "training_frequency_per_week"),
      current_club: str(meta, "current_club"),
      age_category: str(meta, "age_category") ?? getPlayerAgeCategory(birthDate),
      position_objectives: parseTextArray(
        (meta.position_objectives as string[] | string | undefined) ?? [],
      ),
      injury_history: str(meta, "injury_history"),
      load_constraints: str(meta, "load_constraints"),
    },
    { onConflict: "user_id" },
  );

  if (role === "coach") {
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ") || email || "Coach";
    await admin.from("coaches").upsert(
      {
        user_id: userId,
        name: fullName,
        speciality: str(meta, "speciality") ?? "Coach",
        bio: str(meta, "bio") ?? "",
        location: str(meta, "location") ?? "",
        department: str(meta, "department") ?? str(meta, "location") ?? "",
        price_per_session: num(meta, "price_per_session") ?? 0,
        avatar_url: str(meta, "avatar_url"),
        diplomas: parseTextArray((meta.diplomas as string[] | string | undefined) ?? []),
        experience_years: num(meta, "experience_years"),
        certifications: parseTextArray(
          (meta.certifications as string[] | string | undefined) ?? [],
        ),
        focus_areas: parseTextArray((meta.focus_areas as string[] | string | undefined) ?? []),
        session_formats: parseTextArray(
          (meta.session_formats as string[] | string | undefined) ?? [],
        ),
        pedagogy: str(meta, "pedagogy") ?? "",
      },
      { onConflict: "user_id" },
    );
  }

  return role;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (errorParam) {
    const message = errorDescription ?? errorParam;
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(message)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/auth/login?error=config`);
  }

  let finalDestination = nextParam ?? "/dashboard";
  const response = NextResponse.redirect(`${origin}${finalDestination}`);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Synchronise profile + coaches côté server (évite de dépendre de
  // l'auth-listener client qui peut rater le timing)
  if (data.user) {
    try {
      const role = await ensureUserProfile(
        data.user.id,
        (data.user.user_metadata ?? {}) as UserMeta,
        data.user.email ?? null,
      );
      // Si pas de ?next= spécifique, route vers le dashboard du rôle détecté
      if (!nextParam) {
        finalDestination = getDashboardPathForRole(role);
        return NextResponse.redirect(`${origin}${finalDestination}`, {
          headers: response.headers,
        });
      }
    } catch (syncError) {
      console.error("[PerformX] ensureUserProfile failed:", syncError);
      // On ne bloque pas la redirection : l'auth-listener client tentera aussi
    }
  }

  return response;
}
