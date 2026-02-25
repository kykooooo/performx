"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth-shell";
import { FieldError, Notice, type NoticeData } from "@/components/notice";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";
import { validateEmail, validatePassword, type FieldErrors } from "@/lib/validation";

// Demo credentials are intentionally exposed via NEXT_PUBLIC_* for demo purposes only.
// Set NEXT_PUBLIC_DEMO_MODE=true to enable the demo panel. Remove all NEXT_PUBLIC_DEMO_*
// env vars before deploying to production.
const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LoginPage() {
  const demoCoachEmail = DEMO_ENABLED ? (process.env.NEXT_PUBLIC_DEMO_COACH_EMAIL ?? "") : "";
  const demoCoachPassword = DEMO_ENABLED ? (process.env.NEXT_PUBLIC_DEMO_COACH_PASSWORD ?? "") : "";
  const demoPlayerEmail = DEMO_ENABLED ? (process.env.NEXT_PUBLIC_DEMO_PLAYER_EMAIL ?? "") : "";
  const demoPlayerPassword = DEMO_ENABLED ? (process.env.NEXT_PUBLIC_DEMO_PLAYER_PASSWORD ?? "") : "";
  const demoParentEmail = DEMO_ENABLED ? (process.env.NEXT_PUBLIC_DEMO_PARENT_EMAIL ?? "") : "";
  const demoParentPassword = DEMO_ENABLED ? (process.env.NEXT_PUBLIC_DEMO_PARENT_PASSWORD ?? "") : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) next.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) next.password = passErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setNotice({ type: "error", text: error.message });
    } else {
      if (data.user) {
        syncProfile(data.user).catch((err) => console.warn("[PerformX]", err));
      }
      setNotice({ type: "success", text: "Connexion réussie." });
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setLoading(false);
    }
  };

  const applyDemoCredentials = (role: "coach" | "player" | "parent") => {
    setErrors({});
    if (role === "coach") {
      setEmail(demoCoachEmail);
      setPassword(demoCoachPassword);
    } else if (role === "parent") {
      setEmail(demoParentEmail);
      setPassword(demoParentPassword);
    } else {
      setEmail(demoPlayerEmail);
      setPassword(demoPlayerPassword);
    }
  };

  return (
    <AuthShell title="Bienvenue sur PerformX" subtitle="Connecte-toi pour réserver une séance.">
      <form className="space-y-4" onSubmit={handleLogin} noValidate>
        <div>
          <label htmlFor="login-email" className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-white/70">
            E-mail
          </label>
          <input
            id="login-email"
            className={`px-input ${errors.email ? "border-[color:var(--px-danger)]" : ""}`}
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          <FieldError error={errors.email} />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-white/70">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="login-password"
              className={`px-input pr-12 ${errors.password ? "border-[color:var(--px-danger)]" : ""}`}
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setErrors((prev) => ({ ...prev, password: "" })); }}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? "Masquer" : "Voir"}
            </button>
          </div>
          <FieldError error={errors.password} />
        </div>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" className="h-4 w-4" />
          Se souvenir de moi
        </label>
        <Notice notice={notice} />
        <button className="px-button w-full" type="submit" disabled={loading}>
          {loading ? <><span className="px-spinner mr-2" /> Connexion...</> : "Se connecter"}
        </button>
        {DEMO_ENABLED && (demoCoachEmail || demoPlayerEmail || demoParentEmail) && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Comptes démo</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button
                className="px-button-ghost text-xs"
                type="button"
                onClick={() => applyDemoCredentials("player")}
                disabled={!demoPlayerEmail || !demoPlayerPassword}
              >
                Joueur
              </button>
              <button
                className="px-button-ghost text-xs"
                type="button"
                onClick={() => applyDemoCredentials("coach")}
                disabled={!demoCoachEmail || !demoCoachPassword}
              >
                Coach
              </button>
              <button
                className="px-button-ghost text-xs"
                type="button"
                onClick={() => applyDemoCredentials("parent")}
                disabled={!demoParentEmail || !demoParentPassword}
              >
                Parent
              </button>
            </div>
          </div>
        )}
        <p className="text-center text-xs text-white/70">Ou se connecter avec</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="px-button-ghost" type="button" onClick={() => handleOAuth("google")}>
            Google
          </button>
          <button className="px-button-ghost" type="button" onClick={() => handleOAuth("facebook")}>
            Facebook
          </button>
        </div>
        <p className="text-center text-xs text-white/70">
          Pas encore inscrit ? <Link className="text-[color:var(--px-accent)]" href="/auth/register">Créer un compte</Link>
        </p>
      </form>
    </AuthShell>
  );
}
