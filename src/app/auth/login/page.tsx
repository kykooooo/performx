import type { Metadata } from "next";
import dynamic from "next/dynamic";

const LoginPage = dynamic(() => import("./login-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[400px]" /></div>,
});

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à ton compte PerformX pour accéder à tes séances et ta messagerie.",
};

export default function LoginRoutePage() {
  return <LoginPage />;
}
