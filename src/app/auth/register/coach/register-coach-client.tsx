"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import { COACH_DIPLOMAS, COACH_SPECIALITIES, DEPARTMENTS } from "@/lib/constants";
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
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [selectedDiplomas, setSelectedDiplomas] = useState<string[]>([]);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearField = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const toggleDiploma = (diploma: string) => {
    setSelectedDiplomas((prev) =>
      prev.includes(diploma) ? prev.filter((d) => d !== diploma) : [...prev, diploma],
    );
    clearField("diplomas");
  };

  const toggleCertification = (cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert],
    );
  };

  const CERTIFICATION_OPTIONS = COACH_DIPLOMAS.filter((d) => d.startsWith("UEFA"));

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
    const locErr = validateRequired(location, "Le département");
    if (locErr) next.location = locErr;
    if (price === "" || price <= 0) next.price = "Le prix par séance est requis.";
    else {
      const prErr = validatePrice(price);
      if (prErr) next.price = prErr;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep3 = (): boolean => {
    const next: FieldErrors = {};
    if (selectedDiplomas.length === 0) next.diplomas = "Sélectionne au moins un diplôme.";
    if (!diplomaFile) next.diplomaFile = "Un justificatif est requis pour vérification.";
    else if (diplomaFile.size > 10 * 1024 * 1024) next.diplomaFile = "Le fichier ne doit pas dépasser 10 Mo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!validateStep3()) return;

    setLoading(true);

    // Upload diploma file if provided
    let diplomaFileUrl: string | null = null;
    if (diplomaFile) {
      const fileExt = diplomaFile.name.split(".").pop();
      const filePath = `diplomas/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, diplomaFile);

      if (!uploadError) {
        diplomaFileUrl = filePath;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "coach",
          first_name: sanitizeInput(firstName),
          last_name: sanitizeInput(lastName),
          speciality,
          location,
          price_per_session: price === "" ? 0 : price,
          bio: sanitizeInput(bio),
          diplomas: selectedDiplomas.join(", "),
          diploma_file: diplomaFileUrl,
          diploma_verified: false,
          experience_years: experienceYears === "" ? null : experienceYears,
          certifications: certifications.join(", "),
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
      router.push("/dashboard");
      return;
    }

    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    setLoading(false);
  };

  const handleNextStep1 = () => {
    if (!validateStep1()) return;
    setNotice(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!validateStep2()) return;
    setNotice(null);
    setStep(3);
  };

  const stepLabels = ["Compte", "Profil", "Diplômes"];

  return (
    <AuthShell
      title="Inscription coach"
      subtitle={`Étape ${step}/3 : ${stepLabels[step - 1].toLowerCase()}.`}
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

        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-coach-firstName" className="mb-1 block text-xs text-white/70">Prénom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input id="reg-coach-firstName" className={`px-input ${errors.firstName ? "border-[color:var(--px-danger)]" : ""}`} placeholder="Prénom" value={firstName} onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }} aria-invalid={!!errors.firstName} />
                <FieldError error={errors.firstName} />
              </div>
              <div>
                <label htmlFor="reg-coach-lastName" className="mb-1 block text-xs text-white/70">Nom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input id="reg-coach-lastName" className={`px-input ${errors.lastName ? "border-[color:var(--px-danger)]" : ""}`} placeholder="Nom" value={lastName} onChange={(e) => { setLastName(e.target.value); clearField("lastName"); }} aria-invalid={!!errors.lastName} />
                <FieldError error={errors.lastName} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-coach-email" className="mb-1 block text-xs text-white/70">Adresse e-mail <span className="text-[color:var(--px-danger)]">*</span></label>
              <input id="reg-coach-email" className={`px-input ${errors.email ? "border-[color:var(--px-danger)]" : ""}`} type="email" placeholder="Adresse e-mail" value={email} onChange={(e) => { setEmail(e.target.value); clearField("email"); }} aria-invalid={!!errors.email} />
              <FieldError error={errors.email} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-coach-password" className="mb-1 block text-xs text-white/70">Mot de passe <span className="text-[color:var(--px-danger)]">*</span></label>
                <input id="reg-coach-password" className={`px-input ${errors.password ? "border-[color:var(--px-danger)]" : ""}`} type="password" placeholder="Mot de passe" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} aria-invalid={!!errors.password} />
                <FieldError error={errors.password} />
              </div>
              <div>
                <label htmlFor="reg-coach-confirmPassword" className="mb-1 block text-xs text-white/70">Confirmer <span className="text-[color:var(--px-danger)]">*</span></label>
                <input id="reg-coach-confirmPassword" className={`px-input ${errors.confirmPassword ? "border-[color:var(--px-danger)]" : ""}`} type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }} aria-invalid={!!errors.confirmPassword} />
                <FieldError error={errors.confirmPassword} />
              </div>
            </div>
            <p className="text-[10px] text-white/30">Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.</p>
            <div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input type="checkbox" className="h-4 w-4" checked={acceptedTerms} onChange={(e) => { setAcceptedTerms(e.target.checked); clearField("terms"); }} aria-invalid={!!errors.terms} />
                J&apos;accepte la politique de confidentialité et les conditions d&apos;utilisation.
              </label>
              <FieldError error={errors.terms} />
            </div>
            <Notice notice={notice} />
            <button className="px-button w-full" type="button" onClick={handleNextStep1}>
              Continuer
            </button>
          </>
        )}

        {/* ── Step 2: Profile ── */}
        {step === 2 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-coach-speciality" className="mb-1 block text-xs text-white/70">Spécialité <span className="text-[color:var(--px-danger)]">*</span></label>
                <select
                  id="reg-coach-speciality"
                  className={`px-select ${errors.speciality ? "border-[color:var(--px-danger)]" : ""}`}
                  value={speciality}
                  onChange={(e) => { setSpeciality(e.target.value); clearField("speciality"); }}
                  aria-invalid={!!errors.speciality}
                >
                  <option value="">Sélectionner</option>
                  {COACH_SPECIALITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <FieldError error={errors.speciality} />
              </div>
              <div>
                <label htmlFor="reg-coach-location" className="mb-1 block text-xs text-white/70">Département <span className="text-[color:var(--px-danger)]">*</span></label>
                <select
                  id="reg-coach-location"
                  className={`px-select ${errors.location ? "border-[color:var(--px-danger)]" : ""}`}
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); clearField("location"); }}
                  aria-invalid={!!errors.location}
                >
                  <option value="">Sélectionner un département</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <FieldError error={errors.location} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="reg-coach-price" className="mb-1 block text-xs text-white/70">Prix par séance (€) <span className="text-[color:var(--px-danger)]">*</span></label>
                <input id="reg-coach-price" className={`px-input ${errors.price ? "border-[color:var(--px-danger)]" : ""}`} type="number" min={0} step={1} placeholder="Ex: 45" value={price} onChange={(e) => { setPrice(e.target.value === "" ? "" : Number(e.target.value)); clearField("price"); }} aria-invalid={!!errors.price} />
                <FieldError error={errors.price} />
              </div>
              <div>
                <label htmlFor="reg-coach-experience" className="mb-1 block text-xs text-white/70">Années d&apos;expérience</label>
                <input id="reg-coach-experience" className="px-input" type="number" min={0} step={1} placeholder="Ex: 5" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-coach-bio" className="mb-1 block text-xs text-white/70">Bio</label>
              <textarea
                id="reg-coach-bio"
                className="min-h-[100px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                placeholder="Présente-toi en quelques lignes..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="button" onClick={handleNextStep2}>
                Continuer
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Diplomas & Certifications ── */}
        {step === 3 && (
          <>
            <div className="rounded-xl border border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/5 p-4">
              <p className="text-xs font-semibold text-[color:var(--px-warning)]">Vérification obligatoire</p>
              <p className="mt-1 text-xs text-white/70">
                Tes diplômes seront vérifiés par notre équipe avant l&apos;activation de ton profil coach. Envoie un justificatif (scan ou photo).
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/70">Diplômes obtenus</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {COACH_DIPLOMAS.filter((d) => !d.startsWith("UEFA")).map((diploma) => (
                  <label
                    key={diploma}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${
                      selectedDiplomas.includes(diploma)
                        ? "border-[color:var(--px-accent)]/50 bg-[color:var(--px-accent)]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={selectedDiplomas.includes(diploma)}
                      onChange={() => toggleDiploma(diploma)}
                    />
                    {diploma}
                  </label>
                ))}
              </div>
              <FieldError error={errors.diplomas} />
            </div>

            <div>
              <p className="mb-2 text-sm text-white/70">Certifications UEFA</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CERTIFICATION_OPTIONS.map((cert) => (
                  <label
                    key={cert}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${
                      certifications.includes(cert)
                        ? "border-[color:var(--px-accent)]/50 bg-[color:var(--px-accent)]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={certifications.includes(cert)}
                      onChange={() => toggleCertification(cert)}
                    />
                    {cert}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/70">Justificatif (PDF ou image)</p>
              <label
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
                  errors.diplomaFile
                    ? "border-[color:var(--px-danger)]/50 bg-[color:var(--px-danger)]/5"
                    : diplomaFile
                      ? "border-[color:var(--px-success)]/50 bg-[color:var(--px-success)]/5"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30"
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    setDiplomaFile(e.target.files?.[0] ?? null);
                    clearField("diplomaFile");
                  }}
                />
                {diplomaFile ? (
                  <>
                    <span className="text-sm text-[color:var(--px-success)]">{diplomaFile.name}</span>
                    <span className="text-[10px] text-white/70">Clique pour changer de fichier</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-white/70">Clique ou dépose ton fichier ici</span>
                    <span className="text-[10px] text-white/30">PDF, JPG, PNG — max 10 Mo</span>
                  </>
                )}
              </label>
              <FieldError error={errors.diplomaFile} />
            </div>

            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(2)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Création...</> : "Créer le compte coach"}
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
