import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/constants";

const CoachProfileClient = dynamic(() => import("./coach-profile-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[600px]" /></div>,
});

type Props = {
  params: Promise<{ id: string }>;
};

async function getCoach(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("public_coaches")
    .select("name, speciality, location, rating, bio, reviews_count, price_per_session")
    .eq("id", id)
    .single();

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = SITE_URL;
  const coach = await getCoach(id);

  if (!coach) {
    return { title: "Coach introuvable" };
  }

  const title = `${coach.name} · ${coach.speciality}`;
  const description = coach.bio
    ? `${coach.bio.slice(0, 150)}${coach.bio.length > 150 ? "..." : ""}`
    : `Coach ${coach.speciality} à ${coach.location ?? "France"} · Note ${coach.rating?.toFixed(1) ?? "N/A"}/5`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PerformX`,
      description,
      url: `${siteUrl}/coach/${id}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${title} | PerformX`,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/coach/${id}`,
    },
  };
}

export default async function CoachProfilePage({ params }: Props) {
  const { id } = await params;
  const siteUrl = SITE_URL;
  const coach = await getCoach(id);

  const personSchema = coach
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: coach.name,
        jobTitle: `Coach Football · ${coach.speciality}`,
        description: coach.bio ?? undefined,
        address: coach.location
          ? { "@type": "PostalAddress", addressLocality: coach.location }
          : undefined,
        url: `${siteUrl}/coach/${id}`,
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Coachs", item: `${siteUrl}/coach` },
      ...(coach
        ? [{ "@type": "ListItem", position: 3, name: coach.name, item: `${siteUrl}/coach/${id}` }]
        : []),
    ],
  };

  const ratingSchema =
    coach && coach.rating && coach.reviews_count
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `Coaching ${coach.speciality} avec ${coach.name}`,
          description: coach.bio ?? `Séances de coaching football individuelles`,
          offers: {
            "@type": "Offer",
            price: coach.price_per_session ?? 0,
            priceCurrency: "EUR",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: coach.rating,
            bestRating: 5,
            reviewCount: coach.reviews_count,
          },
        }
      : null;

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {personSchema && <JsonLd data={personSchema} />}
      {ratingSchema && <JsonLd data={ratingSchema} />}
      <CoachProfileClient />
    </>
  );
}
