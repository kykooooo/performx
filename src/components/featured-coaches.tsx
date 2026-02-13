"use client";

import { useEffect, useState } from "react";
import CoachCard from "./coach-card";
import { SkeletonCard } from "./skeleton";
import { supabase } from "@/lib/supabase";

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
};

export default function FeaturedCoaches() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchCoaches = async () => {
      const { data } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, bio, location, price_per_session, rating, reviews_count, avatar_url")
        .order("rating", { ascending: false })
        .limit(4);

      if (!mounted) return;
      setCoaches(data ?? []);
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
      <p className="text-sm text-white/50">Aucun coach disponible pour le moment.</p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {coaches.map((coach, index) => (
        <div key={coach.id} className="px-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
          <CoachCard
            reserveHref={`/booking?coach=${coach.id}`}
            profileHref={`/coach/${coach.id}`}
            avatarUrl={coach.avatar_url}
            name={coach.name}
            speciality={coach.speciality}
            description={coach.bio ?? ""}
            location={coach.location ?? ""}
            price={`${coach.price_per_session ?? 0}€`}
            rating={coach.rating ?? 0}
            reviews={coach.reviews_count ?? 0}
          />
        </div>
      ))}
    </div>
  );
}
