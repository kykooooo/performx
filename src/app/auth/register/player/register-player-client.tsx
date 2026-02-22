"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS, PLAYER_POSITIONS } from "@/lib/constants";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  type FieldErrors,
} from "@/lib/validation";

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
  const [notice, setNotice] = useState<NoticeData>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearField = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const validateStep1 = (): boolean => {
    const next: FieldErrors = {};
    const fnErr = validateRequired(firstName, "Le prénom");
    if (fnErr) next.firstName = fnErr;
    const lnErr = validateRequired(lastName, "Le nom");
    if (lnErr) next.lastName = lnErr;
    const emErr = validateEmail(email);
    if (emErr) next.email = emErr;
    const pwErr = validatePassword(password);
    if (pwErr) next.password = pwErr;
    const pmErr = validatePasswordMatch(password, confirmPassword);
    if (pmErr) next.confirmPassword = pmErr;
    if (!acceptedTerms) next.terms = "Tu dois accepter les conditions pour continuer.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const next: FieldErrors = {};
    const pmErr = validatePasswordMatch(password, confirmPassword);
    if (pmErr) next.confirmPassword = pmErr;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "player",
          first_name: sanitizeInput(firstName),
          last_name: sanitizeInput(lastName),
          gender,
          birth_date: birthDate,
          city: sanitizeInput(city),
          level,
          position: sanitizeInput(position),
          objectives: sanitizeInput(objectives),
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
    if (!validateStep1()) return;
    setNotice(null);
    setStep(2);
  };

  return (
    <AuthShell
      title="Inscription joueur"
      subtitle={step === 1 ? "Étape 1/2: crée ton compte." : "Étape 2/2: complète ton profil."}
    >
      <form className="space-y-4" onSubmit={handleRegister} noValidate>
        <div className="flex items-center justify-between">
          <span className="px-pill">Étape {step} / 2</span>
          <Link href="/auth/register" className="text-xs text-white/50">Changer de profil</Link>
        </div>

        {step === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <input
                  className={`px-input ${errors.firstName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }}
                  aria-invalid={!!errors.firstName}
                />
                <FieldError error={errors.firstName} />
              </div>
              <div>
                <input
                  className={`px-input ${errors.lastName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Nom"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearField("lastName"); }}
                  aria-invalid={!!errors.lastName}
                />
                <FieldError error={errors.lastName} />
              </div>
            </div>
            <div>
              <input
                className={`px-input ${errors.email ? "border-[color:var(--px-danger)]" : ""}`}
                type="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearField("email"); }}
                aria-invalid={!!errors.email}
              />
              <FieldError error={errors.email} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <input
                  className={`px-input ${errors.password ? "border-[color:var(--px-danger)]" : ""}`}
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearField("password"); }}
                  aria-invalid={!!errors.password}
                />
                <FieldError error={errors.password} />
              </div>
              <div>
                <input
                  className={`px-input ${errors.confirmPassword ? "border-[color:var(--px-danger)]" : ""}`}
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }}
                  aria-invalid={!!errors.confirmPassword}
                />
                <FieldError error={errors.confirmPassword} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={acceptedTerms}
                  onChange={(e) => { setAcceptedTerms(e.target.checked); clearField("terms"); }}
                  aria-invalid={!!errors.terms}
                />
                J&apos;accepte la politique de confidentialité et les conditions d&apos;utilisation.
              </label>
              <FieldError error={errors.terms} />
            </div>
            <Notice notice={notice} />
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
            <select className="px-select" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Département</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="px-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Niveau</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Confirmé">Confirmé</option>
              </select>
              <select className="px-select" value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="">Poste</option>
                {PLAYER_POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
              placeholder="Objectifs personnels (ex: vitesse, précision, détection)"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
            />
            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Création...</> : "Créer le compte joueur"}
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
