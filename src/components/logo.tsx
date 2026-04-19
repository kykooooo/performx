import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" aria-label="Retour a l'accueil PerformX" className="shrink-0">
      <Image
        src="/brand/performx-logo.jpeg"
        alt="Logo PerformX"
        width={768}
        height={768}
        priority
        sizes="(max-width: 768px) 56px, 64px"
        className="h-14 w-14 rounded-lg object-contain md:h-16 md:w-16"
      />
    </Link>
  );
}
