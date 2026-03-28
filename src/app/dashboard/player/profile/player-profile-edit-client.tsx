"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { Notice, type NoticeData } from "@/components/notice";
import PlayerProfileFormSections from "@/components/player-profile-form-sections";
import ScrollReveal from "@/components/scroll-reveal";
import { ArrowRightIcon, BoltIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { POSITION_FAMILY_LABELS, getPositionFamily, getPositionObjectives } from "@/lib/football";
import { mockPlayer } from "@/lib/mock-data";
import {
  buildPlayerProfileMetadata,
  buildPlayerProfileUpdate,
  createEmptyPlayerProfileValues,
  mapPlayerProfileRecordToValues,
  type PlayerProfileValues,
} from "@/lib/player-profile";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  department?: string | null;
  city: string | null;
  avatar_url: string | null;
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
};

type LinkCodeRow = {
  code: string;
  expires_at: string;
};

const buildDemoValues = () =>
  mapPlayerProfileRecordToValues({
    first_name: "Alex",
    last_name: "Martin",
    gender: "Homme",
    birth_date: "2007-03-15",
    city: mockPlayer.city,
    level: mockPlayer.level,
    position: mockPlayer.position,
    dominant_foot: mockPlayer.dominantFoot,
    training_frequency_per_week: mockPlayer.trainingFrequencyPerWeek,
    current_club: mockPlayer.currentClub,
    age_category: mockPlayer.ageCategory,
    position_objectives: mockPlayer.positionObjectives,
    objectives: mockPlayer.objectives,
    injury_history: mockPlayer.injuryHistory,
    load_constraints: mockPlayer.loadConstraints,
  });

export default function PlayerProfileEditPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [values, setValues] = useState<PlayerProfileValues>(createEmptyPlayerProfileValues());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [parentLinkCode, setParentLinkCode] = useState<string | null>(null);
  const [parentLinkExpiresAt, setParentLinkExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingLinkCode, setGeneratingLinkCode] = useState(false);
  const [notice, setNotice] = useState<NoticeData>(null);

  const fullName = [values.firstName, values.lastName].filter(Boolean).join(" ") || "Joueur";
  const positionFamily = useMemo(() => getPositionFamily(values.position), [values.position]);
  const formattedLinkExpiry = useMemo(() => {
    if (!parentLinkExpiresAt) return null;
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(parentLinkExpiresAt));
  }, [parentLinkExpiresAt]);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        if (!mounted) return;
        setValues(buildDemoValues());
        setAvatarUrl(null);
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, gender, birth_date, city, avatar_url, level, position, objectives, dominant_foot, training_frequency_per_week, current_club, age_category, position_objectives, injury_history, load_constraints",
        )
        .eq("user_id", user.id)
        .single();

      if (!mounted) return;

      const fallback = mapPlayerProfileRecordToValues({
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
      });

      setUserId(user.id);
      setValues(profileData ? mapPlayerProfileRecordToValues(profileData as ProfileRow) : fallback);
      setAvatarUrl((profileData?.avatar_url as string | null) ?? null);
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

  const persistProfile = async (nextAvatarUrl: string | null) => {
    if (!userId) return null;
    const metadata = buildPlayerProfileMetadata(values, { avatarUrl: nextAvatarUrl });
    const { error: authError } = await supabase.auth.updateUser({ data: metadata });
    if (authError) return authError;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        ...buildPlayerProfileUpdate(values, { avatarUrl: nextAvatarUrl }),
      },
      { onConflict: "user_id" },
    );

    return profileError;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isDemo) {
      setNotice({ type: "success", text: "Profil joueur mis a jour (mode demo)." });
      return;
    }

    if (!userId) return;
    setSaving(true);
    setNotice(null);

    const error = await persistProfile(avatarUrl);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Profil joueur mis a jour." });
  };

  const handleAvatarUpload = async (file: File) => {
    if (isDemo) {
      setNotice({ type: "success", text: "Photo mise a jour (mode demo)." });
      return;
    }

    if (!userId) return;
    setUploading(true);
    setNotice(null);

    const extension = file.name.split(".").pop();
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setNotice({ type: "error", text: uploadError.message });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    setAvatarUrl(publicUrl);

    const error = await persistProfile(publicUrl);
    setUploading(false);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Photo mise a jour." });
  };

  const handleGenerateParentLinkCode = async () => {
    if (isDemo) {
      setParentLinkCode("PXDEMO76");
      setParentLinkExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
      setNotice({ type: "success", text: "Code parent genere (mode demo)." });
      return;
    }

    setGeneratingLinkCode(true);
    setNotice(null);
    const { data, error } = await supabase.rpc("generate_parent_link_code");
    setGeneratingLinkCode(false);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    const payload = (Array.isArray(data) ? data[0] : data) as LinkCodeRow | null;
    setParentLinkCode(payload?.code ?? null);
    setParentLinkExpiresAt(payload?.expires_at ?? null);
    setNotice({ type: "success", text: "Code parent genere avec succes." });
  };

  return (
    <AppShell active="/dashboard" hideTitle>
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Profil</span>
              {isDemo && <span className="px-pill">Mode demo</span>}
            </div>
            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Mon profil <span className="px-gradient-text">joueur.</span>
            </h1>
            <p
              className="px-fade-up max-w-xl text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Renseigne ton profil football complet pour suivre ta progression et partager un code
              de liaison parent quand tu en as besoin.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/dashboard" className="px-button-ghost text-sm">
              Retour dashboard
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div className="space-y-6">
            <div className="px-skeleton h-80 rounded-2xl" />
            <div className="px-skeleton h-72 rounded-2xl" />
            <div className="px-skeleton h-56 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="px-skeleton h-80 rounded-2xl" />
            <div className="px-skeleton h-56 rounded-2xl" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Photo et visibilite</h3>
                      <p className="text-xs text-white/70">
                        Une photo claire aide les coachs a mieux identifier le joueur.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <div className="relative">
                      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-blue-500/20 to-transparent text-white shadow-lg">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt="Avatar joueur"
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <UserIcon className="h-9 w-9 text-white/70" />
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--px-accent)] text-[10px] font-bold text-black shadow-lg">
                        PX
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="px-button-ghost inline-flex cursor-pointer text-sm">
                        {uploading ? "Upload..." : "Changer photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleAvatarUpload(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[11px] text-white/50">JPG, PNG. Max 2 Mo.</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <PlayerProfileFormSections
                  values={values}
                  onChange={updateField}
                  onToggleObjective={toggleObjective}
                />
              </ScrollReveal>

              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <ShieldIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Liaison parent</h3>
                      <p className="text-xs text-white/70">
                        Genere un code temporaire si un parent doit relier ton compte.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="px-button text-sm"
                      onClick={handleGenerateParentLinkCode}
                      disabled={generatingLinkCode}
                    >
                      <ShieldIcon className="h-4 w-4" />
                      {generatingLinkCode ? "Generation..." : "Generer un code parent"}
                    </button>
                    {parentLinkCode && (
                      <div className="rounded-2xl border border-[color:var(--px-accent)]/25 bg-[color:var(--px-accent)]/10 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                          Code actif
                        </p>
                        <p className="mt-1 text-xl font-semibold tracking-[0.25em] text-white">
                          {parentLinkCode}
                        </p>
                        {formattedLinkExpiry && (
                          <p className="mt-1 text-[11px] text-white/50">
                            Expire le {formattedLinkExpiry}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-button px-8 py-3 text-sm" type="submit" disabled={saving}>
                    <BoltIcon className="h-4 w-4" />
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                  <Notice notice={notice} />
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card overflow-hidden">
                  <div className="relative h-36 bg-gradient-to-br from-blue-600/30 via-blue-500/10 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--px-card)] to-transparent" />
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full border border-blue-400/30 bg-blue-400/15 px-2.5 py-1 text-[10px] font-semibold text-blue-300">
                        Apercu profil
                      </span>
                    </div>
                    {values.position && (
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                          {values.position}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="relative -mt-10 px-5 pb-5">
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[color:var(--px-card)] bg-gradient-to-br from-blue-500/20 to-transparent shadow-lg">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Apercu avatar joueur"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <UserIcon className="h-7 w-7 text-white/70" />
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-lg font-semibold text-white">{fullName}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/70">
                        {values.department && <span>{values.department}</span>}
                        {positionFamily && (
                          <span>{POSITION_FAMILY_LABELS[positionFamily]}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {values.level && (
                        <span className="rounded-full border border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-warning)]">
                          {values.level}
                        </span>
                      )}
                      {values.ageCategory && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
                          {values.ageCategory}
                        </span>
                      )}
                      {values.dominantFoot && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
                          {values.dominantFoot}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                        Snapshot foot
                      </p>
                      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/70">
                        <li>Club actuel: {values.currentClub || "A renseigner"}</li>
                        <li>
                          Charge hebdo:{" "}
                          {values.trainingFrequency === ""
                            ? "A renseigner"
                            : `${values.trainingFrequency} seance(s) / semaine`}
                        </li>
                        <li>
                          Objectifs de poste:{" "}
                          {values.positionObjectives.length > 0
                            ? values.positionObjectives.slice(0, 2).join(" · ")
                            : "A selectionner"}
                        </li>
                      </ul>
                    </div>

                    {values.objectives && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                          Objectifs personnels
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">
                          {values.objectives}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-5">
                  <p className="mb-2 text-xs font-semibold text-white/70">Conseils de completion</p>
                  <ul className="space-y-2 text-xs leading-relaxed text-white/70">
                    <li>
                      Un profil complet aide le coach a calibrer les seances, surtout sur la
                      charge et les objectifs de poste.
                    </li>
                    <li>
                      Le code parent n&apos;est utile que si tu veux partager ton suivi avec un
                      parent ou un tuteur.
                    </li>
                    <li>
                      Les champs sante restent prives et ne seront jamais montres sur la fiche
                      publique.
                    </li>
                  </ul>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </form>
      )}
    </AppShell>
  );
}
