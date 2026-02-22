import type { Metadata } from "next";
import ClubDashboardPage from "./club-client";

export const metadata: Metadata = {
  title: "Dashboard Club",
  robots: { index: false },
};

export default function ClubRoutePage() {
  return <ClubDashboardPage />;
}
