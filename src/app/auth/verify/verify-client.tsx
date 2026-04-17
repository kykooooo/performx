"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < CODE_LENGTH) {
      inputsRef.current[index]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError(null);

    if (value && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError(null);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Saisis les 6 chiffres du code.");
      return;
    }
    if (!email) {
      setError("Adresse e-mail manquante. Reprends depuis l'inscription.");
      return;
    }

    setVerifying(true);
    setError(null);

    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    setVerifying(false);

    if (otpError) {
      setError(
        otpError.message.toLowerCase().includes("expired")
          ? "Le code a expiré. Demande un nouveau code."
          : "Code incorrect. Vérifie tes chiffres ou demande un nouveau code.",
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    if (!email) {
      setError("Adresse e-mail manquante. Reprends depuis l'inscription.");
      return;
    }

    setResending(true);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResendTimer(RESEND_COOLDOWN);
    setDigits(Array(CODE_LENGTH).fill(""));
    focusInput(0);
  };

  if (success) {
    return (
      <div className="px-fade-up space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--px-success)]/15">
          <CheckCircleIcon className="h-8 w-8 text-[color:var(--px-success)]" />
        </div>
        <h2 className="text-2xl text-white">Compte vérifié !</h2>
        <p className="text-sm text-white/70">Redirection vers le tableau de bord...</p>
        <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-pulse rounded-full bg-[color:var(--px-success)]" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleVerify}>
      {!emailFromUrl && (
        <div>
          <label htmlFor="verify-email" className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-white/70">
            Adresse e-mail
          </label>
          <input
            id="verify-email"
            className="px-input"
            type="email"
            placeholder="Ton adresse e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
      )}

      {emailFromUrl && (
        <p className="text-center text-xs text-white/70">
          Code envoyé à <span className="text-white">{emailFromUrl}</span>
        </p>
      )}

      <div className="flex justify-center gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            className={`h-12 w-12 rounded-xl border text-center text-lg text-white outline-none transition-colors focus:border-[color:var(--px-accent)] focus:ring-1 focus:ring-[color:var(--px-accent)] ${
              error ? "border-[color:var(--px-danger)] bg-[color:var(--px-danger)]/10" : "border-white/10 bg-white/10"
            }`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            aria-label={`Chiffre ${index + 1}`}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-center text-xs text-[color:var(--px-danger)]">
          {error}
        </p>
      )}

      <button className="px-button w-full" type="submit" disabled={verifying}>
        {verifying ? (
          <>
            <span className="px-spinner mr-2" />
            Vérification...
          </>
        ) : (
          "Vérifier"
        )}
      </button>

      <p className="text-center text-xs text-white/70">
        Code non reçu ?{" "}
        <button
          type="button"
          className={`font-semibold transition ${
            resendTimer > 0 || resending
              ? "cursor-not-allowed text-white/30"
              : "text-[color:var(--px-accent)] hover:underline"
          }`}
          onClick={handleResend}
          disabled={resendTimer > 0 || resending}
        >
          {resending
            ? "Envoi..."
            : resendTimer > 0
              ? `Renvoyer (${resendTimer}s)`
              : "Renvoyer"}
        </button>
      </p>
    </form>
  );
}
