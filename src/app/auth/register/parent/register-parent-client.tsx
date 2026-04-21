"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS } from "@/lib/constants";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  type FieldErrors,
} from "@/lib/validation";

const stepLabels = ["Compte", "Activation"];

export default function RegisterParentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = redirectParam && redirectParam.startsWith("/") ? redirectParam : null;
  const loginQs = safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : "";
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
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
    if (!department) next.department = "Le departement est requis.";
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
          role: "parent",
          first_name: sanitizeInput(firstName),
          last_name: sanitizeInput(lastName),
          city: department,
          department,
        },
      },
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      syncProfile(data.user).catch((err) => console.warn("[PerformX]", err));
      // Hard reload : cookies auth à propager avant check middleware.
      const target = safeRedirect ?? "/dashboard";
      if (typeof window !== "undefined") {
        window.location.assign(target);
      } else {
        router.push(target);
      }
      return;
    }

    setNotice({
      type: "success",
      text: `Compte parent créé ! Un email de confirmation a été envoyé à ${email}. Clique sur le lien pour activer ton compte.`,
    });
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
          <Link href="/auth/register" className="text-xs text-white/70">Changer de profil</Link>
        </div>

        {step === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-parent-firstName" className="mb-1 block text-xs text-white/70">Ton prénom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-parent-firstName"
                  className={`px-input ${errors.firstName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }}
                />
                <FieldError error={errors.firstName} />
              </div>
              <div>
                <label htmlFor="reg-parent-lastName" className="mb-1 block text-xs text-white/70">Ton nom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-parent-lastName"
                  className={`px-input ${errors.lastName ? "border-[color:var(--px-danger)]" : ""}`}
                  placeholder="Nom"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearField("lastName"); }}
                />
                <FieldError error={errors.lastName} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-parent-email" className="mb-1 block text-xs text-white/70">Adresse e-mail <span className="text-[color:var(--px-danger)]">*</span></label>
              <input
                id="reg-parent-email"
                className={`px-input ${errors.email ? "border-[color:var(--px-danger)]" : ""}`}
                type="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearField("email"); }}
              />
              <FieldError error={errors.email} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-parent-password" className="mb-1 block text-xs text-white/70">Mot de passe <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-parent-password"
                  className={`px-input ${errors.password ? "border-[color:var(--px-danger)]" : ""}`}
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearField("password"); }}
                />
                <FieldError error={errors.password} />
              </div>
              <div>
                <label htmlFor="reg-parent-confirmPassword" className="mb-1 block text-xs text-white/70">Confirmer <span className="text-[color:var(--px-danger)]">*</span></label>
                <input
                  id="reg-parent-confirmPassword"
                  className={`px-input ${errors.confirmPassword ? "border-[color:var(--px-danger)]" : ""}`}
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }}
                />
                <FieldError error={errors.confirmPassword} />
              </div>
            </div>
            <p className="text-[10px] text-white/30">Min. 8 caracteres, 1 majuscule, 1 chiffre, 1 caractere special.</p>
            <div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={acceptedTerms}
                  onChange={(e) => { setAcceptedTerms(e.target.checked); clearField("terms"); }}
                />
                J&apos;accepte la politique de confidentialite et les conditions d&apos;utilisation.
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
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Le compte parent n&apos;embarque plus une fiche enfant statique. Une fois inscrit, tu lieras un vrai compte joueur depuis ton dashboard avec un code temporaire généré cote joueur.
            </div>
            <div>
              <label htmlFor="reg-parent-department" className="mb-1 block text-xs text-white/70">Departement <span className="text-[color:var(--px-danger)]">*</span></label>
              <select
                id="reg-parent-department"
                className={`px-select ${errors.department ? "border-[color:var(--px-danger)]" : ""}`}
                value={department}
                onChange={(e) => { setDepartment(e.target.value); clearField("department"); }}
              >
                <option value="">Selectionner un departement</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <FieldError error={errors.department} />
            </div>
            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Creation...</> : "Créer le compte parent"}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-white/70">
          Déjà un compte ? <Link className="text-[color:var(--px-accent)]" href={`/auth/login${loginQs}`}>Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}
