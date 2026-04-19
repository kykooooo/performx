"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import {
  PLAYER_LEVELS,
  PLAYER_POSITIONS,
  getPositionFamily,
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

const stepLabels = ["Compte", "Football"];

export default function RegisterPlayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = redirectParam && redirectParam.startsWith("/") ? redirectParam : null;
  const inviteParam = searchParams.get("invite");
  const safeInvite = inviteParam ? inviteParam.toUpperCase().slice(0, 16) : null;
  const loginRedirect = safeInvite
    ? `/auth/invite/${safeInvite}`
    : safeRedirect;
  const loginQs = loginRedirect ? `?redirect=${encodeURIComponent(loginRedirect)}` : "";
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const positionFamily = useMemo(() => getPositionFamily(position), [position]);

  const clearField = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const next: FieldErrors = {};
    // Seul le niveau et le poste sont requis pour activer le matching coach pertinent.
    // Le reste est renseignable plus tard dans le profil.
    if (!level) next.level = "Le niveau est requis.";
    if (!position) next.position = "Le poste est requis.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    // L'étape 2 (Football) est la dernière — on valide juste celle-ci avant submit
    if (!validateStep2()) return;

    setLoading(true);
    const metadata = buildPlayerProfileMetadata(
      {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        gender: "",
        birthDate: "",
        department: "",
        level,
        position,
        dominantFoot: "",
        trainingFrequency: "",
        currentClub: "",
        ageCategory: "",
        positionObjectives: [],
        objectives: "",
        injuryHistory: "",
        loadConstraints: "",
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

      if (safeInvite) {
        const { error: claimError } = await supabase.rpc("claim_parent_invite", {
          p_code: safeInvite,
        });
        if (claimError) {
          console.warn("[PerformX] claim invite failed", claimError.message);
          router.push(`/auth/invite/${safeInvite}`);
          return;
        }
        router.push("/dashboard/player?invite=ok");
        return;
      }

      router.push(safeRedirect ?? "/dashboard");
      return;
    }

    setNotice({
      type: "success",
      text: safeInvite
        ? `Compte créé ! Après avoir confirmé ton email, clique sur le lien d'invitation reçu de ton parent pour lier vos comptes.`
        : `Compte créé ! Un email de confirmation a été envoyé à ${email}. Clique sur le lien dans l'email pour activer ton compte.`,
    });
    setLoading(false);
  };

  const handleNext = (nextStep: 2) => {
    if (!validateStep1()) return;
    setNotice(null);
    setStep(nextStep);
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
            <p className="mb-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Dis-nous juste ton niveau et ton poste pour qu&apos;on te propose les bons coachs.
              Tu pourras compléter ton profil (pied fort, club, objectifs, historique...) après
              l&apos;inscription depuis ton dashboard.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">Niveau <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.level ? "border-[color:var(--px-danger)]" : ""}`} value={level} onChange={(e) => { setLevel(e.target.value); clearField("level"); }}>
                  <option value="">Sélectionner</option>
                  {PLAYER_LEVELS.map((playerLevel) => (
                    <option key={playerLevel} value={playerLevel}>{playerLevel}</option>
                  ))}
                </select>
                <FieldError error={errors.level} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/70">Poste <span className="text-[color:var(--px-danger)]">*</span></label>
                <select className={`px-select ${errors.position ? "border-[color:var(--px-danger)]" : ""}`} value={position} onChange={(e) => { setPosition(e.target.value); clearField("position"); }}>
                  <option value="">Sélectionner</option>
                  {PLAYER_POSITIONS.map((playerPosition) => (
                    <option key={playerPosition} value={playerPosition}>{playerPosition}</option>
                  ))}
                </select>
                <FieldError error={errors.position} />
              </div>
            </div>

            <Notice notice={notice} />
            <div className="flex gap-3">
              <button className="px-button-ghost w-full" type="button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button className="px-button w-full" type="submit" disabled={loading}>
                {loading ? <><span className="px-spinner mr-2" /> Création...</> : "Créer mon compte"}
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
