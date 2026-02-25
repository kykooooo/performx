"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS, PLAYER_LEVELS, PLAYER_POSITIONS } from "@/lib/constants";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  type FieldErrors,
} from "@/lib/validation";

const stepLabels = ["Compte", "Profil"];

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

  const validateStep2 = (): boolean => {
    const next: FieldErrors = {};
    if (!gender) next.gender = "Le genre est requis.";
    if (!birthDate) next.birthDate = "La date de naissance est requise.";
    if (!city) next.city = "Le département est requis.";
    if (!level) next.level = "Le niveau est requis.";
    if (!position) next.position = "Le poste est requis.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!validateStep2()) return;

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
          city,
          level,
          position,
          objectives: sanitizeInput(objectives),
        },
      },
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
    } else {
      if (data.user && data.session) {
        syncProfile(data.user).catch((err) => console.warn("[PerformX]", err));
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
      subtitle={`Étape ${step}/2 : ${stepLabels[step - 1].toLowerCase()}.`}
    >
      <form className="space-y-4" onSubmit={handleRegister} noValidate>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  i + 1 === step
                    ? "bg-[color:var(--px-accent)]/20 text-[color:var(--px-accent)]"
                    : i + 1 < step
                      ? "bg-[color:var(--px-success)]/20 text-[color:var(--px-success)]"
                      : "bg-white/5 text-white/30"
                }`}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
          <Link href="/auth/register" className="text-xs text-white/70">Changer de profil</Link>
        </div>

        {step === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-player-firstName" className="mb-1 block text-xs text-white/70">Prénom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-player-firstName"
                  className={`px-input ${errors.firstName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }}
                  aria-invalid={!!errors.firstName}
                />
                <FieldError error={errors.firstName} />
              </div>
              <div>
                <label htmlFor="reg-player-lastName" className="mb-1 block text-xs text-white/70">Nom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-player-lastName"
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
              <label htmlFor="reg-player-email" className="mb-1 block text-xs text-white/70">Adresse e-mail <span className="text-[color:var(--px-danger)]">*</span></label>
              <input
                id="reg-player-email"
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
                <label htmlFor="reg-player-password" className="mb-1 block text-xs text-white/70">Mot de passe <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-player-password"
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
                <label htmlFor="reg-player-confirmPassword" className="mb-1 block text-xs text-white/70">Confirmer <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-player-confirmPassword"
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
            <p className="text-[10px] text-white/30">Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.</p>
            <div>
              <label className="flex items-center gap-2 text-xs text-white/70">
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
              <div>
                <label htmlFor="reg-player-gender" className="mb-1 block text-xs text-white/70">Genre <span className="text-[color:var(--px-danger)]">*</span></label>
                <select id="reg-player-gender" className={`px-select ${errors.gender ? "border-[color:var(--px-danger)]" : ""}`} value={gender} onChange={(e) => { setGender(e.target.value); clearField("gender"); }} aria-invalid={!!errors.gender}>
                  <option value="">Sélectionner</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="Autre">Autre</option>
                </select>
                <FieldError error={errors.gender} />
              </div>
              <div>
                <label htmlFor="reg-player-birthDate" className="mb-1 block text-xs text-white/70">Date de naissance <span className="text-[color:var(--px-danger)]">*</span></label>
                <input id="reg-player-birthDate" className={`px-input ${errors.birthDate ? "border-[color:var(--px-danger)]" : ""}`} type="date" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); clearField("birthDate"); }} aria-invalid={!!errors.birthDate} />
                <FieldError error={errors.birthDate} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-player-city" className="mb-1 block text-xs text-white/70">Département <span className="text-[color:var(--px-danger)]">*</span></label>
              <select id="reg-player-city" className={`px-select ${errors.city ? "border-[color:var(--px-danger)]" : ""}`} value={city} onChange={(e) => { setCity(e.target.value); clearField("city"); }} aria-invalid={!!errors.city}>
                <option value="">Sélectionner un département</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <FieldError error={errors.city} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-player-level" className="mb-1 block text-xs text-white/70">Niveau <span className="text-[color:var(--px-danger)]">*</span></label>
                <select id="reg-player-level" className={`px-select ${errors.level ? "border-[color:var(--px-danger)]" : ""}`} value={level} onChange={(e) => { setLevel(e.target.value); clearField("level"); }} aria-invalid={!!errors.level}>
                  <option value="">Sélectionner</option>
                  {PLAYER_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <FieldError error={errors.level} />
              </div>
              <div>
                <label htmlFor="reg-player-position" className="mb-1 block text-xs text-white/70">Poste <span className="text-[color:var(--px-danger)]">*</span></label>
                <select id="reg-player-position" className={`px-select ${errors.position ? "border-[color:var(--px-danger)]" : ""}`} value={position} onChange={(e) => { setPosition(e.target.value); clearField("position"); }} aria-invalid={!!errors.position}>
                  <option value="">Sélectionner</option>
                  {PLAYER_POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <FieldError error={errors.position} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-player-objectives" className="mb-1 block text-xs text-white/70">Objectifs personnels</label>
              <textarea
                id="reg-player-objectives"
                className="min-h-[100px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                placeholder="Ex: vitesse, précision, détection..."
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
              />
            </div>
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

        <p className="text-center text-xs text-white/70">
          Déjà un compte ? <Link className="text-[color:var(--px-accent)]" href="/auth/login">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}
