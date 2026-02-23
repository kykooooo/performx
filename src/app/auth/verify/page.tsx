import type { Metadata } from "next";
import AuthShell from "@/components/auth-shell";
import VerifyClient from "./verify-client";

export const metadata: Metadata = {
  title: "Vérification du compte",
  robots: { index: false },
};

export default function VerifyPage() {
  return (
    <AuthShell
      title="Validation de ton compte"
      subtitle="Saisis le code à 6 chiffres reçu par e-mail pour activer ton compte."
    >
      <VerifyClient />
    </AuthShell>
  );
}
