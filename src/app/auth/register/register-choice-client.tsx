"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function RegisterChoiceClient() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="grid gap-4">
      <div className="px-card p-5">
        <h3 className="text-xl text-white">Je suis joueur</h3>
        <p className="mt-2 text-sm text-white/70">Accède aux coachs et réserve tes séances.</p>
        <Link href={`/auth/register/player${qs}`} className="px-button mt-4 w-full">
          Créer un compte joueur
        </Link>
      </div>
      <div className="px-card p-5">
        <h3 className="text-xl text-white">Je suis coach</h3>
        <p className="mt-2 text-sm text-white/70">
          Propose tes disponibilités et reçois des réservations.
        </p>
        <Link href={`/auth/register/coach${qs}`} className="px-button mt-4 w-full">
          Créer un compte coach
        </Link>
      </div>
      <div className="px-card p-5">
        <h3 className="text-xl text-white">Je suis parent</h3>
        <p className="mt-2 text-sm text-white/70">
          Suis la progression de ton enfant et réserve ses séances.
        </p>
        <Link href={`/auth/register/parent${qs}`} className="px-button mt-4 w-full">
          Créer un compte parent
        </Link>
      </div>
      <p className="text-center text-xs text-white/70">
        Déjà un compte ?{" "}
        <Link
          className="text-[color:var(--px-accent)]"
          href={`/auth/login${qs}`}
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
