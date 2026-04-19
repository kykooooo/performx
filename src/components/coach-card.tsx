import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, StarIcon, BoltIcon } from "./icons";
import {
  getCoachAccentGradient,
  getCoachAudienceLabel,
  getCoachBestForLabel,
  getCoachStyleLabel,
  getNextAvailabilityLabel,
  getSpecialityEmoji,
} from "@/lib/football-surface";
import type { AvailabilitySlot } from "@/lib/types";

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
  experienceYears?: number | null;
  focusAreas?: string[];
  sessionFormats?: string[];
  availability?: AvailabilitySlot[] | null;
  pedagogy?: string | null;
  certifications?: string[] | null;
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
  experienceYears,
  focusAreas = [],
  sessionFormats = [],
  availability,
  pedagogy,
  certifications,
}: CoachCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hasRealPhoto = Boolean(avatarUrl && avatarUrl.trim().length > 0);
  const accentGradient = getCoachAccentGradient(`${name}-${speciality}`);
  const specialityEmoji = getSpecialityEmoji(speciality);
  const styleLabel = getCoachStyleLabel(speciality, pedagogy);
  const audienceLabel = getCoachAudienceLabel(sessionFormats, experienceYears);
  const bestForLabel = getCoachBestForLabel(speciality, focusAreas);
  const nextAvailability = getNextAvailabilityLabel(availability);
  const credentialLabel = certifications?.[0] ?? null;

  return (
    <div className="px-card group relative flex h-full flex-col gap-4 overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:border-[color:var(--px-accent)]/50 hover:shadow-[0_20px_60px_-20px_rgba(255,106,0,0.45)]">
      {/* Soft accent glow that bleeds from the header on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-40 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(255,106,0,0.22), transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Header banner : photo si fournie, sinon gradient accent + emoji géant */}
      <div className="relative h-36 overflow-hidden rounded-xl border border-white/10 transition duration-500 group-hover:border-[color:var(--px-accent)]/30">
        {hasRealPhoto ? (
          <>
            <Image
              src={avatarUrl as string}
              alt={name}
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,106,0,0.25),transparent_55%)]" />
          </>
        ) : (
          <>
            {/* Fond gradient accent déterministe par coach */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${accentGradient}`}
              aria-hidden="true"
            />
            {/* Tramage diagonal subtil pour la texture */}
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 9px)",
              }}
              aria-hidden="true"
            />
            {/* Motif terrain : rond central + ligne médiane */}
            <svg
              viewBox="0 0 200 120"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full opacity-20"
              aria-hidden="true"
            >
              <circle cx="100" cy="60" r="22" fill="none" stroke="white" strokeWidth="1.2" />
              <line x1="100" y1="0" x2="100" y2="120" stroke="white" strokeWidth="1.2" />
            </svg>
            {/* Emoji spécialité géant en fond */}
            <span
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5 text-[90px] leading-none opacity-30 drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)] transition duration-500 group-hover:scale-110 group-hover:opacity-40"
              aria-hidden="true"
            >
              {specialityEmoji}
            </span>
            {/* Overlay sombre en bas pour lisibilité des tags */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"
              aria-hidden="true"
            />
          </>
        )}

        {/* Avatar + nom (reste lisible dans les 2 modes) */}
        <div className="absolute left-4 top-4 flex items-center gap-3">
          <div
            className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] transition duration-500 group-hover:scale-105 group-hover:border-[color:var(--px-accent)]/70 ${
              hasRealPhoto
                ? "border-white/30 bg-black/60"
                : "border-white/40 bg-gradient-to-br from-black/70 to-black/30"
            }`}
          >
            {hasRealPhoto ? (
              <Image
                src={avatarUrl as string}
                alt={name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <span className="relative tracking-wider">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white drop-shadow">{name}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">{speciality}</p>
          </div>
        </div>

        {/* Speciality tag */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-[color:var(--px-accent)]/40 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--px-accent)] backdrop-blur-sm">
          <BoltIcon className="h-3 w-3" />
          Coach
        </span>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white" aria-label={`${price} par séance`}>{price}<span className="text-[10px] text-white/70">/séance</span></p>
        </div>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-sm leading-relaxed text-white/70">{description}</p>

      {/* Bloc prochaine dispo — l'info la plus importante pour décider */}
      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--px-success)]/25 bg-[color:var(--px-success)]/8 px-3 py-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-success)] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--px-success)]" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--px-success)]/80">
            Prochaine dispo
          </p>
          <p className="truncate text-sm font-medium text-white">{nextAvailability}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Style</p>
          <p className="mt-1 text-sm text-white">{styleLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Best for</p>
          <p className="mt-1 text-sm text-white">{bestForLabel}</p>
        </div>
      </div>

      {(focusAreas.length > 0 || experienceYears || sessionFormats.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {focusAreas.slice(0, 2).map((focus) => (
            <span key={focus} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
              {focus}
            </span>
          ))}
          {experienceYears ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
              {experienceYears} ans
            </span>
          ) : null}
          {sessionFormats[0] ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
              {sessionFormats[0]}
            </span>
          ) : null}
          <span className="rounded-full border border-[color:var(--px-accent)]/20 bg-[color:var(--px-accent)]/10 px-2.5 py-1 text-[10px] text-[color:var(--px-accent)]">
            {audienceLabel}
          </span>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <MapPinIcon className="h-4 w-4 shrink-0" />
          {location}
        </div>
        <div className="text-xs text-white/70 sm:text-right">
          {credentialLabel ? `Diplôme : ${credentialLabel}` : "Formats et cycle sur demande"}
        </div>
      </div>

      {/* Rating bar */}
      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5" aria-label={`Note\u00a0: ${rating.toFixed(1)} sur 5, ${reviews} avis`}>
          <div className="flex items-center gap-0.5" aria-hidden="true">
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
          <span className="text-xs font-medium text-white/80">{rating.toFixed(1)}</span>
          <span className="text-xs text-white/70">({reviews})</span>
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
