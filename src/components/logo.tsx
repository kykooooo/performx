import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" aria-label="Retour a l'accueil PerformX" className="shrink-0">
      {/* mix-blend-screen : fait disparaître les pixels noirs (fond JPEG)
          pour ne garder que le X blanc + orange + le lettrage.
          Marche uniquement sur fond sombre — c'est exactement le cas
          de la top-nav (bg-black/60). */}
      <Image
        src="/brand/performx-logo.jpeg"
        alt="Logo PerformX"
        width={768}
        height={768}
        priority
        sizes="(max-width: 768px) 56px, 64px"
        className="h-14 w-14 object-contain mix-blend-screen md:h-16 md:w-16"
      />
    </Link>
  );
}
