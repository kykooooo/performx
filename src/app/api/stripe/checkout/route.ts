import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

type CheckoutBody = {
  coachId: string;
  date: string;
  time: string;
  durationMinutes: number;
};

const isValidBody = (value: unknown): value is CheckoutBody => {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.coachId === "string" &&
    typeof body.date === "string" &&
    typeof body.time === "string" &&
    typeof body.durationMinutes === "number"
  );
};

export async function POST(request: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json(
      { error: "Paiement indisponible (Stripe non configuré)." },
      { status: 503 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // lecture seule dans cette route — pas de set cookies
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Connecte-toi pour réserver une séance." },
      { status: 401 },
    );
  }

  const { data: coach, error: coachError } = await supabase
    .from("public_coaches")
    .select("id, name, speciality, price_per_session")
    .eq("id", body.coachId)
    .maybeSingle();

  if (coachError || !coach) {
    return NextResponse.json({ error: "Coach introuvable." }, { status: 404 });
  }

  const priceInCents = Math.round((coach.price_per_session ?? 0) * 100);
  if (priceInCents <= 0) {
    return NextResponse.json(
      { error: "Le tarif de ce coach est invalide." },
      { status: 400 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: priceInCents,
            product_data: {
              name: `Séance avec ${coach.name}`,
              description: `${coach.speciality} · ${body.date} à ${body.time} (${body.durationMinutes} min)`,
            },
          },
        },
      ],
      metadata: {
        player_id: user.id,
        coach_id: body.coachId,
        session_date: body.date,
        session_time: body.time,
        duration_minutes: String(body.durationMinutes),
        price_cents: String(priceInCents),
      },
      success_url: `${origin}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking?canceled=1&coach=${body.coachId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
