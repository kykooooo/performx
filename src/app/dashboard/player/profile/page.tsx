import type { Metadata } from "next";
import PlayerProfileEditPage from "./player-profile-edit-client";

export const metadata: Metadata = {
  title: "Modifier mon profil",
  robots: { index: false },
};

export default function PlayerProfileEditRoutePage() {
  return <PlayerProfileEditPage />;
}
