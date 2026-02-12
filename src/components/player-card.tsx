import Link from "next/link";
import { MapPinIcon, StarIcon } from "./icons";

type PlayerCardProps = {
  profileHref: string;
  avatarUrl?: string | null;
  name: string;
  level: string;
  position: string;
  city: string;
  objectives?: string;
  rating: number;
  reviews: number;
};

export default function PlayerCard({
  profileHref,
  avatarUrl,
  name,
  level,
  position,
  city,
  objectives,
  rating,
  reviews,
}: PlayerCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-card flex h-full flex-col gap-4 p-4">
      <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,153,255,0.22),transparent_55%)]" />
        <div className="absolute left-4 top-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/60 text-sm font-semibold text-white">
            {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{level || "Joueur"}</p>
          </div>
        </div>
        <span className="absolute right-3 top-3 px-badge">Joueur</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/60">
        <MapPinIcon className="h-4 w-4" />
        {city || "Localisation non définie"}
      </div>
      <p className="text-sm text-white/70">{objectives || "Objectifs en cours de définition."}</p>
      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
        <div>
          <p className="text-xs text-white/50">Poste</p>
          <p className="text-lg font-semibold text-white">{position || "N/A"}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/70">
          <StarIcon className="h-4 w-4 text-[color:var(--px-accent)]" />
          {rating.toFixed(1)}
          <span className="text-white/40">({reviews})</span>
        </div>
      </div>
      <Link href={profileHref} className="px-button-ghost text-center">
        Voir profil
      </Link>
    </div>
  );
}
