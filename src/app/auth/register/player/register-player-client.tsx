"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { DEPARTMENTS } from "@/lib/constants";
import {
  AGE_CATEGORIES,
  DOMINANT_FEET,
  PLAYER_LEVELS,
  PLAYER_POSITIONS,
  TRAINING_FREQUENCY_OPTIONS,
  getPlayerAgeCategory,
  getPositionFamily,
  getPositionObjectives,
} from "@/lib/football";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  type FieldErrors,
} from "@/lib/validation";
import { buildPlayerProfileMetadata } from "@/lib/player-profile";

const stepLabels = ["Compte", "Profil", "Football"];

export default function RegisterPlayerPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [position, setPosition] = useState("");
  const [dominantFoot, setDominantFoot] = useState("");
  const [trainingFrequency, setTrainingFrequency] = useState<number | "">("");
  const [currentClub, setCurrentClub] = useState("");
  const [ageCategory, setAgeCategory] = useState("");
  const [objectives, setObjectives] = useState("");
  const [selectedPositionObjectives, setSelectedPositionObjectives] = useState<string[]>([]);
  const [injuryHistory, setInjuryHistory] = useState("");
  const [loadConstraints, setLoadConstraints] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const positionFamily = useMemo(() => getPositionFamily(position), [position]);
  const positionObjectives = useMemo(
    () => getPositionObjectives(positionFamily),
    [positionFamily],
  );

  const clearField = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const togglePositionObjective = (objective: string) => {
    setSelectedPositionObjectives((prev) =>
      prev.includes(objective) ? prev.filter((item) => item !== objective) : [...prev, objective],
    );
  };

  const validateStep1 = () => {
    const next: FieldErrors = {};
    const fnErr = validateRequired(firstName, "Le prenom");
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

  const validateStep2 = () => {
    const next: FieldErrors = {};
    if (!gender) next.gender = "Le genre est requis.";
    if (!birthDate) next.birthDate = "La date de naissance est requise.";
    if (!department) next.department = "Le departement est requis.";
    if (!level) next.level = "Le niveau est requis.";
    if (!position) next.position = "Le poste est requis.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep3 = () => {
    const next: FieldErrors = {};
    if (!dominantFoot) next.dominantFoot = "Le pied fort est requis.";
    if (trainingFrequency === "") next.trainingFrequency = "La frequence d'entrainement est requise.";
    if (!ageCategory) next.ageCategory = "La categorie d'age est requise.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!validateStep3()) return;

    setLoading(true);
    const resolvedAgeCategory = ageCategory || getPlayerAgeCategory(birthDate) || "U19";
    const metadata = buildPlayerProfileMetadata(
      {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        gender,
        birthDate,
        department,
        level,
        position,
        dominantFoot,
        trainingFrequency,
        currentClub: sanitizeInput(currentClub),
        ageCategory: resolvedAgeCategory,
        positionObjectives: selectedPositionObjectives,
        objectives: sanitizeInput(objectives),
        injuryHistory: sanitizeInput(injuryHistory),
        loadConstraints: sanitizeInput(loadConstraints),
      },
      {},
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          position_family: positionFamily,
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

  const handleNext = (nextStep: 2 | 3) => {
    const isValid = nextStep === 2 ? validateStep1() : validateStep2();
    if (!isValid) return;
    if (nextStep === 3 && !ageCategory && birthDate) {
      setAgeCategory(getPlayerAgeCategory(birthDate) ?? "");
    }
    setNotice(null);
    setStep(nextStep);
  };

  return (
    <AuthShell
      title="Inscription joueur"
      subtitle={`Etape ${step}/3 : ${stepLabels[step - 1].toLowerCase()}.`}
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
                <label className="mb-1 block text-xs text-white/70">Prénom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input className={`px-input ${errors.firstName ? "border-[color:var(--px-danger)]" : ""}`} value={firstName} onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }} placeholder="Prénom" />
                <FieldError error={errors.firstName} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Nom <span className="text-[color:var(--px-danger)]">*</span></label>
                <input className={`px-input ${errors.lastName ? "border-[color:var(--px-danger)]" : ""}`} value={lastName} onChange={(e) => { setLastName(e.target.value); clearField("lastName"); }} placeholder="Nom" />
                <FieldError error={errors.lastName} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">Adresse e-mail <span className="text-[color:var(--px-danger)]">*</span></label>
              <input className={`px-input ${errors.email ? "border-[color:var(--px-danger)]" : ""}`} type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearField("email"); }} placeholder="Adresse e-mail" />
              <FieldError error={errors.email} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Mot de passe <span className="text-[color:var(--px-danger)]">*</span></label>
                <input className={`px-input ${errors.password ? "border-[color:var(--px-danger)]" : ""}`} type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} placeholder="Mot de passe" />
                <FieldError error={errors.password} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Confirmer <span className="text-[color:var(--px-danger)]">*</span></label>
                <input className={`px-input ${errors.confirmPassword ? "border-[color:var(--px-danger)]" : ""}`} type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }} placeholder="Confirmer le mot de passe" />
                <FieldError error={errors.confirmPassword} />
              </div>
            </div>
            <p className="text-[10px] text-white/30">Min. 8 caracteres, 1 majuscule, 1 chiffre, 1 caractere special.</p>
            <div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input type="checkbox" className="h-4 w-4" checked={acceptedTerms} onChange={(e) => { setAcceptedTerms(e.target.checked); clearField("terms"); }} />
                J&apos;accepte la politique de confidentialite et les conditions d&apos;utilisation.
              </label>
              <FieldError error={errors.terms} />
            </div>
            <Notice notice={notice} />
            <button className="px-button w-full" type="button" onClick={() => handleNext(2)}>
              Continuer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Genre <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.gender ? "border-[color:var(--px-danger)]" : ""}`} value={gender} onChange={(e) => { setGender(e.target.value); clearField("gender"); }}>
                  <option value="">Selectionner</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="Autre">Autre</option>
                </select>
                <FieldError error={errors.gender} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Date de naissance <span className="text-[color:var(--px-danger)]">*</span></label>
                <input className={`px-input ${errors.birthDate ? "border-[color:var(--px-danger)]" : ""}`} type="date" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); clearField("birthDate"); }} />
                <FieldError error={errors.birthDate} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">Departement <span className="text-[color:var(--px-danger)]">*</span></label>
              <select className={`px-select ${errors.department ? "border-[color:var(--px-danger)]" : ""}`} value={department} onChange={(e) => { setDepartment(e.target.value); clearField("department"); }}>
                <option value="">Selectionner un departement</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <FieldError error={errors.department} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Niveau <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.level ? "border-[color:var(--px-danger)]" : ""}`} value={level} onChange={(e) => { setLevel(e.target.value); clearField("level"); }}>
                  <option value="">Selectionner</option>
                  {PLAYER_LEVELS.map((playerLevel) => (
                    <option key={playerLevel} value={playerLevel}>{playerLevel}</option>
                  ))}
                </select>
                <FieldError error={errors.level} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Poste <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.position ? "border-[color:var(--px-danger)]" : ""}`} value={position} onChange={(e) => { setPosition(e.target.value); clearField("position"); }}>
                  <option value="">Selectionner</option>
                  {PLAYER_POSITIONS.map((playerPosition) => (
                    <option key={playerPosition} value={playerPosition}>{playerPosition}</option>
                  ))}
                </select>
                <FieldError error={errors.position} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="button" onClick={() => handleNext(3)}>
                Continuer
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Pied fort <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.dominantFoot ? "border-[color:var(--px-danger)]" : ""}`} value={dominantFoot} onChange={(e) => { setDominantFoot(e.target.value); clearField("dominantFoot"); }}>
                  <option value="">Selectionner</option>
                  {DOMINANT_FEET.map((foot) => (
                    <option key={foot} value={foot}>{foot}</option>
                  ))}
                </select>
                <FieldError error={errors.dominantFoot} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Frequence d&apos;entrainement <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.trainingFrequency ? "border-[color:var(--px-danger)]" : ""}`} value={trainingFrequency} onChange={(e) => { setTrainingFrequency(e.target.value === "" ? "" : Number(e.target.value)); clearField("trainingFrequency"); }}>
                  <option value="">Selectionner</option>
                  {TRAINING_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError error={errors.trainingFrequency} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Club actuel</label>
                <input className="px-input" value={currentClub} onChange={(e) => setCurrentClub(e.target.value)} placeholder="Club actuel" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Categorie d&apos;age <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.ageCategory ? "border-[color:var(--px-danger)]" : ""}`} value={ageCategory} onChange={(e) => { setAgeCategory(e.target.value); clearField("ageCategory"); }}>
                  <option value="">Selectionner</option>
                  {AGE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <FieldError error={errors.ageCategory} />
              </div>
            </div>

            {positionObjectives.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-white/70">Objectifs lies au poste</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {positionObjectives.map((objective) => (
                    <label key={objective} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${
                      selectedPositionObjectives.includes(objective)
                        ? "border-[color:var(--px-accent)]/50 bg-[color:var(--px-accent)]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}>
                      <input type="checkbox" className="h-3.5 w-3.5" checked={selectedPositionObjectives.includes(objective)} onChange={() => togglePositionObjective(objective)} />
                      {objective}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-white/70">Objectifs personnels</label>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Ex: gagner en vitesse de decision, mieux finir mes actions..."
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Historique de blessure</label>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                  value={injuryHistory}
                  onChange={(e) => setInjuryHistory(e.target.value)}
                  placeholder="Visible par tes parents lies et tes coachs."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Contraintes de charge</label>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
                  value={loadConstraints}
                  onChange={(e) => setLoadConstraints(e.target.value)}
                  placeholder="Ex: eviter doubles seances explosives sur 48h."
                />
              </div>
            </div>

            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(2)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Creation...</> : "Creer le compte joueur"}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-white/70">
          Deja un compte ? <Link className="text-[color:var(--px-accent)]" href="/auth/login">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}
