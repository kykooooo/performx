"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { Notice, type NoticeData } from "@/components/notice";
import PlayerProfileFormSections from "@/components/player-profile-form-sections";
import { getPositionFamily, getPositionObjectives } from "@/lib/football";
import {
  buildPlayerProfileMetadata,
  buildPlayerProfileUpdate,
  createEmptyPlayerProfileValues,
  mapPlayerProfileRecordToValues,
  type PlayerProfileValues,
} from "@/lib/player-profile";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  department?: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  objectives: string | null;
  dominant_foot: string | null;
  training_frequency_per_week: number | null;
  current_club: string | null;
  age_category: string | null;
  position_objectives: string[] | string | null;
  injury_history: string | null;
  load_constraints: string | null;
  avatar_url: string | null;
};

export default function PlayerInfoClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [values, setValues] = useState<PlayerProfileValues>(createEmptyPlayerProfileValues());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeData>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        if (!mounted) return;
        setNotice({
          type: "error",
          text: "Connecte-toi ou créé ton compte joueur pour compléter ces informations.",
        });
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "role, first_name, last_name, gender, birth_date, city, level, position, objectives, dominant_foot, training_frequency_per_week, current_club, age_category, position_objectives, injury_history, load_constraints, avatar_url",
        )
        .eq("user_id", user.id)
        .single();

      if (!mounted) return;

      setUserId(user.id);
      setAvatarUrl((profileData?.avatar_url as string | null) ?? null);

      if (profileData && profileData.role && profileData.role !== "player") {
        setNotice({
          type: "error",
          text: "Cet ecran est reserve aux comptes joueur.",
        });
        setLoading(false);
        return;
      }

      setValues(
        profileData
          ? mapPlayerProfileRecordToValues(profileData as ProfileRow)
          : mapPlayerProfileRecordToValues({
              first_name: (user.user_metadata.first_name as string | undefined) ?? null,
              last_name: (user.user_metadata.last_name as string | undefined) ?? null,
              gender: (user.user_metadata.gender as string | undefined) ?? null,
              birth_date: (user.user_metadata.birth_date as string | undefined) ?? null,
              department:
                (user.user_metadata.department as string | undefined) ??
                (user.user_metadata.city as string | undefined) ??
                null,
              level: (user.user_metadata.level as string | undefined) ?? null,
              position: (user.user_metadata.position as string | undefined) ?? null,
              objectives: (user.user_metadata.objectives as string | undefined) ?? null,
              dominant_foot: (user.user_metadata.dominant_foot as string | undefined) ?? null,
              training_frequency_per_week:
                (user.user_metadata.training_frequency_per_week as number | undefined) ?? null,
              current_club: (user.user_metadata.current_club as string | undefined) ?? null,
              age_category: (user.user_metadata.age_category as string | undefined) ?? null,
              position_objectives:
                (user.user_metadata.position_objectives as string[] | string | undefined) ?? null,
              injury_history: (user.user_metadata.injury_history as string | undefined) ?? null,
              load_constraints: (user.user_metadata.load_constraints as string | undefined) ?? null,
            }),
      );
      setLoading(false);
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (
    field: keyof PlayerProfileValues,
    value: PlayerProfileValues[keyof PlayerProfileValues],
  ) => {
    setValues((current) => {
      if (field !== "position") {
        return { ...current, [field]: value };
      }

      const nextPosition = String(value);
      const nextObjectives = getPositionObjectives(getPositionFamily(nextPosition));
      return {
        ...current,
        position: nextPosition,
        positionObjectives: current.positionObjectives.filter((objective) =>
          nextObjectives.includes(objective),
        ),
      };
    });
  };

  const toggleObjective = (objective: string) => {
    setValues((current) => ({
      ...current,
      positionObjectives: current.positionObjectives.includes(objective)
        ? current.positionObjectives.filter((item) => item !== objective)
        : [...current.positionObjectives, objective],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      setNotice({
        type: "error",
        text: "Aucune session detectee. Connecte-toi pour enregistrer ton profil.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);
    const metadata = buildPlayerProfileMetadata(values, { avatarUrl });

    const { error: authError } = await supabase.auth.updateUser({ data: metadata });
    if (authError) {
      setSaving(false);
      setNotice({ type: "error", text: authError.message });
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        ...buildPlayerProfileUpdate(values, { avatarUrl }),
      },
      { onConflict: "user_id" },
    );

    setSaving(false);

    if (profileError) {
      setNotice({ type: "error", text: profileError.message });
      return;
    }

    setNotice({ type: "success", text: "Profil joueur complète. Redirection en cours..." });
    window.setTimeout(() => router.push("/dashboard/player"), 700);
  };

  return (
    <AuthShell
      title="Compléter mon profil joueur"
      subtitle="On aligne ici le profil terrain, la charge hebdo et les informations privees utiles au suivi."
    >
      {loading ? (
        <div className="space-y-4">
          <div className="px-skeleton h-32 rounded-2xl" />
          <div className="px-skeleton h-60 rounded-2xl" />
          <div className="px-skeleton h-44 rounded-2xl" />
        </div>
      ) : !userId ? (
        <div className="space-y-4">
          <Notice notice={notice} />
          <Link className="px-button block w-full text-center" href="/auth/login">
            Se connecter
          </Link>
          <Link className="px-button-ghost block w-full text-center" href="/auth/register/player">
            Créer un compte joueur
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PlayerProfileFormSections
            values={values}
            onChange={updateField}
            onToggleObjective={toggleObjective}
            showPrivacyHint
          />

          <Notice notice={notice} />

          <button className="px-button w-full" type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Valider et acceder au dashboard"}
          </button>

          <p className="text-center text-xs text-white/70">
            Déjà complète ?{" "}
            <Link className="text-[color:var(--px-accent)]" href="/dashboard/player/profile">
              Ouvrir mon profil
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
