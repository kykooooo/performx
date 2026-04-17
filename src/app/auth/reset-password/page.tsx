import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AuthShell from "@/components/auth-shell";

const ResetPasswordClient = dynamic(() => import("./reset-password-client"), {
  loading: () => <div className="px-skeleton h-[200px] rounded-xl" />,
});

export const metadata: Metadata = {
  title: "Réinitialiser mon mot de passe",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe solide pour sécuriser ton compte."
    >
      <ResetPasswordClient />
    </AuthShell>
  );
}
