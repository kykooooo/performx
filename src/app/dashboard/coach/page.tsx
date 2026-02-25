import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CoachDashboardPage = dynamic(() => import("./coach-dashboard-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Dashboard Coach",
  robots: { index: false },
};

export default function CoachDashboardRoutePage() {
  return <CoachDashboardPage />;
}
