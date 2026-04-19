import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" aria-label="Retour a l'accueil PerformX" className="shrink-0">
      <Image
        src="/brand/performx-logo.svg"
        alt="Logo PerformX"
        width={400}
        height={480}
        priority
        sizes="(max-width: 768px) 56px, 64px"
        className="h-14 w-auto md:h-16"
      />
    </Link>
  );
}
