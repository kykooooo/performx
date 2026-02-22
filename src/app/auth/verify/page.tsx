import type { Metadata } from "next";
import AuthShell from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Vérification du compte",
  robots: { index: false },
};

export default function VerifyPage() {
  return (
    <AuthShell
      title="Validation de votre compte"
      subtitle="Saisis le code reçu par e-mail pour activer ton compte."
    >
      <form className="space-y-6">
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              className="h-12 w-12 rounded-xl border border-white/10 bg-white/10 text-center text-lg text-white"
              maxLength={1}
            />
          ))}
        </div>
        <button className="px-button w-full" type="submit">
          Vérifier
        </button>
        <p className="text-center text-xs text-white/60">Code non reçu ? Renvoyer</p>
      </form>
    </AuthShell>
  );
}
