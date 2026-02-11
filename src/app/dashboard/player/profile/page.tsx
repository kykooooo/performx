"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { supabase } from "@/lib/supabase";

export default function PlayerProfileEditPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setNotice({ type: "error", text: "Connecte-toi pour modifier ton profil joueur." });
        setLoading(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, gender, birth_date, city, avatar_url")
        .eq("user_id", userData.user.id)
        .single();

      if (!mounted) return;
      if (error || !profileData) {
        setNotice({ type: "error", text: error?.message ?? "Profil introuvable." });
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);
      setFirstName(profileData.first_name ?? "");
      setLastName(profileData.last_name ?? "");
      setGender(profileData.gender ?? "");
      setBirthDate(profileData.birth_date ?? "");
      setCity(profileData.city ?? "");
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
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        gender,
        birth_date: birthDate || null,
        city,
      })
      .eq("user_id", userId);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Profil joueur mis à jour." });
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
    if (profileError) {
      setNotice({ type: "error", text: profileError.message });
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
      title="Profil joueur"
      description="Mets à jour tes informations personnelles."
    >
      <div className="px-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-white">Informations joueur</h3>
          <Link href="/dashboard" className="px-button-ghost">
            Retour dashboard
          </Link>
        </div>
        {loading && <p className="mt-4 text-sm text-white/50">Chargement...</p>}
        {!loading && (
          <form className="mt-6 grid gap-4" onSubmit={handleSave}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/60 text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar joueur" className="h-full w-full object-cover" />
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
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="px-input"
                placeholder="Prénom"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
              <input
                className="px-input"
                placeholder="Nom"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="px-select" value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Genre</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
              <input
                className="px-input"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </div>
            <input
              className="px-input"
              placeholder="Ville"
              value={city}
              onChange={(event) => setCity(event.target.value)}
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
