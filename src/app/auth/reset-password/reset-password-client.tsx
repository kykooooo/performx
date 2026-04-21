"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@/components/icons";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { supabase } from "@/lib/supabase";
import {
  validatePassword,
  validatePasswordMatch,
  type FieldErrors,
} from "@/lib/validation";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<NoticeData>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSessionReady(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const next: FieldErrors = {};
    const pwErr = validatePassword(password);
    if (pwErr) next.password = pwErr;
    const pmErr = validatePasswordMatch(password, confirmPassword);
    if (pmErr) next.confirmPassword = pmErr;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setSuccess(true);
    // Hard navigation (Safari iOS) : cookies auth à propager avant le
    // middleware SSR, sinon boucle /auth/login.
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.assign("/dashboard");
      } else {
        router.push("/dashboard");
      }
    }, 2000);
  };

  if (sessionReady === null) {
    return <div className="px-skeleton h-[200px] rounded-xl" />;
  }

  if (sessionReady === false) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-white/70">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link
          href="/auth/forgot-password"
          className="px-button mt-4 inline-flex w-full justify-center"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--px-success)]/15">
          <CheckCircleIcon className="h-8 w-8 text-[color:var(--px-success)]" />
        </div>
        <h2 className="text-2xl text-white">Mot de passe mis à jour</h2>
        <p className="text-sm text-white/70">Redirection vers ton dashboard...</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="reset-password"
          className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-white/70"
        >
          Nouveau mot de passe
        </label>
        <div className="relative">
          <input
            id="reset-password"
            className={`px-input pr-12 ${errors.password ? "border-[color:var(--px-danger)]" : ""}`}
            type={showPassword ? "text" : "password"}
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            autoComplete="new-password"
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white"
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Masquer" : "Voir"}
          </button>
        </div>
        <FieldError error={errors.password} />
      </div>

      <div>
        <label
          htmlFor="reset-confirm"
          className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-white/70"
        >
          Confirmer
        </label>
        <input
          id="reset-confirm"
          className={`px-input ${errors.confirmPassword ? "border-[color:var(--px-danger)]" : ""}`}
          type={showPassword ? "text" : "password"}
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          autoComplete="new-password"
        />
        <FieldError error={errors.confirmPassword} />
      </div>

      <p className="text-[10px] text-white/50">
        Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.
      </p>

      <Notice notice={notice} />

      <button className="px-button w-full" type="submit" disabled={loading}>
        {loading ? (
          <>
            <span className="px-spinner mr-2" />
            Mise à jour...
          </>
        ) : (
          "Définir le nouveau mot de passe"
        )}
      </button>
    </form>
  );
}
