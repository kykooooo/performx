import type { Metadata } from "next";
import CoachDashboardPage from "./coach-dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard Coach",
  robots: { index: false },
};

export default function CoachDashboardRoutePage() {
  return <CoachDashboardPage />;
}
