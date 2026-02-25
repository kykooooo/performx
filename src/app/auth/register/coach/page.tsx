import type { Metadata } from "next";
import dynamic from "next/dynamic";

const RegisterCoachPage = dynamic(() => import("./register-coach-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[500px]" /></div>,
});

export const metadata: Metadata = {
  title: "Inscription Coach",
  description: "Rejoins PerformX en tant que coach. Crée ton profil, définis tes disponibilités et reçois des réservations.",
};

export default function RegisterCoachRoutePage() {
  return <RegisterCoachPage />;
}
