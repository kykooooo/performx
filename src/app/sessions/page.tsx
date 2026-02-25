import type { Metadata } from "next";
import dynamic from "next/dynamic";

const SessionsPage = dynamic(() => import("./sessions-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

export const metadata: Metadata = {
  title: "Mes Séances",
  description: "Consulte et gère tes séances de coaching football à venir et passées.",
  robots: { index: false },
};

export default function SessionsRoutePage() {
  return <SessionsPage />;
}
