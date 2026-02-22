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

const stepLabels = ["Compte", "Enfant"];

export default function RegisterParentPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childBirthDate, setChildBirthDate] = useState("");
  const [childLevel, setChildLevel] = useState("");
  const [childPosition, setChildPosition] = useState("");
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
    if (!city) next.city = "Le département est requis.";
    const cfnErr = validateRequired(childFirstName, "Le prénom de l'enfant");
    if (cfnErr) next.childFirstName = cfnErr;
    const clnErr = validateRequired(childLastName, "Le nom de l'enfant");
    if (clnErr) next.childLastName = clnErr;
    if (!childBirthDate) next.childBirthDate = "La date de naissance est requise.";
    if (!childLevel) next.childLevel = "Le niveau est requis.";
    if (!childPosition) next.childPosition = "Le poste est requis.";
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
          role: "club",
          first_name: sanitizeInput(firstName),
          last_name: sanitizeInput(lastName),
          city,
          child_first_name: sanitizeInput(childFirstName),
          child_last_name: sanitizeInput(childLastName),
          child_birth_date: childBirthDate,
          child_level: childLevel,
          child_position: childPosition,
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
        text: "Compte parent créé. Vérifie ton e-mail pour valider l'inscription.",
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
      title="Inscription parent"
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
          <Link href="/auth/register" className="text-xs text-white/50">Changer de profil</Link>
        </div>

        {step === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/50">Ton prénom <span className="text-[color:var(--px-danger)]">*</span></label>
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
                <label className="mb-1 block text-xs text-white/50">Ton nom <span className="text-[color:var(--px-danger)]">*</span></label>
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
              <label className="mb-1 block text-xs text-white/50">Adresse e-mail <span className="text-[color:var(--px-danger)]">*</span></label>
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
                <label className="mb-1 block text-xs text-white/50">Mot de passe <span className="text-[color:var(--px-danger)]">*</span></label>
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
                <label className="mb-1 block text-xs text-white/50">Confirmer <span className="text-[color:var(--px-danger)]">*</span></label>
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
            <p className="text-[10px] text-white/30">Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.</p>
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
            <p className="text-xs text-white/50">
              Ces informations nous aident à personnaliser l&apos;expérience de ton enfant.
            </p>
            <div>
              <label className="mb-1 block text-xs text-white/50">Département <span className="text-[color:var(--px-danger)]">*</span></label>
              <select className={`px-select ${errors.city ? "border-[color:var(--px-danger)]" : ""}`} value={city} onChange={(e) => { setCity(e.target.value); clearField("city"); }} aria-invalid={!!errors.city}>
                <option value="">Sélectionner un département</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <FieldError error={errors.city} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/50">Prénom de l&apos;enfant <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  className={`px-input ${errors.childFirstName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Prénom"
                  value={childFirstName}
                  onChange={(e) => { setChildFirstName(e.target.value); clearField("childFirstName"); }}
                  aria-invalid={!!errors.childFirstName}
                />
                <FieldError error={errors.childFirstName} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Nom de l&apos;enfant <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  className={`px-input ${errors.childLastName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Nom"
                  value={childLastName}
                  onChange={(e) => { setChildLastName(e.target.value); clearField("childLastName"); }}
                  aria-invalid={!!errors.childLastName}
                />
                <FieldError error={errors.childLastName} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Date de naissance <span className="text-[color:var(--px-danger)]">*</span></label>
              <input
                className={`px-input ${errors.childBirthDate ? "border-[color:var(--px-danger)]" : ""}`}
                type="date"
                value={childBirthDate}
                onChange={(e) => { setChildBirthDate(e.target.value); clearField("childBirthDate"); }}
                aria-invalid={!!errors.childBirthDate}
              />
              <FieldError error={errors.childBirthDate} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/50">Niveau <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.childLevel ? "border-[color:var(--px-danger)]" : ""}`} value={childLevel} onChange={(e) => { setChildLevel(e.target.value); clearField("childLevel"); }} aria-invalid={!!errors.childLevel}>
                  <option value="">Sélectionner</option>
                  {PLAYER_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <FieldError error={errors.childLevel} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Poste <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.childPosition ? "border-[color:var(--px-danger)]" : ""}`} value={childPosition} onChange={(e) => { setChildPosition(e.target.value); clearField("childPosition"); }} aria-invalid={!!errors.childPosition}>
                  <option value="">Sélectionner</option>
                  {PLAYER_POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <FieldError error={errors.childPosition} />
              </div>
            </div>
            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Création...</> : "Créer le compte parent"}
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
