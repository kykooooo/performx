import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, StarIcon, BoltIcon } from "./icons";
import { getCoachAvatarUrl } from "@/lib/coach-avatars";

type CoachCardProps = {
  reserveHref: string;
  profileHref: string;
  avatarUrl?: string | null;
  name: string;
  speciality: string;
  description: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
};

export default function CoachCard({
  reserveHref,
  profileHref,
  avatarUrl,
  name,
  speciality,
  description,
  location,
  price,
  rating,
  reviews,
}: CoachCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const resolvedAvatar = getCoachAvatarUrl(avatarUrl, `${name}-${speciality}`);

  return (
    <div className="px-card group flex h-full flex-col gap-4 p-4 transition-transform duration-300 hover:translate-y-[-3px]">
      {/* Header banner */}
      <div className="relative h-36 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,106,0,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,138,0,0.1),transparent_50%)]" />

        {/* Avatar + info */}
        <div className="absolute left-4 top-4 flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-black/60 text-sm font-semibold text-white shadow-lg">
            {resolvedAvatar ? (
              <Image src={resolvedAvatar} alt={name} fill sizes="48px" className="object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{speciality}</p>
          </div>
        </div>

        {/* Speciality tag */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--px-accent)]">
          <BoltIcon className="h-3 w-3" />
          Coach
        </span>

        {/* Availability indicator */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-success)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--px-success)]" />
          </span>
          <span className="text-[10px] font-medium text-[color:var(--px-success)]">Disponible</span>
        </div>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">{price}<span className="text-[10px] text-white/50">/séance</span></p>
        </div>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-sm leading-relaxed text-white/70">{description}</p>

      {/* Location */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <MapPinIcon className="h-4 w-4 shrink-0" />
        {location}
      </div>

      {/* Rating bar */}
      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(rating)
                    ? "text-[color:var(--px-accent)]"
                    : "text-white/15"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-white/70">{rating.toFixed(1)}</span>
          <span className="text-xs text-white/50">({reviews})</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={profileHref} className="px-button-ghost text-center text-xs">
          Voir profil
        </Link>
        <Link href={reserveHref} className="px-button text-center text-xs">
          Réserver
        </Link>
      </div>
    </div>
  );
}
