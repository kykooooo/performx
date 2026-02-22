import type { Metadata } from "next";
import RegisterPlayerPage from "./register-player-client";

export const metadata: Metadata = {
  title: "Inscription Joueur",
  description: "Crée ton compte joueur sur PerformX et commence à réserver des séances de coaching football.",
};

export default function RegisterPlayerRoutePage() {
  return <RegisterPlayerPage />;
}
