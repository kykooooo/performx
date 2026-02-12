import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "./logo";
import { CalendarIcon, ChatIcon, GridIcon, HomeIcon, UserIcon, WhistleIcon } from "./icons";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/", icon: <HomeIcon className="h-4 w-4" /> },
  { label: "Coach", href: "/coach", icon: <WhistleIcon className="h-4 w-4" /> },
  { label: "Joueurs", href: "/players", icon: <UserIcon className="h-4 w-4" /> },
  { label: "Mes séances", href: "/sessions", icon: <CalendarIcon className="h-4 w-4" /> },
  { label: "Messages", href: "/messages", icon: <ChatIcon className="h-4 w-4" /> },
  { label: "Dashboard", href: "/dashboard", icon: <GridIcon className="h-4 w-4" /> },
];

export default function TopNav({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="px-container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden text-xs uppercase tracking-[0.4em] text-white/40 lg:block">
            La plateforme qui connecte les talents
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 transition ${
                  isActive
                    ? "border-[color:var(--px-accent)] bg-white/10 text-white"
                    : "border-transparent text-white/70 hover:border-white/20 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-button-ghost text-sm"
          >
            <UserIcon className="h-4 w-4" />
            Compte
          </Link>
        </div>
      </div>
    </header>
  );
}
