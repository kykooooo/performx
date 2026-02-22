import type { Metadata } from "next";
import CoachProfileEditPage from "./coach-profile-edit-client";

export const metadata: Metadata = {
  title: "Modifier mon profil coach",
  robots: { index: false },
};

export default function CoachProfileEditRoutePage() {
  return <CoachProfileEditPage />;
}
