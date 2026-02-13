"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import ScrollReveal from "@/components/scroll-reveal";
import {
  UserIcon,
  ArrowRightIcon,
  MapPinIcon,
  StarIcon,
  BoltIcon,
  ShieldIcon,
} from "@/components/icons";
import { supabase } from "@/lib/supabase";
import { mockPlayers } from "@/lib/mock-data";

const POSITIONS = [
  "Gardien",
  "Défenseur central",
  "Latéral droit",
  "Latéral gauche",
  "Milieu défensif",
  "Milieu offensif",
  "Ailier droit",
  "Ailier gauche",
  "Attaquant",
  "Meneur de jeu",
];

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];

const LEVEL_COLORS: Record<string, string> = {
  Débutant: "border-blue-400/30 bg-blue-400/15 text-blue-400",
  Intermédiaire: "border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/15 text-[color:var(--px-warning)]",
  Avancé: "border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]",
};

export default function PlayerProfileEditPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");
  const [position, setPosition] = useState("");
  const [objectives, setObjectives] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (mounted) {
          const mock = mockPlayers[0];
          const [first, ...rest] = mock.name.split(" ");
          setFirstName(first);
          setLastName(rest.join(" "));
          setCity(mock.city);
          setLevel(mock.level);
          setPosition(mock.position);
          setObjectives(mock.objectives ?? "");
          setGender("Homme");
          setBirthDate("2002-03-15");
          setIsDemo(true);
          setLoading(false);
        }
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, gender, birth_date, city, avatar_url, level, position, objectives")
        .eq("user_id", userData.user.id)
        .single();

      if (!mounted) return;
      if (error || !profileData) {
        const mock = mockPlayers[0];
        const [first, ...rest] = mock.name.split(" ");
        setFirstName(first);
        setLastName(rest.join(" "));
        setCity(mock.city);
        setLevel(mock.level);
        setPosition(mock.position);
        setObjectives(mock.objectives ?? "");
        setGender("Homme");
        setBirthDate("2002-03-15");
        setIsDemo(true);
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);
      setFirstName(profileData.first_name ?? "");
      setLastName(profileData.last_name ?? "");
      setGender(profileData.gender ?? "");
      setBirthDate(profileData.birth_date ?? "");
      setCity(profileData.city ?? "");
      setLevel(profileData.level ?? "");
      setPosition(profileData.position ?? "");
      setObjectives(profileData.objectives ?? "");
      setAvatarUrl(profileData.avatar_url ?? null);
      setLoading(false);
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDemo) {
      setNotice({ type: "success", text: "Profil joueur mis à jour (mode démo)." });
      return;
    }
    if (!userId) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        gender,
        birth_date: birthDate || null,
        city,
        level: level || null,
        position: position || null,
        objectives: objectives || null,
      })
      .eq("user_id", userId);

    setSaving(false);
    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Profil joueur mis à jour." });
  };

  const handleAvatarUpload = async (file: File) => {
    if (isDemo) {
      setNotice({ type: "success", text: "Photo mise à jour (mode démo)." });
      return;
    }
    if (!userId) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      setNotice({ type: "error", text: uploadError.message });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", userId);
    if (profileError) {
      setNotice({ type: "error", text: profileError.message });
      setUploading(false);
      return;
    }
    setAvatarUrl(publicUrl);
    setNotice({ type: "success", text: "Photo mise à jour." });
    setUploading(false);
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Joueur";

  return (
    <AppShell active="/dashboard" hideTitle>
      {/* ── Hero header ── */}
      <section className="py-8 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Profil</span>
              {isDemo && <span className="px-pill">Mode démo</span>}
            </div>
            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Mon profil{" "}
              <span className="px-gradient-text">joueur.</span>
            </h1>
            <p
              className="px-fade-up max-w-md text-base text-white/60"
              style={{ animationDelay: "160ms" }}
            >
              Personnalise ton profil pour que les coachs te repèrent plus facilement.
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
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-6">
            <div className="px-skeleton h-80 rounded-2xl" />
            <div className="px-skeleton h-60 rounded-2xl" />
          </div>
          <div className="px-skeleton h-96 rounded-2xl" />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            {/* ── Left column — Form ── */}
            <div className="space-y-6">
              {/* Avatar + identity */}
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Identité</h3>
                      <p className="text-xs text-white/50">Informations personnelles</p>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br from-blue-500/20 to-transparent text-white shadow-lg">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-8 w-8 text-white/40" />
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--px-accent)] text-black text-[10px] font-bold shadow-lg">
                        PX
                      </span>
                    </div>
                    <div>
                      <label className="px-button-ghost cursor-pointer text-sm">
                        {uploading ? "Upload..." : "Changer photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleAvatarUpload(file);
                          }}
                        />
                      </label>
                      <p className="mt-1 text-[11px] text-white/30">JPG, PNG. Max 2 Mo.</p>
                    </div>
                  </div>

                  {/* Name fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Prénom</label>
                      <input
                        className="px-input mt-2"
                        placeholder="Prénom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Nom</label>
                      <input
                        className="px-input mt-2"
                        placeholder="Nom"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Genre</label>
                      <select className="px-select mt-2" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Sélectionner</option>
                        <option value="Homme">Homme</option>
                        <option value="Femme">Femme</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Date de naissance</label>
                      <input
                        className="px-input mt-2"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Ville</label>
                    <div className="relative mt-2">
                      <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        className="px-input pl-9"
                        placeholder="Ta ville"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Football info */}
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <ShieldIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Infos sportives</h3>
                      <p className="text-xs text-white/50">Niveau, poste et objectifs</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Niveau</label>
                      <select className="px-select mt-2" value={level} onChange={(e) => setLevel(e.target.value)}>
                        <option value="">Sélectionner</option>
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Poste</label>
                      <select className="px-select mt-2" value={position} onChange={(e) => setPosition(e.target.value)}>
                        <option value="">Sélectionner</option>
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Objectifs</label>
                    <textarea
                      className="mt-2 min-h-[100px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                      placeholder="Décris tes objectifs..."
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-white/30">Visible par les coachs pour personnaliser tes séances.</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Submit */}
              <ScrollReveal>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-button text-sm px-8 py-3" type="submit" disabled={saving}>
                    <BoltIcon className="h-4 w-4" />
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                  {notice && (
                    <div
                      className={`rounded-xl border px-4 py-2 text-xs ${
                        notice.type === "success"
                          ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                          : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                      }`}
                    >
                      {notice.text}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* ── Right column — Preview card ── */}
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card overflow-hidden">
                  <div className="relative h-32 bg-gradient-to-br from-blue-600/30 via-blue-500/10 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--px-card)] to-transparent" />
                    <div className="absolute left-4 top-3">
                      <span className="rounded-full border border-blue-400/30 bg-blue-400/15 px-2.5 py-1 text-[10px] font-semibold text-blue-400">
                        Aperçu profil
                      </span>
                    </div>
                    {position && (
                      <div className="absolute right-4 top-3">
                        <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                          {position}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="relative -mt-10 px-5 pb-5">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[color:var(--px-card)] bg-gradient-to-br from-blue-500/20 to-transparent shadow-lg">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-7 w-7 text-white/40" />
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-lg font-semibold text-white">{fullName}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                        {city && (
                          <>
                            <MapPinIcon className="h-3 w-3" />
                            <span>{city}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {level && (
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${LEVEL_COLORS[level] ?? "border-white/10 bg-white/5 text-white/60"}`}>
                          {level}
                        </span>
                      )}
                      {gender && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60">
                          {gender}
                        </span>
                      )}
                    </div>

                    {objectives && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-1">Objectifs</p>
                        <p className="text-xs leading-relaxed text-white/70">{objectives}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-3.5 w-3.5 ${i < 4 ? "text-[color:var(--px-accent)]" : "text-white/15"}`}
                        />
                      ))}
                      <span className="ml-1 text-xs text-white/50">4.2 (8 avis)</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-5">
                  <p className="text-xs font-semibold text-white/70 mb-2">Conseils</p>
                  <ul className="space-y-2 text-xs text-white/50 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Ajoute une photo pour augmenter la visibilité de ton profil.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Décris tes objectifs pour que les coachs te proposent des séances adaptées.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Indique ton poste pour être trouvé plus facilement.
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
