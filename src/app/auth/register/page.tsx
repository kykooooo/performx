import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AuthShell from "@/components/auth-shell";

const RegisterChoiceClient = dynamic(() => import("./register-choice-client"));

export const metadata: Metadata = {
  title: "Inscription",
  description: "Crée ton compte PerformX en tant que joueur, coach ou parent.",
};

export default function RegisterChoicePage() {
  return (
    <AuthShell title="Créer un compte" subtitle="Choisis ton profil pour commencer.">
      <RegisterChoiceClient />
    </AuthShell>
  );
}
