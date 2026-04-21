import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" aria-label="Retour a l'accueil PerformX" className="shrink-0">
      {/* Carré noir propre (bg-black + rounded-lg) pour que le logo
          s'intègre sans teinte grise perceptible autour. Le JPEG a son
          propre fond noir qui se confond avec le conteneur. */}
      <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-black md:h-16 md:w-16">
        <Image
          src="/brand/performx-logo.jpeg"
          alt="Logo PerformX"
          width={768}
          height={768}
          priority
          sizes="(max-width: 768px) 56px, 64px"
          className="h-full w-full object-contain"
        />
      </span>
    </Link>
  );
}
