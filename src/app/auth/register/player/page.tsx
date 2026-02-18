"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth-shell";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";

export default function RegisterPlayerPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");
  const [position, setPosition] = useState("");
  const [objectives, setObjectives] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (password !== confirmPassword) {
      setNotice({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "player",
          first_name: firstName,
          last_name: lastName,
          gender,
          birth_date: birthDate,
          city,
          level,
          position,
          objectives,
        },
      },
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
    } else {
      if (data.user && data.session) {
        syncProfile(data.user).catch(() => null);
      }
      setNotice({
        type: "success",
        text: "Compte joueur créé. Vérifie ton e-mail pour valider l'inscription.",
      });
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setNotice({ type: "error", text: "Complète les champs requis pour continuer." });
      return;
    }
    if (!acceptedTerms) {
      setNotice({ type: "error", text: "Tu dois accepter les conditions pour continuer." });
      return;
    }
    if (password !== confirmPassword) {
      setNotice({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    setNotice(null);
    setStep(2);
  };

  return (
    <AuthShell
      title="Inscription joueur"
      subtitle={step === 1 ? "Étape 1/2: crée ton compte." : "Étape 2/2: complète ton profil."}
    >
      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="flex items-center justify-between">
          <span className="px-pill">Étape {step} / 2</span>
          <Link href="/auth/register" className="text-xs text-white/50">Changer de profil</Link>
        </div>

        {step === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="px-input" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <input className="px-input" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <input className="px-input" type="email" placeholder="Adresse e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="px-input" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <input
                className="px-input"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              J&apos;accepte la politique de confidentialité et les conditions d&apos;utilisation.
            </label>
            {notice && (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${
                  notice.type === "success"
                    ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                    : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                }`}
              >
                {notice.text}
              </div>
            )}
            <button className="px-button w-full" type="button" onClick={handleNext}>
              Continuer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="px-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Genre</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
              <input className="px-input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <input className="px-input" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="px-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Niveau</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Confirmé">Confirmé</option>
              </select>
              <input className="px-input" placeholder="Poste" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none"
              placeholder="Objectifs personnels (ex: vitesse, précision, détection)"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
            />
            {notice && (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${
                  notice.type === "success"
                    ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                    : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                }`}
              >
                {notice.text}
              </div>
            )}
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer le compte joueur"}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-white/60">
          Déjà un compte ? <Link className="text-[color:var(--px-accent)]" href="/auth/login">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}
