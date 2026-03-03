import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--px-border)] bg-[color:var(--px-surface)] text-lg font-semibold text-[color:var(--px-accent)]">
        X
      </span>
      <p className="text-lg font-semibold leading-none">
        Perform<span className="text-[color:var(--px-accent)]">X</span>
      </p>
    </Link>
  );
}
