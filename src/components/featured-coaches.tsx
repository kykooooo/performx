"use client";

import { useEffect, useMemo, useState } from "react";
import CoachCard from "./coach-card";
import { SkeletonCard } from "./skeleton";
import { parseTextArray } from "@/lib/football";
import { supabase } from "@/lib/supabase";
import { buildCoachAvatarMap } from "@/lib/coach-avatars";
import { mockCoaches } from "@/lib/mock-data";
import type { AvailabilitySlot } from "@/lib/types";

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  bio: string | null;
  location: string | null;
  price_per_session: number | null;
  rating: number | null;
  reviews_count: number | null;
  avatar_url: string | null;
  availability?: AvailabilitySlot[] | null;
  experience_years?: number | null;
  focus_areas?: string[] | string | null;
  session_formats?: string[] | string | null;
  pedagogy?: string | null;
  certifications?: string[] | string | null;
};

function mockToCoachRow(c: (typeof mockCoaches)[number]): CoachRow {
  return {
    id: c.id,
    name: c.name,
    speciality: c.speciality,
    bio: c.bio,
    location: c.location,
    price_per_session: c.pricePerSession,
    rating: c.rating,
    reviews_count: c.reviews,
    avatar_url: null,
    availability: c.availability,
    experience_years: c.experienceYears ?? null,
    focus_areas: c.focusAreas ?? [],
    session_formats: c.sessionFormats ?? [],
    pedagogy: c.pedagogy ?? null,
    certifications: c.certifications ?? [],
  };
}

export default function FeaturedCoaches() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const coachAvatarMap = useMemo(() => buildCoachAvatarMap(coaches), [coaches]);

  useEffect(() => {
    let mounted = true;
    const fetchCoaches = async () => {
      const { data } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, bio, location, price_per_session, rating, reviews_count, avatar_url, availability, experience_years, focus_areas, session_formats, pedagogy, certifications")
        .order("rating", { ascending: false })
        .limit(4);

      if (!mounted) return;
      // Fallback to mock data for demo when Supabase returns nothing
      const rows = data && data.length > 0
        ? data
        : mockCoaches.slice(0, 4).map(mockToCoachRow);
      setCoaches(rows);
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

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {coaches.map((coach, index) => (
        <div key={coach.id} className="px-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
          <CoachCard
            reserveHref={`/booking?coach=${coach.id}`}
            profileHref={`/coach/${coach.id}`}
            avatarUrl={coachAvatarMap.get(coach.id) ?? coach.avatar_url}
            name={coach.name}
            speciality={coach.speciality}
            description={coach.bio ?? ""}
            location={coach.location ?? ""}
            price={`${coach.price_per_session ?? 0}€`}
            rating={coach.rating ?? 0}
            reviews={coach.reviews_count ?? 0}
            availability={coach.availability ?? []}
            experienceYears={coach.experience_years ?? null}
            focusAreas={parseTextArray(coach.focus_areas ?? [])}
            sessionFormats={parseTextArray(coach.session_formats ?? [])}
            pedagogy={coach.pedagogy ?? null}
            certifications={parseTextArray(coach.certifications ?? [])}
          />
        </div>
      ))}
    </div>
  );
}
