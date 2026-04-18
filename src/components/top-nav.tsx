"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "./logo";
import ThemeToggle from "./theme-toggle";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { normalizeUserRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
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
import { MOCK_TOTAL_UNREAD } from "@/lib/mock-data";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--px-danger)] px-1 text-[9px] font-bold leading-none text-white">
      {count}
    </span>
  );
}

export default function TopNav({ active }: { active?: string }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUnreadCount(MOCK_TOTAL_UNREAD);
      return;
    }
    const { data } = await supabase.rpc("get_total_unread_count");
    if (typeof data === "number") setUnreadCount(data);
  }, []);

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setUserRole(normalizeUserRole(profile?.role ?? null));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const isLoggedIn = !!data.user;
      setLoggedIn(isLoggedIn);
      if (isLoggedIn && data.user) {
        fetchUnread();
        fetchUserRole(data.user.id);
      } else {
        setUnreadCount(0);
        setUserRole(null);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const isLoggedIn = !!session?.user;
      setLoggedIn(isLoggedIn);
      if (isLoggedIn && session?.user) {
        fetchUnread();
        fetchUserRole(session.user.id);
      } else {
        setUnreadCount(0);
        setUserRole(null);
      }
    });
    return () => { data.subscription.unsubscribe(); };
  }, [fetchUnread, fetchUserRole]);

  // Refresh unread count when new messages arrive via Realtime
  useEffect(() => {
    if (!loggedIn || !isSupabaseConfigured) return;
    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loggedIn, fetchUnread]);

  const navItems: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { label: "Accueil", href: "/", icon: <HomeIcon className="h-4 w-4" /> },
    ];

    // Visiteurs non-connectés : accès aux annuaires publics
    if (!loggedIn) {
      return [
        ...base,
        { label: "Coachs", href: "/coach", icon: <WhistleIcon className="h-4 w-4" /> },
        { label: "Joueurs", href: "/players", icon: <UserIcon className="h-4 w-4" /> },
      ];
    }

    // Coach : ses séances, messages, son dashboard (pas d'annuaire joueurs)
    if (userRole === "coach") {
      return [
        ...base,
        { label: "Mes séances", href: "/sessions", icon: <CalendarIcon className="h-4 w-4" /> },
        {
          label: "Messages",
          href: "/messages",
          icon: (
            <span className="relative">
              <ChatIcon className="h-4 w-4" />
              <UnreadBadge count={unreadCount} />
            </span>
          ),
        },
        { label: "Dashboard", href: "/dashboard/coach", icon: <GridIcon className="h-4 w-4" /> },
      ];
    }

    // Parent : voit les coachs (pour réserver), messages, son dashboard
    if (userRole === "parent") {
      return [
        ...base,
        { label: "Coachs", href: "/coach", icon: <WhistleIcon className="h-4 w-4" /> },
        {
          label: "Messages",
          href: "/messages",
          icon: (
            <span className="relative">
              <ChatIcon className="h-4 w-4" />
              <UnreadBadge count={unreadCount} />
            </span>
          ),
        },
        { label: "Dashboard", href: "/dashboard/parent", icon: <GridIcon className="h-4 w-4" /> },
      ];
    }

    // Player (défaut) : voit les coachs, ses séances, messages, son dashboard
    return [
      ...base,
      { label: "Coachs", href: "/coach", icon: <WhistleIcon className="h-4 w-4" /> },
      { label: "Mes séances", href: "/sessions", icon: <CalendarIcon className="h-4 w-4" /> },
      {
        label: "Messages",
        href: "/messages",
        icon: (
          <span className="relative">
            <ChatIcon className="h-4 w-4" />
            <UnreadBadge count={unreadCount} />
          </span>
        ),
      },
      { label: "Dashboard", href: "/dashboard/player", icon: <GridIcon className="h-4 w-4" /> },
    ];
  }, [loggedIn, unreadCount, userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="px-container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden text-xs uppercase tracking-[0.4em] text-white/70 xl:block">
              Coaching foot individuel
            </span>
            <span className="hidden rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--px-accent)] md:inline-flex">
              Beta
            </span>
          </div>

          {/* Desktop nav */}
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 text-sm lg:flex">
            {navItems.map((item) => {
              const isActive = active === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
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
            <ThemeToggle />
            {loggedIn ? (
              <button
                className="px-button-ghost hidden text-sm sm:inline-flex"
                type="button"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            ) : (
              <Link href="/auth/login" className="px-button-ghost hidden text-sm sm:inline-flex">
                <UserIcon className="h-4 w-4" />
                Connexion
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] text-[color:var(--px-text-secondary)] transition hover:border-[color:var(--px-accent)]/40 hover:text-[color:var(--px-text)] lg:hidden"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay — outside header to avoid backdrop-blur containing block */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — outside header to avoid backdrop-blur containing block */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-label="Menu de navigation"
        aria-modal={mobileOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[320px] flex-col border-l border-[color:var(--px-border)] shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "var(--px-bg)" }}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--px-border)] p-4">
          <Logo />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] text-[color:var(--px-text-secondary)] transition hover:text-[color:var(--px-text)]"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Navigation mobile" className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 text-[color:var(--px-text)]"
                    : "border border-transparent text-[color:var(--px-text-secondary)] hover:bg-[color:var(--px-surface)] hover:text-[color:var(--px-text)]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[color:var(--px-border)] p-4 pb-6">
          {loggedIn ? (
            <button
              className="px-button-ghost w-full text-center"
              type="button"
              onClick={() => { setMobileOpen(false); handleLogout(); }}
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="px-button w-full text-center"
              onClick={() => setMobileOpen(false)}
            >
              <UserIcon className="h-4 w-4" />
              Connexion
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
