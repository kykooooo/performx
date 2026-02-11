"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth-shell";
import { syncProfile } from "@/lib/profile-sync";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setNotice({ type: "error", text: error.message });
    } else {
      if (data.user) {
        syncProfile(data.user).catch(() => null);
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

  return (
    <AuthShell title="Bienvenue sur PerformX" subtitle="Connecte-toi pour réserver une séance.">
      <form className="space-y-4" onSubmit={handleLogin}>
        <input
          className="px-input"
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div className="relative">
          <input
            className="px-input pr-12"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50" type="button">
            Voir
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" className="h-4 w-4" />
          Se souvenir de moi
        </label>
        {notice && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              notice.type === "success"
                ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
            }`}
          >
            {notice.text}
          </div>
        )}
        <button className="px-button w-full" type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="text-center text-xs text-white/50">Ou se connecter avec</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="px-button-ghost" type="button" onClick={() => handleOAuth("google")}>
            Google
          </button>
          <button className="px-button-ghost" type="button" onClick={() => handleOAuth("facebook")}>
            Facebook
          </button>
        </div>
        <p className="text-center text-xs text-white/60">
          Pas encore inscrit ? <Link className="text-[color:var(--px-accent)]" href="/auth/register">Créer un compte</Link>
        </p>
      </form>
    </AuthShell>
  );
}
