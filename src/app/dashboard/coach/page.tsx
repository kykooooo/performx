import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { requireRole } from "@/lib/auth-server";

const CoachDashboardPage = dynamic(() => import("./coach-dashboard-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Dashboard Coach",
  robots: { index: false },
};

export default async function CoachDashboardRoutePage() {
  await requireRole(["coach"]);
  return <CoachDashboardPage />;
}
