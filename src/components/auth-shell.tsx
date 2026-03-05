import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "./logo";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="px-dark-context relative min-h-screen overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(11,11,13)]/90 to-[rgb(11,11,13)]/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
      <div className="relative z-10">
        <div className="px-container flex items-center justify-between py-6">
          <Logo />
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Accueil
          </Link>
        </div>
        <div className="px-container flex min-h-[75vh] items-center justify-center py-10">
          <div className="px-glass px-fade-up w-full max-w-lg p-8">
            <div className="mb-6">
              <h1 className="text-3xl text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-white/70">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
