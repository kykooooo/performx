import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { requireRole } from "@/lib/auth-server";

const ParentDashboardPage = dynamic(() => import("./club-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Dashboard Parent",
  robots: { index: false },
};

export default async function ParentRoutePage() {
  await requireRole(["parent"]);
  return <ParentDashboardPage />;
}
