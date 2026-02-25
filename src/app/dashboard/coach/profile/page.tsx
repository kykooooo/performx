import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CoachProfileEditPage = dynamic(() => import("./coach-profile-edit-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Modifier mon profil coach",
  robots: { index: false },
};

export default function CoachProfileEditRoutePage() {
  return <CoachProfileEditPage />;
}
