import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ParentDashboardPage = dynamic(() => import("./club-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Dashboard Parent",
  robots: { index: false },
};

export default function ParentRoutePage() {
  return <ParentDashboardPage />;
}
