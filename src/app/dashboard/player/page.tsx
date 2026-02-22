import type { Metadata } from "next";
import PlayerDashboardPage from "./player-dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard Joueur",
  robots: { index: false },
};

export default function Page() {
  return <PlayerDashboardPage />;
}
