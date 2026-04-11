import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CoachPage = dynamic(() => import("./coach-listing-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const revalidate = 300; // Revalidate every 5 minutes

export const metadata: Metadata = {
  title: "Nos Coachs",
  description:
    "Parcours notre réseau de coachs de football certifiés. Filtre par spécialité, localisation et note pour trouver le coach idéal.",
};

export default function CoachListingPage() {
  return <CoachPage />;
}
