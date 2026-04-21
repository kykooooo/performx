"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/app-shell";
import DeleteAccountButton from "@/components/delete-account-button";
import { LoadingState } from "@/components/feedback-state";
import ScrollReveal from "@/components/scroll-reveal";
import { useRoleGuard } from "@/lib/use-role-guard";
import {
  WhistleIcon,
  ArrowRightIcon,
  MapPinIcon,
  StarIcon,
  BoltIcon,
  UserIcon,
} from "@/components/icons";
import { AGE_CATEGORIES, COACH_SPECIALITIES, parseTextArray } from "@/lib/football";
import { supabase } from "@/lib/supabase";

const SPECIALITIES = COACH_SPECIALITIES;

const INTERVENTION_LOCATIONS = [
  "Domicile joueur",
  "Terrain extérieur",
  "Salle / gymnase",
  "Club partenaire",
] as const;

export default function CoachProfileEditPage() {
  const { status: guardStatus } = useRoleGuard("coach");
  const [coachId, setCoachId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [acceptedAgeCategories, setAcceptedAgeCategories] = useState<string[]>([]);
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(0);
  const [interventionLocations, setInterventionLocations] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [diplomas, setDiplomas] = useState("");
  const [certifications, setCertifications] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [sessionFormats, setSessionFormats] = useState("");
  const [pedagogy, setPedagogy] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const syncCoachMetadata = async (nextAvatarUrl: string | null) => {
    if (!userId) return null;
    const [firstName, ...lastNameParts] = name.trim().split(" ").filter(Boolean);
    const metadata = {
      role: "coach",
      first_name: firstName ?? "",
      last_name: lastNameParts.join(" "),
      speciality,
      specialities,
      accepted_age_categories: acceptedAgeCategories,
      service_radius_km: serviceRadiusKm || null,
      intervention_locations: interventionLocations,
      bio,
      location,
      department,
      price_per_session: price,
      diplomas: parseTextArray(diplomas),
      experience_years: experienceYears || null,
      certifications: parseTextArray(certifications),
      focus_areas: parseTextArray(focusAreas),
      session_formats: parseTextArray(sessionFormats),
      pedagogy,
      avatar_url: nextAvatarUrl,
    };

    const { error } = await supabase.auth.updateUser({ data: metadata });
    return error;
  };

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (mounted) {
          setIsDemo(true);
          setLoading(false);
        }
        return;
      }

      const { data: coachData } = await supabase
        .from("coaches")
        .select("id, name, speciality, specialities, accepted_age_categories, service_radius_km, intervention_locations, bio, location, department, diplomas, experience_years, certifications, focus_areas, session_formats, pedagogy, price_per_session, rating, reviews_count")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!mounted) return;

      setUserId(userData.user.id);
      setAvatarUrl(profileData?.avatar_url ?? null);

      if (!coachData) {
        const metadata = userData.user.user_metadata ?? {};
        const firstName = (metadata.first_name as string | undefined) ?? "";
        const lastName = (metadata.last_name as string | undefined) ?? "";
        setName([firstName, lastName].filter(Boolean).join(" "));
        setLoading(false);
        return;
      }

      setCoachId(coachData.id);
      setName(coachData.name ?? "");
      setSpeciality(coachData.speciality ?? "");
      const loadedSpecialities = parseTextArray(
        coachData.specialities as string[] | string | null,
      );
      setSpecialities(
        loadedSpecialities.length > 0
          ? loadedSpecialities
          : coachData.speciality
            ? [coachData.speciality]
            : [],
      );
      setAcceptedAgeCategories(
        parseTextArray(coachData.accepted_age_categories as string[] | string | null),
      );
      setServiceRadiusKm(Number(coachData.service_radius_km ?? 0));
      setInterventionLocations(
        parseTextArray(coachData.intervention_locations as string[] | string | null),
      );
      setBio(coachData.bio ?? "");
      setLocation(coachData.location ?? "");
      setDepartment(coachData.department ?? "");
      setExperienceYears(coachData.experience_years ?? 0);
      setDiplomas(parseTextArray(coachData.diplomas as string[] | string | null).join(", "));
      setCertifications(parseTextArray(coachData.certifications as string[] | string | null).join(", "));
      setFocusAreas(parseTextArray(coachData.focus_areas as string[] | string | null).join(", "));
      setSessionFormats(parseTextArray(coachData.session_formats as string[] | string | null).join(", "));
      setPedagogy(coachData.pedagogy ?? "");
      setPrice(coachData.price_per_session ?? 0);
      setRating(Number(coachData.rating ?? 0));
      setReviewsCount(Number(coachData.reviews_count ?? 0));
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
      setNotice({ type: "success", text: "Profil coach mis à jour (mode démo)." });
      return;
    }
    if (!coachId) return;
    setSaving(true);

    const authError = await syncCoachMetadata(avatarUrl);
    if (authError) {
      setSaving(false);
      setNotice({ type: "error", text: authError.message });
      return;
    }

    const { error } = await supabase
      .from("coaches")
      .update({
        name,
        speciality: specialities[0] ?? speciality,
        specialities,
        accepted_age_categories: acceptedAgeCategories,
        service_radius_km: serviceRadiusKm || null,
        intervention_locations: interventionLocations,
        bio,
        location,
        department,
        experience_years: experienceYears || null,
        diplomas: parseTextArray(diplomas),
        certifications: parseTextArray(certifications),
        focus_areas: parseTextArray(focusAreas),
        session_formats: parseTextArray(sessionFormats),
        pedagogy,
        price_per_session: price,
      })
      .eq("id", coachId);

    setSaving(false);
    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Profil coach mis à jour." });
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
    const authError = await syncCoachMetadata(publicUrl);
    if (authError) {
      setNotice({ type: "error", text: authError.message });
      setUploading(false);
      return;
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", userId);
    const { error: coachError } = await supabase
      .from("coaches")
      .update({ avatar_url: publicUrl })
      .eq("id", coachId);
    if (profileError || coachError) {
      setNotice({ type: "error", text: profileError?.message ?? coachError?.message ?? "Erreur upload." });
      setUploading(false);
      return;
    }
    setAvatarUrl(publicUrl);
    setNotice({ type: "success", text: "Photo mise à jour." });
    setUploading(false);
  };

  if (guardStatus !== "ok") {
    return (
      <AppShell active="/dashboard" hideTitle>
        <LoadingState title="Chargement" description="Vérification de ton espace coach..." />
      </AppShell>
    );
  }

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
              <span className="px-gradient-text">coach.</span>
            </h1>
            <p
              className="px-fade-up max-w-md text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Mets à jour ton profil pour attirer plus de joueurs et remplir ton planning.
            </p>
          </div>
          <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/dashboard/coach" className="px-button-ghost text-sm">
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
              {/* Identity section */}
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Identité</h3>
                      <p className="text-xs text-white/70">Nom et photo affichés publiquement</p>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br from-[color:var(--px-accent)]/20 to-transparent text-white shadow-lg">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="Avatar" fill sizes="80px" className="object-cover" />
                        ) : (
                          <WhistleIcon className="h-8 w-8 text-white/70" />
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
                      <p className="mt-1 text-[11px] text-white/70">JPG, PNG. Max 2 Mo.</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="coach-edit-name" className="text-[11px] uppercase tracking-[0.2em] text-white/70">Nom affiché</label>
                    <input
                      id="coach-edit-name"
                      className="px-input mt-2"
                      placeholder="Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="coach-edit-location" className="text-[11px] uppercase tracking-[0.2em] text-white/70">Localisation</label>
                    <div className="relative mt-2">
                      <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                      <input
                        id="coach-edit-location"
                        className="px-input pl-9"
                        placeholder="Rouen · 12 km"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Speciality + bio */}
              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <WhistleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Spécialisation</h3>
                      <p className="text-xs text-white/70">Ta spécialité et ta présentation</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Spécialités</label>
                    <p className="mt-1 text-[11px] text-white/60">
                      Sélectionne toutes tes spécialités (au moins une). Les joueurs filtreront les coachs grâce à ces tags.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {SPECIALITIES.map((option) => {
                        const checked = specialities.includes(option);
                        return (
                          <label
                            key={option}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                              checked
                                ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => {
                                setSpecialities((prev) => {
                                  const next = checked
                                    ? prev.filter((entry) => entry !== option)
                                    : [...prev, option];
                                  if (!speciality || !next.includes(speciality)) {
                                    setSpeciality(next[0] ?? "");
                                  }
                                  return next;
                                });
                              }}
                            />
                            <span className="flex h-4 w-4 items-center justify-center rounded border border-current">
                              {checked ? (
                                <span className="h-2 w-2 rounded-sm bg-current" />
                              ) : null}
                            </span>
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="coach-edit-bio" className="text-[11px] uppercase tracking-[0.2em] text-white/70">Bio</label>
                    <textarea
                      id="coach-edit-bio"
                      className="mt-2 min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                      placeholder="Décris ton approche, ton parcours, ce qui te différencie..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-white/70">
                      Visible sur ton profil public. Sois précis pour attirer les bons joueurs.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Zone & public accepté */}
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Zone &amp; public</h3>
                      <p className="text-xs text-white/70">
                        Tranches d&apos;âge encadrées, rayon d&apos;action et lieux d&apos;intervention
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Tranches d&apos;âge acceptées</label>
                    <p className="mt-1 text-[11px] text-white/60">
                      Sélectionne toutes les catégories que tu peux encadrer. Tu pourras toujours refuser au cas par cas.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {AGE_CATEGORIES.map((age) => {
                        const checked = acceptedAgeCategories.includes(age);
                        return (
                          <label
                            key={age}
                            className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-xs transition ${
                              checked
                                ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => {
                                setAcceptedAgeCategories((prev) =>
                                  checked
                                    ? prev.filter((entry) => entry !== age)
                                    : [...prev, age],
                                );
                              }}
                            />
                            {age}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="coach-edit-radius" className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                      Rayon d&apos;action (km)
                    </label>
                    <p className="mt-1 text-[11px] text-white/60">
                      Distance maximum depuis ta localisation pour les séances à domicile ou sur terrain partenaire.
                    </p>
                    <div className="relative mt-2">
                      <input
                        id="coach-edit-radius"
                        className="px-input pr-16"
                        type="number"
                        min={0}
                        step={5}
                        value={serviceRadiusKm}
                        onChange={(event) => setServiceRadiusKm(Number(event.target.value) || 0)}
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/70">km</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {[5, 10, 20, 40].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setServiceRadiusKm(preset)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            serviceRadiusKm === preset
                              ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                          }`}
                        >
                          {preset} km
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Lieux d&apos;intervention</label>
                    <p className="mt-1 text-[11px] text-white/60">
                      Choisis les lieux où tu peux donner une séance.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {INTERVENTION_LOCATIONS.map((loc) => {
                        const checked = interventionLocations.includes(loc);
                        return (
                          <label
                            key={loc}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                              checked
                                ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => {
                                setInterventionLocations((prev) =>
                                  checked
                                    ? prev.filter((entry) => entry !== loc)
                                    : [...prev, loc],
                                );
                              }}
                            />
                            <span className="flex h-4 w-4 items-center justify-center rounded border border-current">
                              {checked ? (
                                <span className="h-2 w-2 rounded-sm bg-current" />
                              ) : null}
                            </span>
                            <span>{loc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Price */}
              <ScrollReveal>
                <div className="px-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <BoltIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Tarification</h3>
                      <p className="text-xs text-white/70">Prix par séance affiché aux joueurs</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="coach-edit-price" className="text-[11px] uppercase tracking-[0.2em] text-white/70">Prix par séance (€)</label>
                    <div className="relative mt-2">
                      <input
                        id="coach-edit-price"
                        className="px-input pr-16"
                        type="number"
                        min={0}
                        step={1}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/70">€/séance</span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      {[25, 35, 45, 55].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPrice(preset)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            price === preset
                              ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                          }`}
                        >
                          {preset}€
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="px-card-strong p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <WhistleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">Expertise premium</h3>
                      <p className="text-xs text-white/70">Diplomes, formats, focus et pedagogie</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Departement</label>
                      <input className="px-input mt-2" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="76 - Seine-Maritime" />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Expérience</label>
                      <input className="px-input mt-2" type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value) || 0)} placeholder="8" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Diplomes</label>
                    <input className="px-input mt-2" value={diplomas} onChange={(e) => setDiplomas(e.target.value)} placeholder="UEFA B, BEF" />
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Certifications</label>
                    <input className="px-input mt-2" value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="UEFA B, analyse video" />
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Focus metier</label>
                    <input className="px-input mt-2" value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} placeholder="Premier controle, finition, prise d'information" />
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Formats de séance</label>
                    <input className="px-input mt-2" value={sessionFormats} onChange={(e) => setSessionFormats(e.target.value)} placeholder="Individuel, duo, analyse video" />
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Pedagogie</label>
                    <textarea
                      className="mt-2 min-h-[110px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                      value={pedagogy}
                      onChange={(e) => setPedagogy(e.target.value)}
                      placeholder="Explique ton approche et comment tu fais progresser un joueur."
                    />
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

              {/* Zone danger */}
              <ScrollReveal>
                <DeleteAccountButton />
              </ScrollReveal>
            </div>

            {/* ── Right column — Preview card ── */}
            <div className="space-y-6">
              <ScrollReveal>
                <div className="px-card overflow-hidden">
                  {/* Banner */}
                  <div className="relative h-36">
                    <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-accent)]/30 via-[color:var(--px-accent)]/5 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,138,0,0.2),transparent_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--px-card)] to-transparent" />
                    <div className="absolute left-4 top-3 flex items-center gap-2">
                      <span className="rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/15 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-accent)]">
                        Aperçu profil
                      </span>
                    </div>
                    {price > 0 && (
                      <div className="absolute bottom-3 right-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                        {price}€<span className="text-[10px] font-normal text-white/70">/séance</span>
                      </div>
                    )}
                  </div>

                  <div className="relative -mt-10 px-5 pb-5">
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[color:var(--px-card)] bg-gradient-to-br from-[color:var(--px-accent)]/20 to-transparent shadow-lg">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill sizes="64px" className="object-cover" />
                      ) : (
                        <WhistleIcon className="h-7 w-7 text-white/70" />
                      )}
                    </div>

                    <div className="mt-3 flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{name || "Coach"}</p>
                        <p className="text-xs text-[color:var(--px-accent)]">{speciality || "Spécialité"}</p>
                      </div>
                      <span className="relative flex h-2.5 w-2.5 mt-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-success)] opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--px-success)]" />
                      </span>
                    </div>

                    {location && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                        <MapPinIcon className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    )}

                    {bio && (
                      <p className="mt-3 text-xs leading-relaxed text-white/70 line-clamp-3">{bio}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {experienceYears > 0 && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
                          {experienceYears} ans
                        </span>
                      )}
                      {parseTextArray(sessionFormats).slice(0, 1).map((format) => (
                        <span
                          key={format}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70"
                        >
                          {format}
                        </span>
                      ))}
                    </div>

                    {parseTextArray(focusAreas).length > 0 && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
                          Focus metier
                        </p>
                        <p className="text-xs leading-relaxed text-white/70">
                          {parseTextArray(focusAreas).slice(0, 3).join(" · ")}
                        </p>
                      </div>
                    )}

                    {pedagogy && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
                          Pedagogie
                        </p>
                        <p className="text-xs leading-relaxed text-white/70 line-clamp-3">
                          {pedagogy}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-1">
                      {reviewsCount > 0 ? (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "text-[color:var(--px-accent)]" : "text-white/15"}`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-white/70">
                            {rating.toFixed(1)} ({reviewsCount} avis)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-white/50">Pas encore d&apos;avis</span>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-5">
                  <p className="text-xs font-semibold text-white/70 mb-2">Conseils pour ton profil</p>
                  <ul className="space-y-2 text-xs text-white/70 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Ajoute une photo professionnelle pour gagner en crédibilité.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Rédige une bio détaillée avec ton parcours et ta méthode.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--px-accent)]" />
                      Un prix compétitif attire plus de premiers rendez-vous.
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
