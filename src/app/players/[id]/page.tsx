import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import PlayerProfileClient from "./player-profile-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://performx.fr";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: "Profil joueur" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: player } = await supabase
    .from("public_players")
    .select("first_name, last_name, level, position, city")
    .eq("user_id", id)
    .single();

  if (!player) {
    return { title: "Joueur introuvable" };
  }

  const name = [player.first_name, player.last_name].filter(Boolean).join(" ") || "Joueur";
  const title = `${name} · ${player.position ?? "Joueur"}`;
  const description = `Profil de ${name} – ${player.level ?? "Niveau non défini"} · ${player.position ?? "Poste non défini"} · ${player.city ?? "France"}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PerformX`,
      description,
      url: `${siteUrl}/players/${id}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${title} | PerformX`,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/players/${id}`,
    },
  };
}

export default function PlayerProfilePage() {
  return <PlayerProfileClient />;
}
