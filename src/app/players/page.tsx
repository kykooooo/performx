import type { Metadata } from "next";
import PlayersPage from "./players-listing-client";

export const metadata: Metadata = {
  title: "Joueurs",
  description:
    "Découvre les profils joueurs de la communauté PerformX. Filtre par niveau, poste et ville pour trouver le partenaire idéal.",
};

export default function PlayersListingPage() {
  return <PlayersPage />;
}
