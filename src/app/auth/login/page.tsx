import type { Metadata } from "next";
import LoginPage from "./login-client";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à ton compte PerformX pour accéder à tes séances et ta messagerie.",
};

export default function LoginRoutePage() {
  return <LoginPage />;
}
