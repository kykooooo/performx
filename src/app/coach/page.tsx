"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import CoachCard from "@/components/coach-card";
import FilterBar from "@/components/filters";
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

export default function CoachPage() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchCoaches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, bio, location, price_per_session, rating, reviews_count, avatar_url")
        .order("rating", { ascending: false });

      if (!mounted) return;
      if (error) {
        setError(error.message);
        setCoaches([]);
      } else {
        setError(null);
        setCoaches(data ?? []);
      }
      setLoading(false);
    };

    fetchCoaches();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      active="/coach"
      title="Trouver un coach"
      description="Trouver un coach proche de chez vous et qui répond à vos critères."
    >
      <FilterBar />
      {loading && <p className="text-sm text-white/50">Chargement des coachs...</p>}
      {error && <p className="text-sm text-[color:var(--px-danger)]">{error}</p>}
      {!loading && coaches.length === 0 && !error && (
        <p className="text-sm text-white/50">Aucun coach disponible pour le moment.</p>
      )}
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
    </AppShell>
  );
}
