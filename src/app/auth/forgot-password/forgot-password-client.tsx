"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircleIcon } from "@/components/icons";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { supabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [notice, setNotice] = useState<NoticeData>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setLoading(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--px-success)]/15">
          <CheckCircleIcon className="h-8 w-8 text-[color:var(--px-success)]" />
        </div>
        <h2 className="text-2xl text-white">E-mail envoyé</h2>
        <p className="text-sm text-white/70">
          Si un compte existe pour <span className="text-white">{email}</span>, tu recevras un lien
          pour réinitialiser ton mot de passe dans quelques instants.
        </p>
        <p className="text-xs text-white/50">
          Pense à vérifier tes spams si tu ne reçois rien.
        </p>
        <Link href="/auth/login" className="px-button-ghost mt-4 inline-flex w-full justify-center">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="forgot-email"
          className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-white/70"
        >
          Adresse e-mail
        </label>
        <input
          id="forgot-email"
          className={`px-input ${emailError ? "border-[color:var(--px-danger)]" : ""}`}
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError("");
          }}
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
        />
        <FieldError error={emailError} />
      </div>

      <Notice notice={notice} />

      <button className="px-button w-full" type="submit" disabled={loading}>
        {loading ? (
          <>
            <span className="px-spinner mr-2" />
            Envoi en cours...
          </>
        ) : (
          "Envoyer le lien de réinitialisation"
        )}
      </button>

      <p className="text-center text-xs text-white/70">
        Tu te souviens de ton mot de passe ?{" "}
        <Link className="text-[color:var(--px-accent)]" href="/auth/login">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
