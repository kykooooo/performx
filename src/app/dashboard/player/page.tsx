import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { requireRole } from "@/lib/auth-server";

const PlayerDashboardPage = dynamic(() => import("./player-dashboard-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Dashboard Joueur",
  robots: { index: false },
};

export default async function Page() {
  await requireRole(["player"]);
  return <PlayerDashboardPage />;
}
