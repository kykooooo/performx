import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AuthShell from "@/components/auth-shell";

const VerifyClient = dynamic(() => import("./verify-client"), {
  loading: () => <div className="px-skeleton h-[200px] rounded-xl" />,
});

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
