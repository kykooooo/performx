import type { Metadata } from "next";
import dynamic from "next/dynamic";

const RegisterPlayerPage = dynamic(() => import("./register-player-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[500px]" /></div>,
});

export const metadata: Metadata = {
  title: "Inscription Joueur",
  description: "Crée ton compte joueur sur PerformX et commence à réserver des séances de coaching football.",
};

export default function RegisterPlayerRoutePage() {
  return <RegisterPlayerPage />;
}
