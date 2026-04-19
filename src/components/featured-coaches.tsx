"use client";

import { useEffect, useMemo, useState } from "react";
import CoachCard from "./coach-card";
import { SkeletonCard } from "./skeleton";
import { buildCoachAvatarMap } from "@/lib/coach-avatars";
import { getFeaturedCoaches } from "@/lib/data/coaches";
import type { CoachRecord } from "@/lib/data/types";

export default function FeaturedCoaches() {
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const coachAvatarMap = useMemo(() => buildCoachAvatarMap(coaches), [coaches]);

  useEffect(() => {
    let mounted = true;

    const fetchCoaches = async () => {
      setLoading(true);
      const result = await getFeaturedCoaches(4);
      if (!mounted) return;
      setCoaches(result.data);
      setLoading(false);
    };

    fetchCoaches();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[color:var(--px-accent)]/10 via-white/5 to-transparent p-8 text-center">
        <p className="text-sm text-white/70">
          <span className="px-gradient-text font-semibold">PerformX est en phase de lancement.</span>
          <br />
          Les premiers coachs arrivent — reviens bientôt ou inscris-toi pour être notifié.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {coaches.map((coach, index) => (
        <div key={coach.id} className="px-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
          <CoachCard
            reserveHref={`/booking?coach=${coach.id}`}
            profileHref={`/coach/${coach.id}`}
            messageHref={`/messages?coach=${coach.id}`}
            avatarUrl={coachAvatarMap.get(coach.id) ?? coach.avatarUrl}
            name={coach.name}
            speciality={coach.speciality}
            description={coach.bio ?? ""}
            location={coach.location ?? coach.department ?? ""}
            price={`${coach.pricePerSession ?? 0} EUR`}
            rating={coach.rating ?? 0}
            reviews={coach.reviewsCount}
            availability={coach.availability}
            experienceYears={coach.experienceYears}
            focusAreas={coach.focusAreas}
            sessionFormats={coach.sessionFormats}
            pedagogy={coach.pedagogy}
            certifications={coach.certifications}
          />
        </div>
      ))}
    </div>
  );
}
