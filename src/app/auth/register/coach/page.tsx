import type { Metadata } from "next";
import RegisterCoachPage from "./register-coach-client";

export const metadata: Metadata = {
  title: "Inscription Coach",
  description: "Rejoins PerformX en tant que coach. Crée ton profil, définis tes disponibilités et reçois des réservations.",
};

export default function RegisterCoachRoutePage() {
  return <RegisterCoachPage />;
}
