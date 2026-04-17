"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { WhistleIcon, UsersIcon, CalendarIcon, StarIcon } from "./icons";

type PublicStatsData = {
  coaches: number;
  players: number;
  sessions: number;
  coachRating: number;
  playerRating: number;
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

function useCountUp(target: number, duration: number = 2000, decimals: number = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let frameId: number;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, decimals]);

  return value;
}

function StatItem({
  icon,
  label,
  value,
  suffix,
  decimals = 0,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(element);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  const animatedValue = useCountUp(visible ? value : 0, 1400, decimals);

  return (
    <div
      ref={ref}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[color:var(--px-accent)]/30 hover:bg-white/8"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">
          {decimals > 0 ? animatedValue.toFixed(decimals) : animatedValue}
          {suffix && <span className="ml-1 text-base text-white/70">{suffix}</span>}
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">{label}</p>
      </div>
    </div>
  );
}

export default function PublicStats() {
  const [stats, setStats] = useState<PublicStatsData | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      const [coachesRes, playersRes, sessionsRes] = await Promise.all([
        supabase.from("public_coaches").select("rating"),
        supabase.from("public_players").select("rating"),
        supabase.from("public_sessions").select("coach_id", { count: "exact", head: true }),
      ]);
      const coachesData = coachesRes.data;
      const playersData = playersRes.data;
      const sessionsCount = sessionsRes.count;

      if (!mounted) return;
      const coachRatings = (coachesData ?? []).map((row) => row.rating ?? 0).filter((r) => r > 0);
      const playerRatings = (playersData ?? []).map((row) => row.rating ?? 0).filter((r) => r > 0);

      setStats({
        coaches: (coachesData ?? []).length,
        players: (playersData ?? []).length,
        sessions: sessionsCount ?? 0,
        coachRating: average(coachRatings),
        playerRating: average(playerRatings),
      });
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const hasAnyData =
    stats.coaches > 0 || stats.players > 0 || stats.sessions > 0;

  if (!hasAnyData) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[color:var(--px-accent)]/10 via-white/5 to-transparent p-8 text-center">
        <p className="text-sm text-white/70">
          <span className="px-gradient-text font-semibold">Rejoins la première vague PerformX.</span>
          <br />
          La communauté se construit maintenant — coachs et joueurs arrivent chaque semaine.
        </p>
      </div>
    );
  }

  const items: Array<{
    icon: React.ReactNode;
    label: string;
    value: number;
    suffix?: string;
    decimals?: number;
  }> = [
    {
      icon: <WhistleIcon className="h-5 w-5" />,
      label: "Coachs actifs",
      value: stats.coaches,
    },
    {
      icon: <UsersIcon className="h-5 w-5" />,
      label: "Joueurs inscrits",
      value: stats.players,
    },
    {
      icon: <CalendarIcon className="h-5 w-5" />,
      label: "Séances réservées",
      value: stats.sessions,
    },
  ];

  if (stats.coachRating > 0) {
    items.push({
      icon: <StarIcon className="h-5 w-5" />,
      label: "Note moyenne",
      value: stats.coachRating,
      suffix: "/ 5",
      decimals: 1,
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((stat, index) => (
        <StatItem
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          decimals={stat.decimals}
          delay={index * 100}
        />
      ))}
    </div>
  );
}
