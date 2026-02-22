import type { Metadata } from "next";
import SessionsPage from "./sessions-client";

export const metadata: Metadata = {
  title: "Mes Séances",
  description: "Consulte et gère tes séances de coaching football à venir et passées.",
  robots: { index: false },
};

export default function SessionsRoutePage() {
  return <SessionsPage />;
}
