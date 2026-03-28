import type { Metadata } from "next";
import dynamic from "next/dynamic";

const PlayerInfoClient = dynamic(() => import("./player-info-client"), {
  loading: () => (
    <div className="px-container py-10">
      <div className="px-skeleton h-[560px]" />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Informations joueur",
  robots: { index: false },
};

export default function PlayerInfoPage() {
  return <PlayerInfoClient />;
}
