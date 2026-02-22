import type { Metadata } from "next";
import CoachPage from "./coach-listing-client";

export const metadata: Metadata = {
  title: "Nos Coachs",
  description:
    "Parcours notre réseau de coachs de football certifiés. Filtre par spécialité, localisation et note pour trouver le coach idéal.",
};

export default function CoachListingPage() {
  return <CoachPage />;
}
