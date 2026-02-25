import type { Metadata } from "next";
import dynamic from "next/dynamic";

const PlayersPage = dynamic(() => import("./players-listing-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Joueurs",
  description:
    "Découvre les profils joueurs de la communauté PerformX. Filtre par niveau, poste et ville pour trouver le partenaire idéal.",
};

export default function PlayersListingPage() {
  return <PlayersPage />;
}
