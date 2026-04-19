"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "./icons";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
};

function formatRelativeTime(dateIso: string) {
  const now = Date.now();
  const then = new Date(dateIso).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD} j`;
  return new Date(dateIso).toLocaleDateString("fr-FR");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.rpc("get_unread_notification_count");
    if (typeof data === "number") setUnreadCount(data);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, href, read, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    setNotifications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setLoggedIn(true);
        setUserId(data.user.id);
        fetchUnread();
      } else {
        setLoggedIn(false);
        setUserId(null);
        setUnreadCount(0);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoggedIn(true);
        setUserId(session.user.id);
        fetchUnread();
      } else {
        setLoggedIn(false);
        setUserId(null);
        setUnreadCount(0);
        setNotifications([]);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUnread]);

  // Realtime : rafraîchit le compteur dès qu'une notif est insérée pour ce user
  useEffect(() => {
    if (!loggedIn || !userId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnread();
          if (open) fetchNotifications();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loggedIn, userId, fetchUnread, fetchNotifications, open]);

  // Ferme le dropdown si clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.rpc("mark_notifications_read");
    setUnreadCount(0);
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const handleNotificationClick = async (notif: NotificationRow) => {
    if (!notif.read && isSupabaseConfigured) {
      await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((prev) =>
        prev.map((entry) => (entry.id === notif.id ? { ...entry, read: true } : entry)),
      );
    }
    setOpen(false);
  };

  if (!loggedIn) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] text-[color:var(--px-text-secondary)] transition hover:border-[color:var(--px-accent)]/40 hover:text-[color:var(--px-text)]"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--px-danger)] px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,92vw)] overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--px-bg)]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 p-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[color:var(--px-accent)] hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[min(70vh,30rem)] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-xs text-white/60">Chargement...</p>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-white/70">Aucune notification</p>
                <p className="mt-1 text-xs text-white/50">
                  Tu seras prévenu ici dès qu&apos;un joueur réserve ou qu&apos;un feedback tombe.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((notif) => {
                  const Content = (
                    <div className="flex gap-3 p-3 transition hover:bg-white/5">
                      <span
                        className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
                          notif.read ? "bg-white/20" : "bg-[color:var(--px-accent)]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            notif.read ? "text-white/70" : "text-white"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-white/60">{notif.body}</p>
                        )}
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
                          {formatRelativeTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={notif.id}>
                      {notif.href ? (
                        <Link
                          href={notif.href}
                          onClick={() => handleNotificationClick(notif)}
                          className="block"
                        >
                          {Content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notif)}
                          className="block w-full text-left"
                        >
                          {Content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
