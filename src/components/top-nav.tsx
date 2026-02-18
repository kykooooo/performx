"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import {
  CalendarIcon,
  ChatIcon,
  CloseIcon,
  GridIcon,
  HomeIcon,
  MenuIcon,
  UserIcon,
  WhistleIcon,
} from "./icons";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="px-container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden text-xs uppercase tracking-[0.4em] text-white/40 xl:block">
            La plateforme qui connecte les talents
          </span>
          <span className="hidden rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--px-accent)] md:inline-flex">
            Version demo
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm lg:flex">
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
          <Link href="/auth/login" className="px-button-ghost hidden text-sm sm:inline-flex">
            <UserIcon className="h-4 w-4" />
            Compte
          </Link>

          {/* Mobile hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:border-white/20 hover:text-white lg:hidden"
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[320px] flex-col border-l border-white/10 bg-[color:var(--px-bg)] transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <Logo />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:text-white"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 text-white"
                    : "border border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 pb-6">
          <Link
            href="/auth/login"
            className="px-button w-full text-center"
            onClick={() => setMobileOpen(false)}
          >
            <UserIcon className="h-4 w-4" />
            Mon compte
          </Link>
        </div>
      </div>
    </header>
  );
}
