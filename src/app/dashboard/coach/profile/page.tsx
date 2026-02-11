"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { supabase } from "@/lib/supabase";

export default function CoachProfileEditPage() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setNotice({ type: "error", text: "Connecte-toi pour modifier ton profil." });
        setLoading(false);
        return;
      }

      const { data: coachData, error } = await supabase
        .from("coaches")
        .select("id, name, speciality, bio, location, price_per_session")
        .eq("user_id", userData.user.id)
        .single();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", userData.user.id)
        .single();

      if (!mounted) return;
      if (error || !coachData) {
        setNotice({ type: "error", text: error?.message ?? "Profil coach introuvable." });
        setLoading(false);
        return;
      }

      setCoachId(coachData.id);
      setUserId(userData.user.id);
      setName(coachData.name ?? "");
      setSpeciality(coachData.speciality ?? "");
      setBio(coachData.bio ?? "");
      setLocation(coachData.location ?? "");
      setPrice(coachData.price_per_session ?? 0);
      setAvatarUrl(profileData?.avatar_url ?? null);
      setLoading(false);
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coachId) return;

    const { error } = await supabase
      .from("coaches")
      .update({
        name,
        speciality,
        bio,
        location,
        price_per_session: price,
      })
      .eq("id", coachId);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Profil coach mis à jour." });
  };

  const handleAvatarUpload = async (file: File) => {
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

  return (
    <AppShell
      active="/dashboard"
      title="Modifier mon profil coach"
      description="Mets à jour ton prix, ta spécialité et ta présentation."
    >
      <div className="px-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-white">Infos publiques</h3>
          <Link href="/dashboard/coach" className="px-button-ghost">
            Retour dashboard
          </Link>
        </div>
        {loading && <p className="mt-4 text-sm text-white/50">Chargement...</p>}
        {!loading && (
          <form className="mt-6 grid gap-4" onSubmit={handleSave}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/60 text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar coach" className="h-full w-full object-cover" />
                ) : (
                  <span>PX</span>
                )}
              </div>
              <label className="px-button-ghost cursor-pointer">
                {uploading ? "Upload..." : "Changer photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleAvatarUpload(file);
                    }
                  }}
                />
              </label>
            </div>
            <input
              className="px-input"
              placeholder="Nom affiché"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <input
              className="px-input"
              placeholder="Spécialité"
              value={speciality}
              onChange={(event) => setSpeciality(event.target.value)}
              required
            />
            <input
              className="px-input"
              placeholder="Localisation"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none"
              placeholder="Bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            <input
              className="px-input"
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
            />
            <button className="px-button" type="submit">
              Enregistrer
            </button>
          </form>
        )}
        {notice && (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
              notice.type === "success"
                ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
            }`}
          >
            {notice.text}
          </div>
        )}
      </div>
    </AppShell>
  );
}
