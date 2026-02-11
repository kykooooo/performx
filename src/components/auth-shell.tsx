import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "./logo";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(11,11,13,0.9), rgba(11,11,13,0.55)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
      <div className="relative z-10">
        <div className="px-container flex items-center justify-between py-6">
          <Logo />
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            Accueil
          </Link>
        </div>
        <div className="px-container flex min-h-[75vh] items-center justify-center py-10">
          <div className="px-glass px-fade-up w-full max-w-lg p-8">
            <div className="mb-6">
              <h1 className="text-3xl text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
