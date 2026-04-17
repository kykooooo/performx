import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AuthShell from "@/components/auth-shell";

const ForgotPasswordClient = dynamic(() => import("./forgot-password-client"), {
  loading: () => <div className="px-skeleton h-[200px] rounded-xl" />,
});

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Saisis ton adresse e-mail. On t'envoie un lien pour réinitialiser ton mot de passe."
    >
      <ForgotPasswordClient />
    </AuthShell>
  );
}
