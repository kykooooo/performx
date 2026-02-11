import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg font-semibold">
        X
      </span>
      <div className="leading-none">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Perform</p>
        <p className="text-lg font-semibold">
          Perform<span className="text-[color:var(--px-accent)]">X</span>
        </p>
      </div>
    </Link>
  );
}
