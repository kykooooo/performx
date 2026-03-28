import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, StarIcon, UserIcon } from "./icons";
import { getPositionLaneLabel, getPositionZoneLabel } from "@/lib/football-surface";
import type { PositionFamily } from "@/lib/types";

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
  ageCategory?: string | null;
  dominantFoot?: string | null;
  currentClub?: string | null;
  positionFamily?: PositionFamily | null;
  positionObjectives?: string[];
};

const LEVEL_COLORS: Record<string, string> = {
  "Debutant": "border-blue-400/30 bg-blue-400/15 text-blue-400",
  "Intermediaire": "border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/15 text-[color:var(--px-warning)]",
  "Avance": "border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]",
  "Confirme": "border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]",
  "Elite": "border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]",
};

const normalizeLevelKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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
  ageCategory,
  dominantFoot,
  currentClub,
  positionFamily,
  positionObjectives = [],
}: PlayerCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const levelColor = LEVEL_COLORS[normalizeLevelKey(level)] ?? "border-white/20 bg-white/10 text-white/70";
  const laneLabel = getPositionLaneLabel(positionFamily);
  const zoneLabel = getPositionZoneLabel(positionFamily);

  return (
    <div className="px-card group flex h-full flex-col gap-4 p-4 transition-transform duration-300 hover:translate-y-[-3px]">
      <div className="relative h-32 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,153,255,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(100,180,255,0.08),transparent_50%)]" />

        <div className="absolute left-4 top-4 flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-black/60 text-sm font-semibold text-white shadow-lg">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} fill sizes="48px" className="object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{position || "Joueur"}</p>
          </div>
        </div>

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-400">
          <UserIcon className="h-3 w-3" />
          Joueur
        </span>

        <div className="absolute bottom-3 left-4">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${levelColor}`}>
            {level || "Niveau"}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <p className="text-xs font-medium text-white">{position || "N/A"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/70">
        <MapPinIcon className="h-4 w-4 shrink-0" />
        {city || "Localisation non definie"}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Zone cle</p>
          <p className="mt-1 text-sm text-white">{zoneLabel}</p>
          <p className="mt-1 text-[11px] text-white/60">{laneLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Snapshot</p>
          <p className="mt-1 text-sm text-white">{currentClub || "Club a confirmer"}</p>
          <p className="mt-1 text-[11px] text-white/60">
            {[ageCategory, dominantFoot].filter(Boolean).join(" · ") || "Infos terrain a completer"}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
        {objectives || "Objectifs en cours de definition."}
      </p>

      {positionObjectives.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {positionObjectives.slice(0, 2).map((objective) => (
            <span key={objective} className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] text-blue-300">
              {objective}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5" aria-label={`Note: ${rating.toFixed(1)} sur 5, ${reviews} avis`}>
          <div className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon
                key={index}
                className={`h-3.5 w-3.5 ${
                  index < Math.round(rating)
                    ? "text-[color:var(--px-accent)]"
                    : "text-white/15"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-white/70">{rating.toFixed(1)}</span>
          <span className="text-xs text-white/70">({reviews})</span>
        </div>
      </div>

      <Link href={profileHref} className="px-button-ghost text-center text-xs">
        Voir profil
      </Link>
    </div>
  );
}
