import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AdminClient = dynamic(() => import("./admin-client"), {
  loading: () => (
    <div className="px-container py-10">
      <div className="px-skeleton h-[600px]" />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
