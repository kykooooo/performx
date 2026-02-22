"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePrice,
  validateRequired,
  type FieldErrors,
} from "@/lib/validation";

export default function RegisterCoachPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [bio, setBio] = useState("");
  const [diplomas, setDiplomas] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [certifications, setCertifications] = useState("");
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
    const spErr = validateRequired(speciality, "La spécialité");
    if (spErr) next.speciality = spErr;
    const locErr = validateRequired(location, "La localisation");
    if (locErr) next.location = locErr;
    const dipErr = validateRequired(diplomas, "Les diplômes");
    if (dipErr) next.diplomas = dipErr;
    const prErr = validatePrice(price);
    if (prErr) next.price = prErr;
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
          role: "coach",
          first_name: sanitizeInput(firstName),
          last_name: sanitizeInput(lastName),
          speciality: sanitizeInput(speciality),
          location: sanitizeInput(location),
          price_per_session: price,
          bio: sanitizeInput(bio),
          diplomas: sanitizeInput(diplomas),
          experience_years: experienceYears === "" ? null : experienceYears,
          certifications: sanitizeInput(certifications),
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
        text: "Compte coach créé. Vérifie ton e-mail pour valider l'inscription.",
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
      title="Inscription coach"
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
                <input className={`px-input ${errors.firstName ? "border-[color:var(--px-danger)]" : ""}`} placeholder="Prénom" value={firstName} onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }} aria-invalid={!!errors.firstName} />
                <FieldError error={errors.firstName} />
              </div>
              <div>
                <input className={`px-input ${errors.lastName ? "border-[color:var(--px-danger)]" : ""}`} placeholder="Nom" value={lastName} onChange={(e) => { setLastName(e.target.value); clearField("lastName"); }} aria-invalid={!!errors.lastName} />
                <FieldError error={errors.lastName} />
              </div>
            </div>
            <div>
              <input className={`px-input ${errors.email ? "border-[color:var(--px-danger)]" : ""}`} type="email" placeholder="Adresse e-mail" value={email} onChange={(e) => { setEmail(e.target.value); clearField("email"); }} aria-invalid={!!errors.email} />
              <FieldError error={errors.email} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <input className={`px-input ${errors.password ? "border-[color:var(--px-danger)]" : ""}`} type="password" placeholder="Mot de passe" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} aria-invalid={!!errors.password} />
                <FieldError error={errors.password} />
              </div>
              <div>
                <input className={`px-input ${errors.confirmPassword ? "border-[color:var(--px-danger)]" : ""}`} type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }} aria-invalid={!!errors.confirmPassword} />
                <FieldError error={errors.confirmPassword} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" className="h-4 w-4" checked={acceptedTerms} onChange={(e) => { setAcceptedTerms(e.target.checked); clearField("terms"); }} aria-invalid={!!errors.terms} />
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
                <input className={`px-input ${errors.speciality ? "border-[color:var(--px-danger)]" : ""}`} placeholder="Spécialité" value={speciality} onChange={(e) => { setSpeciality(e.target.value); clearField("speciality"); }} aria-invalid={!!errors.speciality} />
                <FieldError error={errors.speciality} />
              </div>
              <div>
                <input className={`px-input ${errors.location ? "border-[color:var(--px-danger)]" : ""}`} placeholder="Localisation" value={location} onChange={(e) => { setLocation(e.target.value); clearField("location"); }} aria-invalid={!!errors.location} />
                <FieldError error={errors.location} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <input className={`px-input ${errors.price ? "border-[color:var(--px-danger)]" : ""}`} type="number" min={0} step={1} placeholder="Prix par séance (€)" value={price} onChange={(e) => { setPrice(Number(e.target.value)); clearField("price"); }} aria-invalid={!!errors.price} />
                <FieldError error={errors.price} />
              </div>
              <input className="px-input" type="number" min={0} step={1} placeholder="Années d'expérience" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
              placeholder="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div>
              <textarea
                className={`min-h-[110px] w-full rounded-xl border bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30 ${errors.diplomas ? "border-[color:var(--px-danger)]" : "border-[color:var(--px-border)]"}`}
                placeholder="Diplômes (séparés par des virgules)"
                value={diplomas}
                onChange={(e) => { setDiplomas(e.target.value); clearField("diplomas"); }}
                aria-invalid={!!errors.diplomas}
              />
              <FieldError error={errors.diplomas} />
            </div>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
              placeholder="Certifications (ex: UEFA B, etc.)"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
            />
            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Création...</> : "Créer le compte coach"}
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
